// Fog of War — 讓 vitals 顯示不完美（假警報、A-line dampening、lab hemolysis）
// 純函數模組，不依賴 store

import type { VitalSigns, LabValue } from "../types";

// ============================================================
// Config & Presets
// ============================================================

export interface FogConfig {
  level: "none" | "light" | "full";
  spo2FalseAlarmRate: number;   // light: 0.03, full: 0.08
  alineDampeningMmHg: number;   // light: 0, full: 10-15 (random)
  labHemolysisRate: number;     // light: 0.05, full: 0.15
}

export const FOG_PRESETS: Record<string, FogConfig> = {
  none: {
    level: "none",
    spo2FalseAlarmRate: 0,
    alineDampeningMmHg: 0,
    labHemolysisRate: 0,
  },
  light: {
    level: "light",
    spo2FalseAlarmRate: 0.03,
    alineDampeningMmHg: 0,
    labHemolysisRate: 0.05,
  },
  full: {
    level: "full",
    spo2FalseAlarmRate: 0.08,
    alineDampeningMmHg: 12,
    labHemolysisRate: 0.15,
  },
};

// ============================================================
// Deterministic seeded random (simple mulberry32)
// ============================================================

function seededRandom(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Random float in [min, max) using seeded rng */
function randRange(rng: () => number, min: number, max: number): number {
  return min + rng() * (max - min);
}

// ============================================================
// Vitals Fog
// ============================================================

export interface VitalsFogResult {
  displayVitals: VitalSigns;
  artifacts: string[];
}

/**
 * Apply fog-of-war to vitals for display purposes.
 * Returns modified vitals + artifact flags for UI hints.
 *
 * @param vitals   - True vitals from engine
 * @param config   - Fog configuration
 * @param tickSeed - Deterministic seed (e.g. gameTime * 1000 + some salt)
 */
export function applyVitalsFog(
  vitals: VitalSigns,
  config: FogConfig,
  tickSeed: number,
): VitalsFogResult {
  if (config.level === "none") {
    return { displayVitals: vitals, artifacts: [] };
  }

  const rng = seededRandom(tickSeed);
  const artifacts: string[] = [];
  let displayVitals = { ...vitals };

  // ── SpO2 False Alarm ────────────────────────────────────────
  if (config.spo2FalseAlarmRate > 0 && rng() < config.spo2FalseAlarmRate) {
    const drop = Math.round(randRange(rng, 5, 12));
    displayVitals = {
      ...displayVitals,
      spo2: Math.max(50, vitals.spo2 - drop),
    };
    artifacts.push("spo2_false_alarm");
  }

  // ── A-line Dampening ────────────────────────────────────────
  if (config.alineDampeningMmHg > 0) {
    const baseDamp = config.alineDampeningMmHg;
    // SBP: underestimate (true - dampening ± 3)
    const sbpOffset = baseDamp + Math.round(randRange(rng, -3, 3));
    const newSbp = vitals.sbp - sbpOffset;
    // DBP: overestimate (true + 0-5)
    const dbpOffset = Math.round(randRange(rng, 0, 5));
    const newDbp = vitals.dbp + dbpOffset;
    // MAP: recalculate from display values
    const newMap = Math.round(newDbp + (newSbp - newDbp) / 3);

    displayVitals = {
      ...displayVitals,
      sbp: newSbp,
      dbp: newDbp,
      map: newMap,
      aLineWaveform: "dampened",
    };
    artifacts.push("aline_dampened");
  }

  return { displayVitals, artifacts };
}

// ============================================================
// Lab Fog
// ============================================================

export interface LabFogResult {
  displayResult: Record<string, LabValue>;
  flags: string[];
}

/**
 * Apply fog-of-war to lab results.
 * Currently: hemolysis flag on K+ with false elevation.
 *
 * @param labResults - True lab results (Record<string, LabValue>)
 * @param config     - Fog configuration
 * @param seed       - Deterministic seed
 */
export function applyLabFog(
  labResults: Record<string, LabValue>,
  config: FogConfig,
  seed: number,
): LabFogResult {
  if (config.level === "none" || config.labHemolysisRate === 0) {
    return { displayResult: labResults, flags: [] };
  }

  const rng = seededRandom(seed);
  const flags: string[] = [];
  const displayResult = { ...labResults };

  // Check if K+ exists and roll for hemolysis
  const kKey = Object.keys(labResults).find(
    (k) => k.toLowerCase() === "k" || k.toLowerCase() === "k+",
  );

  if (kKey && rng() < config.labHemolysisRate) {
    const original = labResults[kKey];
    if (typeof original.value === "number") {
      const elevation = randRange(rng, 0.5, 1.5);
      const newValue = Math.round((original.value + elevation) * 10) / 10;
      displayResult[kKey] = {
        ...original,
        value: newValue,
        flag: newValue > 5.5 ? "H" : original.flag,
      };
      flags.push("hemolysis_noted");
    }
  }

  return { displayResult, flags };
}
