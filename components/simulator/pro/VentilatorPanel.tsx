"use client";

import { useState } from "react";
import { useProGameStore } from "@/lib/simulator/store";

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

// ─── VentilatorPanel (read-only monitoring display) ───────────────────────────

export default function VentilatorPanel() {
  const ventilator = useProGameStore((s) => s.ventilator);
  const vitals = useProGameStore((s) => s.patient?.vitals);
  const phase = useProGameStore((s) => s.phase);

  const [collapsed, setCollapsed] = useState(true);

  const isActive = phase === "playing";

  // ── Derived / displayed values ──────────────────────────────

  const rrActual = vitals?.rr ?? ventilator.rrSet;
  const tvActual = ventilator.tvSet;
  const minuteVent = ((rrActual * tvActual) / 1000).toFixed(1);
  const etco2 = vitals?.etco2 ?? Math.round(40 * (5.0 / Math.max(parseFloat(minuteVent), 1)));
  const fio2Pct = Math.round(ventilator.fio2 * 100);

  const peakPressure = Math.round(ventilator.peep + (ventilator.tvSet / 40));
  const plateauPressure = Math.round(peakPressure - 5);

  // Color coding
  const fio2Color = ventilator.fio2 > 0.6 ? "text-yellow-400" : ventilator.fio2 > 0.8 ? "text-red-400" : "text-green-400";
  const peepColor = valueColor(ventilator.peep, [4, 10], [3, 15]);
  const rrColor = valueColor(rrActual, [10, 20], [8, 25]);
  const mvColor = valueColor(parseFloat(minuteVent), [4, 8], [3, 10]);
  const etco2Color = valueColor(etco2, [35, 45], [30, 50]);
  const ppColor = valueColor(peakPressure, [0, 30], [0, 40]);

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

          {/* Teaching note */}
          <div className="rounded border border-blue-900/30 bg-blue-950/10 px-3 py-2">
            <p className="text-blue-400/60 text-[10px] leading-relaxed">
              💡 術後標準：FiO₂ 0.4, PEEP 5。肺水腫/ARDS → 提高 PEEP ≥ 8 改善氧合。高 PEEP 會升高 CVP，注意血壓。調整呼吸器請至「開 Order → 呼吸器」。
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
