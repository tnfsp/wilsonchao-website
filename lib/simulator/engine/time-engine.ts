// ICU 值班模擬器 Pro — Time Engine
// 純函數，不依賴 React。
// 負責：GameClock 管理、事件排程、時間推進、複合條件判斷。

import type {
  GameClock,
  PendingEvent,
  EventCondition,
  SingleCondition,
  PatientState,
  PlacedOrder,
  MTPState,
} from "../types";

// ============================================================
// GameState snapshot（傳入條件判斷用）
// ============================================================

export interface GameStateSnapshot {
  clock: GameClock;
  patient: PatientState;
  orders: PlacedOrder[];
  mtp: MTPState;
  severity: number;
  elapsedMinutes: number;       // = clock.currentTime
  actionsTaken: string[];       // order ids / action keys
  hintsUsed: number;
}

// ============================================================
// Clock 操作（純函數，回傳新的 GameClock）
// ============================================================

/** 建立初始 GameClock */
export function createGameClock(startHour: number = 2): GameClock {
  return {
    currentTime: 0,
    startHour,
    isPaused: false,
    speed: 1,
  };
}

/** 暫停 */
export function pauseClock(clock: GameClock): GameClock {
  return { ...clock, isPaused: true };
}

/** 繼續 */
export function resumeClock(clock: GameClock): GameClock {
  return { ...clock, isPaused: false };
}

/** 設定時間倍率（1x / 2x / 5x ...） */
export function setClockSpeed(clock: GameClock, speed: number): GameClock {
  if (speed <= 0) throw new Error("speed must be > 0");
  return { ...clock, speed };
}

/** 將 game minutes 轉為顯示用時間字串（例如 "02:15 AM"） */
export function formatGameTime(clock: GameClock): string {
  const totalMinutes = clock.startHour * 60 + clock.currentTime;
  const hours = Math.floor(totalMinutes / 60) % 24;
  const minutes = totalMinutes % 60;
  const ampm = hours < 12 ? "AM" : "PM";
  const displayHour = hours % 12 === 0 ? 12 : hours % 12;
  const displayMin = String(minutes).padStart(2, "0");
  return `${displayHour}:${displayMin} ${ampm}`;
}

// ============================================================
// 事件排程
// ============================================================

/** 加入一個 PendingEvent，回傳新的事件陣列 */
export function addEvent(
  events: PendingEvent[],
  event: PendingEvent
): PendingEvent[] {
  // 不允許重複 id
  const filtered = events.filter((e) => e.id !== event.id);
  return [...filtered, event];
}

/** 移除一個 PendingEvent */
export function removeEvent(
  events: PendingEvent[],
  eventId: string
): PendingEvent[] {
  return events.filter((e) => e.id !== eventId);
}

/** 取得下一個未觸發事件（最小 triggerAt，同時間則 priority 小的先） */
export function getNextEvent(
  events: PendingEvent[]
): PendingEvent | undefined {
  const pending = events.filter((e) => !e.fired);
  if (pending.length === 0) return undefined;
  return pending.reduce((a, b) => {
    if (a.triggerAt !== b.triggerAt) return a.triggerAt < b.triggerAt ? a : b;
    return a.priority <= b.priority ? a : b;
  });
}

/** 取得所有在指定時間點（含）之前未觸發的事件，按 triggerAt ASC，同時間按 priority ASC */
export function getEventsDue(
  events: PendingEvent[],
  currentTime: number
): PendingEvent[] {
  return events
    .filter((e) => !e.fired && e.triggerAt <= currentTime)
    .sort((a, b) =>
      a.triggerAt !== b.triggerAt
        ? a.triggerAt - b.triggerAt
        : a.priority - b.priority
    );
}

/** 標記事件為已觸發，回傳新的事件陣列 */
export function markEventFired(
  events: PendingEvent[],
  eventId: string
): PendingEvent[] {
  return events.map((e) =>
    e.id === eventId ? { ...e, fired: true } : e
  );
}

// ============================================================
// 複合條件判斷
// ============================================================

/**
 * 判斷單一條件是否成立
 * field 支援：
 *   - "severity"
 *   - "elapsed_minutes" / "elapsedMinutes"
 *   - "vitals.hr" / "vitals.sbp" / "vitals.map" / "vitals.spo2" / "vitals.temperature" / 等
 *   - "chestTube.currentRate" / "chestTube.totalOutput" / 等
 *   - "lethalTriad.count"
 *   - "temperature"（= vitals.temperature）
 *   - action_taken:<actionKey>
 *   - action_not_taken:<actionKey>
 *   - "hintsUsed"
 */
function evaluateSingleCondition(
  condition: SingleCondition,
  state: GameStateSnapshot
): boolean {
  const { field, op, value } = condition;

  let actual: number | string | boolean | undefined;

  if (field === "severity") {
    actual = state.severity;
  } else if (field === "elapsed_minutes" || field === "elapsedMinutes") {
    actual = state.elapsedMinutes;
  } else if (field === "temperature") {
    actual = state.patient.vitals.temperature;
  } else if (field === "hintsUsed") {
    actual = state.hintsUsed;
  } else if (field.startsWith("vitals.")) {
    const key = field.slice(7) as keyof typeof state.patient.vitals;
    actual = state.patient.vitals[key] as number | string;
  } else if (field.startsWith("chestTube.")) {
    const key = field.slice(10) as keyof typeof state.patient.chestTube;
    actual = state.patient.chestTube[key] as number | string | boolean;
  } else if (field.startsWith("lethalTriad.")) {
    const key = field.slice(12) as keyof typeof state.patient.lethalTriad;
    actual = state.patient.lethalTriad[key] as number | boolean;
  } else if (field.startsWith("action_taken:")) {
    const actionKey = field.slice(13);
    return state.actionsTaken.includes(actionKey);
  } else if (field.startsWith("action_not_taken:")) {
    const actionKey = field.slice(17);
    return !state.actionsTaken.includes(actionKey);
  } else {
    // 未知欄位，條件不成立
    return false;
  }

  if (op === "exists") return actual !== undefined && actual !== null;
  if (op === "not_exists") return actual === undefined || actual === null;

  if (actual === undefined || actual === null) return false;

  switch (op) {
    case ">":
      return Number(actual) > Number(value);
    case "<":
      return Number(actual) < Number(value);
    case ">=":
      return Number(actual) >= Number(value);
    case "<=":
      return Number(actual) <= Number(value);
    case "==":
      return actual === value;
    case "!=":
      return actual !== value;
    default:
      return false;
  }
}

/**
 * 判斷複合條件（AND / OR）是否成立
 */
export function evaluateCondition(
  condition: EventCondition,
  state: GameStateSnapshot
): boolean {
  const results = condition.conditions.map((c) =>
    evaluateSingleCondition(c, state)
  );

  if (condition.operator === "AND") {
    return results.every(Boolean);
  } else {
    return results.some(Boolean);
  }
}

// ============================================================
// 時間推進（核心）
// ============================================================

export interface AdvanceTimeResult {
  /** 更新後的 clock */
  clock: GameClock;
  /** 更新後的 events 陣列（已觸發的 fired = true） */
  events: PendingEvent[];
  /** 這次推進中應觸發的事件（依序） */
  firedEvents: PendingEvent[];
}

/**
 * 推進 `minutes` 分鐘。
 * 回傳新的 clock、events 陣列、以及此次推進中按順序觸發的事件列表。
 * 條件式事件（有 triggerCondition）：同時檢查時間是否到 AND 條件是否成立。
 *   — 若時間到但條件不成立，不觸發（保留，等待下次推進再檢查）。
 */
export function advanceTime(
  clock: GameClock,
  events: PendingEvent[],
  minutes: number,
  state: GameStateSnapshot
): AdvanceTimeResult {
  if (clock.isPaused) {
    return { clock, events, firedEvents: [] };
  }

  const newTime = clock.currentTime + minutes;
  const newClock: GameClock = { ...clock, currentTime: newTime };

  // 取得時間點已到的事件
  const candidates = getEventsDue(events, newTime);

  const firedEvents: PendingEvent[] = [];
  let updatedEvents = [...events];

  for (const event of candidates) {
    // 若有條件，需條件也成立才觸發
    const conditionMet =
      !event.triggerCondition ||
      evaluateCondition(event.triggerCondition, {
        ...state,
        elapsedMinutes: newTime,
        clock: newClock,
      });

    if (conditionMet) {
      firedEvents.push(event);
      updatedEvents = markEventFired(updatedEvents, event.id);
    }
  }

  return { clock: newClock, events: updatedEvents, firedEvents };
}

// ============================================================
// Helper：建立常用事件的 factory
// ============================================================

/** 建立 lab_result 事件 */
export function createLabResultEvent(
  id: string,
  triggerAt: number,
  labData: Record<string, unknown>,
  priority: number = 5
): PendingEvent {
  return {
    id,
    triggerAt,
    type: "lab_result",
    data: labData,
    fired: false,
    priority,
  };
}

/** 建立 nurse_call 事件 */
export function createNurseCallEvent(
  id: string,
  triggerAt: number,
  message: string,
  condition?: EventCondition,
  priority: number = 3
): PendingEvent {
  return {
    id,
    triggerAt,
    type: "nurse_call",
    data: { message },
    triggerCondition: condition,
    fired: false,
    priority,
  };
}

/** 建立 vitals_change 事件 */
export function createVitalsChangeEvent(
  id: string,
  triggerAt: number,
  changes: {
    vitalChanges?: Partial<import("../types").VitalSigns>;
    chestTubeChanges?: Partial<import("../types").ChestTubeState>;
    temperatureChange?: number;
    severityChange?: number;
  },
  condition?: EventCondition,
  priority: number = 4
): PendingEvent {
  return {
    id,
    triggerAt,
    type: "vitals_change",
    data: changes,
    triggerCondition: condition,
    fired: false,
    priority,
  };
}
