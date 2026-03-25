"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { useProGameStore } from "@/lib/simulator/store";
import type { VitalSigns } from "@/lib/simulator/types";
import { applyVitalsFog, FOG_PRESETS } from "@/lib/simulator/engine/fog-of-war";

// ── CSS animations ──────────────────────────────────────────────────────────

const colorVitalsCSS = `
@keyframes std-critical-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}
@keyframes std-bg-pulse {
  0%, 100% { background-color: rgba(239, 68, 68, 0.25); }
  50% { background-color: rgba(239, 68, 68, 0.45); }
}
.std-critical-pulse {
  animation: std-bg-pulse 1.5s ease-in-out infinite, std-critical-pulse 1.5s ease-in-out infinite;
}
@keyframes fog-false-alarm-blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}
.fog-false-alarm {
  animation: fog-false-alarm-blink 0.5s ease-in-out infinite;
}
`;

// ── Types ───────────────────────────────────────────────────────────────────

type AlertLevel = "normal" | "warning" | "critical";

interface VitalTileConfig {
  key: "hr" | "sbp" | "spo2" | "cvp" | "map" | "temp" | "rr";
  label: string;
  unit: string;
  getValue: (v: VitalSigns) => number;
  format?: (v: VitalSigns) => string;
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function calcMAP(sbp: number, dbp: number): number {
  return Math.round(dbp + (sbp - dbp) / 3);
}

function getAlertLevel(
  key: VitalTileConfig["key"],
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
    case "rr":
      if (value > 30 || value < 8) return "critical";
      if (value > 25 || value < 10) return "warning";
      return "normal";
  }
}

function trend(curr: number, prev: number | undefined, threshold = 3): string {
  if (prev === undefined) return "\u2192";
  if (curr > prev + threshold) return "\u2191";
  if (curr < prev - threshold) return "\u2193";
  return "\u2192";
}

const TILE_STYLES: Record<AlertLevel, { bg: string; border: string; text: string }> = {
  normal: {
    bg: "bg-emerald-900/30",
    border: "border-emerald-500/30",
    text: "text-emerald-300",
  },
  warning: {
    bg: "bg-yellow-900/30",
    border: "border-dashed border-yellow-500/60",
    text: "text-yellow-300",
  },
  critical: {
    bg: "bg-red-900/30",
    border: "border-solid border-red-500/70",
    text: "text-red-300",
  },
};

const TILES: VitalTileConfig[] = [
  { key: "hr", label: "\u5FC3\u7387 HR", unit: "bpm", getValue: (v) => v.hr },
  {
    key: "sbp",
    label: "\u8840\u58D3 BP",
    unit: "mmHg",
    getValue: (v) => v.sbp,
    format: (v) => `${v.sbp}/${v.dbp}`,
  },
  { key: "spo2", label: "SpO\u2082", unit: "%", getValue: (v) => v.spo2 },
  { key: "cvp", label: "CVP", unit: "mmHg", getValue: (v) => v.cvp },
  {
    key: "map",
    label: "MAP",
    unit: "mmHg",
    getValue: (v) => v.map ?? calcMAP(v.sbp, v.dbp),
  },
  {
    key: "temp",
    label: "\u9AD4\u6EAB",
    unit: "\u00B0C",
    getValue: (v) => v.temperature,
    format: (v) => v.temperature.toFixed(1),
  },
  { key: "rr", label: "\u547C\u5438 RR", unit: "/min", getValue: (v) => v.rr },
];

// ── VitalTile ───────────────────────────────────────────────────────────────

function VitalTile({
  config,
  vitals,
  prevVitals,
  fogArtifacts,
}: {
  config: VitalTileConfig;
  vitals: VitalSigns;
  prevVitals?: VitalSigns;
  fogArtifacts?: string[];
}) {
  const value = config.getValue(vitals);
  const displayValue = config.format ? config.format(vitals) : String(Math.round(value));
  const prevValue = prevVitals ? config.getValue(prevVitals) : undefined;
  const level = getAlertLevel(config.key, value);
  const style = TILE_STYLES[level];
  const trendArrow = trend(value, prevValue, config.key === "spo2" ? 1 : config.key === "temp" ? 0.3 : 3);

  const isFalseAlarm = config.key === "spo2" && fogArtifacts?.includes("spo2_false_alarm");
  const isDampened = config.key === "sbp" && fogArtifacts?.includes("aline_dampened");

  return (
    <div
      className={[
        "relative rounded-xl p-3 border-2 flex flex-col gap-0.5 transition-colors duration-300",
        style.bg,
        style.border,
        level === "critical" ? "std-critical-pulse" : "",
      ].join(" ")}
      role="status"
      aria-label={`${config.label}: ${displayValue} ${config.unit}, ${level}`}
    >
      {/* Label */}
      <div className="text-[11px] font-medium text-gray-400 tracking-wide">
        {config.label}
      </div>

      {/* Value + trend */}
      <div className={[
        "font-mono font-bold text-2xl leading-none",
        isDampened ? "text-gray-500" : style.text,
        isFalseAlarm ? "fog-false-alarm" : "",
      ].join(" ")}>
        {displayValue}
        <span className="text-sm ml-1 opacity-70">{trendArrow}</span>
        {isFalseAlarm && (
          <span className="text-sm ml-1 animate-pulse" role="img" aria-label="Artifact">⚠️</span>
        )}
      </div>

      {/* Unit */}
      <div className="text-[10px] text-gray-500">{config.unit}</div>

      {/* Alert icons (a11y: not color-only) */}
      {level === "warning" && !isFalseAlarm && (
        <span
          className="absolute top-1.5 right-1.5 text-sm"
          role="img"
          aria-label="Warning"
        >
          {"\u26A0\uFE0F"}
        </span>
      )}
      {level === "critical" && !isFalseAlarm && (
        <span
          className="absolute top-1.5 right-1.5 text-sm animate-pulse"
          role="img"
          aria-label="Critical"
        >
          {"\uD83D\uDD34"}
        </span>
      )}
    </div>
  );
}

// ── Main Panel ──────────────────────────────────────────────────────────────

export default function ColorVitalsPanel({
  prevVitals,
}: {
  prevVitals?: VitalSigns;
}) {
  const vitals = useProGameStore((s) => s.patient?.vitals);
  const fogLevel = useProGameStore((s) => s.difficultyConfig.fogLevel ?? "none");
  const gameTime = useProGameStore((s) => s.clock.currentTime);

  // Apply fog-of-war to vitals (display layer only — engine uses true vitals)
  const fogConfig = FOG_PRESETS[fogLevel] ?? FOG_PRESETS.none;
  const { displayVitals, artifacts } = useMemo(() => {
    if (!vitals) return { displayVitals: undefined, artifacts: [] as string[] };
    // Use gameTime as seed for deterministic per-tick randomness
    return applyVitalsFog(vitals, fogConfig, Math.floor(gameTime * 1000));
  }, [vitals, fogConfig, gameTime]);

  if (!displayVitals) {
    return (
      <div className="rounded-xl border border-white/8 bg-white/5 p-4 text-gray-500 text-sm">
        生命徵象尚未載入
      </div>
    );
  }

  return (
    <>
      <style>{colorVitalsCSS}</style>
      <div className="space-y-2">
        <div className="flex items-center gap-2 px-1">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-[11px] uppercase tracking-widest text-gray-500 font-medium">
            生命徵象
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {TILES.map((tile) => (
            <VitalTile
              key={tile.key}
              config={tile}
              vitals={displayVitals}
              prevVitals={prevVitals}
              fogArtifacts={artifacts}
            />
          ))}
        </div>
      </div>
    </>
  );
}
