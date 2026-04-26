/**
 * Nurse Trigger Engine — Pure state-driven nurse dialogue system
 *
 * Replaces scripted triggerTime nurse events with condition-based triggers
 * that fire when BioGears state meets specific criteria.
 *
 * Design:
 *   - NurseTrigger[] defined per-scenario
 *   - evaluateNurseTriggers() called every store tick
 *   - Pure function: no side effects, returns messages to fire
 *   - Supports AND logic on conditions, cooldown, maxFires
 */

import type { VitalSigns, ChestTubeState, Pathology } from "../types";

// ============================================================
// Types
// ============================================================

export type BioGearsConditionField =
  | "ct_output"          // chestTube.currentRate
  | "ct_total"           // chestTube.totalOutput
  | "sbp"
  | "dbp"
  | "map"
  | "hr"
  | "cvp"
  | "spo2"
  | "rr"
  | "temperature"
  | "severity"
  | "elapsed_minutes"
  | "blood_volume"       // vitals.bloodVolume
  | "ejection_fraction"  // vitals.ejectionFraction
  | "pathology"          // current pathology string
  | "action_taken"       // player has done this action (string match)
  | "action_not_taken"   // player has NOT done this action
  | "ct_delta_negative"  // CT output dropped from previous high (boolean-like, value = threshold)
  | "blood_units_given"; // number of blood product units given

export interface BioGearsCondition {
  field: BioGearsConditionField;
  op: ">" | "<" | ">=" | "<=" | "==" | "!=" | "crossed_above" | "crossed_below";
  value: number | string | boolean;
}

export type NurseCategory = "observation" | "hint" | "escalation" | "mislead";

export interface NurseTrigger {
  id: string;
  conditions: BioGearsCondition[];  // AND logic
  message: string;                  // supports {{ct_rate}} {{sbp}} {{cvp}} etc.
  maxFires: number;                 // default 1
  cooldown: number;                 // game-minutes between fires
  priority: number;                 // lower = higher priority
  category: NurseCategory;
}

// ============================================================
// Trigger State (tracking fires/cooldowns)
// ============================================================

export interface NurseTriggerState {
  /** How many times each trigger has fired */
  fireCounts: Record<string, number>;
  /** Game-time of last fire for each trigger */
  lastFiredAt: Record<string, number>;
  /** Previous values for crossed_above/crossed_below detection */
  prevValues: Record<string, number>;
  /** Peak CT output (for delta detection) */
  peakCtOutput: number;
}

export function createNurseTriggerState(): NurseTriggerState {
  return {
    fireCounts: {},
    lastFiredAt: {},
    prevValues: {},
    peakCtOutput: 0,
  };
}

// ============================================================
// Evaluation Context
// ============================================================

export interface NurseEvalContext {
  vitals: VitalSigns;
  chestTube: ChestTubeState;
  severity: number;
  pathology: Pathology;
  elapsedMinutes: number;
  actionsTaken: string[];   // lowercase action strings
  bloodUnitsGiven: number;
}

// ============================================================
// Core Evaluation (Pure)
// ============================================================

/**
 * Evaluate a single condition against the current context.
 */
function checkCondition(
  cond: BioGearsCondition,
  ctx: NurseEvalContext,
  state: NurseTriggerState,
): boolean {
  const numValue = typeof cond.value === "number" ? cond.value : 0;
  const strValue = typeof cond.value === "string" ? cond.value.toLowerCase() : "";

  let currentVal: number | string | undefined;

  switch (cond.field) {
    case "ct_output":         currentVal = ctx.chestTube.currentRate; break;
    case "ct_total":          currentVal = ctx.chestTube.totalOutput; break;
    case "sbp":               currentVal = ctx.vitals.sbp; break;
    case "dbp":               currentVal = ctx.vitals.dbp; break;
    case "map":               currentVal = ctx.vitals.map; break;
    case "hr":                currentVal = ctx.vitals.hr; break;
    case "cvp":               currentVal = ctx.vitals.cvp; break;
    case "spo2":              currentVal = ctx.vitals.spo2; break;
    case "rr":                currentVal = ctx.vitals.rr; break;
    case "temperature":       currentVal = ctx.vitals.temperature; break;
    case "severity":          currentVal = ctx.severity; break;
    case "elapsed_minutes":   currentVal = ctx.elapsedMinutes; break;
    case "blood_volume":      currentVal = ctx.vitals.bloodVolume ?? 5500; break;
    case "ejection_fraction": currentVal = ctx.vitals.ejectionFraction ?? 55; break;
    case "pathology":         currentVal = ctx.pathology; break;
    case "blood_units_given": currentVal = ctx.bloodUnitsGiven; break;

    case "action_taken":
      return ctx.actionsTaken.some(a => a.includes(strValue));

    case "action_not_taken":
      return !ctx.actionsTaken.some(a => a.includes(strValue));

    case "ct_delta_negative":
      // True when CT output has dropped by more than `value` from peak
      return state.peakCtOutput - ctx.chestTube.currentRate > numValue;

    default:
      return false;
  }

  if (currentVal === undefined) return false;

  // Handle crossed_above / crossed_below
  if (cond.op === "crossed_above" || cond.op === "crossed_below") {
    const prevKey = `${cond.field}`;
    const prev = state.prevValues[prevKey] ?? (typeof currentVal === "number" ? currentVal : 0);
    if (typeof currentVal !== "number") return false;

    if (cond.op === "crossed_above") {
      return prev <= numValue && currentVal > numValue;
    } else {
      return prev >= numValue && currentVal < numValue;
    }
  }

  // Standard comparisons
  if (typeof currentVal === "number") {
    switch (cond.op) {
      case ">":  return currentVal > numValue;
      case "<":  return currentVal < numValue;
      case ">=": return currentVal >= numValue;
      case "<=": return currentVal <= numValue;
      case "==": return currentVal === numValue;
      case "!=": return currentVal !== numValue;
    }
  }

  if (typeof currentVal === "string") {
    switch (cond.op) {
      case "==": return currentVal === strValue;
      case "!=": return currentVal !== strValue;
      default: return false;
    }
  }

  return false;
}

/**
 * Evaluate all nurse triggers and return those that should fire.
 *
 * Pure function: does NOT mutate state. Returns fired trigger IDs and messages.
 * The caller must call `updateNurseTriggerState()` after processing.
 */
export function evaluateNurseTriggers(
  triggers: NurseTrigger[],
  ctx: NurseEvalContext,
  state: NurseTriggerState,
): Array<{ triggerId: string; message: string; category: NurseCategory; priority: number }> {
  const results: Array<{ triggerId: string; message: string; category: NurseCategory; priority: number }> = [];

  for (const trigger of triggers) {
    // Check maxFires
    const fireCount = state.fireCounts[trigger.id] ?? 0;
    if (fireCount >= trigger.maxFires) continue;

    // Check cooldown
    const lastFired = state.lastFiredAt[trigger.id];
    if (lastFired !== undefined && ctx.elapsedMinutes - lastFired < trigger.cooldown) continue;

    // Check all conditions (AND logic)
    const allMet = trigger.conditions.every(c => checkCondition(c, ctx, state));
    if (!allMet) continue;

    // Interpolate message template
    const message = interpolateMessage(trigger.message, ctx);

    results.push({
      triggerId: trigger.id,
      message,
      category: trigger.category,
      priority: trigger.priority,
    });
  }

  // Sort by priority (lower = higher priority)
  results.sort((a, b) => a.priority - b.priority);

  return results;
}

/**
 * Update trigger state after processing fired triggers.
 * Returns new state (immutable).
 */
export function updateNurseTriggerState(
  state: NurseTriggerState,
  firedIds: string[],
  gameTime: number,
  ctx: NurseEvalContext,
): NurseTriggerState {
  const newFireCounts = { ...state.fireCounts };
  const newLastFiredAt = { ...state.lastFiredAt };

  for (const id of firedIds) {
    newFireCounts[id] = (newFireCounts[id] ?? 0) + 1;
    newLastFiredAt[id] = gameTime;
  }

  // Update previous values for crossed_above/crossed_below
  const newPrevValues: Record<string, number> = {
    ct_output: ctx.chestTube.currentRate,
    sbp: ctx.vitals.sbp,
    dbp: ctx.vitals.dbp,
    map: ctx.vitals.map,
    hr: ctx.vitals.hr,
    cvp: ctx.vitals.cvp,
    spo2: ctx.vitals.spo2,
    severity: ctx.severity,
  };

  // Track peak CT output
  const peakCtOutput = Math.max(state.peakCtOutput, ctx.chestTube.currentRate);

  return {
    fireCounts: newFireCounts,
    lastFiredAt: newLastFiredAt,
    prevValues: newPrevValues,
    peakCtOutput,
  };
}

// ============================================================
// Template Interpolation
// ============================================================

function interpolateMessage(template: string, ctx: NurseEvalContext): string {
  return template
    .replace(/\{\{ct_rate\}\}/g, String(ctx.chestTube.currentRate))
    .replace(/\{\{ct_total\}\}/g, String(ctx.chestTube.totalOutput))
    .replace(/\{\{sbp\}\}/g, String(Math.round(ctx.vitals.sbp)))
    .replace(/\{\{dbp\}\}/g, String(Math.round(ctx.vitals.dbp)))
    .replace(/\{\{map\}\}/g, String(Math.round(ctx.vitals.map)))
    .replace(/\{\{hr\}\}/g, String(Math.round(ctx.vitals.hr)))
    .replace(/\{\{cvp\}\}/g, String(Math.round(ctx.vitals.cvp)))
    .replace(/\{\{spo2\}\}/g, String(Math.round(ctx.vitals.spo2)))
    .replace(/\{\{rr\}\}/g, String(Math.round(ctx.vitals.rr)))
    .replace(/\{\{temp\}\}/g, String(ctx.vitals.temperature));
}

// ============================================================
// Bleeding-to-Tamponade Nurse Triggers
// ============================================================

export const bleedingToTamponadeNurseTriggers: NurseTrigger[] = [
  // ── Phase 1 Triggers ──

  {
    id: "n-ct-high",
    conditions: [
      { field: "ct_output", op: ">", value: 250 },
    ],
    message: "醫師，血壓又掉了一點，{{sbp}}/{{dbp}}。chest tube 出的是鮮紅色的，有看到一些血塊，現在 {{ct_rate}}cc/hr。",
    maxFires: 1,
    cooldown: 3,
    priority: 10,
    category: "observation",
  },

  {
    id: "n-bp-dropping",
    conditions: [
      { field: "sbp", op: "<", value: 90 },
    ],
    message: "醫師，血壓掉到 {{sbp}}/{{dbp}} 了，要不要做點什麼？",
    maxFires: 1,
    cooldown: 5,
    priority: 5,
    category: "observation",
  },

  {
    id: "n-bp-critical",
    conditions: [
      { field: "map", op: "<", value: 55 },
    ],
    message: "醫師！MAP 只有 {{map}}，這個血壓很危險！",
    maxFires: 2,
    cooldown: 3,
    priority: 1,
    category: "escalation",
  },

  {
    id: "n-no-senior-pressure",
    conditions: [
      { field: "severity", op: ">", value: 40 },
      { field: "action_not_taken", op: "==", value: "call_senior" },
      { field: "elapsed_minutes", op: ">", value: 8 },
    ],
    message: "醫師，血壓 {{sbp}}/{{dbp}}，CT 累計 {{ct_total}}cc，這一個小時量一直沒有減少⋯⋯接下來要怎麼處理？需不需要通知學長？",
    maxFires: 1,
    cooldown: 5,
    priority: 15,
    category: "escalation",
  },

  {
    id: "n-transfusion-ica",
    conditions: [
      { field: "blood_units_given", op: ">=", value: 4 },
      { field: "action_not_taken", op: "==", value: "order_ica" },
    ],
    message: "醫師，輸了不少血了，要不要追一下 ionized calcium？",
    maxFires: 1,
    cooldown: 5,
    priority: 20,
    category: "hint",
  },

  // ── Phase Transition Triggers ──

  {
    id: "n-ct-declining",
    conditions: [
      { field: "ct_delta_negative", op: ">", value: 120 },
      // CT has dropped by > 120 from peak (e.g., peak 300 → current < 180)
    ],
    message: "醫師，CT 量好像在少了⋯⋯之前 {{ct_rate}}cc/hr，現在少很多。",
    maxFires: 1,
    cooldown: 5,
    priority: 12,
    category: "observation",
  },

  {
    id: "n-mislead",
    conditions: [
      { field: "ct_output", op: "<", value: 50 },
      { field: "pathology", op: "==", value: "cardiac_tamponade" },
    ],
    message: "醫師，好消息欸，CT 量少了很多，只剩 {{ct_rate}}cc/hr，看起來出血有在止了吧？血壓 {{sbp}}/{{dbp}}，也稍微穩了一下。",
    maxFires: 1,
    cooldown: 5,
    priority: 8,
    category: "mislead",
  },

  // ── Phase 2 Triggers ──

  {
    id: "n-cvp-rising",
    conditions: [
      { field: "cvp", op: "crossed_above", value: 12 },
    ],
    message: "醫師，跟你報一下，CVP 現在 {{cvp}}，比剛剛高了一些。血壓 {{sbp}}/{{dbp}}。",
    maxFires: 1,
    cooldown: 3,
    priority: 7,
    category: "observation",
  },

  {
    id: "n-ct-near-zero",
    conditions: [
      { field: "ct_output", op: "<", value: 10 },
      { field: "pathology", op: "==", value: "cardiac_tamponade" },
    ],
    message: "醫師！CT 這幾分鐘幾乎沒東西出來了，只有 {{ct_rate}}cc/hr。血壓 {{sbp}}/{{dbp}}，心跳 {{hr}}。",
    maxFires: 1,
    cooldown: 5,
    priority: 5,
    category: "observation",
  },

  {
    id: "n-ct-stopped",
    conditions: [
      { field: "ct_output", op: "==", value: 0 },
      { field: "cvp", op: ">", value: 15 },
    ],
    message: "醫師！CT 完全停了！CVP 一直升到 {{cvp}}，血壓 {{sbp}}/{{dbp}}⋯⋯這不太對吧？",
    maxFires: 1,
    cooldown: 5,
    priority: 3,
    category: "escalation",
  },

  {
    id: "n-hint-milk",
    conditions: [
      { field: "ct_output", op: "<", value: 30 },
      { field: "action_not_taken", op: "==", value: "chest_tube_milk" },
      { field: "pathology", op: "==", value: "cardiac_tamponade" },
      { field: "elapsed_minutes", op: ">", value: 3 },
    ],
    message: "醫師，CT 好像不太通的樣子⋯⋯你看要不要先試著 milk 一下 chest tube？有時候是 clot 堵住。",
    maxFires: 1,
    cooldown: 5,
    priority: 15,
    category: "hint",
  },

  {
    id: "n-hint-pocus",
    conditions: [
      { field: "ct_output", op: "<", value: 20 },
      { field: "action_not_taken", op: "==", value: "pocus:cardiac" },
      { field: "pathology", op: "==", value: "cardiac_tamponade" },
    ],
    message: "醫師，超音波機就在旁邊——你要不要照個心臟看看有沒有積液？",
    maxFires: 1,
    cooldown: 5,
    priority: 15,
    category: "hint",
  },

  {
    id: "n-no-senior-p2",
    conditions: [
      { field: "pathology", op: "==", value: "cardiac_tamponade" },
      { field: "action_not_taken", op: "==", value: "recall_senior" },
      { field: "elapsed_minutes", op: ">", value: 3 },
      { field: "severity", op: ">", value: 40 },
    ],
    message: "醫師⋯⋯情況好像在變差，要不要趕快再打給學長？",
    maxFires: 1,
    cooldown: 5,
    priority: 10,
    category: "escalation",
  },

  {
    id: "n-pre-arrest",
    conditions: [
      { field: "map", op: "<", value: 40 },
    ],
    message: "⚠️ 血壓 {{sbp}}/{{dbp}}，心跳 {{hr}}，意識下降。病人呈現 near-PEA 狀態——心臟在跳但幾乎沒有 output。必須立即行動！",
    maxFires: 1,
    cooldown: 3,
    priority: 0,
    category: "escalation",
  },
];
