"use client";

import { VitalSigns } from "@/lib/simulator/types";

function VitalItem({
  label,
  value,
  unit,
  color = "text-green-400",
  alert,
}: {
  label: string;
  value: string | number;
  unit?: string;
  color?: string;
  alert?: boolean;
}) {
  return (
    <div
      className={`px-3 py-2 rounded-lg bg-black/40 border ${
        alert ? "border-red-500/50 animate-pulse" : "border-white/5"
      }`}
    >
      <div className="text-[10px] uppercase tracking-wider text-gray-500">
        {label}
      </div>
      <div className={`text-xl font-mono font-bold ${color}`}>
        {value}
        {unit && (
          <span className="text-xs font-normal text-gray-500 ml-1">
            {unit}
          </span>
        )}
      </div>
    </div>
  );
}

export default function VitalsPanel({
  vitals,
  prevVitals,
}: {
  vitals: VitalSigns;
  prevVitals?: VitalSigns;
}) {
  const bpColor =
    vitals.bpSys < 90
      ? "text-red-400"
      : vitals.bpSys < 100
        ? "text-yellow-400"
        : "text-green-400";
  const hrColor =
    vitals.hr > 120
      ? "text-red-400"
      : vitals.hr > 100
        ? "text-yellow-400"
        : "text-green-400";
  const ctColor =
    vitals.chestTube > 200
      ? "text-red-400"
      : vitals.chestTube > 150
        ? "text-yellow-400"
        : "text-green-400";
  const uoColor =
    vitals.uo < 15
      ? "text-red-400"
      : vitals.uo < 30
        ? "text-yellow-400"
        : "text-green-400";

  const arrow = (curr: number, prev?: number) => {
    if (!prev) return "";
    if (curr > prev + 5) return " ↑";
    if (curr < prev - 5) return " ↓";
    return "";
  };

  return (
    <div className="bg-[#0a1628] rounded-xl p-4 border border-white/5">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
        <span className="text-xs text-gray-500 uppercase tracking-wider">
          Bedside Monitor
        </span>
      </div>
      <div className="grid grid-cols-4 gap-2">
        <VitalItem
          label="HR"
          value={`${vitals.hr}${arrow(vitals.hr, prevVitals?.hr)}`}
          unit="bpm"
          color={hrColor}
          alert={vitals.hr > 120}
        />
        <VitalItem
          label="ABP"
          value={`${vitals.bpSys}/${vitals.bpDia}${arrow(vitals.bpSys, prevVitals?.bpSys)}`}
          unit="mmHg"
          color={bpColor}
          alert={vitals.bpSys < 90}
        />
        <VitalItem
          label="SpO₂"
          value={vitals.spo2}
          unit="%"
          color={vitals.spo2 < 92 ? "text-red-400" : "text-cyan-400"}
        />
        <VitalItem
          label="CVP"
          value={`${vitals.cvp}${arrow(vitals.cvp, prevVitals?.cvp)}`}
          unit="mmHg"
          color="text-blue-400"
        />
        <VitalItem
          label="Chest Tube"
          value={`${vitals.chestTube}${arrow(vitals.chestTube, prevVitals?.chestTube)}`}
          unit="cc/hr"
          color={ctColor}
          alert={vitals.chestTube > 200}
        />
        <VitalItem
          label="UO"
          value={`${vitals.uo}${arrow(vitals.uo, prevVitals?.uo)}`}
          unit="cc/hr"
          color={uoColor}
          alert={vitals.uo < 15}
        />
        <VitalItem
          label="Temp"
          value={vitals.temp.toFixed(1)}
          unit="°C"
          color="text-gray-300"
        />
        {vitals.pap && (
          <VitalItem label="PAP" value={vitals.pap} unit="mmHg" color="text-purple-400" />
        )}
      </div>
      {vitals.extraLines && vitals.extraLines.length > 0 && (
        <div className="grid grid-cols-4 gap-2 mt-2">
          {vitals.extraLines.map((l, i) => (
            <VitalItem
              key={i}
              label={l.label}
              value={l.value}
              color={l.color || "text-gray-300"}
            />
          ))}
        </div>
      )}
    </div>
  );
}
