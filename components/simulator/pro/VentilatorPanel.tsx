"use client";

import { useState, useEffect } from "react";
import { useProGameStore } from "@/lib/simulator/store";
import { getBioGearsClient } from "@/lib/simulator/engine/biogears-engine";

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

/** Generate ventilator validation warnings based on current settings and readings */
function getVentWarnings(
  fio2: number,
  peep: number,
  peakPressure: number,
  plateauPressure: number,
  minuteVent: number,
): string[] {
  const warnings: string[] = [];
  if (fio2 > 0.6) warnings.push("FiO\u2082 > 60% \u2014 \u6CE8\u610F\u6C27\u4E2D\u6BD2\u98A8\u96AA");
  if (peep > 12) warnings.push("PEEP > 12 cmH\u2082O \u2014 \u53EF\u80FD\u5F71\u97FF\u8840\u58D3");
  if (peakPressure > 35) warnings.push("Peak P > 35 cmH\u2082O \u2014 \u6C23\u58D3\u50B7\u98A8\u96AA");
  if (plateauPressure > 30) warnings.push("Plateau P > 30 cmH\u2082O \u2014 \u80BA\u4FDD\u8B77\u7B56\u7565\u5EFA\u8B70 \u2264 30");
  if (minuteVent > 10) warnings.push("Minute Vent > 10 L/min \u2014 \u904E\u5EA6\u901A\u6C23");
  if (minuteVent < 3) warnings.push("Minute Vent < 3 L/min \u2014 \u901A\u6C23\u4E0D\u8DB3");
  return warnings;
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
  const [bgConnected, setBgConnected] = useState(false);

  const isActive = phase === "playing";

  // ── Poll BioGears connection status ────────────────────────
  useEffect(() => {
    if (!isActive) return;
    const check = () => {
      try {
        setBgConnected(getBioGearsClient().isInitialized);
      } catch {
        setBgConnected(false);
      }
    };
    check();
    const interval = setInterval(check, 3000);
    return () => clearInterval(interval);
  }, [isActive]);

  // ── Derived / displayed values ──────────────────────────────

  const rrActual = vitals?.rr ?? ventilator.rrSet;
  const tvActual = ventilator.tvSet;
  const minuteVent = ((rrActual * tvActual) / 1000).toFixed(1);
  const etco2 = vitals?.etco2 ?? Math.round(40 * (5.0 / Math.max(parseFloat(minuteVent), 1)));
  const fio2Pct = Math.round(ventilator.fio2 * 100);

  const peakPressure = Math.round(ventilator.peep + (ventilator.tvSet / 40));
  const plateauPressure = Math.round(peakPressure - 5);

  // Validation warnings
  const warnings = getVentWarnings(
    ventilator.fio2,
    ventilator.peep,
    peakPressure,
    plateauPressure,
    parseFloat(minuteVent),
  );

  // Color coding
  const fio2Color = ventilator.fio2 > 0.8 ? "text-red-400" : ventilator.fio2 > 0.6 ? "text-yellow-400" : "text-green-400";
  const peepColor = valueColor(ventilator.peep, [4, 10], [3, 15]);
  const rrColor = valueColor(rrActual, [10, 20], [8, 25]);
  const mvColor = valueColor(parseFloat(minuteVent), [4, 8], [3, 10]);
  const etco2Color = valueColor(etco2, [35, 45], [30, 50]);
  const ppColor = valueColor(peakPressure, [0, 30], [0, 40]);

  return (
    <div className={`rounded-xl border overflow-hidden transition-colors duration-500 ${
      warnings.length > 0 ? "border-yellow-500/40 bg-[#001a25]" : "border-white/8 bg-[#001a25]"
    }`}>
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
          {/* BioGears Sync indicator */}
          {bgConnected && (
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-900/60 border border-emerald-500/30 text-emerald-400 font-mono uppercase tracking-wider ml-1">
              BioGears Sync
            </span>
          )}
          {/* Warning count badge */}
          {warnings.length > 0 && (
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-yellow-900/60 border border-yellow-500/30 text-yellow-400 font-bold ml-1">
              {warnings.length}
            </span>
          )}
        </div>
        <span className="text-gray-600 text-xs">{collapsed ? "▸" : "▾"}</span>
      </button>

      {!collapsed && (
        <div className="px-4 pb-4 space-y-4">
          {/* ── Validation warnings ──────────────────────────── */}
          {warnings.length > 0 && (
            <div className="rounded-lg border border-yellow-500/30 bg-yellow-900/10 px-3 py-2 space-y-1">
              {warnings.map((w, i) => (
                <p key={i} className="text-[11px] text-yellow-400 leading-tight">
                  ⚠ {w}
                </p>
              ))}
            </div>
          )}

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
        </div>
      )}
    </div>
  );
}
