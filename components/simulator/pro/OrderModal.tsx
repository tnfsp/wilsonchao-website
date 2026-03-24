"use client";

import { useState, useCallback, useEffect } from "react";
import { useProGameStore } from "@/lib/simulator/store";
import { medicationCategories } from "@/lib/simulator/data/medications";
import { transfusionCategories, MTP_ACTIVATION_CRITERIA } from "@/lib/simulator/data/transfusions";
import { checkDrugInteractions } from "@/lib/simulator/engine/order-engine";
import type { OrderDefinition, DrugInteraction, VentMode, VentilatorState } from "@/lib/simulator/types";

// ============================================================
// Tab config
// ============================================================

type TabKey = "medication" | "fluid" | "transfusion" | "hemostatic" | "electrolyte" | "ventilator";

const TABS: { key: TabKey; label: string; emoji: string }[] = [
  { key: "medication", label: "藥物", emoji: "💊" },
  { key: "fluid", label: "輸液", emoji: "💧" },
  { key: "transfusion", label: "輸血", emoji: "🩸" },
  { key: "hemostatic", label: "止血", emoji: "🩹" },
  { key: "electrolyte", label: "電解質", emoji: "💉" },
  { key: "ventilator", label: "呼吸器", emoji: "🫁" },
];

// Category → drug list mapping (inside the tabs)
const MED_SUBCATEGORIES: { label: string; drugs: OrderDefinition[] }[] = [
  { label: "升壓藥 Vasopressors", drugs: medicationCategories.vasopressors },
  { label: "強心藥 Inotropes", drugs: medicationCategories.inotropes },
  { label: "鎮靜止痛 Sedation / Analgesia", drugs: [...medicationCategories.sedation, ...medicationCategories.steroids] },
  { label: "利尿劑 Diuretics", drugs: medicationCategories.diuretics },
  { label: "抗生素 Antibiotics", drugs: medicationCategories.antibiotics },
];

// ============================================================
// GuardRail bar component
// ============================================================

function GuardRailBar({
  min,
  max,
  warnAbove,
  rejectAbove,
  currentDose,
  unit,
}: {
  min?: number;
  max?: number;
  warnAbove?: number;
  rejectAbove?: number;
  currentDose: number;
  unit: string;
}) {
  if (!max) return null;
  const clampedMax = rejectAbove ?? max;
  const pct = (v: number) => Math.min(100, Math.max(0, (v / clampedMax) * 100));

  return (
    <div className="mt-2 space-y-1">
      <div className="relative h-2 w-full rounded bg-zinc-700">
        {/* warn zone */}
        {warnAbove !== undefined && (
          <div
            className="absolute top-0 h-full rounded-l bg-yellow-500/30"
            style={{ left: `${pct(warnAbove)}%`, right: `${pct(rejectAbove ?? clampedMax)}%` }}
          />
        )}
        {/* reject zone */}
        {rejectAbove !== undefined && (
          <div
            className="absolute top-0 right-0 h-full rounded-r bg-red-500/30"
            style={{ left: `${pct(rejectAbove)}%` }}
          />
        )}
        {/* current dose cursor */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full shadow"
          style={{
            left: `calc(${pct(currentDose)}% - 4px)`,
            backgroundColor:
              rejectAbove !== undefined && currentDose > rejectAbove
                ? "#ef4444"
                : warnAbove !== undefined && currentDose > warnAbove
                ? "#eab308"
                : "#22d3ee",
          }}
        />
      </div>
      <div className="flex justify-between text-xs text-zinc-500">
        <span>{min ?? 0} {unit}</span>
        {warnAbove && <span className="text-yellow-500">⚠ {warnAbove}</span>}
        {rejectAbove && <span className="text-red-500">🚫 {rejectAbove}</span>}
      </div>
    </div>
  );
}

// ============================================================
// Drug Detail Panel (selected drug → dose, freq, submit)
// ============================================================

function DrugDetailPanel({
  drug,
  onClose,
  onConfirm,
}: {
  drug: OrderDefinition;
  onClose: () => void;
  onConfirm: (dose: string, frequency: string) => void;
}) {
  const [dose, setDose] = useState(drug.defaultDose);
  const [frequency, setFrequency] = useState(drug.frequencies[0] ?? "Once");
  const [confirmingWarning, setConfirmingWarning] = useState(false);
  const [overrideWarning, setOverrideWarning] = useState(false);

  const patient = useProGameStore((s) => s.patient);
  const numericDose = parseFloat(dose) || 0;
  const { guardRail } = drug;

  // Local guard rail check
  const isRejected =
    guardRail?.rejectAbove !== undefined && numericDose > guardRail.rejectAbove;
  const isWarning =
    !isRejected &&
    guardRail?.warnAbove !== undefined &&
    numericDose > guardRail.warnAbove;

  // Drug interactions
  const interactions: DrugInteraction[] = patient
    ? checkDrugInteractions(drug, patient)
    : [];

  const hasBlockInteraction = interactions.some((i) => i.severity === "block");
  const warnInteractions = interactions.filter(
    (i) => i.severity === "warning" || i.severity === "info"
  );

  const canSubmit = !isRejected && !hasBlockInteraction && (!isWarning || overrideWarning);

  function handleSubmit() {
    if (isWarning && !overrideWarning) {
      setConfirmingWarning(true);
      return;
    }
    onConfirm(dose, frequency);
  }

  return (
    <div className="bg-zinc-800 rounded-xl p-5 border border-zinc-700">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-white font-bold text-lg">{drug.name}</h3>
          <p className="text-zinc-400 text-sm">{drug.route}</p>
        </div>
        <button onClick={onClose} className="text-zinc-500 hover:text-white text-xl leading-none">×</button>
      </div>

      {/* Interactions */}
      {interactions.length > 0 && (
        <div className="mb-4 space-y-2">
          {hasBlockInteraction && (
            <div className="bg-red-900/60 border border-red-500 rounded-lg px-4 py-3 text-red-200 text-sm">
              🚫 <strong>護理師：</strong>{interactions.find((i) => i.severity === "block")?.message}
            </div>
          )}
          {warnInteractions.map((i, idx) => (
            <div key={idx} className="bg-yellow-900/40 border border-yellow-600 rounded-lg px-4 py-3 text-yellow-200 text-sm">
              ⚠️ {i.message}
            </div>
          ))}
        </div>
      )}

      {/* Dose input */}
      <div className="space-y-4">
        <div>
          <label className="block text-zinc-400 text-sm mb-1">劑量（{drug.unit}）</label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={dose}
              onChange={(e) => { setDose(e.target.value); setOverrideWarning(false); setConfirmingWarning(false); }}
              step="any"
              className="w-36 bg-zinc-700 text-white rounded-lg px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
            <span className="text-zinc-400 text-sm">{drug.unit}</span>
          </div>

          {/* Guard rail bar */}
          <GuardRailBar
            min={guardRail?.min}
            max={guardRail?.max}
            warnAbove={guardRail?.warnAbove}
            rejectAbove={guardRail?.rejectAbove}
            currentDose={numericDose}
            unit={drug.unit}
          />
        </div>

        {/* Frequency */}
        <div>
          <label className="block text-zinc-400 text-sm mb-1">頻率</label>
          <select
            value={frequency}
            onChange={(e) => setFrequency(e.target.value)}
            className="bg-zinc-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          >
            {drug.frequencies.map((f) => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Guard rail feedback */}
      {isRejected && (
        <div className="mt-4 bg-red-900/60 border border-red-500 rounded-lg px-4 py-3 text-red-200 text-sm">
          🚫 <strong>護理師：</strong>{guardRail?.rejectMessage ?? `學長，這個劑量太高了，藥局不會配`}
        </div>
      )}

      {isWarning && !overrideWarning && (
        <div className="mt-4 bg-yellow-900/40 border border-yellow-600 rounded-lg px-4 py-3 text-yellow-200 text-sm">
          ⚠️ <strong>護理師：</strong>{guardRail?.warnMessage ?? `學長，這個劑量有點高欸，確定嗎？`}
        </div>
      )}

      {/* Confirm warning override */}
      {(confirmingWarning || (isWarning && !overrideWarning)) && !isRejected && (
        <div className="mt-3 flex gap-2">
          <button
            onClick={() => { setOverrideWarning(true); setConfirmingWarning(false); }}
            className="flex-1 bg-yellow-600 hover:bg-yellow-500 text-white rounded-lg py-2 text-sm font-semibold transition"
          >
            確定，我知道風險，繼續開
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg py-2 text-sm transition"
          >
            取消
          </button>
        </div>
      )}

      {/* Submit */}
      {!confirmingWarning && (
        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className={`mt-4 w-full py-2.5 rounded-lg font-bold text-sm transition ${
            canSubmit
              ? "bg-cyan-600 hover:bg-cyan-500 text-white"
              : "bg-zinc-700 text-zinc-500 cursor-not-allowed"
          }`}
        >
          {isRejected
            ? "無法送出"
            : hasBlockInteraction
            ? "禁忌（藥物交互作用）"
            : "確認送出"}
        </button>
      )}
    </div>
  );
}

// ============================================================
// Drug List inside a tab
// ============================================================

function DrugList({
  drugs,
  label,
  selectedId,
  onSelect,
}: {
  drugs: OrderDefinition[];
  label?: string;
  selectedId: string | null;
  onSelect: (drug: OrderDefinition) => void;
}) {
  return (
    <div className="mb-4">
      {label && (
        <p className="text-xs uppercase tracking-widest text-zinc-500 mb-2 px-1">{label}</p>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {drugs.map((drug) => (
          <button
            key={drug.id}
            onClick={() => onSelect(drug)}
            className={`text-left rounded-lg px-3 py-2.5 transition border ${
              selectedId === drug.id
                ? "bg-cyan-600/20 border-cyan-500 text-cyan-200"
                : "bg-zinc-800/70 border-zinc-700 text-zinc-300 hover:border-zinc-500 hover:text-white"
            }`}
          >
            <span className="font-medium text-sm">{drug.name}</span>
            <span className="ml-2 text-xs text-zinc-500">{drug.defaultDose} {drug.unit}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// Transfusion Tab — special UI
// ============================================================

const BLOOD_PRODUCTS = [
  { key: "prbc", label: "pRBC", desc: "Packed Red Blood Cells", color: "text-red-400" },
  { key: "ffp", label: "FFP", desc: "Fresh Frozen Plasma", color: "text-yellow-300" },
  { key: "platelet", label: "Platelet", desc: "血小板", color: "text-orange-300" },
  { key: "cryo", label: "Cryo", desc: "Cryoprecipitate", color: "text-purple-300" },
] as const;

type BloodProductKey = "prbc" | "ffp" | "platelet" | "cryo";

function TransfusionTab({
  selectedId,
  onSelect,
}: {
  selectedId: string | null;
  onSelect: (drug: OrderDefinition) => void;
}) {
  const [activeProduct, setActiveProduct] = useState<BloodProductKey>("prbc");
  const [warmingBlanket, setWarmingBlanket] = useState(false);
  const mtpState = useProGameStore((s) => s.mtpState);
  const activateMTP = useProGameStore((s) => s.activateMTP);

  const productDrugs = transfusionCategories[activeProduct] as OrderDefinition[];

  return (
    <div className="space-y-4">
      {/* Blood product selector */}
      <div>
        <p className="text-xs uppercase tracking-widest text-zinc-500 mb-2">血品種類</p>
        <div className="grid grid-cols-4 gap-2">
          {BLOOD_PRODUCTS.map((bp) => (
            <button
              key={bp.key}
              onClick={() => setActiveProduct(bp.key)}
              className={`rounded-lg py-2 px-1 text-center transition border ${
                activeProduct === bp.key
                  ? "bg-zinc-700 border-cyan-500"
                  : "bg-zinc-800 border-zinc-700 hover:border-zinc-500"
              }`}
            >
              <p className={`font-bold text-sm ${bp.color}`}>{bp.label}</p>
              <p className="text-zinc-500 text-xs leading-tight mt-0.5 hidden sm:block">{bp.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Unit options */}
      <div>
        <p className="text-xs uppercase tracking-widest text-zinc-500 mb-2">選擇單位數</p>
        <div className="flex flex-wrap gap-2">
          {productDrugs.map((drug) => (
            <button
              key={drug.id}
              onClick={() => onSelect(drug)}
              className={`px-4 py-2 rounded-lg border text-sm font-semibold transition ${
                selectedId === drug.id
                  ? "bg-cyan-600/20 border-cyan-500 text-cyan-200"
                  : "bg-zinc-800 border-zinc-700 text-zinc-300 hover:border-zinc-500"
              }`}
            >
              {drug.defaultDose} {activeProduct === "prbc" || activeProduct === "ffp" ? "U" : activeProduct === "platelet" ? "dose" : "U"}
            </button>
          ))}
        </div>
      </div>

      {/* Warming blanket */}
      <div className="flex items-center gap-3 bg-zinc-800 rounded-lg px-4 py-3 border border-zinc-700">
        <button
          onClick={() => setWarmingBlanket(!warmingBlanket)}
          className={`w-10 h-5 rounded-full transition-colors relative ${
            warmingBlanket ? "bg-orange-500" : "bg-zinc-600"
          }`}
        >
          <span
            className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
              warmingBlanket ? "translate-x-5" : "translate-x-0.5"
            }`}
          />
        </button>
        <div>
          <p className="text-sm text-white">🌡️ Blood Warmer</p>
          <p className="text-xs text-zinc-500">預防輸血低體溫（建議大量輸血時開啟）</p>
        </div>
        {warmingBlanket && (
          <span className="ml-auto text-orange-400 text-xs font-semibold">ON</span>
        )}
      </div>

      {/* MTP */}
      {!mtpState.activated ? (
        <div className="bg-zinc-800/80 border border-red-800 rounded-xl p-4">
          <p className="text-red-400 font-bold text-sm mb-2">🚨 Massive Transfusion Protocol（MTP）</p>
          <p className="text-zinc-400 text-xs mb-3">啟動條件（符合任一）：</p>
          <ul className="text-zinc-500 text-xs space-y-1 mb-4 list-disc list-inside">
            {MTP_ACTIVATION_CRITERIA.map((c, i) => (
              <li key={i}>{c}</li>
            ))}
          </ul>
          <p className="text-zinc-400 text-xs mb-3">啟動後：pRBC : FFP : Plt = <strong className="text-white">1 : 1 : 1</strong>，每 round 2U : 2U : 1 dose</p>
          <button
            onClick={activateMTP}
            className="w-full bg-red-700 hover:bg-red-600 text-white rounded-lg py-2.5 font-bold text-sm transition"
          >
            🚨 啟動 MTP
          </button>
        </div>
      ) : (
        <div className="bg-green-900/20 border border-green-600 rounded-xl px-4 py-3">
          <p className="text-green-400 font-semibold text-sm">✅ MTP 已啟動</p>
          <p className="text-zinc-400 text-xs mt-1">
            已完成 {mtpState.roundsDelivered} round(s) — 繼續下單輸血可觸發下一 round
          </p>
        </div>
      )}
    </div>
  );
}

// ============================================================
// Ventilator Tab
// ============================================================

const VENT_MODES: VentMode[] = ["VC", "PC", "PS", "SIMV"];
const IE_RATIOS = ["1:1.5", "1:2", "1:3", "1:4"];

function VentStepper({
  label,
  value,
  min,
  max,
  step,
  unit,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm text-zinc-300">{label}</span>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onChange(Math.max(min, value - step))}
          className="w-8 h-8 flex items-center justify-center rounded-lg border border-zinc-600 text-zinc-400 hover:text-white hover:border-cyan-500/50 transition-colors text-lg"
        >
          −
        </button>
        <span className="font-mono text-base font-bold text-white w-16 text-center">
          {value}
          <span className="text-xs text-zinc-500 ml-0.5 font-normal">{unit}</span>
        </span>
        <button
          onClick={() => onChange(Math.min(max, value + step))}
          className="w-8 h-8 flex items-center justify-center rounded-lg border border-zinc-600 text-zinc-400 hover:text-white hover:border-cyan-500/50 transition-colors text-lg"
        >
          +
        </button>
      </div>
    </div>
  );
}

function VentilatorTab({
  onConfirm,
}: {
  onConfirm: (changes: Partial<VentilatorState>, summary: string) => void;
}) {
  const currentVent = useProGameStore((s) => s.ventilator);
  const patient = useProGameStore((s) => s.patient);

  const [mode, setMode] = useState<VentMode>(currentVent.mode);
  const [fio2, setFio2] = useState(Math.round(currentVent.fio2 * 100));
  const [peep, setPeep] = useState(currentVent.peep);
  const [rrSet, setRrSet] = useState(currentVent.rrSet);
  const [tvSet, setTvSet] = useState(currentVent.tvSet);
  const [ieRatio, setIeRatio] = useState(currentVent.ieRatio);

  // Detect what changed
  const changes: Partial<VentilatorState> = {};
  const diffs: string[] = [];
  if (mode !== currentVent.mode) {
    changes.mode = mode;
    diffs.push(`Mode ${currentVent.mode} → ${mode}`);
  }
  if (fio2 !== Math.round(currentVent.fio2 * 100)) {
    changes.fio2 = fio2 / 100;
    diffs.push(`FiO₂ ${Math.round(currentVent.fio2 * 100)}% → ${fio2}%`);
  }
  if (peep !== currentVent.peep) {
    changes.peep = peep;
    diffs.push(`PEEP ${currentVent.peep} → ${peep}`);
  }
  if (rrSet !== currentVent.rrSet) {
    changes.rrSet = rrSet;
    diffs.push(`RR ${currentVent.rrSet} → ${rrSet}`);
  }
  if (tvSet !== currentVent.tvSet) {
    changes.tvSet = tvSet;
    diffs.push(`TV ${currentVent.tvSet} → ${tvSet}`);
  }
  if (ieRatio !== currentVent.ieRatio) {
    changes.ieRatio = ieRatio;
    diffs.push(`I:E ${currentVent.ieRatio} → ${ieRatio}`);
  }

  const hasChanges = diffs.length > 0;
  const fio2Color = fio2 > 60 ? "text-yellow-400" : fio2 > 80 ? "text-red-400" : "text-cyan-400";

  return (
    <div className="space-y-5">
      {/* Current settings display */}
      <div className="rounded-xl border border-zinc-700 bg-zinc-800/50 px-4 py-3">
        <p className="text-xs uppercase tracking-widest text-zinc-500 mb-2">目前設定</p>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-black/30 rounded-lg py-1.5 px-2">
            <p className="text-zinc-500 text-[10px]">Mode</p>
            <p className="text-blue-400 font-mono font-bold text-sm">{currentVent.mode}</p>
          </div>
          <div className="bg-black/30 rounded-lg py-1.5 px-2">
            <p className="text-zinc-500 text-[10px]">FiO₂</p>
            <p className="text-cyan-400 font-mono font-bold text-sm">{Math.round(currentVent.fio2 * 100)}%</p>
          </div>
          <div className="bg-black/30 rounded-lg py-1.5 px-2">
            <p className="text-zinc-500 text-[10px]">PEEP</p>
            <p className="text-cyan-400 font-mono font-bold text-sm">{currentVent.peep}</p>
          </div>
          <div className="bg-black/30 rounded-lg py-1.5 px-2">
            <p className="text-zinc-500 text-[10px]">RR</p>
            <p className="text-zinc-300 font-mono font-bold text-sm">{currentVent.rrSet}</p>
          </div>
          <div className="bg-black/30 rounded-lg py-1.5 px-2">
            <p className="text-zinc-500 text-[10px]">TV</p>
            <p className="text-zinc-300 font-mono font-bold text-sm">{currentVent.tvSet}</p>
          </div>
          <div className="bg-black/30 rounded-lg py-1.5 px-2">
            <p className="text-zinc-500 text-[10px]">I:E</p>
            <p className="text-zinc-300 font-mono font-bold text-sm">{currentVent.ieRatio}</p>
          </div>
        </div>
        {patient && (
          <p className="text-zinc-600 text-xs mt-2 text-center">
            SpO₂ {patient.vitals.spo2}% · RR {patient.vitals.rr}/min
          </p>
        )}
      </div>

      {/* Adjustment controls */}
      <div className="space-y-4">
        <p className="text-xs uppercase tracking-widest text-zinc-500">調整呼吸器</p>

        {/* Mode selection */}
        <div className="flex items-center justify-between py-2">
          <span className="text-sm text-zinc-300">Mode</span>
          <div className="flex gap-1.5">
            {VENT_MODES.map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`text-xs px-3 py-1.5 rounded-lg border transition-colors font-mono font-bold ${
                  mode === m
                    ? "border-blue-500/60 bg-blue-900/30 text-blue-300"
                    : "border-zinc-600 text-zinc-500 hover:border-zinc-400 hover:text-zinc-300"
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        {/* FiO₂ slider */}
        <div className="py-2 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-300">FiO₂</span>
            <span className={`font-mono text-base font-bold ${fio2Color}`}>{fio2}%</span>
          </div>
          <input
            type="range"
            min={21}
            max={100}
            step={5}
            value={fio2}
            onChange={(e) => setFio2(parseInt(e.target.value))}
            className="w-full h-1.5 rounded-full appearance-none cursor-pointer accent-cyan-400"
            style={{ background: `linear-gradient(to right, #22d3ee ${((fio2 - 21) / 79) * 100}%, #27272a ${((fio2 - 21) / 79) * 100}%)` }}
          />
          <div className="flex justify-between text-[10px] text-zinc-600">
            <span>21%</span>
            <span>60%</span>
            <span>100%</span>
          </div>
        </div>

        {/* PEEP */}
        <VentStepper label="PEEP" value={peep} min={0} max={20} step={1} unit="cmH₂O" onChange={setPeep} />

        {/* RR */}
        <VentStepper label="RR" value={rrSet} min={8} max={30} step={1} unit="/min" onChange={setRrSet} />

        {/* TV */}
        <VentStepper label="TV" value={tvSet} min={300} max={700} step={25} unit="mL" onChange={setTvSet} />

        {/* I:E ratio */}
        <div className="flex items-center justify-between py-2">
          <span className="text-sm text-zinc-300">I:E Ratio</span>
          <div className="flex gap-1.5">
            {IE_RATIOS.map((ie) => (
              <button
                key={ie}
                onClick={() => setIeRatio(ie)}
                className={`text-xs px-2.5 py-1.5 rounded-lg border transition-colors font-mono ${
                  ieRatio === ie
                    ? "border-teal-500/60 bg-teal-900/30 text-teal-300"
                    : "border-zinc-600 text-zinc-500 hover:border-zinc-400 hover:text-zinc-300"
                }`}
              >
                {ie}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Change summary + confirm */}
      {hasChanges && (
        <div className="rounded-xl border border-cyan-800/40 bg-cyan-900/10 px-4 py-3">
          <p className="text-cyan-400 text-xs font-medium mb-2">變更預覽</p>
          <ul className="space-y-1">
            {diffs.map((d, i) => (
              <li key={i} className="text-sm text-zinc-300 flex items-center gap-2">
                <span className="text-cyan-500">→</span> {d}
              </li>
            ))}
          </ul>
        </div>
      )}

      <button
        onClick={() => {
          if (hasChanges) {
            onConfirm(changes, diffs.join(", "));
          }
        }}
        disabled={!hasChanges}
        className={`w-full py-3 rounded-xl font-bold text-sm transition ${
          hasChanges
            ? "bg-cyan-600 hover:bg-cyan-500 text-white"
            : "bg-zinc-700 text-zinc-500 cursor-not-allowed"
        }`}
      >
        {hasChanges ? "確認調整呼吸器" : "尚未更改設定"}
      </button>
    </div>
  );
}

// ============================================================
// Main OrderModal
// ============================================================

export default function OrderModal() {
  const activeModal = useProGameStore((s) => s.activeModal);
  const closeModal = useProGameStore((s) => s.closeModal);
  const placeOrder = useProGameStore((s) => s.placeOrder);
  const patient = useProGameStore((s) => s.patient);
  const updateVentilator = useProGameStore((s) => s.updateVentilator);
  const addTimelineEntry = useProGameStore((s) => s.addTimelineEntry);
  const clock = useProGameStore((s) => s.clock);

  const [activeTab, setActiveTab] = useState<TabKey>("medication");
  const [selectedDrug, setSelectedDrug] = useState<OrderDefinition | null>(null);
  const [lastResult, setLastResult] = useState<{ ok: boolean; message: string } | null>(null);

  const isOpen = activeModal === "order";

  // Auto-switch to ventilator tab when opened from ActionBar vent button
  useEffect(() => {
    if (isOpen) {
      const hint = sessionStorage.getItem("sim-order-tab");
      if (hint === "ventilator") {
        setActiveTab("ventilator");
        sessionStorage.removeItem("sim-order-tab");
      }
    }
  }, [isOpen]);

  const handleSelectDrug = useCallback((drug: OrderDefinition) => {
    setSelectedDrug(drug);
    setLastResult(null);
  }, []);

  const handleConfirm = useCallback(
    (dose: string, frequency: string) => {
      if (!selectedDrug) return;
      const result = placeOrder({ definition: selectedDrug, dose, frequency });
      if (result.success) {
        setLastResult({ ok: true, message: `✅ 已開：${selectedDrug.name} ${dose} ${selectedDrug.unit} ${frequency}` });
        setSelectedDrug(null);
      } else {
        setLastResult({ ok: false, message: result.rejectMessage ?? "❌ 無法送出" });
      }
    },
    [selectedDrug, placeOrder]
  );

  const handleVentConfirm = useCallback(
    (changes: Partial<VentilatorState>, summary: string) => {
      updateVentilator(changes);
      addTimelineEntry({
        gameTime: clock.currentTime,
        type: "order_placed",
        content: `🫁 呼吸器調整：${summary}`,
        sender: "player",
        isImportant: true,
      });
      setLastResult({ ok: true, message: `✅ 呼吸器調整完成：${summary}` });
    },
    [updateVentilator, addTimelineEntry, clock.currentTime]
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-3xl mx-auto my-6 bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-800">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-zinc-800">
          <div>
            <h2 className="text-white font-bold text-xl">📋 開 Order</h2>
            {patient && (
              <p className="text-zinc-400 text-sm mt-0.5">
                {patient.vitals.hr} bpm · MAP {patient.vitals.map} · Temp {patient.vitals.temperature.toFixed(1)}°C
              </p>
            )}
          </div>
          <button
            onClick={closeModal}
            className="text-zinc-500 hover:text-white text-2xl leading-none transition"
          >
            ×
          </button>
        </div>

        {/* Tabs */}
        <div className="flex overflow-x-auto border-b border-zinc-800">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => { setActiveTab(tab.key); setSelectedDrug(null); setLastResult(null); }}
              className={`flex-shrink-0 flex items-center gap-1.5 px-5 py-3 text-sm font-medium transition border-b-2 ${
                activeTab === tab.key
                  ? "border-cyan-500 text-cyan-400"
                  : "border-transparent text-zinc-500 hover:text-zinc-300"
              }`}
            >
              <span>{tab.emoji}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          {/* Success/fail feedback */}
          {lastResult && (
            <div
              className={`mb-4 rounded-lg px-4 py-3 text-sm ${
                lastResult.ok
                  ? "bg-green-900/40 border border-green-600 text-green-300"
                  : "bg-red-900/40 border border-red-600 text-red-300"
              }`}
            >
              {lastResult.message}
            </div>
          )}

          {/* Selected drug detail */}
          {selectedDrug && activeTab !== "transfusion" && (
            <div className="mb-5">
              <DrugDetailPanel
                drug={selectedDrug}
                onClose={() => setSelectedDrug(null)}
                onConfirm={handleConfirm}
              />
            </div>
          )}

          {/* If transfusion tab: selected drug detail as well */}
          {selectedDrug && activeTab === "transfusion" && (
            <div className="mb-5">
              <DrugDetailPanel
                drug={selectedDrug}
                onClose={() => setSelectedDrug(null)}
                onConfirm={handleConfirm}
              />
            </div>
          )}

          {/* Tab content */}
          <div className="max-h-[55vh] overflow-y-auto pr-1 space-y-2 scrollbar-thin scrollbar-thumb-zinc-700">
            {activeTab === "medication" && (
              <div className="space-y-4">
                {MED_SUBCATEGORIES.map((cat) => (
                  <DrugList
                    key={cat.label}
                    label={cat.label}
                    drugs={cat.drugs}
                    selectedId={selectedDrug?.id ?? null}
                    onSelect={handleSelectDrug}
                  />
                ))}
              </div>
            )}

            {activeTab === "fluid" && (
              <DrugList
                label="輸液 IV Fluids"
                drugs={medicationCategories.fluids}
                selectedId={selectedDrug?.id ?? null}
                onSelect={handleSelectDrug}
              />
            )}

            {activeTab === "transfusion" && (
              <TransfusionTab
                selectedId={selectedDrug?.id ?? null}
                onSelect={handleSelectDrug}
              />
            )}

            {activeTab === "hemostatic" && (
              <DrugList
                label="止血劑 Hemostatics"
                drugs={medicationCategories.hemostatics}
                selectedId={selectedDrug?.id ?? null}
                onSelect={handleSelectDrug}
              />
            )}

            {activeTab === "electrolyte" && (
              <DrugList
                label="電解質補充 Electrolytes"
                drugs={medicationCategories.electrolytes}
                selectedId={selectedDrug?.id ?? null}
                onSelect={handleSelectDrug}
              />
            )}

            {activeTab === "ventilator" && (
              <VentilatorTab onConfirm={handleVentConfirm} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
