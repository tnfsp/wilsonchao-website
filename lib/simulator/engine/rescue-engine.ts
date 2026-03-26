// ICU 值班模擬器 — Rescue Window Engine
// Pure functions for Standard mode delayed-death rescue system.
// No store imports.

import type {
  VitalSigns,
  DifficultyConfig,
  RescueState,
  TrackedAction,
  Pathology,
} from "../types";

// ============================================================
// Per-scenario rescue thresholds (override DifficultyConfig defaults)
// ============================================================

interface ScenarioRescueConfig {
  thresholds: (vitals: VitalSigns, severity: number) => boolean;
  requiredActions: string[];  // action pattern strings that count as rescue
  cause: string;
}

const SCENARIO_RESCUE_CONFIGS: Record<string, ScenarioRescueConfig> = {
  "postop-bleeding": {
    thresholds: (v, severity) => v.sbp < 60 || v.hr > 150 || severity >= 90,
    requiredActions: [
      "order:fluid:",
      "order:transfusion:",
      "mtp:activated",
      "order:medication:norepinephrine",
      "order:medication:epinephrine",
      "order:medication:vasopressin",
    ],
    cause: "大量出血導致血流動力學不穩定！",
  },
  "cardiac-tamponade": {
    thresholds: (v, severity) => v.sbp < 50 || v.map < 35 || severity >= 90,
    requiredActions: [
      "order:procedure:pericardiocentesis",
      "order:procedure:resternotomy",
      "order:fluid:",
      "order:medication:norepinephrine",
      "order:medication:phenylephrine",
      "consult:",
    ],
    cause: "心包填塞導致心輸出量急遽下降！",
  },
  "septic-shock": {
    thresholds: (v, severity) => v.map < 50 || severity >= 90,
    requiredActions: [
      "order:medication:norepinephrine",
      "order:medication:vasopressin",
      "order:medication:epinephrine",
      "order:fluid:",
      "order:medication:vancomycin",
      "order:medication:piperacillin",
      "order:medication:meropenem",
    ],
    cause: "敗血性休克惡化，器官灌流嚴重不足！",
  },
};

// ============================================================
// Core: check if rescue window should activate
// ============================================================

/**
 * Determines whether a rescue window should activate based on vitals.
 * Returns null if no rescue needed, or a new RescueState if triggered.
 *
 * Only activates for non-pro modes with rescueThreshold configured.
 */
export function checkRescueActivation(
  vitals: VitalSigns,
  severity: number,
  config: DifficultyConfig,
  scenarioId: string,
  gameTime: number,
): RescueState | null {
  // Pro mode or lite mode: no rescue window
  if (!config.rescueThreshold || !config.rescueWindowSeconds) return null;

  const scenarioConfig = SCENARIO_RESCUE_CONFIGS[scenarioId];
  const windowSeconds = config.rescueWindowSeconds;

  // Use scenario-specific thresholds if available, else fallback to generic
  let shouldActivate = false;
  if (scenarioConfig) {
    shouldActivate = scenarioConfig.thresholds(vitals, severity);
  } else {
    // Generic threshold from DifficultyConfig
    const t = config.rescueThreshold;
    shouldActivate =
      vitals.sbp < t.sbp ||
      vitals.hr < t.hr ||
      vitals.hr > 150 ||  // tachycardic arrest (matches postop-bleeding scenario threshold)
      vitals.spo2 < t.spo2 ||
      severity >= 90;
  }

  if (!shouldActivate) return null;

  return {
    active: true,
    startedAt: gameTime,
    remainingSeconds: windowSeconds,
    requiredActions: scenarioConfig?.requiredActions ?? [],
    cause: scenarioConfig?.cause ?? "病人生命徵象急速惡化！",
  };
}

// ============================================================
// Evaluate if player took a rescue action
// ============================================================

/**
 * Checks if any player action taken since rescue started
 * matches a required rescue action pattern.
 */
export function evaluateRescueActions(
  actions: TrackedAction[],
  rescueStartTime: number,
  requiredActions: string[],
): boolean {
  if (requiredActions.length === 0) return false;

  // Actions taken after rescue started
  const recentActions = actions.filter((a) => a.gameTime >= rescueStartTime);
  if (recentActions.length === 0) return false;

  // Any recent action matching any required pattern
  return recentActions.some((a) =>
    requiredActions.some((pattern) =>
      a.action.toLowerCase().includes(pattern.toLowerCase())
    )
  );
}

// ============================================================
// Stabilize vitals after rescue (bounce to safe zone)
// ============================================================

/** Minimum safe vitals after rescue — patient stabilizes but isn't healthy */
export function getRescueStabilizeValues(pathology: Pathology): Partial<VitalSigns> {
  // Return partial modifiers to bring vitals back to a "just stable" state
  const base: Partial<VitalSigns> = {
    sbp: 90,
    dbp: 55,
    map: 67,
    hr: 105,
    spo2: 94,
  };

  switch (pathology) {
    case "surgical_bleeding":
    case "coagulopathy":
      return { ...base, sbp: 88, cvp: 5 };
    case "cardiac_tamponade":
    case "tamponade":
      return { ...base, sbp: 85, cvp: 10 };
    case "septic_shock":
      return { ...base, sbp: 85, map: 62 };
    default:
      return base;
  }
}
