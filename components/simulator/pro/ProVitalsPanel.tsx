"use client";

import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { useProGameStore } from "@/lib/simulator/store";
import type { VitalSigns, ALineWaveform } from "@/lib/simulator/types";
import { applyVitalsFog, FOG_PRESETS } from "@/lib/simulator/engine/fog-of-war";
import { getLastBioGearsState, getBioGearsClient } from "@/lib/simulator/engine/biogears-engine";
import type { BioGearsHemodynamics } from "@/lib/simulator/engine/biogears-client";

// ─── CSS ─────────────────────────────────────────────────────────────────────

const vitalsPanelStyle = `
@keyframes border-flash-green {
  0% { border-color: rgba(34, 197, 94, 0.9); box-shadow: 0 0 0 2px rgba(34, 197, 94, 0.5); }
  100% { border-color: transparent; box-shadow: none; }
}
@keyframes border-flash-red {
  0% { border-color: rgba(239, 68, 68, 0.9); box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.5); }
  100% { border-color: transparent; box-shadow: none; }
}
@keyframes severity-pulse {
  0%, 100% { border-color: rgba(239, 68, 68, 0.4); }
  50% { border-color: rgba(239, 68, 68, 0.9); }
}
@keyframes vital-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}
@keyframes vital-bg-pulse {
  0%, 100% { background-color: rgba(239, 68, 68, 0.12); }
  50% { background-color: rgba(239, 68, 68, 0.28); }
}
.vital-flash-green {
  animation: border-flash-green 1.2s ease-out forwards;
}
.vital-flash-red {
  animation: border-flash-red 1.2s ease-out forwards;
}
.severity-pulse {
  animation: severity-pulse 2s ease-in-out infinite;
}
.vital-critical-pulse {
  animation: vital-bg-pulse 1.5s ease-in-out infinite, vital-pulse 1.5s ease-in-out infinite;
}
`;

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

type AlertLevel = "normal" | "warning" | "critical";

function getVitalLevel(
  key: "hr" | "sbp" | "spo2" | "cvp" | "map" | "temp",
  value: number,
): AlertLevel {
  switch (key) {
    case "hr":
      if (value > 130 || value < 45) return "critical";
      if (value > 100 || value < 60) return "warning";
      return "normal";
    case "sbp":
      if (value < 80) return "critical";
      if (value < 95) return "warning";
      return "normal";
    case "spo2":
      if (value < 90) return "critical";
      if (value < 95) return "warning";
      return "normal";
    case "cvp":
      if (value < 2 || value > 16) return "critical";
      if (value < 4 || value > 14) return "warning";
      return "normal";
    case "map":
      if (value < 55) return "critical";
      if (value < 65) return "warning";
      return "normal";
    case "temp":
      if (value < 35 || value > 38.5) return "critical";
      if (value < 35.5 || value > 38) return "warning";
      return "normal";
  }
}

const ALERT_LEVEL_STYLES: Record<AlertLevel, string> = {
  normal: "border-white/8 bg-white/5",
  warning: "border-yellow-500/40 bg-yellow-500/10",
  critical: "border-red-500/60 bg-red-500/15 vital-critical-pulse",
};

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

// ─── useFlash hook ────────────────────────────────────────────────────────────

/** Returns a flash class ("vital-flash-green" | "vital-flash-red" | "") */
function useFlash(
  curr: number,
  prev: number | undefined,
  /** positive direction = "good" (e.g. BP going up is good) */
  higherIsBetter: boolean,
  threshold = 3
): string {
  const [flashClass, setFlashClass] = useState("");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (prev === undefined) return;
    const diff = curr - prev;
    if (Math.abs(diff) < threshold) return;

    const improved = higherIsBetter ? diff > 0 : diff < 0;
    const cls = improved ? "vital-flash-green" : "vital-flash-red";

    // Clear existing timer
    if (timerRef.current) clearTimeout(timerRef.current);
    setFlashClass(""); // reset first to re-trigger animation

    // Use rAF trick to force re-render before setting class
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setFlashClass(cls);
        timerRef.current = setTimeout(() => setFlashClass(""), 1300);
      });
    });
  }, [curr]); // eslint-disable-line react-hooks/exhaustive-deps

  return flashClass;
}

// ─── VitalCard ────────────────────────────────────────────────────────────────

interface VitalCardProps {
  label: string;
  value: string | number;
  unit?: string;
  valueColor: string;
  alertLevel?: AlertLevel;
  trendArrow?: "↑" | "↓" | "→";
  subValue?: string;
  flashClass?: string;
}

function VitalCard({
  label,
  value,
  unit,
  valueColor,
  alertLevel = "normal",
  trendArrow,
  subValue,
  flashClass = "",
}: VitalCardProps) {
  return (
    <div
      className={[
        "relative rounded-xl p-3 border flex flex-col gap-0.5 transition-colors duration-300",
        flashClass,
        ALERT_LEVEL_STYLES[alertLevel],
      ].join(" ")}
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
      {alertLevel === "warning" && (
        <span className="absolute top-1.5 right-1.5 text-[10px] text-yellow-400" aria-label="Warning">
          ⚠️
        </span>
      )}
      {alertLevel === "critical" && (
        <span className="absolute top-1.5 right-1.5 text-[10px] text-red-400 animate-pulse" aria-label="Critical">
          🔴
        </span>
      )}
    </div>
  );
}

// ─── BioGears live detection ─────────────────────────────────────────────────

/** Returns true if BioGears client is initialized and providing live data. */
function useBioGearsLive(): boolean {
  const [live, setLive] = useState(false);

  useEffect(() => {
    // Poll every 2 seconds to check BioGears status
    const check = () => {
      try {
        const client = getBioGearsClient();
        setLive(client.isInitialized);
      } catch {
        setLive(false);
      }
    };
    check();
    const interval = setInterval(check, 2000);
    return () => clearInterval(interval);
  }, []);

  return live;
}

/** Returns the latest BioGears hemodynamics data, or null if not available. */
function useBioGearsHemodynamics(): BioGearsHemodynamics | null {
  const [hemo, setHemo] = useState<BioGearsHemodynamics | null>(null);
  const biogearsLive = useBioGearsLive();

  useEffect(() => {
    if (!biogearsLive) {
      setHemo(null);
      return;
    }
    const sync = () => {
      const bgState = getLastBioGearsState();
      setHemo(bgState?.hemodynamics ?? null);
    };
    sync();
    const interval = setInterval(sync, 2000);
    return () => clearInterval(interval);
  }, [biogearsLive]);

  return hemo;
}

// ─── Advanced Hemodynamics Row ──────────────────────────────────────────────

function HemoRow({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-[10px] text-gray-500 uppercase tracking-wider">{label}</span>
      <span className="text-xs font-mono text-gray-200">
        {value} <span className="text-gray-500">{unit}</span>
      </span>
    </div>
  );
}

// ─── ProVitalsPanel ───────────────────────────────────────────────────────────

export default function ProVitalsPanel({
  prevVitals,
}: {
  prevVitals?: VitalSigns;
}) {
  const rawVitals = useProGameStore((s) => s.patient?.vitals);
  const severity = useProGameStore((s) => s.patient?.severity ?? 0);
  const fogLevel = useProGameStore((s) => s.difficultyConfig.fogLevel ?? "none");
  const gameTime = useProGameStore((s) => s.clock.currentTime);

  // BioGears live mode
  const biogearsLive = useBioGearsLive();
  const hemodynamics = useBioGearsHemodynamics();
  const [hemoExpanded, setHemoExpanded] = useState(false);

  // Apply fog-of-war (display layer only)
  const fogConfig = FOG_PRESETS[fogLevel] ?? FOG_PRESETS.none;
  const { displayVitals: vitals, artifacts: fogArtifacts } = useMemo(() => {
    if (!rawVitals) return { displayVitals: undefined as VitalSigns | undefined, artifacts: [] as string[] };
    return applyVitalsFog(rawVitals, fogConfig, Math.floor(gameTime * 1000));
  }, [rawVitals, fogConfig, gameTime]);

  // Flash hooks for each vital
  const hrFlash = useFlash(vitals?.hr ?? 0, prevVitals?.hr, false /* lower HR = better for tachycardia */, 5);
  const bpFlash = useFlash(vitals?.sbp ?? 0, prevVitals?.sbp, true /* higher BP = better */, 5);
  const spo2Flash = useFlash(vitals?.spo2 ?? 0, prevVitals?.spo2, true, 1);
  const cvpFlash = useFlash(vitals?.cvp ?? 0, prevVitals?.cvp, false /* CVP going down after fluid resolved = context-dependent, skip */, 999);
  const tempFlash = useFlash(vitals?.temperature ?? 0, prevVitals?.temperature, true /* higher temp = better if hypothermic */, 0.3);
  const rrFlash = useFlash(vitals?.rr ?? 0, prevVitals?.rr, false, 2);

  if (!vitals) {
    return (
      <div className="rounded-xl border border-white/8 bg-white/5 p-4 text-gray-500 text-sm">
        Vitals 尚未載入
      </div>
    );
  }

  const mapVal = vitals.map ?? calcMAP(vitals.sbp, vitals.dbp);

  const hrLevel = getVitalLevel("hr", vitals.hr);
  const bpLevel = getVitalLevel("sbp", vitals.sbp);
  const spo2Level = getVitalLevel("spo2", vitals.spo2);
  const cvpLevel = getVitalLevel("cvp", vitals.cvp);
  const mapLevel = getVitalLevel("map", mapVal);
  const tempLevel = getVitalLevel("temp", vitals.temperature);

  const hrArrow = trend(vitals.hr, prevVitals?.hr, 5);
  const bpArrow = trend(vitals.sbp, prevVitals?.sbp, 5);
  const spo2Arrow = trend(vitals.spo2, prevVitals?.spo2, 1);
  const cvpArrow = trend(vitals.cvp, prevVitals?.cvp, 1);
  const rrArrow = trend(vitals.rr, prevVitals?.rr, 2);

  const aLineLabel = aLineLabels[vitals.aLineWaveform] ?? vitals.aLineWaveform;
  const aLineColor = aLineColors[vitals.aLineWaveform] ?? "text-gray-300";

  // Severity-based panel border
  const severityBorderClass =
    severity > 70
      ? "severity-pulse border-red-500/40"
      : severity > 50
      ? "border-orange-500/30"
      : "border-white/8";

  return (
    <>
      <style>{vitalsPanelStyle}</style>
      <div
        id="pro-vitals-panel"
        className={`rounded-xl border bg-[#001a25] p-4 space-y-3 transition-colors duration-500 ${severityBorderClass}`}
      >
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
            valueColor={hrLevel === "critical" ? "text-red-400" : hrLevel === "warning" ? "text-yellow-400" : "text-red-300"}
            alertLevel={hrLevel}
            trendArrow={hrArrow}
            flashClass={hrFlash}
          />
          <VitalCard
            label="BP (A-line)"
            value={`${vitals.sbp}/${vitals.dbp}`}
            unit="mmHg"
            valueColor={bpLevel === "critical" ? "text-red-400" : bpLevel === "warning" ? "text-yellow-400" : "text-white"}
            alertLevel={bpLevel}
            trendArrow={bpArrow}
            subValue={`MAP ${mapVal}${mapLevel !== "normal" ? (mapLevel === "critical" ? " ⚠" : " ↓") : ""}`}
            flashClass={bpFlash}
          />
          <VitalCard
            label="SpO₂"
            value={vitals.spo2}
            unit="%"
            valueColor={spo2Level !== "normal" ? "text-red-400" : "text-blue-400"}
            alertLevel={spo2Level}
            trendArrow={spo2Arrow}
            flashClass={spo2Flash}
          />
          <VitalCard
            label="CVP"
            value={vitals.cvp}
            unit="mmHg"
            valueColor={cvpLevel === "critical" ? "text-red-400" : cvpLevel === "warning" ? "text-yellow-400" : "text-yellow-400"}
            alertLevel={cvpLevel}
            trendArrow={cvpArrow}
            flashClass={cvpFlash}
          />
          <VitalCard
            label="Temp"
            value={vitals.temperature.toFixed(1)}
            unit="°C"
            valueColor={tempLevel === "critical" ? "text-red-400" : tempLevel === "warning" ? "text-orange-400" : "text-orange-300"}
            alertLevel={tempLevel}
            flashClass={tempFlash}
          />
          <VitalCard
            label="RR"
            value={vitals.rr}
            unit="/min"
            valueColor={vitals.rr > 25 || vitals.rr < 10 ? "text-orange-400" : "text-gray-300"}
            trendArrow={rrArrow}
            flashClass={rrFlash}
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
    </>
  );
}
