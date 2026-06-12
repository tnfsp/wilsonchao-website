/**
 * ICU 值班模擬器 Pro — Store 介面定義
 *
 * 從 store.ts 抽出的 ProGameStore interface 與 helper types。
 * 對外仍由 store.ts re-export，元件層 import 路徑不變。
 */

import type { StateCreator } from "zustand";
import type { NurseTrigger, NurseTriggerState } from "@/lib/simulator/engine/nurse-trigger-engine";
import type { PhaseTransition } from "@/lib/simulator/engine/phase-engine";
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
  LethalTriadState,
  IOBalance,
  Pathology,
  OrderStatus,
  VentilatorState,
  TrackedAction,
  DefibrillatorState,
  ShockResult,
  DifficultyLevel,
  DifficultyConfig,
  RescueState,
  SeniorPresence,
} from "../types";

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
  sbarReport: Record<string, string> | null;
  sbarPhase1: Record<string, string> | null;  // Phase 1 SBAR（給學長的報告）

  // Score
  score: GameScore | null;

  // Death
  deathCause: string | null;

  // ROSC grace period — game time until which arrest re-triggering is suppressed
  roscGraceUntil: number | null;

  // MAP-below-threshold tracker for prolonged hypotension detection (VF branch)
  mapBelowThresholdSince: number | null;

  // Rescue Window (Standard mode delayed death)
  rescueState: RescueState | null;
  rescueCount: number; // Track rescue attempts to prevent infinite rescue loops

  // Senior presence state machine
  seniorPresence: SeniorPresence;

  // Phase Transition Engine
  phaseTransitions: PhaseTransition[];

  // Nurse Trigger Engine
  nurseTriggers: NurseTrigger[];
  nurseTriggerState: NurseTriggerState;

  // UI
  activeModal: ModalType;

  // Internal: patient tick function registered by game screen component
  _tickPatientFn: ((minutes: number) => void) | null;

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

  /** 註冊 patient tick 函數（由 GameScreen 元件掛載時設定） */
  registerTickPatient: (fn: ((minutes: number) => void) | null) => void;

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

  /** 觸發心跳停止（進入 ACLS 流程，而非直接死亡） */
  triggerCardiacArrest: (cause: string) => void;

  /** Set rescue window state (Standard mode) */
  setRescueState: (state: RescueState | null) => void;

  /** Set senior presence state */
  setSeniorPresence: (presence: SeniorPresence) => void;

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

  /** Milk chest tube — moved from ChestTubePanel so ActionBar can trigger it */
  milkChestTube: () => void;

  // ---- Hint System ----
  /** 使用提示（最多 3 次），AI 生成 contextual hint */
  hintLoading: boolean;
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

  /** ROSC 通知 — cap severity 並設定 grace period 防止 immediate re-arrest */
  notifyRosc: () => void;
}

// ============================================================
// Helper Types
// ============================================================

export interface PlaceOrderParams {
  definition: OrderDefinition;
  dose: string;
  frequency: string;
  /** Skip the automatic 1-minute time advance (for batch preset orders) */
  skipAdvance?: boolean;
}

export interface PlaceOrderResult {
  success: boolean;
  orderId: string | null;
  warning?: string;
  rejected?: boolean;
  rejectMessage?: string;
}

/** Zustand slice creator typed against the full store */
export type StoreSlice<T> = StateCreator<ProGameStore, [], [], T>;
