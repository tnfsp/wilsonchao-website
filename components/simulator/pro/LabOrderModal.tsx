"use client";

import { useState, useCallback } from "react";
import { useProGameStore } from "@/lib/simulator/store";
import { allLabs } from "@/lib/simulator/data/labs";
import type { OrderDefinition } from "@/lib/simulator/types";

// ============================================================
// Lab display metadata — 每個 lab item 一條
// ============================================================

interface LabMeta {
  emoji: string;
  desc: string;
}

const LAB_META: Record<string, LabMeta> = {
  // Bundles
  cbc: { emoji: "🩸", desc: "Hb / Hct / Plt / WBC / MCV / MCH" },
  abg: { emoji: "💨", desc: "pH / PaO₂ / PaCO₂ / HCO₃ / BE / Lactate / SaO₂" },
  // Individual chemistry
  na: { emoji: "🧪", desc: "Sodium" },
  k: { emoji: "🧪", desc: "Potassium" },
  cl: { emoji: "🧪", desc: "Chloride" },
  co2: { emoji: "🧪", desc: "Total CO₂ (Bicarb)" },
  bun: { emoji: "🧪", desc: "Blood Urea Nitrogen" },
  cr: { emoji: "🧪", desc: "Creatinine" },
  glucose: { emoji: "🩸", desc: "Blood Glucose" },
  // Individual coagulation
  pt_inr: { emoji: "🧬", desc: "Prothrombin Time / INR" },
  aptt: { emoji: "🧬", desc: "Activated Partial Thromboplastin Time" },
  fibrinogen: { emoji: "🧬", desc: "Fibrinogen level" },
  act: { emoji: "⏱️", desc: "Activated Clotting Time (bedside)" },
  // Blood gas individual
  lactate: { emoji: "⚗️", desc: "Serum / Arterial Lactate" },
  ica: { emoji: "🦴", desc: "Ionized Ca²⁺" },
  // Cardiac
  troponin: { emoji: "❤️", desc: "Troponin I" },
  // Blood bank
  type_screen: { emoji: "🅰️", desc: "Type & Screen / Crossmatch / 備血" },
  // Special
  teg: { emoji: "📊", desc: "Thromboelastography" },
  rotem: { emoji: "📈", desc: "ROTEM" },
  blood_culture: { emoji: "🦠", desc: "Blood Culture × 2 sets" },
};

// ============================================================
// Group display order — 臨床分類
// ============================================================

const LAB_GROUPS: { label: string; ids: string[] }[] = [
  { label: "血液 / 血庫", ids: ["cbc", "type_screen"] },
  { label: "Blood Gas", ids: ["abg", "lactate", "ica"] },
  { label: "生化", ids: ["na", "k", "cl", "co2", "bun", "cr", "glucose", "troponin"] },
  { label: "凝血", ids: ["pt_inr", "aptt", "fibrinogen", "act"] },
  { label: "特殊", ids: ["teg", "rotem", "blood_culture"] },
];

// Build lookup
const labById: Record<string, OrderDefinition> = Object.fromEntries(
  allLabs.map((l) => [l.id, l])
);

// ============================================================
// Format turnaround time
// ============================================================

function formatTAT(minutes: number, stat: boolean): string {
  const effective = stat ? Math.ceil(minutes * 0.5) : minutes;
  if (effective >= 60) {
    const h = Math.floor(effective / 60);
    const m = effective % 60;
    return m > 0 ? `約 ${h}h ${m}min` : `約 ${h} 小時`;
  }
  return `約 ${effective} 分鐘`;
}

// ============================================================
// Main LabOrderModal
// ============================================================

export default function LabOrderModal() {
  const activeModal = useProGameStore((s) => s.activeModal);
  const closeModal = useProGameStore((s) => s.closeModal);
  const placeOrder = useProGameStore((s) => s.placeOrder);

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isStat, setIsStat] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [submittedNames, setSubmittedNames] = useState<string[]>([]);

  const isOpen = activeModal === "lab_order";

  const toggleLab = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleSelectGroup = (ids: string[]) => {
    setSelected((prev) => {
      const next = new Set(prev);
      const validIds = ids.filter((id) => labById[id]);
      const allSelected = validIds.every((id) => next.has(id));
      if (allSelected) {
        validIds.forEach((id) => next.delete(id));
      } else {
        validIds.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  const handleSubmit = useCallback(() => {
    if (selected.size === 0) return;
    const names: string[] = [];

    selected.forEach((id) => {
      const def = labById[id];
      if (!def) return;

      // Stat vs Routine — adjust timeToResult in a patched definition
      const patchedDef: OrderDefinition = isStat
        ? {
            ...def,
            timeToResult: def.timeToResult
              ? Math.ceil(def.timeToResult * 0.5)
              : def.timeToResult,
          }
        : def;

      placeOrder({
        definition: patchedDef,
        dose: "1",
        frequency: isStat ? "STAT" : "Routine",
      });
      names.push(def.name);
    });

    setSubmittedNames(names);
    setSubmitted(true);
    setSelected(new Set());
  }, [selected, isStat, placeOrder]);

  const handleClose = () => {
    setSubmitted(false);
    setSubmittedNames([]);
    closeModal();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl mx-auto my-6 bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-800">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-zinc-800">
          <div>
            <h2 className="text-white font-bold text-xl">🔬 開 Lab 檢查</h2>
            <p className="text-zinc-400 text-sm mt-0.5">勾選所需項目後送出</p>
          </div>
          <button
            onClick={handleClose}
            className="text-zinc-500 hover:text-white text-2xl leading-none transition"
          >
            ×
          </button>
        </div>

        {/* Stat / Routine toggle */}
        <div className="px-6 pt-4 pb-2 flex items-center gap-4">
          <p className="text-zinc-400 text-sm">優先度：</p>
          <div className="flex rounded-lg overflow-hidden border border-zinc-700">
            <button
              onClick={() => setIsStat(true)}
              className={`px-4 py-1.5 text-sm font-semibold transition ${
                isStat
                  ? "bg-red-600 text-white"
                  : "bg-zinc-800 text-zinc-400 hover:text-zinc-200"
              }`}
            >
              🚨 STAT
            </button>
            <button
              onClick={() => setIsStat(false)}
              className={`px-4 py-1.5 text-sm font-semibold transition ${
                !isStat
                  ? "bg-zinc-600 text-white"
                  : "bg-zinc-800 text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Routine
            </button>
          </div>
          {isStat && (
            <span className="text-xs text-red-400">結果時間 × 0.5</span>
          )}
        </div>

        {/* Success message */}
        {submitted && submittedNames.length > 0 && (
          <div className="mx-6 mb-2 bg-green-900/40 border border-green-600 rounded-lg px-4 py-3 text-sm text-green-300">
            ✅ 已送出：{submittedNames.join("、")}
          </div>
        )}

        {/* Lab list */}
        <div className="px-6 pb-4 max-h-[60vh] overflow-y-auto space-y-5 scrollbar-thin scrollbar-thumb-zinc-700">
          {LAB_GROUPS.map((group) => {
            const validIds = group.ids.filter((id) => labById[id]);
            if (validIds.length === 0) return null;

            return (
              <div key={group.label}>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs uppercase tracking-widest text-zinc-500">{group.label}</p>
                  <button
                    onClick={() => handleSelectGroup(validIds)}
                    className="text-xs text-cyan-500 hover:text-cyan-300 transition"
                  >
                    {validIds.every((id) => selected.has(id)) ? "取消全選" : "全選"}
                  </button>
                </div>
                <div className="space-y-1.5">
                  {validIds.map((id) => {
                    const def = labById[id];
                    const meta = LAB_META[id];
                    const isChecked = selected.has(id);
                    const tat = def.timeToResult ? formatTAT(def.timeToResult, isStat) : "—";

                    return (
                      <button
                        key={id}
                        onClick={() => toggleLab(id)}
                        className={`w-full flex items-start gap-3 px-4 py-2.5 rounded-lg border text-left transition ${
                          isChecked
                            ? "bg-cyan-600/20 border-cyan-500"
                            : "bg-zinc-800 border-zinc-700 hover:border-zinc-500"
                        }`}
                      >
                        {/* Checkbox */}
                        <div
                          className={`mt-0.5 flex-shrink-0 w-4 h-4 rounded border-2 flex items-center justify-center ${
                            isChecked
                              ? "bg-cyan-500 border-cyan-500"
                              : "border-zinc-600"
                          }`}
                        >
                          {isChecked && (
                            <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 10 10">
                              <path d="M1 5l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                            </svg>
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm">{meta?.emoji ?? "🔬"}</span>
                            <span className={`font-semibold text-sm ${isChecked ? "text-cyan-200" : "text-white"}`}>
                              {def.name}
                            </span>
                          </div>
                          {meta?.desc && (
                            <p className="text-zinc-500 text-xs mt-0.5 leading-snug">{meta.desc}</p>
                          )}
                        </div>

                        {/* TAT */}
                        <div className="flex-shrink-0 text-right">
                          <p className="text-xs text-zinc-400">{tat}</p>
                          {def.route && (
                            <p className="text-xs text-zinc-600 mt-0.5">{def.route}</p>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-6 pb-5 pt-3 border-t border-zinc-800 flex items-center gap-3">
          <div className="flex-1">
            {selected.size > 0 ? (
              <p className="text-sm text-zinc-400">
                已選 <span className="text-cyan-400 font-semibold">{selected.size}</span> 項
              </p>
            ) : (
              <p className="text-sm text-zinc-600">尚未選擇任何項目</p>
            )}
          </div>
          <button
            onClick={handleClose}
            className="px-4 py-2 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white text-sm transition"
          >
            關閉
          </button>
          <button
            onClick={handleSubmit}
            disabled={selected.size === 0}
            className={`px-6 py-2 rounded-lg font-bold text-sm transition ${
              selected.size > 0
                ? "bg-cyan-600 hover:bg-cyan-500 text-white"
                : "bg-zinc-700 text-zinc-500 cursor-not-allowed"
            }`}
          >
            送出 {selected.size > 0 ? `(${selected.size})` : ""}
          </button>
        </div>
      </div>
    </div>
  );
}
