"use client";

import { useMemo } from "react";
import { useProGameStore } from "@/lib/simulator/store";
import { applyVitalsFog, FOG_PRESETS } from "@/lib/simulator/engine/fog-of-war";
import WaveformMonitor from "./WaveformMonitor";
import ChestTubeInline from "./ChestTubeInline";

// ─── Severity helpers ────────────────────────────────────────────────────────

type AlertLevel = "normal" | "warning" | "critical";

function hrSeverity(hr: number): AlertLevel {
  if (hr > 130 || hr < 45) return "critical";
  if (hr > 100 || hr < 60) return "warning";
  return "normal";
}

function bpSeverity(sbp: number): AlertLevel {
  if (sbp < 80) return "critical";
  if (sbp < 95) return "warning";
  return "normal";
}

function mapSeverity(map: number): AlertLevel {
  if (map < 55) return "critical";
  if (map < 65) return "warning";
  return "normal";
}

function spo2Severity(spo2: number): AlertLevel {
  if (spo2 < 90) return "critical";
  if (spo2 < 95) return "warning";
  return "normal";
}

function cvpSeverity(cvp: number): AlertLevel {
  if (cvp < 2 || cvp > 16) return "critical";
  if (cvp < 4 || cvp > 14) return "warning";
  return "normal";
}

function tempSeverity(temp: number): AlertLevel {
  if (temp < 35 || temp > 38.5) return "critical";
  if (temp < 35.5 || temp > 38) return "warning";
  return "normal";
}

function calcMAP(sbp: number, dbp: number): number {
  return Math.round(dbp + (sbp - dbp) / 3);
}

function trend(curr: number, prev: number | undefined, threshold = 3): string {
  if (prev === undefined) return "";
  if (curr > prev + threshold) return "\u2191";
  if (curr < prev - threshold) return "\u2193";
  return "";
}

const levelColor: Record<AlertLevel, string> = {
  normal: "text-green-400",
  warning: "text-yellow-400",
  critical: "text-red-400",
};

const criticalPulseCSS = `
@keyframes mobile-vital-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
.mv-critical { animation: mobile-vital-pulse 1.5s ease-in-out infinite; }
`;

// ─── Inline Vital ────────────────────────────────────────────────────────────

function V({
  label,
  value,
  level,
  trendStr,
}: {
  label: string;
  value: string;
  level: AlertLevel;
  trendStr?: string;
}) {
  return (
    <span className={`${level === "critical" ? "mv-critical" : ""}`}>
      <span className="text-gray-500">{label}</span>
      <span className={`font-mono font-bold ml-0.5 ${levelColor[level]}`}>
        {value}
      </span>
      {trendStr && (
        <span className={`text-[10px] ${trendStr === "\u2191" ? "text-red-400" : "text-blue-400"}`}>
          {trendStr}
        </span>
      )}
    </span>
  );
}

// ─── MobileMonitorPanel ──────────────────────────────────────────────────────
// Fixed-height panel for mobile: 2 vitals rows + waveform + CT status

export default function MobileMonitorPanel() {
  const rawVitals = useProGameStore((s) => s.patient?.vitals);
  const fogLevel = useProGameStore((s) => s.difficultyConfig.fogLevel ?? "none");
  const gameTime = useProGameStore((s) => s.clock.currentTime);

  // Apply fog-of-war
  const fogConfig = FOG_PRESETS[fogLevel] ?? FOG_PRESETS.none;
  const vitals = useMemo(() => {
    if (!rawVitals) return undefined;
    return applyVitalsFog(rawVitals, fogConfig, Math.floor(gameTime * 1000)).displayVitals;
  }, [rawVitals, fogConfig, gameTime]);

  if (!vitals) return null;

  const map = vitals.map ?? calcMAP(vitals.sbp, vitals.dbp);
  const hr = Math.round(vitals.hr);
  const sbp = Math.round(vitals.sbp);
  const dbp = Math.round(vitals.dbp);
  const spo2 = Math.round(vitals.spo2);
  const cvp = Math.round(vitals.cvp);
  const temp = vitals.temperature;
  const rr = Math.round(vitals.rr);

  return (
    <div className="bg-[#000d14] border-b border-white/8">
      <style dangerouslySetInnerHTML={{ __html: criticalPulseCSS }} />

      {/* ── Row 1: HR BP MAP ── */}
      <div className="flex items-center gap-3 px-3 py-1 text-xs">
        <V label="HR" value={String(hr)} level={hrSeverity(hr)} trendStr={trend(hr, undefined)} />
        <V label="BP" value={`${sbp}/${dbp}`} level={bpSeverity(sbp)} />
        <V label="MAP" value={String(map)} level={mapSeverity(map)} />
      </div>

      {/* ── Row 2: SpO2 CVP T RR ── */}
      <div className="flex items-center gap-3 px-3 py-1 text-xs border-t border-white/5">
        <V label="SpO\u2082" value={String(spo2)} level={spo2Severity(spo2)} />
        <V label="CVP" value={String(cvp)} level={cvpSeverity(cvp)} />
        <V label="T" value={temp.toFixed(1)} level={tempSeverity(temp)} />
        <V label="RR" value={String(rr)} level={rr > 25 || rr < 10 ? "warning" : "normal"} />
      </div>

      {/* ── Waveform: full ECG + A-line + SpO2 + CO2 ── */}
      <WaveformMonitor height={140} className="rounded-none border-0" />

      {/* ── CT Status inline ── */}
      <ChestTubeInline />
    </div>
  );
}
