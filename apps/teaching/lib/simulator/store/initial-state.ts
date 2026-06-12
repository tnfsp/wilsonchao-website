/**
 * Store 初始狀態與難度設定（從 store.ts 機械搬移，零行為改變）
 */

import { createNurseTriggerState } from "@/lib/simulator/engine/nurse-trigger-engine";
import type { NurseTrigger } from "@/lib/simulator/engine/nurse-trigger-engine";
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
  VentilatorState,
  TrackedAction,
  DefibrillatorState,
  DifficultyLevel,
  DifficultyConfig,
  RescueState,
  SeniorPresence,
} from "../types";

export const initialClock: GameClock = {
  currentTime: 0,
  startHour: 2,
  isPaused: true,
  speed: 1,
};

export const initialMTPState: MTPState = {
  activated: false,
  activatedAt: undefined,
  roundsDelivered: 0,
};

export const initialVentilatorState: VentilatorState = {
  mode: 'VC',
  fio2: 0.4,
  peep: 5,
  rrSet: 14,
  tvSet: 500,
  inspPressure: 15,
  psLevel: 10,
  ieRatio: '1:2',
};

export const initialDefibrillatorState: DefibrillatorState = {
  energy: 200,
  mode: "async",
  lastShockAt: null,
};

export const DIFFICULTY_CONFIGS: Record<DifficultyLevel, DifficultyConfig> = {
  lite: {
    canDie: false,
    timeScale: 0,
    hintLimit: Infinity,
    fogLevel: "none",
  },
  standard: {
    canDie: true,
    rescueThreshold: { sbp: 60, hr: 30, spo2: 70 },
    rescueWindowSeconds: 60,
    timeScale: 0.75,
    hintLimit: Infinity,
    fogLevel: "light",
  },
  pro: {
    canDie: true,
    timeScale: 1,
    hintLimit: 3,
    fogLevel: "full",
  },
};

export const initialState = {
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
  hintLoading: false,
  pauseThinkUsed: false,
  sbarReport: null as Record<string, string> | null,
  sbarPhase1: null as Record<string, string> | null,
  score: null as GameScore | null,
  deathCause: null as string | null,
  roscGraceUntil: null as number | null,
  mapBelowThresholdSince: null as number | null,
  rescueState: null as RescueState | null,
  rescueCount: 0,
  seniorPresence: "absent" as SeniorPresence,
  phaseTransitions: [] as PhaseTransition[],
  nurseTriggers: [] as NurseTrigger[],
  nurseTriggerState: createNurseTriggerState(),
  activeModal: null as ModalType,
  _tickPatientFn: null as ((minutes: number) => void) | null,
  ventilator: initialVentilatorState,
  guidanceMode: false,
  guidanceHighlight: null as string | null,
  defibrillator: initialDefibrillatorState,
};
