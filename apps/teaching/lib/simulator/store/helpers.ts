/**
 * Store 內部共用 helpers（從 store.ts 機械搬移，零行為改變）
 */

import type {
  ActiveEffect,
  OrderDefinition,
  Pathology,
  TimelineEntry,
} from "../types";

/**
 * Pathology 轉換時，判斷已有 effect 對新 pathology 是否仍 "correct treatment"。
 * 保守策略：bleeding 的止血藥（protamine, TXA, 輸血）對 tamponade 無效但也無害，
 * 標記為 false 讓它們不再減少 severity，但 severityChange 也被 set 為 0 避免 worsening。
 */
export function isEffectCorrectForNewPathology(
  effect: ActiveEffect,
  newPathology: Pathology,
): boolean {
  // 通用處置（volume, vasopressor）在多數 pathology 都算 correct
  const universalTypes: ActiveEffect["type"][] = ["fluid", "vasopressor", "inotrope"];
  if (universalTypes.includes(effect.type)) return true;

  // 止血類（hemostatic, blood products）只對 bleeding/coagulopathy 有效
  const hemostaticTypes: ActiveEffect["type"][] = ["hemostatic", "blood_product"];
  if (hemostaticTypes.includes(effect.type)) {
    return newPathology === "surgical_bleeding" || newPathology === "coagulopathy";
  }

  // 其他（warming, electrolyte, procedure）保持原樣
  return effect.isCorrectTreatment;
}

/** Format elapsed game-minutes + startHour into "HH:MM AM" */
export function formatGameTime(elapsedMinutes: number, startHour = 2): string {
  const totalMin = startHour * 60 + elapsedMinutes;
  const wrapped = ((totalMin % 1440) + 1440) % 1440;
  const h = Math.floor(wrapped / 60);
  const m = wrapped % 60;
  const ampm = h < 12 ? "AM" : "PM";
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${String(h12).padStart(2, "0")}:${String(m).padStart(2, "0")} ${ampm}`;
}

/** Build rhythm context for severityToRhythm — ischemic risk + prolonged hypotension */
export function buildRhythmContext(state: {
  scenario: { ischemicRisk?: boolean } | null;
  mapBelowThresholdSince: number | null;
  clock: { currentTime: number };
}): { hasCAD?: boolean; prolongedHypotension?: boolean } {
  return {
    hasCAD: state.scenario?.ischemicRisk ?? false,
    prolongedHypotension: !!(
      state.mapBelowThresholdSince != null &&
      state.clock.currentTime - state.mapBelowThresholdSince >= 5
    ),
  };
}

let _idCounter = 0;
export function nextId(prefix = "id"): string {
  return `${prefix}_${Date.now()}_${++_idCounter}`;
}

/** resetGame 用 — 將 id counter 歸零（原 store.ts 內 `_idCounter = 0`） */
export function resetIdCounter(): void {
  _idCounter = 0;
}

// M7: Timeline cap — keep at most 200 entries, remove oldest when exceeded
const MAX_TIMELINE_ENTRIES = 200;
export function capTimeline(timeline: TimelineEntry[]): TimelineEntry[] {
  if (timeline.length <= MAX_TIMELINE_ENTRIES) return timeline;
  return timeline.slice(timeline.length - MAX_TIMELINE_ENTRIES);
}

/** 基礎 guard rail 驗證（不 import order-engine，僅做數字範圍檢查） */
export function validateOrderGuardRail(
  definition: OrderDefinition,
  dose: string
): { warning?: string; rejected?: boolean; rejectMessage?: string } {
  const guardRail = definition.guardRail;
  if (!guardRail) return {};

  const numericDose = parseFloat(dose);
  if (isNaN(numericDose)) return {};

  if (guardRail.rejectAbove !== undefined && numericDose > guardRail.rejectAbove) {
    return {
      rejected: true,
      rejectMessage:
        guardRail.rejectMessage ??
        `醫師，這個劑量太高了（>${guardRail.rejectAbove}），藥局不會配，要不要重開？`,
    };
  }

  if (guardRail.warnAbove !== undefined && numericDose > guardRail.warnAbove) {
    return {
      warning:
        guardRail.warnMessage ??
        `醫師，這個劑量有點高（>${guardRail.warnAbove}），確定嗎？`,
    };
  }

  return {};
}
