"use client";

import { useState } from "react";
import { useProGameStore } from "@/lib/simulator/store";
import type { VentMode } from "@/lib/simulator/types";

// ─── helpers ─────────────────────────────────────────────────────────────────

function valueColor(
  value: number,
  normalRange: [number, number],
  warnRange?: [number, number]
): string {
  const [nMin, nMax] = normalRange;
  if (value >= nMin && value <= nMax) return "text-green-400";
  if (warnRange) {
    const [wMin, wMax] = warnRange;
    if (value >= wMin && value <= wMax) return "text-yellow-400";
  }
  return "text-red-400";
}

// ─── Sub-components ────────────────────────────────────────────────────────────

interface ReadingRowProps {
  label: string;
  value: string | number;
  unit: string;
  colorClass?: string;
}

function ReadingRow({ label, value, unit, colorClass = "text-green-400" }: ReadingRowProps) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-[10px] uppercase tracking-widest text-gray-500 font-medium">{label}</span>
      <span className={`font-mono text-sm font-bold ${colorClass}`}>
        {value}
        <span className="text-[10px] text-gray-500 ml-1 font-normal">{unit}</span>
      </span>
    </div>
  );
}

interface StepperProps {
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  unit?: string;
  colorClass?: string;
}

function Stepper({ value, min, max, step, onChange, unit, colorClass = "text-white" }: StepperProps) {
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => onChange(Math.max(min, value - step))}
        className="w-6 h-6 flex items-center justify-center rounded border border-white/10 text-gray-400 hover:text-white hover:border-teal-500/50 transition-colors text-sm"
      >
        −
      </button>
      <span className={`font-mono text-sm font-bold w-14 text-center ${colorClass}`}>
        {value}
        {unit && <span className="text-[10px] text-gray-500 ml-0.5 font-normal">{unit}</span>}
      </span>
      <button
        onClick={() => onChange(Math.min(max, value + step))}
        className="w-6 h-6 flex items-center justify-center rounded border border-white/10 text-gray-400 hover:text-white hover:border-teal-500/50 transition-colors text-sm"
      >
        +
      </button>
    </div>
  );
}

// ─── VentilatorPanel ───────────────────────────────────────────────────────────

export default function VentilatorPanel() {
  const ventilator = useProGameStore((s) => s.ventilator);
  const vitals = useProGameStore((s) => s.patient?.vitals);
  const updateVentilator = useProGameStore((s) => s.updateVentilator);
  const phase = useProGameStore((s) => s.phase);

  const [collapsed, setCollapsed] = useState(false);

  const isActive = phase === "playing";

  // ── Derived / displayed values ──────────────────────────────

  // Actual RR from vitals (may differ from set RR)
  const rrActual = vitals?.rr ?? ventilator.rrSet;
  // Approximate actual TV (set TV ± 5% noise)
  const tvActual = ventilator.tvSet;
  // Minute ventilation
  const minuteVent = ((rrActual * tvActual) / 1000).toFixed(1);
  // EtCO2 from vitals (patient-engine computes from MV)
  const etco2 = vitals?.etco2 ?? Math.round(40 * (5.0 / Math.max(parseFloat(minuteVent), 1)));
  // FiO2 percentage display
  const fio2Pct = Math.round(ventilator.fio2 * 100);

  // Peak pressure estimate (rough: mode VC → depends on TV/compliance)
  const peakPressure = Math.round(ventilator.peep + (ventilator.tvSet / 40));
  // Plateau pressure (peak - flow resistance)
  const plateauPressure = Math.round(peakPressure - 5);

  // Color coding
  const fio2Color = ventilator.fio2 > 0.6 ? "text-yellow-400" : ventilator.fio2 > 0.8 ? "text-red-400" : "text-green-400";
  const peepColor = valueColor(ventilator.peep, [4, 10], [3, 15]);
  const rrColor = valueColor(rrActual, [10, 20], [8, 25]);
  const mvColor = valueColor(parseFloat(minuteVent), [4, 8], [3, 10]);
  const etco2Color = valueColor(etco2, [35, 45], [30, 50]);
  const ppColor = valueColor(peakPressure, [0, 30], [0, 40]);

  const VENT_MODES: VentMode[] = ['VC', 'PC', 'PS', 'SIMV'];

  return (
    <div className="rounded-xl border border-white/8 bg-[#001a25] overflow-hidden transition-colors duration-500">
      {/* Header */}
      <button
        onClick={() => setCollapsed((c) => !c)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isActive ? "bg-blue-400 animate-pulse" : "bg-gray-600"}`} />
          <span className="text-[10px] uppercase tracking-widest text-gray-500 font-medium">
            Ventilator
          </span>
          <span className="text-[10px] text-blue-400/60 font-mono ml-1">
            {ventilator.mode} · FiO₂ {fio2Pct}% · PEEP {ventilator.peep}
          </span>
        </div>
        <span className="text-gray-600 text-xs">{collapsed ? "▸" : "▾"}</span>
      </button>

      {!collapsed && (
        <div className="px-4 pb-4 space-y-4">
          {/* ── Current settings display ─────────────────────── */}
          <div className="rounded-lg border border-white/5 bg-black/20 px-3 py-2 space-y-0.5">
            <p className="text-[9px] uppercase tracking-widest text-gray-600 mb-1.5">Settings</p>
            <ReadingRow label="Mode" value={ventilator.mode} unit="" colorClass="text-blue-400" />
            <ReadingRow label="FiO₂" value={`${fio2Pct}%`} unit="" colorClass={fio2Color} />
            <ReadingRow label="PEEP" value={ventilator.peep} unit="cmH₂O" colorClass={peepColor} />
            <ReadingRow label="RR Set" value={ventilator.rrSet} unit="/min" colorClass={rrColor} />
            <ReadingRow label="TV Set" value={ventilator.tvSet} unit="mL" colorClass="text-gray-300" />
            <ReadingRow label="I:E" value={ventilator.ieRatio} unit="" colorClass="text-gray-400" />
          </div>

          {/* ── Live data ────────────────────────────────────── */}
          <div className="rounded-lg border border-white/5 bg-black/20 px-3 py-2 space-y-0.5">
            <p className="text-[9px] uppercase tracking-widest text-gray-600 mb-1.5">Monitoring</p>
            <ReadingRow label="RR Actual" value={Math.round(rrActual)} unit="/min" colorClass={rrColor} />
            <ReadingRow label="TV Actual" value={tvActual} unit="mL" colorClass="text-gray-300" />
            <ReadingRow label="Min Vent" value={minuteVent} unit="L/min" colorClass={mvColor} />
            <ReadingRow label="EtCO₂" value={etco2} unit="mmHg" colorClass={etco2Color} />
            <ReadingRow label="Peak P" value={peakPressure} unit="cmH₂O" colorClass={ppColor} />
            <ReadingRow label="Plateau P" value={plateauPressure} unit="cmH₂O" colorClass={valueColor(plateauPressure, [0, 28], [0, 35])} />
          </div>

          {/* ── Controls ─────────────────────────────────────── */}
          {isActive && (
            <div className="space-y-3">
              <p className="text-[9px] uppercase tracking-widest text-gray-600">Adjust</p>

              {/* Mode */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">Mode</span>
                <div className="flex gap-1">
                  {VENT_MODES.map((m) => (
                    <button
                      key={m}
                      onClick={() => updateVentilator({ mode: m })}
                      className={`text-[10px] px-2 py-0.5 rounded border transition-colors font-mono font-bold ${
                        ventilator.mode === m
                          ? "border-blue-500/60 bg-blue-900/30 text-blue-300"
                          : "border-white/10 text-gray-500 hover:border-white/20 hover:text-gray-300"
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              {/* FiO2 slider */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">FiO₂</span>
                  <span className={`font-mono text-sm font-bold ${fio2Color}`}>{fio2Pct}%</span>
                </div>
                <input
                  type="range"
                  min={21}
                  max={100}
                  step={5}
                  value={fio2Pct}
                  onChange={(e) => updateVentilator({ fio2: parseInt(e.target.value) / 100 })}
                  className="w-full h-1 rounded-full appearance-none cursor-pointer accent-blue-400"
                  style={{ background: `linear-gradient(to right, #60a5fa ${fio2Pct}%, #1e293b ${fio2Pct}%)` }}
                />
                <div className="flex justify-between text-[9px] text-gray-600">
                  <span>21%</span>
                  <span>60%</span>
                  <span>100%</span>
                </div>
              </div>

              {/* PEEP stepper */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">PEEP</span>
                <Stepper
                  value={ventilator.peep}
                  min={0}
                  max={20}
                  step={1}
                  onChange={(v) => updateVentilator({ peep: v })}
                  unit="cmH₂O"
                  colorClass={peepColor}
                />
              </div>

              {/* RR stepper */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">RR</span>
                <Stepper
                  value={ventilator.rrSet}
                  min={8}
                  max={30}
                  step={1}
                  onChange={(v) => updateVentilator({ rrSet: v })}
                  unit="/min"
                  colorClass={rrColor}
                />
              </div>

              {/* TV stepper */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">TV</span>
                <Stepper
                  value={ventilator.tvSet}
                  min={300}
                  max={700}
                  step={25}
                  onChange={(v) => updateVentilator({ tvSet: v })}
                  unit="mL"
                  colorClass="text-gray-300"
                />
              </div>

              {/* I:E ratio */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">I:E Ratio</span>
                <div className="flex gap-1">
                  {["1:1.5", "1:2", "1:3", "1:4"].map((ie) => (
                    <button
                      key={ie}
                      onClick={() => updateVentilator({ ieRatio: ie })}
                      className={`text-[10px] px-1.5 py-0.5 rounded border transition-colors font-mono ${
                        ventilator.ieRatio === ie
                          ? "border-teal-500/60 bg-teal-900/30 text-teal-300"
                          : "border-white/10 text-gray-500 hover:border-white/20 hover:text-gray-300"
                      }`}
                    >
                      {ie}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Teaching note */}
          <div className="rounded border border-blue-900/30 bg-blue-950/10 px-3 py-2">
            <p className="text-blue-400/60 text-[10px] leading-relaxed">
              💡 術後標準：FiO₂ 0.4, PEEP 5。肺水腫/ARDS → 提高 PEEP ≥ 8 改善氧合。高 PEEP 會升高 CVP，注意血壓。
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
