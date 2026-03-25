// ICU Simulator — Standard Mode Guidance Engine
// 'Nurse as teaching assistant': monitors game state, emits guidance messages.
// Pure function — no side effects, no store imports.

import type {
  PatientState,
  TrackedAction,
  SimScenario,
  DifficultyConfig,
} from "../types";

// ============================================================
// Public Types
// ============================================================

export type GuidanceTrigger =
  | "idle"
  | "wrong_action"
  | "missed_action"
  | "vitals_critical"
  | "phase_start"
  | "duplicate_order"
  | "dose_error";

export type GuidanceSeverity = "info" | "warning" | "critical";

export interface GuidanceMessage {
  trigger: GuidanceTrigger;
  severity: GuidanceSeverity;
  message: string;
  relatedAction?: string;
}

// ============================================================
// Constants
// ============================================================

const IDLE_THRESHOLD_MINUTES = 3; // 3 game-minutes (~60 real-seconds at 0.75x)
const MISSED_ACTION_WARN_BEFORE_MINUTES = 2;
const DUPLICATE_WINDOW_MINUTES = 5;
const DOSE_ERROR_MULTIPLIER = 5;
const PHASE_DETECT_WINDOW_MINUTES = 0.5;
const PHASE_SEVERITY_THRESHOLD = 10;

/**
 * Minimum game-minutes between ANY two guidance messages.
 * Prevents the nurse from feeling intrusive by spacing out hints.
 */
const GUIDANCE_COOLDOWN_MINUTES = 2;

const VITAL_DANGER = {
  sbp: { low: 80 },
  hr: { low: 40, high: 150 },
  spo2: { low: 88 },
  map: { low: 55 },
} as const;

/** Typical doses for common ICU medications — used for dose-error detection. */
const TYPICAL_DOSES: Record<string, number> = {
  norepinephrine: 0.1,
  levophed: 0.1,
  epinephrine: 0.05,
  vasopressin: 0.04,
  dobutamine: 5,
  milrinone: 0.375,
  calcium_chloride: 1,
  calcium_gluconate: 3,
  txa: 1000,
  tranexamic: 1000,
  protamine: 50,
  heparin: 5000,
  lasix: 40,
  furosemide: 40,
  kcl_iv: 20,
  magnesium: 2,
  amiodarone: 300,
  atropine: 0.5,
  fentanyl: 50,
  morphine: 5,
  midazolam: 2,
  propofol: 50,
};

// ============================================================
// Helpers
// ============================================================

/** Standard mode = has rescue threshold (Pro doesn't, Lite doesn't use engine) */
function isStandardMode(config: DifficultyConfig): boolean {
  return config.rescueThreshold !== undefined;
}

/** Parse "order:{category}:{id}:{dose}" action strings */
function parseOrderAction(
  action: string,
): { category: string; id: string; dose: number } | null {
  const parts = action.split(":");
  if (parts[0] !== "order" || parts.length < 3) return null;
  return {
    category: parts[1],
    id: parts[2],
    dose: parseFloat(parts[3] ?? "0"),
  };
}

/** Check if a tracked action fulfills an expected action (keyword match) */
function actionMatchesExpected(
  tracked: TrackedAction,
  expected: { id: string; action: string },
): boolean {
  const order = parseOrderAction(tracked.action);
  const expectedId = expected.id.toLowerCase();
  const expectedAction = expected.action.toLowerCase();

  if (order) {
    const orderId = order.id.toLowerCase();
    return (
      orderId === expectedId ||
      expectedId.includes(orderId) ||
      orderId.includes(expectedId) ||
      expectedAction.includes(orderId)
    );
  }

  // Non-order action — fuzzy match on raw action string
  const actionLower = tracked.action.toLowerCase();
  return actionLower.includes(expectedId) || expectedId.includes(actionLower);
}

// ============================================================
// 1. IDLE — player hasn't acted in >60s game time
// ============================================================

export function checkIdle(
  actions: TrackedAction[],
  gameTime: number,
): GuidanceMessage | null {
  const lastActionTime =
    actions.length > 0
      ? Math.max(...actions.map((a) => a.gameTime))
      : 0;

  if (gameTime - lastActionTime >= IDLE_THRESHOLD_MINUTES) {
    return {
      trigger: "idle",
      severity: "info",
      message: "學長，要不要先看看 vitals？",
    };
  }
  return null;
}

// ============================================================
// 2. WRONG_ACTION — order contradicts clinical situation
// ============================================================

export function checkWrongAction(
  actions: TrackedAction[],
  scenario: SimScenario,
): GuidanceMessage | null {
  if (actions.length === 0) return null;

  // Only check the most recent action (caller handles dedup)
  const latest = actions[actions.length - 1];
  const order = parseOrderAction(latest.action);
  if (!order) return null;

  const id = order.id.toLowerCase();
  const { pathology } = scenario;

  // Bleeding/coagulopathy + anticoagulant
  if (
    (pathology === "surgical_bleeding" || pathology === "coagulopathy") &&
    (id.includes("heparin") || id.includes("warfarin") || id.includes("coumadin"))
  ) {
    return {
      trigger: "wrong_action",
      severity: "warning",
      message: "學長，病人還在出血，確定要開這個嗎？",
      relatedAction: latest.action,
    };
  }

  // Bleeding + diuretics
  if (
    (pathology === "surgical_bleeding" || pathology === "coagulopathy") &&
    (id.includes("lasix") || id.includes("furosemide"))
  ) {
    return {
      trigger: "wrong_action",
      severity: "warning",
      message: "學長，血壓這樣，利尿好嗎？",
      relatedAction: latest.action,
    };
  }

  // Vasopressor without prior volume resuscitation
  if (
    id.includes("norepinephrine") ||
    id.includes("levophed") ||
    id.includes("epinephrine") ||
    id.includes("vasopressin")
  ) {
    const hasVolume = actions.some((a) => {
      const cat = a.category?.toLowerCase();
      return cat === "fluid" || cat === "transfusion";
    });
    if (!hasVolume) {
      return {
        trigger: "wrong_action",
        severity: "warning",
        message: "學長，volume 還沒給，先上升壓藥嗎？",
        relatedAction: latest.action,
      };
    }
  }

  return null;
}

// ============================================================
// 3. MISSED_ACTION — critical item deadline approaching
// ============================================================

export function checkMissedAction(
  actions: TrackedAction[],
  scenario: SimScenario,
  gameTime: number,
): GuidanceMessage | null {
  for (const ea of scenario.expectedActions) {
    if (!ea.critical) continue;

    const done = actions.some((a) => actionMatchesExpected(a, ea));
    if (done) continue;

    const timeLeft = ea.deadline - gameTime;
    if (timeLeft > 0 && timeLeft <= MISSED_ACTION_WARN_BEFORE_MINUTES) {
      return {
        trigger: "missed_action",
        severity: "warning",
        message: "學長，好像有一件事還沒做...",
        relatedAction: ea.id,
      };
    }
  }
  return null;
}

// ============================================================
// 4. VITALS_CRITICAL — vital crosses danger threshold
// ============================================================

export function checkVitalsCritical(
  state: PatientState,
): GuidanceMessage | null {
  const { vitals } = state;

  if (vitals.sbp < VITAL_DANGER.sbp.low) {
    return {
      trigger: "vitals_critical",
      severity: "critical",
      message: `醫師，BP 只有 ${vitals.sbp}！`,
    };
  }
  if (vitals.hr > VITAL_DANGER.hr.high) {
    return {
      trigger: "vitals_critical",
      severity: "critical",
      message: `醫師，HR ${vitals.hr}！`,
    };
  }
  if (vitals.hr < VITAL_DANGER.hr.low) {
    return {
      trigger: "vitals_critical",
      severity: "critical",
      message: `醫師，HR 只有 ${vitals.hr}！`,
    };
  }
  if (vitals.spo2 < VITAL_DANGER.spo2.low) {
    return {
      trigger: "vitals_critical",
      severity: "critical",
      message: `醫師，SpO2 掉到 ${vitals.spo2}%！`,
    };
  }
  if (vitals.map < VITAL_DANGER.map.low) {
    return {
      trigger: "vitals_critical",
      severity: "critical",
      message: `醫師，MAP 只有 ${vitals.map}！`,
    };
  }
  return null;
}

// ============================================================
// 5. PHASE_START — scenario enters new phase
// ============================================================

export function checkPhaseStart(
  scenario: SimScenario,
  gameTime: number,
): GuidanceMessage | null {
  for (const event of scenario.events) {
    const delta = gameTime - event.triggerTime;
    if (delta < 0 || delta >= PHASE_DETECT_WINDOW_MINUTES) continue;

    // Significant severity change signals a phase transition
    if (
      event.severityChange !== undefined &&
      Math.abs(event.severityChange) >= PHASE_SEVERITY_THRESHOLD
    ) {
      const direction = event.severityChange > 0 ? "惡化" : "穩定";
      return {
        trigger: "phase_start",
        severity: "info",
        message: `目前病人狀況有${direction}的趨勢，接下來可能要調整處置方向。`,
      };
    }
  }
  return null;
}

// ============================================================
// 6. DUPLICATE_ORDER — same drug twice within 5 min
// ============================================================

export function checkDuplicateOrder(
  actions: TrackedAction[],
): GuidanceMessage | null {
  const orders = actions
    .map((a) => ({ ...a, parsed: parseOrderAction(a.action) }))
    .filter(
      (a): a is typeof a & { parsed: NonNullable<typeof a.parsed> } =>
        a.parsed !== null,
    );

  if (orders.length < 2) return null;

  const latest = orders[orders.length - 1];

  for (let i = orders.length - 2; i >= 0; i--) {
    const prev = orders[i];
    if (latest.gameTime - prev.gameTime > DUPLICATE_WINDOW_MINUTES) break;
    if (latest.parsed.id === prev.parsed.id) {
      return {
        trigger: "duplicate_order",
        severity: "warning",
        message: "這個剛剛已經給過了喔，確定要再給一次嗎？",
        relatedAction: latest.action,
      };
    }
  }
  return null;
}

// ============================================================
// 7. DOSE_ERROR — order dose >5x typical
// ============================================================

export function checkDoseError(
  actions: TrackedAction[],
): GuidanceMessage | null {
  if (actions.length === 0) return null;

  const latest = actions[actions.length - 1];
  const order = parseOrderAction(latest.action);
  if (!order || isNaN(order.dose) || order.dose <= 0) return null;

  const typicalDose = TYPICAL_DOSES[order.id.toLowerCase()];
  if (typicalDose === undefined) return null;

  if (order.dose > typicalDose * DOSE_ERROR_MULTIPLIER) {
    return {
      trigger: "dose_error",
      severity: "warning",
      message: "學長，這個劑量...你再確認一下好不好？",
      relatedAction: latest.action,
    };
  }
  return null;
}

// ============================================================
// Main: evaluateGuidance
// ============================================================

/**
 * Evaluate all guidance triggers and return messages for the current tick.
 * Only fires in Standard mode (identified by config.rescueThreshold).
 *
 * Respects a cooldown period: if `lastGuidanceTime` is within
 * `GUIDANCE_COOLDOWN_MINUTES` of `gameTime`, only `critical` messages pass.
 * This prevents the nurse from feeling intrusive.
 *
 * @param state     Current patient state (vitals, severity, etc.)
 * @param actions   All player actions so far (with game-time metadata)
 * @param scenario  The scenario definition
 * @param config    Difficulty config — must be Standard mode to fire
 * @param gameTime  Current game time in minutes
 * @param lastGuidanceTime  Game time of last emitted guidance (optional, 0 = no prior)
 */
export function evaluateGuidance(
  state: PatientState,
  actions: TrackedAction[],
  scenario: SimScenario,
  config: DifficultyConfig,
  gameTime: number,
  lastGuidanceTime: number = 0,
): GuidanceMessage[] {
  if (!isStandardMode(config)) return [];

  const checks = [
    checkIdle(actions, gameTime),
    checkWrongAction(actions, scenario),
    checkMissedAction(actions, scenario, gameTime),
    checkVitalsCritical(state),
    checkPhaseStart(scenario, gameTime),
    checkDuplicateOrder(actions),
    checkDoseError(actions),
  ];

  const all = checks.filter((msg): msg is GuidanceMessage => msg !== null);

  // Cooldown: if last guidance was too recent, only let critical messages through
  const timeSinceLastGuidance = gameTime - lastGuidanceTime;
  if (timeSinceLastGuidance < GUIDANCE_COOLDOWN_MINUTES) {
    return all.filter((msg) => msg.severity === "critical");
  }

  // At most 1 message per tick to avoid flooding the player
  return all.length > 0 ? [all[0]] : [];
}
