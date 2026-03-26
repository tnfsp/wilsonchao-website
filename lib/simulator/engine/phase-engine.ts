// ICU 值班模擬器 Pro — Phase Transition Engine
// 純函數，不依賴 React 或 zustand。
//
// 負責：讀取 scenario phase transition rules，每 tick 評估條件，
// 回傳應觸發的 actions（不直接修改 store）。
//
// 設計原則：
//   evaluateTransitions() 是純 evaluator，無 side effects。
//   Store 層負責將回傳的 PhaseAction[] apply 到 game state。
//
// Reference: archived claude-icu-simulator/lib/mtp-ventilator.ts (PhaseEngine section)

import type {
  SimScenario,
  VitalSigns,
  PatientState,
  PlacedOrder,
  MTPState,
  TrackedAction,
} from "../types";

// ============================================================
// Types
// ============================================================

/**
 * A condition that must be met for a phase transition to fire.
 * All conditions in a transition use AND logic.
 */
export type PhaseCondition =
  | { type: "severity_above"; value: number }
  | { type: "severity_below"; value: number }
  | { type: "time_elapsed"; value: number }          // game minutes
  | { type: "medication_given"; value: string }       // drug name (case-insensitive match)
  | { type: "intervention_done"; value: string }      // action key (case-insensitive match)
  | { type: "vitals_threshold"; vital: keyof VitalSigns; operator: ">" | "<"; value: number };

/**
 * An action to execute when a phase transition fires.
 * The store applies these — the engine never mutates state.
 */
export type PhaseAction =
  | { type: "update_severity_rate"; payload: { rate: number } }
  | { type: "trigger_event"; payload: { event: string } }
  | { type: "update_vitals_target"; payload: { vitals: Partial<VitalSigns> } }
  | { type: "send_biogears_command"; payload: Record<string, unknown> }
  | { type: "add_message"; payload: { text: string; sender: string } };

/**
 * A phase transition rule: when ALL conditions are met,
 * fire the actions. Once fired (firedAt != null), it won't re-trigger.
 */
export interface PhaseTransition {
  id: string;
  /** All conditions must be true (AND) */
  conditions: PhaseCondition[];
  /** Actions to execute when fired */
  actions: PhaseAction[];
  /** Game-time when this transition fired (null = not yet) */
  firedAt: number | null;
}

/**
 * Snapshot of game state passed to the evaluator.
 * Kept minimal — only what condition checks actually need.
 */
export interface PhaseEvalState {
  elapsedMinutes: number;
  severity: number;
  vitals: VitalSigns;
  /** All player actions (lowercase), for medication_given / intervention_done checks */
  actionsTaken: string[];
}

// ============================================================
// Engine: create transitions from scenario
// ============================================================

/**
 * Build PhaseTransition[] from a scenario's events.
 *
 * Currently, scenarios define phase transitions through ScriptedEvents
 * (with pathologyChange, severitySet, etc.). The phase engine adds a
 * *complementary* layer — scenario authors can embed `phaseTransitions`
 * directly in the scenario config for condition-driven transitions that
 * don't fit the time-based ScriptedEvent model.
 *
 * If the scenario has no explicit `phaseTransitions`, returns an empty
 * array (the existing ScriptedEvent system handles everything).
 */
export function createPhaseEngine(scenario: SimScenario): PhaseTransition[] {
  // Check if the scenario carries explicit phase transition rules.
  // This field is optional and added by scenario authors who want
  // condition-driven transitions beyond what ScriptedEvents support.
  const raw = (scenario as SimScenarioWithPhases).phaseTransitions;
  if (!raw || raw.length === 0) return [];

  return raw.map((r) => ({
    ...r,
    firedAt: null,
  }));
}

/** Extended scenario type with optional phaseTransitions field */
interface SimScenarioWithPhases extends SimScenario {
  phaseTransitions?: Omit<PhaseTransition, "firedAt">[];
}

// ============================================================
// Engine: evaluate transitions (pure)
// ============================================================

/**
 * Check whether a single condition is satisfied.
 */
function checkCondition(
  condition: PhaseCondition,
  state: PhaseEvalState,
): boolean {
  switch (condition.type) {
    case "severity_above":
      return state.severity > condition.value;

    case "severity_below":
      return state.severity < condition.value;

    case "time_elapsed":
      return state.elapsedMinutes >= condition.value;

    case "medication_given": {
      const drug = condition.value.toLowerCase();
      return state.actionsTaken.some((a) => a.includes(drug));
    }

    case "intervention_done": {
      const action = condition.value.toLowerCase();
      return state.actionsTaken.some((a) => a.includes(action));
    }

    case "vitals_threshold": {
      const currentValue = state.vitals[condition.vital];
      if (currentValue === undefined || currentValue === null) return false;
      if (typeof currentValue !== "number") return false;
      return condition.operator === ">"
        ? currentValue > condition.value
        : currentValue < condition.value;
    }

    default:
      return false;
  }
}

/**
 * Evaluate all transitions and return actions for those whose conditions
 * are met AND have not yet fired.
 *
 * Pure function — does NOT mutate the transitions array.
 * The caller must mark fired transitions via `markTransitionsFired()`.
 *
 * @returns Array of { transitionId, actions } for each matched transition.
 */
export function evaluateTransitions(
  transitions: PhaseTransition[],
  state: PhaseEvalState,
): Array<{ transitionId: string; actions: PhaseAction[] }> {
  const results: Array<{ transitionId: string; actions: PhaseAction[] }> = [];

  for (const t of transitions) {
    // Skip already-fired transitions
    if (t.firedAt != null) continue;

    // All conditions must pass (AND)
    const allMet = t.conditions.every((c) => checkCondition(c, state));
    if (allMet) {
      results.push({
        transitionId: t.id,
        actions: t.actions,
      });
    }
  }

  return results;
}

// ============================================================
// I3: Severity → Rhythm → Arrest auto-transition
// ============================================================

import type { RhythmType } from "../types";

/**
 * Map tamponade severity to the expected cardiac rhythm.
 * Based on the pathophysiology:
 *   0-40:   Sinus tachycardia (compensatory)
 *   40-60:  Sinus tach (electrical alternans visible on ECG, but rhythm stays sinus_tach)
 *   60-80:  Sinus tach → transitional (near-PEA hemodynamics but still has rhythm)
 *   80-90:  PEA (pulseless electrical activity)
 *   90-100: Asystole
 *
 * VF branch: only if ischemia context present (CAD, prolonged MAP<40)
 */
export function severityToRhythm(
  severity: number,
  context?: { hasCAD?: boolean; prolongedHypotension?: boolean },
): RhythmType {
  // VF branch: ischemia-driven
  if (
    severity > 60 &&
    (context?.hasCAD || context?.prolongedHypotension) &&
    severity < 90 // once past 90, goes to asystole not VF
  ) {
    return "vf";
  }

  if (severity < 40) return "sinus_tach";
  if (severity < 60) return "sinus_tach"; // electrical alternans is ECG morphology, not rhythm type
  if (severity < 80) return "sinus_tach"; // near-PEA hemodynamics, rhythm technically present
  if (severity < 90) return "pea";
  return "asystole";
}

/**
 * Check if the current severity level constitutes cardiac arrest.
 * Cardiac arrest = severity >= 80 (PEA or asystole).
 */
export function isArrestSeverity(severity: number): boolean {
  return severity >= 80;
}

// ============================================================
// Engine: mark transitions as fired (immutable update)
// ============================================================

/**
 * Return a new transitions array with the specified IDs marked as fired.
 * Does NOT mutate the input array.
 */
export function markTransitionsFired(
  transitions: PhaseTransition[],
  firedIds: string[],
  gameTime: number,
): PhaseTransition[] {
  if (firedIds.length === 0) return transitions;

  const idSet = new Set(firedIds);
  return transitions.map((t) =>
    idSet.has(t.id)
      ? { ...t, firedAt: gameTime }
      : t,
  );
}
