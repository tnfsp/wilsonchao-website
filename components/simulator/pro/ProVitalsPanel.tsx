"use client";

import { useProGameStore } from "@/lib/simulator/store";
import type { VitalSigns, ALineWaveform } from "@/lib/simulator/types";

// ─── helpers ─────────────────────────────────────────────────────────────────

function calcMAP(sbp: number, dbp: number): number {
  return Math.round(dbp + (sbp - dbp) / 3);
}

function trend(curr: number, prev: number | undefined, threshold = 3): "↑" | "↓" | "→" {
  if (prev === undefined) return "→";
  if (curr > prev + threshold) return "↑";
  if (curr < prev - threshold) return "↓";
  return "→";
}

function trendColor(arrow: "↑" | "↓" | "→"): string {
  if (arrow === "↑") return "text-red-400";
  if (arrow === "↓") return "text-blue-400";
  return "text-gray-400";
}

const aLineLabels: Record<ALineWaveform, string> = {
  normal: "Normal",
  dampened: "Dampened",
  low_amplitude: "Low Amplitude",
  wide_pp_variation: "Wide PP Variation",
  pulsus_alternans: "Pulsus Alternans",
};

const aLineColors: Record<ALineWaveform, string> = {
  normal: "text-green-400",
  dampened: "text-yellow-400",
  low_amplitude: "text-orange-400",
  wide_pp_variation: "text-orange-400",
  pulsus_alternans: "text-red-400",
};

// ─── VitalCard ────────────────────────────────────────────────────────────────

interface VitalCardProps {
  label: string;
  value: string | number;
  unit?: string;
  valueColor: string;
  alert?: boolean;
  trendArrow?: "↑" | "↓" | "→";
  subValue?: string;
}

function VitalCard({
  label,
  value,
  unit,
  valueColor,
  alert = false,
  trendArrow,
  subValue,
}: VitalCardProps) {
  return (
    <div
      className={`relative rounded-xl p-3 border flex flex-col gap-0.5 ${
        alert
          ? "border-red-500/60 bg-red-950/30 animate-pulse"
          : "border-white/8 bg-white/5"
      }`}
    >
      <div className="text-[10px] uppercase tracking-widest text-gray-500 font-medium">
        {label}
      </div>
      <div className={`font-mono font-bold text-2xl leading-none ${valueColor}`}>
        {value}
        {trendArrow && (
          <span className={`text-base ml-1 ${trendColor(trendArrow)}`}>
            {trendArrow}
          </span>
        )}
        {unit && (
          <span className="text-xs font-normal text-gray-500 ml-1">{unit}</span>
        )}
      </div>
      {subValue && (
        <div className="text-xs text-gray-500 font-mono">{subValue}</div>
      )}
      {alert && (
        <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
      )}
    </div>
  );
}

// ─── ProVitalsPanel ───────────────────────────────────────────────────────────

export default function ProVitalsPanel({
  prevVitals,
}: {
  prevVitals?: VitalSigns;
}) {
  const vitals = useProGameStore((s) => s.patient?.vitals);

  if (!vitals) {
    return (
      <div className="rounded-xl border border-white/8 bg-white/5 p-4 text-gray-500 text-sm">
        Vitals 尚未載入
      </div>
    );
  }

  const mapVal = vitals.map ?? calcMAP(vitals.sbp, vitals.dbp);
  const hrAlert = vitals.hr > 120 || vitals.hr < 50;
  const bpAlert = vitals.sbp < 90;
  const spo2Alert = vitals.spo2 < 92;
  const tempAlert = vitals.temperature < 36;

  const hrArrow = trend(vitals.hr, prevVitals?.hr, 5);
  const bpArrow = trend(vitals.sbp, prevVitals?.sbp, 5);
  const spo2Arrow = trend(vitals.spo2, prevVitals?.spo2, 1);
  const cvpArrow = trend(vitals.cvp, prevVitals?.cvp, 1);
  const rrArrow = trend(vitals.rr, prevVitals?.rr, 2);

  const aLineLabel = aLineLabels[vitals.aLineWaveform] ?? vitals.aLineWaveform;
  const aLineColor = aLineColors[vitals.aLineWaveform] ?? "text-gray-300";

  return (
    <div className="rounded-xl border border-white/8 bg-[#001a25] p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-[10px] uppercase tracking-widest text-gray-500 font-medium">
            Vital Signs
          </span>
        </div>
        <span className="text-[10px] text-gray-600 font-mono">
          Bedside Monitor
        </span>
      </div>

      {/* Main vitals grid */}
      <div className="grid grid-cols-2 gap-2">
        <VitalCard
          label="HR"
          value={vitals.hr}
          unit="bpm"
          valueColor={hrAlert ? "text-red-400" : vitals.hr > 100 ? "text-yellow-400" : "text-red-300"}
          alert={hrAlert}
          trendArrow={hrArrow}
        />
        <VitalCard
          label="BP (A-line)"
          value={`${vitals.sbp}/${vitals.dbp}`}
          unit="mmHg"
          valueColor={bpAlert ? "text-red-400" : vitals.sbp < 100 ? "text-yellow-400" : "text-white"}
          alert={bpAlert}
          trendArrow={bpArrow}
          subValue={`MAP ${mapVal} mmHg`}
        />
        <VitalCard
          label="SpO₂"
          value={vitals.spo2}
          unit="%"
          valueColor={spo2Alert ? "text-red-400" : "text-blue-400"}
          alert={spo2Alert}
          trendArrow={spo2Arrow}
        />
        <VitalCard
          label="CVP"
          value={vitals.cvp}
          unit="mmHg"
          valueColor="text-yellow-400"
          trendArrow={cvpArrow}
        />
        <VitalCard
          label="Temp"
          value={vitals.temperature.toFixed(1)}
          unit="°C"
          valueColor={tempAlert ? "text-red-400" : vitals.temperature < 36.5 ? "text-orange-400" : "text-orange-300"}
          alert={tempAlert}
        />
        <VitalCard
          label="RR"
          value={vitals.rr}
          unit="/min"
          valueColor={vitals.rr > 25 || vitals.rr < 10 ? "text-orange-400" : "text-gray-300"}
          trendArrow={rrArrow}
        />
      </div>

      {/* A-line waveform */}
      <div className="rounded-lg border border-white/8 bg-black/30 px-3 py-2 flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-widest text-gray-500">
          A-line Waveform
        </span>
        <span className={`text-sm font-mono font-semibold ${aLineColor}`}>
          {aLineLabel}
        </span>
      </div>

      {/* etco2 optional */}
      {vitals.etco2 !== undefined && (
        <div className="rounded-lg border border-white/8 bg-black/30 px-3 py-2 flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-widest text-gray-500">
            EtCO₂
          </span>
          <span className="text-sm font-mono font-semibold text-teal-400">
            {vitals.etco2} mmHg
          </span>
        </div>
      )}
    </div>
  );
}
