/**
 * ICU 值班模擬器 Pro — zustand Store
 *
 * 設計原則：
 * - Store 不 import engine 函數（避免循環引用）
 * - Engine 邏輯由 component 層 call 後 dispatch 到 store
 * - Store 提供完整的 setter / updater 讓 engine 可以 dispatch
 *
 * 例外：getOrderEffect / getMTPRoundEffect 在 placeOrder / activateMTP 時直接 dispatch，
 * 以避免需要 component 層中繼，且不造成循環引用（order-engine 不 import store）。
 */

import { create } from "zustand";
import { getOrderEffect, getMTPRoundEffect } from "@/lib/simulator/engine/order-engine";
import { updatePatientState } from "@/lib/simulator/engine/patient-engine";
import { checkRescueActivation, evaluateRescueActions, getRescueStabilizeValues } from "@/lib/simulator/engine/rescue-engine";
import { evaluateCondition } from "@/lib/simulator/engine/time-engine";
import type { GameStateSnapshot } from "@/lib/simulator/engine/time-engine";
import { computeLabSnapshot, buildLabContext } from "@/lib/simulator/engine/lab-engine";
import { getLastBioGearsState } from "@/lib/simulator/engine/biogears-engine";
import type { LabPanelId } from "@/lib/simulator/engine/lab-engine";
import type {
  SimScenario,
  GamePhase,
  GameClock,
  PatientState,
  PendingEvent,
  PlacedOrder,
  MTPState,
  TimelineEntry,
  GameScore,
  ModalType,
  VitalSigns,
  ChestTubeState,
  ActiveEffect,
  OrderDefinition,
  CriticalAction,
  LethalTriadState,
  IOBalance,
  Pathology,
  OrderStatus,
  VentilatorState,
  TrackedAction,
  LabResultData,
  ScriptedEventData,
  OrderEffectData,
  DefibrillatorState,
  ShockResult,
  DifficultyLevel,
  DifficultyConfig,
  RescueState,
} from "./types";

// ============================================================
// Helpers
// ============================================================

/** Format elapsed game-minutes + startHour into "HH:MM AM" */
function formatGameTime(elapsedMinutes: number, startHour = 2): string {
  const totalMin = startHour * 60 + elapsedMinutes;
  const wrapped = ((totalMin % 1440) + 1440) % 1440;
  const h = Math.floor(wrapped / 60);
  const m = wrapped % 60;
  const ampm = h < 12 ? "AM" : "PM";
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${String(h12).padStart(2, "0")}:${String(m).padStart(2, "0")} ${ampm}`;
}

// ============================================================
// Store Interface
// ============================================================

export interface ProGameStore {
  // 難度
  difficulty: DifficultyLevel;
  difficultyConfig: DifficultyConfig;
  setDifficulty: (d: DifficultyLevel) => void;

  // 情境
  scenario: SimScenario | null;
  isLoading: boolean;
  loadError: string | null;

  // 遊戲狀態
  phase: GamePhase;
  clock: GameClock;

  // 病人
  patient: PatientState | null;

  // 事件
  pendingEvents: PendingEvent[];
  firedEvents: PendingEvent[];

  // Orders
  placedOrders: PlacedOrder[];
  mtpState: MTPState;

  // Timeline
  timeline: TimelineEntry[];

  // Player tracking
  playerActions: TrackedAction[];   // 追蹤做了什麼（for scoring）— with timestamps
  hintsUsed: number;
  pauseThinkUsed: boolean;

  // SBAR
  sbarReport: any | null;

  // Score
  score: GameScore | null;

  // Death
  deathCause: string | null;

  // Rescue Window (Standard mode delayed death)
  rescueState: RescueState | null;

  // UI
  activeModal: ModalType;

  // Ventilator
  ventilator: VentilatorState;

  // Guidance system
  guidanceMode: boolean;
  guidanceHighlight: string | null;

  // ---- Primary Actions ----

  /** 載入情境，初始化所有狀態 */
  loadScenario: (id: string) => Promise<void>;

  /** 開始遊戲，phase → playing，排入初始事件 */
  startGame: () => void;

  /** 推進遊戲時間，觸發到期事件 */
  advanceTime: (minutes: number) => void;

  /** 下 order：驗證、加入 placedOrders、排入效果事件 */
  placeOrder: (params: PlaceOrderParams) => PlaceOrderResult;

  /** 啟動 MTP：設定 mtpState，排入血品送達事件 */
  activateMTP: () => void;

  /** 新增 timeline 條目 */
  addTimelineEntry: (entry: Omit<TimelineEntry, "id">) => void;

  /** 執行動作並推進遊戲時間（事件驅動時間引擎核心） */
  actionAdvance: (minutes: number) => void;

  /** 更新 patient vitals（engine dispatch 用） */
  updateVitals: (changes: Partial<VitalSigns>) => void;

  /** 更新 chest tube 狀態（engine dispatch 用） */
  updateChestTube: (changes: Partial<ChestTubeState>) => void;

  /** 玩家傳送訊息到 timeline */
  sendMessage: (text: string) => void;

  /** 開啟 modal */
  openModal: (type: Exclude<ModalType, null>) => void;

  /** 關閉 modal */
  closeModal: () => void;

  /** 使用「暫停思考」功能 */
  usePauseThink: () => void;

  /** 提交 SBAR 報告，phase → sbar（等待送出後→debrief） */
  submitSBAR: (report: Record<string, string>) => void;

  /** 遊戲結束：計算分數，phase → debrief */
  endGame: () => void;

  /** 重置所有狀態 */
  resetGame: () => void;

  /** 觸發病人死亡（由外部 tick 呼叫） */
  triggerDeath: (cause: string) => void;

  /** Set rescue window state (Standard mode) */
  setRescueState: (state: RescueState | null) => void;

  /** Tick rescue countdown (call every real-time second) */
  tickRescueCountdown: () => void;

  /** 檢查並更新 guidance highlight */
  checkGuidance: () => void;

  /** 設定 guidance highlight */
  setGuidanceHighlight: (key: string | null) => void;

  // ---- Engine Dispatch Setters ----
  // 這些 action 供 component 層呼叫 engine 後 dispatch 結果到 store

  /** 新增單一待觸發事件 */
  addPendingEvent: (event: PendingEvent) => void;

  /** 批次設置 pendingEvents（engine 重新排程用） */
  setPendingEvents: (events: PendingEvent[]) => void;

  /** 標記事件已觸發（engine 確認後） */
  fireEvent: (eventId: string) => void;

  /** 更新病人嚴重度（0-100） */
  updatePatientSeverity: (severity: number) => void;

  /** 新增 active effect（藥物/輸液生效） */
  addActiveEffect: (effect: ActiveEffect) => void;

  /** 移除 active effect（效果結束） */
  removeActiveEffect: (effectId: string) => void;

  /** 更新死亡三角狀態 */
  updateLethalTriad: (triad: Partial<LethalTriadState>) => void;

  /** 更新 I/O balance */
  updateIOBalance: (changes: Partial<IOBalance>) => void;

  /** 更新 order 狀態（結果回來、完成等） */
  updateOrderStatus: (
    orderId: string,
    status: OrderStatus,
    result?: unknown
  ) => void;

  /** 直接設置計算好的分數（score-engine dispatch 用） */
  setScore: (score: GameScore) => void;

  /** 更新 pathology（病況變化） */
  updatePathology: (pathology: Pathology) => void;

  /** 更新呼吸器設定 */
  updateVentilator: (changes: Partial<VentilatorState>) => void;

  // ---- Hint System ----
  /** 使用提示（最多 3 次），找到第一個未完成的 critical action 並顯示 hint */
  useHint: () => void;

  // ---- Defibrillator (ACLS) ----
  /** Defibrillator 狀態 */
  defibrillator: DefibrillatorState;

  /** 設定電擊能量 */
  setDefibrillatorEnergy: (energy: number) => void;

  /** 設定電擊模式 */
  setDefibrillatorMode: (mode: "sync" | "async") => void;

  /** 執行電擊 */
  deliverShock: () => ShockResult;
}

// ============================================================
// Helper Types
// ============================================================

export interface PlaceOrderParams {
  definition: OrderDefinition;
  dose: string;
  frequency: string;
}

export interface PlaceOrderResult {
  success: boolean;
  orderId: string | null;
  warning?: string;
  rejected?: boolean;
  rejectMessage?: string;
}

// ============================================================
// Initial State
// ============================================================

const initialClock: GameClock = {
  currentTime: 0,
  startHour: 2,
  isPaused: true,
  speed: 1,
};

const initialMTPState: MTPState = {
  activated: false,
  activatedAt: undefined,
  roundsDelivered: 0,
};

const initialVentilatorState: VentilatorState = {
  mode: 'VC',
  fio2: 0.4,
  peep: 5,
  rrSet: 14,
  tvSet: 500,
  ieRatio: '1:2',
};

const initialDefibrillatorState: DefibrillatorState = {
  energy: 200,
  mode: "async",
  lastShockAt: null,
};

const DIFFICULTY_CONFIGS: Record<DifficultyLevel, DifficultyConfig> = {
  lite: {
    canDie: false,
    timeScale: 0,
    hintLimit: Infinity,
  },
  standard: {
    canDie: true,
    rescueThreshold: { sbp: 60, hr: 30, spo2: 70 },
    rescueWindowSeconds: 60,
    timeScale: 0.75,
    hintLimit: Infinity,
  },
  pro: {
    canDie: true,
    timeScale: 1,
    hintLimit: 3,
  },
};

const initialState = {
  difficulty: "pro" as DifficultyLevel,
  difficultyConfig: DIFFICULTY_CONFIGS.pro,
  scenario: null as SimScenario | null,
  isLoading: false,
  loadError: null as string | null,
  phase: "not_started" as GamePhase,
  clock: initialClock,
  patient: null as PatientState | null,
  pendingEvents: [] as PendingEvent[],
  firedEvents: [] as PendingEvent[],
  placedOrders: [] as PlacedOrder[],
  mtpState: initialMTPState,
  timeline: [] as TimelineEntry[],
  playerActions: [] as TrackedAction[],
  hintsUsed: 0,
  pauseThinkUsed: false,
  sbarReport: null as Record<string, string> | null,
  score: null as GameScore | null,
  deathCause: null as string | null,
  rescueState: null as RescueState | null,
  activeModal: null as ModalType,
  ventilator: initialVentilatorState,
  guidanceMode: false,
  guidanceHighlight: null as string | null,
  defibrillator: initialDefibrillatorState,
};

// ============================================================
// Helpers
// ============================================================

let _idCounter = 0;
function nextId(prefix = "id"): string {
  return `${prefix}_${Date.now()}_${++_idCounter}`;
}

/** 基礎 guard rail 驗證（不 import order-engine，僅做數字範圍檢查） */
function validateOrderGuardRail(
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

/** 基礎分數計算（不 import score-engine） */
function computeBasicScore(
  state: Omit<
    ProGameStore,
    | "loadScenario"
    | "startGame"
    | "advanceTime"
    | "placeOrder"
    | "activateMTP"
    | "addTimelineEntry"
    | "updateVitals"
    | "updateChestTube"
    | "sendMessage"
    | "openModal"
    | "closeModal"
    | "usePauseThink"
    | "submitSBAR"
    | "endGame"
    | "resetGame"
    | "addPendingEvent"
    | "setPendingEvents"
    | "fireEvent"
    | "updatePatientSeverity"
    | "addActiveEffect"
    | "removeActiveEffect"
    | "updateLethalTriad"
    | "updateIOBalance"
    | "updateOrderStatus"
    | "setScore"
    | "updatePathology"
    | "updateVentilator"
    | "useHint"
    | "setDefibrillatorEnergy"
    | "setDefibrillatorMode"
    | "deliverShock"
    | "triggerDeath"
    | "setRescueState"
    | "tickRescueCountdown"
    | "checkGuidance"
    | "setGuidanceHighlight"
    | "actionAdvance"
    | "resetGame"
  >
): GameScore {
  const { scenario, placedOrders, playerActions, hintsUsed, pauseThinkUsed, sbarReport, patient, clock } = state;

  if (!scenario) {
    return {
      timeToFirstAction: 0,
      correctDiagnosis: false,
      criticalActions: [],
      harmfulOrders: [],
      escalationTiming: "never",
      lethalTriadManaged: false,
      sbar: {
        completeness: 0,
        prioritization: 0,
        quantitative: false,
        anticipatory: false,
      },
      hintsUsed,
      pauseThinkUsed,
      overall: "needs_improvement",
      keyLessons: [],
      stars: 1 as 1 | 2 | 3,
      totalScore: 0,
      patientDied: !!state.deathCause,
    };
  }

  // 1. Time to first action (skip game_start entry)
  const meaningfulActions = playerActions.filter((pa) => !pa.action.startsWith("game_start:") && !pa.action.startsWith("event_fired:"));
  const timeToFirstAction = meaningfulActions.length > 0
    ? meaningfulActions[0].gameTime
    : clock.currentTime;

  // 2. Critical actions — 對照 scenario.expectedActions with pattern matching
  const ACTION_PATTERNS: Record<string, RegExp> = {
    "act-blood-culture": /order:lab:.*blood.?culture|lab:.*blood.?culture/i,
    "act-antibiotics": /order:medication:.*(?:vancomycin|piptazo|ceftriaxone|pip.*tazo|meropenem|cefepime)/i,
    "act-fluid-resuscitation": /order:fluid:.*(?:ns|lr|normal.?saline|lactated|albumin)|order:transfusion|mtp:activated/i,
    "act-lactate": /order:lab:.*(?:lactate|abg|blood.?gas)/i,
    "act-vasopressor": /order:medication:.*(?:norepinephrine|levophed|epinephrine|vasopressin)/i,
    "act-call-senior": /consult:.*senior|consult:.*vs|call_senior|call_vs|message:.*叫學長|message:.*通知/i,
    "act-wound-culture": /order:lab:.*wound.?culture|order:lab:.*swab/i,
    "act-foley": /order:procedure:.*foley|order:procedure:.*catheter/i,
    "act-central-line": /order:procedure:.*central.?line|order:procedure:.*cvc/i,
    "act-abg": /order:lab:.*abg|order:lab:.*blood.?gas/i,
    "act-check-ct": /pocus:.*|order:imaging:.*cxr|order:lab:.*cbc/i,
    "act-protamine": /order:.*protamine/i,
    "act-txa": /order:.*txa|order:.*tranexamic/i,
    "act-mtp": /mtp:activated/i,
    "act-pericardiocentesis": /order:procedure:.*pericardio/i,
    "act-echo": /pocus:cardiac/i,
    "act-vent-fio2-increase": /vent:.*fio2=/i,
    "act-vent-peep-increase": /vent:.*peep=/i,
    "act-vent-fio2-adjust": /vent:.*fio2=/i,
    "act-vent-peep-adjust": /vent:.*peep=/i,
    "act-vent-maintain": /vent:/i,
  };

  const criticalActions: CriticalAction[] = scenario.expectedActions.map(
    (expected) => {
      const pattern = ACTION_PATTERNS[expected.id];
      const matchingAction = pattern
        ? playerActions.find((pa) => pattern.test(pa.action))
        : playerActions.find((pa) =>
            pa.action.toLowerCase().includes(expected.action.toLowerCase())
          );

      return {
        id: expected.id,
        description: expected.description,
        met: !!matchingAction,
        timeToComplete: matchingAction ? matchingAction.gameTime : null,
        critical: expected.critical,
        hint: expected.hint,
      };
    }
  );

  // 3. Harmful orders（effect.isCorrectTreatment === false）
  const harmfulOrders = placedOrders
    .filter((o) => o.status === "completed" || o.status === "in_progress")
    .filter((o) => {
      // 如果 definition 上有 effect 且標記為不正確，算有害
      const effectDef = o.definition.effect;
      return effectDef && effectDef.isCorrectTreatment === false;
    })
    .map((o) => o.definition.name);

  // 4. Correct diagnosis（pathology match）
  const correctDiagnosis = scenario.pathology === patient?.pathology;

  // 5. Escalation timing (now using actual gameTime from TrackedAction)
  const escalationAction = playerActions.find((pa) =>
    pa.action.includes("叫學長") || pa.action.includes("consult") || pa.action.includes("通知VS") || pa.action.includes("call_senior") || pa.action.includes("call_vs")
  );
  let escalationTiming: GameScore["escalationTiming"] = "never";
  if (escalationAction) {
    if (escalationAction.gameTime <= 10) escalationTiming = "early";
    else if (escalationAction.gameTime <= 20) escalationTiming = "appropriate";
    else escalationTiming = "late";
  }

  // 6. Lethal triad managed
  const lethalTriadManaged = patient?.lethalTriad.count === 0;

  // 7. SBAR score
  const sbar = computeSBARScore(sbarReport);

  // 8. Overall
  const criticalMissed = criticalActions.filter(
    (ca) => ca.critical && !ca.met
  ).length;
  let overall: GameScore["overall"] = "excellent";
  if (criticalMissed >= 2 || harmfulOrders.length > 0) {
    overall = "needs_improvement";
  } else if (criticalMissed === 1 || hintsUsed > 2) {
    overall = "good";
  }

  // 9. Key lessons
  const keyLessons = scenario.debrief.keyPoints.slice(0, 3);

  // 10. Total score (0-100) and stars
  const patientDied = !!state.deathCause;
  let totalScore = 0;
  // Base: critical actions completion (50 pts)
  const totalCritical = criticalActions.filter((ca) => ca.critical).length;
  const metCritical = criticalActions.filter((ca) => ca.critical && ca.met).length;
  const criticalScore = totalCritical > 0 ? Math.round((metCritical / totalCritical) * 50) : 50;
  totalScore += criticalScore;
  // SBAR score (25 pts)
  totalScore += Math.round((sbar.completeness / 100) * 15);
  totalScore += sbar.quantitative ? 5 : 0;
  totalScore += sbar.anticipatory ? 5 : 0;
  // Escalation (15 pts)
  if (escalationTiming === "appropriate") totalScore += 15;
  else if (escalationTiming === "early") totalScore += 10;
  else if (escalationTiming === "late") totalScore += 5;
  // Lethal triad (10 pts)
  if (lethalTriadManaged) totalScore += 10;
  // Deductions
  totalScore -= harmfulOrders.length * 10;
  totalScore -= hintsUsed * 5;
  totalScore = Math.max(0, Math.min(100, totalScore));

  // Stars
  let stars: 1 | 2 | 3;
  if (patientDied) {
    stars = 1;
  } else if (totalScore >= 80) {
    stars = 3;
  } else if (totalScore >= 50) {
    stars = 2;
  } else {
    stars = 1;
  }

  return {
    timeToFirstAction,
    correctDiagnosis,
    criticalActions,
    harmfulOrders,
    escalationTiming,
    lethalTriadManaged,
    sbar,
    hintsUsed,
    pauseThinkUsed,
    overall,
    keyLessons,
    stars,
    totalScore,
    patientDied,
  };
}

/** SBAR 內容評分 */
function computeSBARScore(
  report: Record<string, string> | null
): GameScore["sbar"] {
  if (!report) {
    return {
      completeness: 0,
      prioritization: 0,
      quantitative: false,
      anticipatory: false,
    };
  }

  const text = Object.values(report).join(" ").toLowerCase();
  const hasQuantitative =
    /\d+/.test(text) && (text.includes("cc") || text.includes("mg") || text.includes("mmhg"));
  const hasAnticipatory =
    text.includes("已準備") ||
    text.includes("已經") ||
    text.includes("已開") ||
    text.includes("建議");

  // completeness: 各 SBAR 欄位是否都填
  const sbarFields = ["situation", "background", "assessment", "recommendation"];
  const filled = sbarFields.filter(
    (f) => report[f] && report[f].trim().length > 10
  ).length;
  const completeness = Math.round((filled / sbarFields.length) * 100);

  // prioritization: 是否先說最重要的事
  const situationText = (report["situation"] ?? "").toLowerCase();
  const mentionsCritical =
    situationText.includes("血壓") ||
    situationText.includes("chest tube") ||
    situationText.includes("出血");
  const prioritization = mentionsCritical ? 80 : 40;

  return {
    completeness,
    prioritization,
    quantitative: hasQuantitative,
    anticipatory: hasAnticipatory,
  };
}

// ============================================================
// Store
// ============================================================

export const useProGameStore = create<ProGameStore>((set, get) => ({
  ...initialState,

  // ----------------------------------------------------------
  // setDifficulty
  // ----------------------------------------------------------
  setDifficulty: (d: DifficultyLevel) => {
    set({ difficulty: d, difficultyConfig: DIFFICULTY_CONFIGS[d] });
  },

  // ----------------------------------------------------------
  // loadScenario
  // ----------------------------------------------------------
  loadScenario: async (id: string) => {
    set({ isLoading: true, loadError: null });
    try {
      const res = await fetch(`/api/simulator/scenarios/${id}`);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      const scenario: SimScenario = await res.json();

      // 初始化 patient state 從 scenario
      const patient: PatientState = {
        vitals: { ...scenario.initialVitals },
        baselineVitals: { ...scenario.initialVitals },
        chestTube: { ...scenario.initialChestTube },
        pathology: scenario.pathology,
        severity: 30, // 預設值，會由 patient-engine 計算
        activeEffects: [],
        ioBalance: {
          totalInput: 0,
          totalOutput: scenario.initialChestTube.totalOutput,
          netBalance: -scenario.initialChestTube.totalOutput,
          breakdown: {
            input: { iv: 0, blood: 0, oral: 0 },
            output: {
              chestTube: scenario.initialChestTube.totalOutput,
              urine: 0,
              ngo: 0,
            },
          },
        },
        lethalTriad: {
          hypothermia: scenario.initialVitals.temperature < 36,
          acidosis: false,
          coagulopathy: false,
          count: scenario.initialVitals.temperature < 36 ? 1 : 0,
        },
      };

      set({
        scenario,
        patient,
        isLoading: false,
        phase: "not_started",
        clock: {
          currentTime: 0,
          startHour: scenario.startHour,
          isPaused: true,
          speed: 1,
        },
        pendingEvents: [],
        firedEvents: [],
        placedOrders: [],
        mtpState: { activated: false, roundsDelivered: 0 },
        ventilator: scenario.initialVentilator ?? initialVentilatorState,
        timeline: [],
        playerActions: [],
        hintsUsed: 0,
        pauseThinkUsed: false,
        sbarReport: null,
        score: null,
        deathCause: null,
        activeModal: null,
        defibrillator: initialDefibrillatorState,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      set({ isLoading: false, loadError: message });
    }
  },

  // ----------------------------------------------------------
  // startGame
  // ----------------------------------------------------------
  startGame: () => {
    const { scenario, clock } = get();
    if (!scenario || get().phase !== "not_started") return;

    // 把 scenario scripted events 轉成 PendingEvent 排入隊列
    const pendingEvents: PendingEvent[] = scenario.events.map((e) => ({
      id: e.id,
      triggerAt: e.triggerTime,
      triggerCondition: e.triggerCondition,
      type: e.type,
      data: {
        message: e.message,
        vitalChanges: e.vitalChanges,
        chestTubeChanges: e.chestTubeChanges,
        temperatureChange: e.temperatureChange,
        severityChange: e.severityChange,
        newLabResults: e.newLabResults,
      } as ScriptedEventData,
      fired: false,
      priority: 0,
    }));

    // 開場事件已手動加入 timeline，標記為已觸發避免重複
    for (const pe of pendingEvents) {
      if (pe.triggerAt === 0 && pe.type === "nurse_call") {
        pe.fired = true;
      }
    }

    // 加入開場護理師訊息到 timeline
    const openingEntry: TimelineEntry = {
      id: nextId("tl"),
      gameTime: 0,
      type: "nurse_message",
      content: scenario.nurseProfile.name + "：" + (scenario.events[0]?.message ?? "醫師，病人狀況需要您來看一下。"),
      sender: "nurse",
      isImportant: true,
    };

    set({
      phase: "playing",
      clock: { ...clock, isPaused: false },
      pendingEvents,
      timeline: [openingEntry],
      playerActions: [{ action: `game_start:${scenario.id}`, gameTime: 0 }],
    });
  },

  // ----------------------------------------------------------
  // advanceTime
  // ----------------------------------------------------------
  advanceTime: (minutes: number) => {
    const { clock, pendingEvents, phase } = get();
    if (phase !== "playing") return;

    const newTime = clock.currentTime + minutes;
    const updatedClock: GameClock = { ...clock, currentTime: newTime };

    // 找出所有應在 newTime 前觸發、且尚未觸發的事件
    // 同時處理條件型事件：時間到 AND 條件成立才觸發
    const currentState = get();
    const snapshot: GameStateSnapshot = {
      clock: { ...clock, currentTime: newTime },
      patient: currentState.patient!,
      orders: currentState.placedOrders as PlacedOrder[],
      mtp: currentState.mtpState,
      severity: currentState.patient?.severity ?? 0,
      elapsedMinutes: newTime,
      actionsTaken: currentState.playerActions.map((pa) => pa.action),
      hintsUsed: currentState.hintsUsed ?? 0,
    };

    const toFire = pendingEvents.filter((e) => {
      if (e.fired || e.triggerAt > newTime) return false;
      // 無條件事件：時間到就觸發
      if (!e.triggerCondition) return true;
      // 條件事件：時間到 + 條件成立才觸發
      return evaluateCondition(e.triggerCondition, snapshot);
    });

    const nowFiredIds = new Set(toFire.map((e) => e.id));

    const updatedPending = pendingEvents.map((e) =>
      nowFiredIds.has(e.id) ? { ...e, fired: true } : e
    );
    const newlyFired = updatedPending.filter((e) => nowFiredIds.has(e.id));

    // ── STEP 1: 先套用 severityChange + chestTubeChanges ──
    // 這樣 patient-engine 下一次 tick 會算出正確的 vitals
    // 護理師對白在 STEP 2 讀 patient state 動態生成
    for (const ev of toFire) {
      const data = ev.data as ScriptedEventData | undefined;
      if (!data) continue;

      const chestTubeChanges = data.chestTubeChanges;
      const severityChange = data.severityChange;

      if (chestTubeChanges || severityChange) {
        set((state) => {
          if (!state.patient) return {};

          let newSeverity = state.patient.severity;
          if (severityChange) {
            newSeverity = Math.max(0, Math.min(100, newSeverity + severityChange));
          }

          let newChestTube = state.patient.chestTube;
          if (chestTubeChanges) {
            newChestTube = { ...newChestTube, ...chestTubeChanges };
          }

          const ctOutputDiff = newChestTube.totalOutput - state.patient.chestTube.totalOutput;
          let newIO = state.patient.ioBalance;
          if (ctOutputDiff !== 0) {
            newIO = {
              ...newIO,
              totalOutput: newIO.totalOutput + ctOutputDiff,
              netBalance: newIO.netBalance - ctOutputDiff,
              breakdown: {
                ...newIO.breakdown,
                output: {
                  ...newIO.breakdown.output,
                  chestTube: newIO.breakdown.output.chestTube + ctOutputDiff,
                },
              },
            };
          }

          // 同時立即重算 vitals（用新 severity）讓 STEP 2 讀到最新數字
          const newPatient = updatePatientState(
            { ...state.patient, severity: newSeverity, chestTube: newChestTube, ioBalance: newIO },
            { minutesPassed: 0, currentGameMinutes: newTime, ventilator: state.ventilator }
          );

          return { patient: newPatient };
        });
      }
    }

    // ── STEP 2: 讀取最新 patient state，建 timeline entries ──
    // 護理師對白用模板 {{hr}} {{sbp}} {{dbp}} {{cvp}} {{ct_rate}} {{ct_total}} {{spo2}} {{map}} {{rr}}
    // 插值為當前 patient state 的真實數字
    const currentPatient = get().patient;
    const interpolateVitals = (text: string): string => {
      if (!currentPatient) {
        // Fallback: use scenario initialVitals if patient not yet hydrated
        const fallback = get().scenario;
        if (!fallback) return text;
        const v = fallback.initialVitals;
        const ct = fallback.initialChestTube ?? { currentRate: 0, totalOutput: 0 };
        return text
          .replace(/\{\{hr\}\}/g, String(Math.round(v.hr)))
          .replace(/\{\{sbp\}\}/g, String(Math.round(v.sbp)))
          .replace(/\{\{dbp\}\}/g, String(Math.round(v.dbp)))
          .replace(/\{\{map\}\}/g, String(Math.round(v.map)))
          .replace(/\{\{cvp\}\}/g, String(Math.round(v.cvp)))
          .replace(/\{\{spo2\}\}/g, String(Math.round(v.spo2)))
          .replace(/\{\{rr\}\}/g, String(Math.round(v.rr)))
          .replace(/\{\{temp\}\}/g, String(v.temperature))
          .replace(/\{\{ct_rate\}\}/g, String(ct.currentRate))
          .replace(/\{\{ct_total\}\}/g, String(ct.totalOutput));
      }
      const v = currentPatient.vitals;
      const ct = currentPatient.chestTube;
      return text
        .replace(/\{\{hr\}\}/g, String(Math.round(v.hr)))
        .replace(/\{\{sbp\}\}/g, String(Math.round(v.sbp)))
        .replace(/\{\{dbp\}\}/g, String(Math.round(v.dbp)))
        .replace(/\{\{map\}\}/g, String(Math.round(v.map)))
        .replace(/\{\{cvp\}\}/g, String(Math.round(v.cvp)))
        .replace(/\{\{spo2\}\}/g, String(Math.round(v.spo2)))
        .replace(/\{\{rr\}\}/g, String(Math.round(v.rr)))
        .replace(/\{\{temp\}\}/g, String(v.temperature))
        .replace(/\{\{ct_rate\}\}/g, String(ct.currentRate))
        .replace(/\{\{ct_total\}\}/g, String(ct.totalOutput));
    };

    const firedEntries: TimelineEntry[] = [];
    const scenario = get().scenario;
    const placedOrders = get().placedOrders;

    for (const ev of toFire) {
      if (ev.type === "lab_result" && (ev.data as LabResultData)?.orderId) {
        // Find the order and its lab panel results
        const labData = ev.data as LabResultData;
        const order = placedOrders.find((o) => o.id === labData.orderId);
        if (order && scenario) {
          const orderId = (order.definition as unknown as Record<string, unknown>).id as string | undefined;

          // === Try BioGears dynamic labs first ===
          const bgState = getLastBioGearsState();
          const labCtx = buildLabContext(placedOrders as Parameters<typeof buildLabContext>[0], newTime);
          const dynamicResults = bgState && orderId
            ? computeLabSnapshot(bgState, labCtx, orderId as LabPanelId)
            : null;

          let labResults: Record<string, { value: number | string; unit: string; normal?: string; flag?: string }> | null = dynamicResults;

          if (!labResults) {
            const orderName = order.definition.name.toLowerCase();
            const labKey = Object.keys(scenario.availableLabs).find((k) => {
              const panel = scenario.availableLabs[k];
              if (orderId && panel.id === orderId) return true;
              if (panel.name === order.definition.name) return true;
              if (panel.id === orderName) return true;
              return false;
            });
            const labPanel = labKey ? scenario.availableLabs[labKey] : null;
            labResults = labPanel?.results ?? null;
          }

          if (labResults) {
            const resultLines = Object.entries(labResults)
              .map(([key, r]) => {
                const flagStr = r.flag === "critical" ? " 🔴" : r.flag === "H" ? " ↑" : r.flag === "L" ? " ↓" : "";
                return `${key.padEnd(10)} ${String(r.value).padStart(7)}  ${r.unit}${flagStr}`;
              })
              .join("\n");
            
            firedEntries.push({
              id: nextId("tl"),
              gameTime: newTime,
              type: "lab_result" as TimelineEntry["type"],
              content: `📊 Lab 回報：${order.definition.name}\n${resultLines}`,
              sender: "system",
              isImportant: true,
            });

            const nurseName = scenario.nurseProfile.name ?? "護理師";
            firedEntries.push({
              id: nextId("tl"),
              gameTime: newTime,
              type: "nurse_message",
              content: `${nurseName}：醫師，${labData.orderName ?? order.definition.name} 結果出來了。`,
              sender: "nurse",
            });
          }
        }
      } else if (ev.type === "vitals_change" || ev.type === "escalation" || ev.type === "chest_tube_change") {
        const scriptData = ev.data as ScriptedEventData;
        const rawContent = scriptData?.message ?? scriptData?.content ?? "";
        // vitals_change without message = silent update (no timeline entry)
        if (rawContent) {
          firedEntries.push({
            id: nextId("tl"),
            gameTime: newTime,
            type: ev.type === "escalation" ? "nurse_message" : "system_event",
            content: interpolateVitals(rawContent),
            sender: ev.type === "escalation" ? "nurse" : "system",
            isImportant: true,
          });
        }
      } else if (ev.type === "nurse_call") {
        const nurseData = ev.data as ScriptedEventData;
        const rawContent = nurseData?.message ?? `護理師：有事情需要你注意。`;
        const nurseName = scenario?.nurseProfile?.name ?? "護理師";
        const content = rawContent.startsWith(nurseName) ? rawContent : `${nurseName}：${rawContent}`;
        firedEntries.push({
          id: nextId("tl"),
          gameTime: newTime,
          type: "nurse_message",
          content: interpolateVitals(content),
          sender: "nurse",
          isImportant: true,
        });
      } else if (ev.type === "senior_arrives") {
        const seniorData = ev.data as ScriptedEventData;
        const content = seniorData?.message ?? "（學長到場）";
        firedEntries.push({
          id: nextId("tl"),
          gameTime: newTime,
          type: "nurse_message",
          content: interpolateVitals(content),
          sender: "senior",
          isImportant: true,
        });
      }
    }

    // Only add time marker when events actually fire
    const newEntries: TimelineEntry[] = [];
    if (firedEntries.length > 0) {
      newEntries.push({
        id: nextId("tl"),
        gameTime: newTime,
        type: "system_event",
        content: `⏰ ${formatGameTime(newTime, clock.startHour)}`,
        sender: "system",
      });
      newEntries.push(...firedEntries);
    }

    set((state) => ({
      clock: updatedClock,
      pendingEvents: updatedPending,
      firedEvents: [...state.firedEvents, ...newlyFired],
      timeline: newEntries.length > 0 ? [...state.timeline, ...newEntries] : state.timeline,
    }));

    // 處理 order_effect 事件 — 藥物/輸血生效
    for (const ev of toFire) {
      if (ev.type === "order_effect") {
        const nurseName = get().scenario?.nurseProfile?.name ?? "護理師";
        const effectData = ev.data as OrderEffectData;

        if (effectData?.isMTP) {
          // MTP round effect
          const mtpEffect = getMTPRoundEffect(newTime);
          get().addActiveEffect(mtpEffect);
          set((state) => ({
            mtpState: {
              ...state.mtpState,
              roundsDelivered: state.mtpState.roundsDelivered + 1,
            },
            timeline: [
              ...state.timeline,
              {
                id: nextId("tl"),
                gameTime: newTime,
                type: "nurse_message" as TimelineEntry["type"],
                content: `${nurseName}：MTP Round ${(effectData.mtpRound ?? 1)} 血品到了！pRBC 2U + FFP 2U + Plt 1 dose 開始輸注。`,
                sender: "nurse" as const,
                isImportant: true,
              },
            ],
          }));

          // Schedule next MTP round (15 min intervals) — up to 4 rounds max
          const currentRound = get().mtpState.roundsDelivered;
          if (currentRound < 4) {
            set((state) => ({
              pendingEvents: [
                ...state.pendingEvents,
                {
                  id: nextId("evt"),
                  type: "order_effect" as PendingEvent["type"],
                  triggerAt: newTime + 15,
                  data: { isMTP: true, mtpRound: currentRound + 1 } as OrderEffectData,
                  fired: false,
                  priority: 0,
                },
              ],
            }));
          }
        } else if (effectData?.orderId) {
          const order = get().placedOrders.find((o) => o.id === effectData.orderId);
          if (order) {
            const weight = get().scenario?.patient?.weight ?? 70;
            const effect = getOrderEffect(order, weight, get().patient?.pathology);
            if (effect) {
              get().addActiveEffect(effect);
              // 更新 order 狀態為 in_progress
              get().updateOrderStatus(effectData.orderId, "in_progress");
              // 護理師確認藥物生效
              set((state) => ({
                timeline: [
                  ...state.timeline,
                  {
                    id: nextId("tl"),
                    gameTime: newTime,
                    type: "nurse_message" as TimelineEntry["type"],
                    content: `${nurseName}：${order.definition.name} 已開始作用了。`,
                    sender: "nurse" as const,
                  },
                ],
              }));
            }
          }
        }
      }
    }

    // 把觸發的事件記錄到 playerActions（供 score-engine 分析）
    if (toFire.length > 0) {
      const trackedActions: TrackedAction[] = toFire.map((e) => ({
        action: `event_fired:${e.id}:${e.type}`,
        gameTime: get().clock.currentTime,
      }));
      set((state) => ({
        playerActions: [...state.playerActions, ...trackedActions],
      }));
    }
  },

  // ----------------------------------------------------------
  // placeOrder
  // ----------------------------------------------------------
  placeOrder: (params: PlaceOrderParams): PlaceOrderResult => {
    const { placedOrders, clock, phase, timeline, playerActions } = get();
    if (phase !== "playing") {
      return { success: false, orderId: null, rejected: true, rejectMessage: "遊戲尚未開始" };
    }

    // Guard rail 驗證
    const guardResult = validateOrderGuardRail(params.definition, params.dose);
    if (guardResult.rejected) {
      // 加入 timeline 提示
      const rejectEntry: TimelineEntry = {
        id: nextId("tl"),
        gameTime: clock.currentTime,
        type: "nurse_message",
        content: guardResult.rejectMessage ?? "醫師，這個 order 無法執行。",
        sender: "nurse",
        isImportant: true,
      };
      set({ timeline: [...timeline, rejectEntry] });
      return {
        success: false,
        orderId: null,
        rejected: true,
        rejectMessage: guardResult.rejectMessage,
      };
    }

    const orderId = nextId("order");
    const resultAvailableAt = params.definition.timeToResult
      ? clock.currentTime + params.definition.timeToResult
      : params.definition.timeToEffect
      ? clock.currentTime + params.definition.timeToEffect
      : undefined;

    const newOrder: PlacedOrder = {
      id: orderId,
      definition: params.definition,
      dose: params.dose,
      frequency: params.frequency,
      placedAt: clock.currentTime,
      status: "pending",
      resultAvailableAt,
      warning: guardResult.warning,
    };

    // 如果有 timeToResult，排入 lab result 事件
    const newEvents: PendingEvent[] = [];
    if (params.definition.timeToResult !== undefined) {
      newEvents.push({
        id: nextId("ev"),
        triggerAt: clock.currentTime + params.definition.timeToResult,
        type: "lab_result",
        data: { orderId, orderName: params.definition.name } as LabResultData,
        fired: false,
        priority: 1,
      });
    }

    // 如果有 effect（藥物/輸血），排入 order_effect 事件
    if (params.definition.effect) {
      const timeToEffect = params.definition.timeToEffect ?? 1;
      newEvents.push({
        id: nextId("ev"),
        triggerAt: clock.currentTime + timeToEffect,
        type: "order_effect",
        data: { orderId } as OrderEffectData,
        fired: false,
        priority: 1,
      });
    }

    // Order 下達的 timeline 條目
    const orderEntry: TimelineEntry = {
      id: nextId("tl"),
      gameTime: clock.currentTime,
      type: "order_placed",
      content: `📋 開了：${params.definition.name} ${params.dose}${params.definition.unit} ${params.frequency}`,
      sender: "player",
    };

    // 護理師確認
    const nurseConfirmEntry: TimelineEntry = {
      id: nextId("tl"),
      gameTime: clock.currentTime,
      type: "nurse_message",
      content: `${get().scenario?.nurseProfile.name ?? "護理師"}：收到，馬上準備。`,
      sender: "nurse",
    };

    const actionLabel = `order:${params.definition.category}:${params.definition.name}:${params.dose}`;

    set((state) => ({
      placedOrders: [...state.placedOrders, newOrder],
      pendingEvents: [...state.pendingEvents, ...newEvents],
      timeline: [...state.timeline, orderEntry, nurseConfirmEntry],
      playerActions: [...state.playerActions, { action: actionLabel, gameTime: clock.currentTime, category: params.definition.category }],
    }));

    // Placing an order takes ~1 game-minute
    get().actionAdvance(1);

    return {
      success: true,
      orderId,
      warning: guardResult.warning,
    };
  },

  // ----------------------------------------------------------
  // activateMTP
  // ----------------------------------------------------------
  activateMTP: () => {
    const { mtpState, clock, scenario, phase } = get();
    if (mtpState.activated || phase !== "playing") return;

    const activatedAt = clock.currentTime;

    // 排入血品送達事件（每 round 15 分鐘）— 使用 order_effect type 讓 advanceTime 自動套用 effect
    const bloodDeliveryEvent: PendingEvent = {
      id: nextId("ev_mtp"),
      triggerAt: activatedAt + 15,
      type: "order_effect",
      data: {
        isMTP: true,
        mtpRound: 1,
        products: { prbc: 2, ffp: 2, platelet: 1 },
      } as OrderEffectData,
      fired: false,
      priority: 0,
    };

    const mtpEntry: TimelineEntry = {
      id: nextId("tl"),
      gameTime: activatedAt,
      type: "player_action",
      content: "🚨 啟動大量輸血 Protocol（MTP）— pRBC : FFP : Plt = 1:1:1",
      sender: "player",
      isImportant: true,
    };

    const nurseEntry: TimelineEntry = {
      id: nextId("tl"),
      gameTime: activatedAt,
      type: "nurse_message",
      content: `${scenario?.nurseProfile.name ?? "護理師"}：了解，立刻聯絡血庫，預計 15 分鐘內第一批血品會到。`,
      sender: "nurse",
      isImportant: true,
    };

    set((state) => ({
      mtpState: {
        activated: true,
        activatedAt,
        roundsDelivered: 0,
      },
      pendingEvents: [...state.pendingEvents, bloodDeliveryEvent],
      timeline: [...state.timeline, mtpEntry, nurseEntry],
      playerActions: [...state.playerActions, { action: "mtp:activated", gameTime: activatedAt, category: "mtp" }],
    }));
  },

  // ----------------------------------------------------------
  // addTimelineEntry
  // ----------------------------------------------------------
  addTimelineEntry: (entry: Omit<TimelineEntry, "id">) => {
    const newEntry: TimelineEntry = {
      id: nextId("tl"),
      ...entry,
    };
    set((state) => ({
      timeline: [...state.timeline, newEntry],
    }));
  },

  // ----------------------------------------------------------
  // actionAdvance — advance time + trigger events (patient update done by useGameTick)
  // Called by modals/actions to simulate time passing during an action.
  // ----------------------------------------------------------
  actionAdvance: (minutes: number) => {
    if (minutes <= 0) return;
    get().advanceTime(minutes);
    // Patient update is handled by the component-level tickPatient via window.__tickPatient
    const tick = (window as unknown as Record<string, unknown>).__tickPatient;
    if (typeof tick === "function") {
      (tick as (m: number) => void)(minutes);
    }
  },

  // ----------------------------------------------------------
  // updateVitals
  // ----------------------------------------------------------
  updateVitals: (changes: Partial<VitalSigns>) => {
    set((state) => {
      if (!state.patient) return state;
      const newVitals = { ...state.patient.vitals, ...changes };
      // 更新 temperature 到 patient 頂層
      const newPatient = {
        ...state.patient,
        vitals: newVitals,
      };
      return { patient: newPatient };
    });
  },

  // ----------------------------------------------------------
  // updateChestTube
  // ----------------------------------------------------------
  updateChestTube: (changes: Partial<ChestTubeState>) => {
    set((state) => {
      if (!state.patient) return state;
      const newChestTube = { ...state.patient.chestTube, ...changes };

      // 同步更新 I/O balance（CT output 部分）
      const ctOutputDiff =
        (changes.totalOutput ?? state.patient.chestTube.totalOutput) -
        state.patient.chestTube.totalOutput;
      const io = state.patient.ioBalance;
      const newIO: IOBalance = {
        ...io,
        totalOutput: io.totalOutput + ctOutputDiff,
        netBalance: io.totalInput - (io.totalOutput + ctOutputDiff),
        breakdown: {
          ...io.breakdown,
          output: {
            ...io.breakdown.output,
            chestTube: io.breakdown.output.chestTube + ctOutputDiff,
          },
        },
      };

      return {
        patient: {
          ...state.patient,
          chestTube: newChestTube,
          ioBalance: newIO,
        },
      };
    });
  },

  // ----------------------------------------------------------
  // sendMessage
  // ----------------------------------------------------------
  sendMessage: (text: string) => {
    const { clock, phase } = get();
    if (phase !== "playing") return;

    const playerEntry: TimelineEntry = {
      id: nextId("tl"),
      gameTime: clock.currentTime,
      type: "player_message",
      content: text,
      sender: "player",
    };

    set((state) => ({
      timeline: [...state.timeline, playerEntry],
      playerActions: [...state.playerActions, { action: `message:${text.slice(0, 50)}`, gameTime: clock.currentTime, category: "message" }],
    }));

    // Talking to nurse takes ~1 game-minute
    get().actionAdvance(1);
  },

  // ----------------------------------------------------------
  // openModal / closeModal
  // ----------------------------------------------------------
  openModal: (type: Exclude<ModalType, null>) => {
    set({ activeModal: type });
  },

  closeModal: () => {
    set({ activeModal: null });
  },

  // ----------------------------------------------------------
  // usePauseThink
  // ----------------------------------------------------------
  usePauseThink: () => {
    const { phase, clock, pauseThinkUsed } = get();
    if (phase !== "playing") return;

    const entry: TimelineEntry = {
      id: nextId("tl"),
      gameTime: clock.currentTime,
      type: "player_action",
      content: "⏸ 暫停思考：系統性評估中...",
      sender: "player",
    };

    set((state) => ({
      pauseThinkUsed: true,
      hintsUsed: pauseThinkUsed ? state.hintsUsed : state.hintsUsed, // 暫停思考不算 hint
      timeline: [...state.timeline, entry],
      playerActions: [...state.playerActions, { action: "pause_think:used", gameTime: clock.currentTime }],
    }));
  },

  // ----------------------------------------------------------
  // submitSBAR
  // ----------------------------------------------------------
  submitSBAR: (report: Record<string, string>) => {
    const { clock } = get();

    const entry: TimelineEntry = {
      id: nextId("tl"),
      gameTime: clock.currentTime,
      type: "player_action",
      content: "📝 提交 SBAR 交班報告",
      sender: "player",
      isImportant: true,
    };

    set((state) => ({
      sbarReport: report,
      phase: "sbar",
      timeline: [...state.timeline, entry],
      playerActions: [...state.playerActions, { action: "sbar:submitted", gameTime: get().clock.currentTime }],
      activeModal: null,
    }));
  },

  // ----------------------------------------------------------
  // endGame
  // ----------------------------------------------------------
  endGame: () => {
    const state = get();
    if (state.phase === "debrief") return;
    // Allow transition from death phase to debrief

    // 停止時鐘
    const finalClock: GameClock = { ...state.clock, isPaused: true };

    // 計算分數（不 import score-engine，用 store 內的 helper）
    const score = computeBasicScore({
      ...state,
      clock: finalClock,
    });

    const debriefEntry: TimelineEntry = {
      id: nextId("tl"),
      gameTime: finalClock.currentTime,
      type: "system_event",
      content: "🏁 情境結束 — 進入 Debrief",
      sender: "system",
      isImportant: true,
    };

    set((s) => ({
      phase: "debrief",
      clock: finalClock,
      score,
      timeline: [...s.timeline, debriefEntry],
      activeModal: null,
    }));
  },

  // ----------------------------------------------------------
  // triggerDeath (with rescue window interception for Standard)
  // ----------------------------------------------------------
  triggerDeath: (cause: string) => {
    const state = get();
    if (state.phase !== "playing") return;

    // Standard mode: intercept death → activate rescue window instead
    if (state.difficulty !== "pro" && state.difficultyConfig.rescueWindowSeconds && !state.rescueState) {
      const rescueState: RescueState = {
        active: true,
        startedAt: state.clock.currentTime,
        expiresAt: state.clock.currentTime + (state.difficultyConfig.rescueWindowSeconds / 60),
        remainingSeconds: state.difficultyConfig.rescueWindowSeconds,
        requiredActions: [],
        cause,
      };

      // Try to get scenario-specific rescue config
      const scenarioId = state.scenario?.id ?? "";
      const activation = checkRescueActivation(
        state.patient!.vitals,
        state.patient!.severity,
        state.difficultyConfig,
        scenarioId,
        state.clock.currentTime,
      );
      if (activation) {
        rescueState.requiredActions = activation.requiredActions;
        rescueState.cause = activation.cause;
      }

      const nurseName = state.scenario?.nurseProfile?.name ?? "護理師";
      const rescueEntry: TimelineEntry = {
        id: nextId("tl"),
        gameTime: state.clock.currentTime,
        type: "nurse_message",
        content: `${nurseName}：醫師！病人快不行了！趕快處理！`,
        sender: "nurse",
        isImportant: true,
      };

      set((s) => ({
        rescueState,
        timeline: [...s.timeline, rescueEntry],
      }));
      return;
    }

    // Already in rescue window and it expired → actual death
    // Or Pro mode → direct death
    const finalClock: GameClock = { ...state.clock, isPaused: true };

    const deathEntry: TimelineEntry = {
      id: nextId("tl"),
      gameTime: finalClock.currentTime,
      type: "system_event",
      content: "💀 病人死亡 — " + cause,
      sender: "system",
      isImportant: true,
    };

    set((s) => ({
      phase: "death",
      clock: finalClock,
      deathCause: cause,
      rescueState: null,
      timeline: [...s.timeline, deathEntry],
      activeModal: null,
    }));
  },

  // ----------------------------------------------------------
  // setRescueState
  // ----------------------------------------------------------
  setRescueState: (rescueState: RescueState | null) => {
    set({ rescueState });
  },

  // ----------------------------------------------------------
  // tickRescueCountdown
  // ----------------------------------------------------------
  tickRescueCountdown: () => {
    const state = get();
    if (!state.rescueState?.active) return;

    // Check if player took a rescue action
    const rescued = evaluateRescueActions(
      state.playerActions,
      state.rescueState.startedAt,
      state.rescueState.requiredActions,
    );

    if (rescued) {
      // Stabilize patient
      const nurseName = state.scenario?.nurseProfile?.name ?? "護理師";
      const stabilizeEntry: TimelineEntry = {
        id: nextId("tl"),
        gameTime: state.clock.currentTime,
        type: "nurse_message",
        content: `${nurseName}：好險！穩住了！`,
        sender: "nurse",
        isImportant: true,
      };

      // Reduce severity and stabilize vitals
      const pathology = state.patient?.pathology ?? "surgical_bleeding";
      const safeVitals = getRescueStabilizeValues(pathology);
      const currentPatient = state.patient;
      if (currentPatient) {
        const stabilizedVitals = { ...currentPatient.vitals, ...safeVitals };
        const newSeverity = Math.min(currentPatient.severity, 60); // cap severity down

        set((s) => ({
          rescueState: null,
          patient: {
            ...currentPatient,
            vitals: stabilizedVitals,
            severity: newSeverity,
          },
          timeline: [...s.timeline, stabilizeEntry],
        }));
      } else {
        set((s) => ({
          rescueState: null,
          timeline: [...s.timeline, stabilizeEntry],
        }));
      }
      return;
    }

    // Decrement countdown
    const remaining = state.rescueState.remainingSeconds - 1;
    if (remaining <= 0) {
      // Rescue window expired → actual death
      set({ rescueState: null });
      get().triggerDeath(state.rescueState.cause);
      return;
    }

    set({
      rescueState: {
        ...state.rescueState,
        remainingSeconds: remaining,
      },
    });
  },

  // ----------------------------------------------------------
  // resetGame
  // ----------------------------------------------------------
  resetGame: () => {
    set({
      ...initialState,
      // 保留 scenario 讓使用者可以直接 restart
      scenario: get().scenario,
    });
  },

  // ----------------------------------------------------------
  // Engine Dispatch Setters
  // ----------------------------------------------------------

  addPendingEvent: (event: PendingEvent) => {
    set((state) => ({
      pendingEvents: [...state.pendingEvents, event],
    }));
  },

  setPendingEvents: (events: PendingEvent[]) => {
    set({ pendingEvents: events });
  },

  fireEvent: (eventId: string) => {
    set((state) => {
      const event = state.pendingEvents.find((e) => e.id === eventId);
      if (!event) return state;
      const updatedPending = state.pendingEvents.map((e) =>
        e.id === eventId ? { ...e, fired: true } : e
      );
      return {
        pendingEvents: updatedPending,
        firedEvents: [...state.firedEvents, { ...event, fired: true }],
      };
    });
  },

  updatePatientSeverity: (severity: number) => {
    set((state) => {
      if (!state.patient) return state;
      return { patient: { ...state.patient, severity } };
    });
  },

  addActiveEffect: (effect: ActiveEffect) => {
    set((state) => {
      if (!state.patient) return state;
      return {
        patient: {
          ...state.patient,
          activeEffects: [...state.patient.activeEffects, effect],
        },
      };
    });
  },

  removeActiveEffect: (effectId: string) => {
    set((state) => {
      if (!state.patient) return state;
      return {
        patient: {
          ...state.patient,
          activeEffects: state.patient.activeEffects.filter(
            (e) => e.id !== effectId
          ),
        },
      };
    });
  },

  updateLethalTriad: (triad: Partial<LethalTriadState>) => {
    set((state) => {
      if (!state.patient) return state;
      const newTriad = { ...state.patient.lethalTriad, ...triad };
      // 重新計算 count
      newTriad.count = [
        newTriad.hypothermia,
        newTriad.acidosis,
        newTriad.coagulopathy,
      ].filter(Boolean).length;
      return { patient: { ...state.patient, lethalTriad: newTriad } };
    });
  },

  updateIOBalance: (changes: Partial<IOBalance>) => {
    set((state) => {
      if (!state.patient) return state;
      const current = state.patient.ioBalance;

      // 合併 breakdown
      const newBreakdown = changes.breakdown
        ? {
            input: {
              ...current.breakdown.input,
              ...(changes.breakdown.input ?? {}),
            },
            output: {
              ...current.breakdown.output,
              ...(changes.breakdown.output ?? {}),
            },
          }
        : current.breakdown;

      const newTotalInput =
        changes.totalInput ??
        Object.values(newBreakdown.input).reduce((a, b) => a + b, 0);
      const newTotalOutput =
        changes.totalOutput ??
        Object.values(newBreakdown.output).reduce((a, b) => a + b, 0);

      const newIO: IOBalance = {
        totalInput: newTotalInput,
        totalOutput: newTotalOutput,
        netBalance: newTotalInput - newTotalOutput,
        breakdown: newBreakdown,
      };

      return { patient: { ...state.patient, ioBalance: newIO } };
    });
  },

  updateOrderStatus: (orderId: string, status: OrderStatus, result?: unknown) => {
    set((state) => ({
      placedOrders: state.placedOrders.map((o) =>
        o.id === orderId ? { ...o, status, ...(result !== undefined ? { result } : {}) } : o
      ),
    }));
  },

  setScore: (score: GameScore) => {
    set({ score });
  },

  updatePathology: (pathology: Pathology) => {
    set((state) => {
      if (!state.patient) return state;
      return { patient: { ...state.patient, pathology } };
    });
  },

  // ----------------------------------------------------------
  // updateVentilator
  // ----------------------------------------------------------
  updateVentilator: (changes: Partial<VentilatorState>) => {
    set((state) => ({
      ventilator: { ...state.ventilator, ...changes },
      playerActions: [...state.playerActions, {
        action: `vent:${Object.entries(changes).map(([k, v]) => `${k}=${v}`).join(',')}`,
        gameTime: state.clock.currentTime,
        category: 'ventilator',
      }],
    }));
  },

  // ----------------------------------------------------------
  // setGuidanceHighlight
  // ----------------------------------------------------------
  setGuidanceHighlight: (key: string | null) => {
    set({ guidanceHighlight: key });
  },

  // ----------------------------------------------------------
  // checkGuidance — compute which button to highlight
  // ----------------------------------------------------------
  checkGuidance: () => {
    const { guidanceMode, playerActions, patient } = get();
    if (!guidanceMode) return;

    const severity = patient?.severity ?? 0;

    // Check what actions have been done
    const hasPE = playerActions.some((pa) => pa.action.startsWith("pe:") || pa.action.includes("pe_done") || pa.action.includes("order:physical_exam") || pa.action.includes("open_pe"));
    const hasLab = playerActions.some((pa) => pa.action.startsWith("order:lab") || pa.action.includes("lab_order") || pa.action.includes("order:lab_panel"));
    const hasTreatment = playerActions.some(
      (pa) => pa.action.startsWith("order:medication") || pa.action.startsWith("order:transfusion") || pa.action.startsWith("order:fluid") || pa.action.includes("mtp:activated")
    );
    const hasCalled = playerActions.some(
      (pa) => pa.action.includes("consult") || pa.action.includes("叫學長") || pa.action.includes("通知VS") || pa.action.includes("call_senior")
    );

    let highlight: string | null = null;

    if (severity > 80) {
      highlight = "sbar";
    } else if (severity > 60 && !hasCalled) {
      highlight = "consult";
    } else if (hasPE && hasLab && !hasTreatment) {
      highlight = "order";
    } else if (hasPE && !hasLab) {
      highlight = "lab_order";
    } else if (!hasPE) {
      highlight = "pe";
    }

    set({ guidanceHighlight: highlight });
  },

  // ----------------------------------------------------------
  // useHint — 使用提示（最多 3 次）
  // ----------------------------------------------------------
  useHint: () => {
    const { phase, hintsUsed, scenario, playerActions, clock } = get();
    if (phase !== "playing" || hintsUsed >= 3 || !scenario) return;

    // 用 scoring 邏輯找第一個未完成的 critical action
    const ACTION_PATTERNS: Record<string, RegExp> = {
      "act-blood-culture": /order:lab:.*blood.?culture|lab:.*blood.?culture/i,
      "act-antibiotics": /order:medication:.*(?:vancomycin|piptazo|ceftriaxone|pip.*tazo|meropenem|cefepime)/i,
      "act-fluid-resuscitation": /order:fluid:.*(?:ns|lr|normal.?saline|lactated|albumin)|order:transfusion|mtp:activated/i,
      "act-lactate": /order:lab:.*(?:lactate|abg|blood.?gas)/i,
      "act-vasopressor": /order:medication:.*(?:norepinephrine|levophed|epinephrine|vasopressin)/i,
      "act-call-senior": /consult:.*senior|consult:.*vs|call_senior|call_vs|message:.*叫學長|message:.*通知/i,
      "act-wound-culture": /order:lab:.*wound.?culture|order:lab:.*swab/i,
      "act-foley": /order:procedure:.*foley|order:procedure:.*catheter/i,
      "act-central-line": /order:procedure:.*central.?line|order:procedure:.*cvc/i,
      "act-abg": /order:lab:.*abg|order:lab:.*blood.?gas/i,
      "act-check-ct": /pocus:.*|order:imaging:.*cxr|order:lab:.*cbc/i,
      "act-protamine": /order:.*protamine/i,
      "act-txa": /order:.*txa|order:.*tranexamic/i,
      "act-mtp": /mtp:activated/i,
      "act-pericardiocentesis": /order:procedure:.*pericardio/i,
      "act-echo": /pocus:cardiac/i,
      "act-vent-fio2-increase": /vent:.*fio2=/i,
      "act-vent-peep-increase": /vent:.*peep=/i,
      "act-vent-fio2-adjust": /vent:.*fio2=/i,
      "act-vent-peep-adjust": /vent:.*peep=/i,
      "act-vent-maintain": /vent:/i,
    };

    const unmetAction = scenario.expectedActions.find((expected) => {
      if (!expected.critical) return false;
      const pattern = ACTION_PATTERNS[expected.id];
      const matched = pattern
        ? playerActions.some((pa) => pattern.test(pa.action))
        : playerActions.some((pa) => pa.action.toLowerCase().includes(expected.action.toLowerCase()));
      return !matched;
    });

    if (!unmetAction) return;

    const hintEntry: Omit<TimelineEntry, "id"> = {
      gameTime: clock.currentTime,
      type: "hint",
      content: `💡 提示：${unmetAction.hint}`,
      sender: "system",
      isImportant: true,
    };

    set((state) => ({
      hintsUsed: state.hintsUsed + 1,
      timeline: [...state.timeline, { id: nextId("tl"), ...hintEntry }],
      playerActions: [...state.playerActions, { action: `hint:${unmetAction.id}`, gameTime: clock.currentTime }],
    }));
  },

  // ----------------------------------------------------------
  // Defibrillator actions
  // ----------------------------------------------------------
  setDefibrillatorEnergy: (energy: number) => {
    set((state) => ({
      defibrillator: { ...state.defibrillator, energy },
    }));
  },

  setDefibrillatorMode: (mode: "sync" | "async") => {
    set((state) => ({
      defibrillator: { ...state.defibrillator, mode },
    }));
  },

  deliverShock: (): ShockResult => {
    const { phase, patient, clock, defibrillator } = get();
    if (phase !== "playing" || !patient) {
      return { success: false, message: "無法在此狀態下電擊" };
    }

    const rhythm = patient.vitals.rhythmStrip;
    const { energy, mode } = defibrillator;

    // Record action
    const actionLabel = `acls:shock:${energy}J:${mode}`;
    const shockEntry: Omit<TimelineEntry, "id"> = {
      gameTime: clock.currentTime,
      type: "player_action",
      sender: "player",
      isImportant: true,
      content: "",
    };

    // Determine outcome based on rhythm
    let result: ShockResult;
    if (rhythm === "vf" || rhythm === "vt_pulseless") {
      // Async shock — appropriate for VF/pulseless VT
      result = { success: true, message: "電擊成功 — 節律恢復中" };
      shockEntry.content = `⚡ 電擊 ${energy}J（${mode === "sync" ? "同步" : "非同步"}）— VF/VT 電擊後觀察節律`;
    } else if (rhythm === "vt_pulse") {
      // Sync cardioversion for VT with pulse
      if (mode === "sync") {
        result = { success: true, message: "同步電擊成功 — VT 轉為竇性節律" };
        shockEntry.content = `⚡ 同步電擊 ${energy}J — VT with pulse → 節律轉換中`;
      } else {
        result = { success: true, message: "非同步電擊 — 注意：VT with pulse 建議使用同步模式" };
        shockEntry.content = `⚡ 非同步電擊 ${energy}J — VT with pulse（⚠ 建議同步模式）`;
      }
    } else if (rhythm === "asystole" || rhythm === "pea") {
      result = { success: false, message: "不適合電擊 — Asystole/PEA 為不可電擊節律" };
      shockEntry.content = `⚡ 嘗試電擊 ${energy}J — ⚠ ${rhythm === "asystole" ? "Asystole" : "PEA"} 不可電擊`;
    } else {
      result = { success: false, message: `目前節律（${rhythm}）不需要電擊` };
      shockEntry.content = `⚡ 嘗試電擊 ${energy}J — 目前節律不需電擊`;
    }

    set((state) => ({
      defibrillator: { ...state.defibrillator, lastShockAt: clock.currentTime },
      timeline: [...state.timeline, { id: nextId("tl"), ...shockEntry }],
      playerActions: [...state.playerActions, { action: actionLabel, gameTime: clock.currentTime, category: "acls" }],
    }));

    // Advance 1 minute for the procedure
    get().actionAdvance(1);

    return result;
  },
}));
