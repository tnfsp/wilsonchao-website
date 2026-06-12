/**
 * Lifecycle slice — 情境載入 / 開始 / SBAR 提交 / 結束 / 重置
 *（從 store.ts 機械搬移，零行為改變）
 */

import { resetCtOutputEngine } from "@/lib/simulator/engine/ct-output-engine";
import {
  createNurseTriggerState,
  bleedingToTamponadeNurseTriggers,
} from "@/lib/simulator/engine/nurse-trigger-engine";
import type { NurseTrigger } from "@/lib/simulator/engine/nurse-trigger-engine";
import { createPhaseEngine } from "@/lib/simulator/engine/phase-engine";
import type {
  SimScenario,
  GameClock,
  PatientState,
  PendingEvent,
  TimelineEntry,
  ScriptedEventData,
  DifficultyLevel,
  SeniorPresence,
} from "../types";
import { nextId, resetIdCounter } from "./helpers";
import {
  initialState,
  initialVentilatorState,
  initialDefibrillatorState,
  DIFFICULTY_CONFIGS,
} from "./initial-state";
import { computeBasicScore } from "./scoring";
import type { ProGameStore, StoreSlice } from "./types";

export type LifecycleSlice = Pick<
  ProGameStore,
  "setDifficulty" | "loadScenario" | "startGame" | "submitSBAR" | "endGame" | "resetGame"
>;

export const createLifecycleSlice: StoreSlice<LifecycleSlice> = (set, get) => ({
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
        hintLoading: false,
        pauseThinkUsed: false,
        sbarReport: null,
        score: null,
        deathCause: null,
        roscGraceUntil: null,
        mapBelowThresholdSince: null,
        rescueState: null,
        rescueCount: 0,
        seniorPresence: "absent" as SeniorPresence,
        activeModal: null,
        _tickPatientFn: null,
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
        pathologyChange: e.pathologyChange,
        severitySet: e.severitySet,
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

    // Initialize phase transition engine from scenario config
    const phaseTransitions = createPhaseEngine(scenario);

    // Initialize nurse trigger engine — select triggers based on scenario ID
    const nurseTriggers: NurseTrigger[] = scenario.id.includes("bleeding-to-tamponade")
      ? bleedingToTamponadeNurseTriggers
      : [];
    const nurseTriggerState = createNurseTriggerState();

    // Reset CT output engine for new scenario
    resetCtOutputEngine(scenario.initialChestTube.totalOutput);

    set({
      phase: "playing",
      clock: { ...clock, isPaused: false },
      pendingEvents,
      phaseTransitions,
      nurseTriggers,
      nurseTriggerState,
      timeline: [openingEntry],
      playerActions: [{ action: `game_start:${scenario.id}`, gameTime: 0 }],
    });
  },

  // ----------------------------------------------------------
  // submitSBAR — Phase 1: 報告給學長（不結束）；Phase 2/單phase: 最終交班（結束）
  // ----------------------------------------------------------
  submitSBAR: (report: Record<string, string>) => {
    const { clock, scenario, patient } = get();
    const isMultiPhase = !!scenario?.phasedFindings;
    const isStillPhase1 = isMultiPhase && patient?.pathology === scenario?.pathology;

    if (isStillPhase1) {
      // ── Phase 1: SBAR 是給學長的報告，遊戲繼續 ──
      const entry: TimelineEntry = {
        id: nextId("tl"),
        gameTime: clock.currentTime,
        type: "player_action",
        content: "📝 你向學長報告 SBAR",
        sender: "player",
        isImportant: true,
      };

      // 記錄 Phase 1 SBAR（獨立保存，Phase 2 的 SBAR 存到 sbarReport）
      set((state) => ({
        sbarPhase1: report,
        // phase 不變！遊戲繼續
        timeline: [...state.timeline, entry],
        playerActions: [...state.playerActions, { action: "sbar:submitted:phase1", gameTime: clock.currentTime }],
        activeModal: null,
      }));

      // 排程學長 3 分鐘後到場
      const seniorEvent: PendingEvent = {
        id: `ev_senior_arrives_${Date.now()}`,
        triggerAt: clock.currentTime + 3,
        type: "senior_arrives",
        data: {
          message: "（學長推門進來）「怎麼了，跟我報告一下。」",
        },
        fired: false,
        priority: 0,
      };
      get().addPendingEvent(seniorEvent);

      get().addTimelineEntry({
        gameTime: clock.currentTime,
        type: "system_event",
        content: "⏳ 學長約 3 分鐘後到場",
        sender: "system",
      });
    } else {
      // ── Phase 2 或單 phase: 最終交班，遊戲結束 ──
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
        phase: "outcome",
        timeline: [...state.timeline, entry],
        playerActions: [...state.playerActions, { action: "sbar:submitted", gameTime: clock.currentTime }],
        activeModal: null,
      }));
    }
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
  // resetGame
  // ----------------------------------------------------------
  resetGame: () => {
    resetIdCounter();
    const current = get();
    set({
      ...initialState,
      // 保留 scenario + difficulty 讓使用者可以直接 restart
      scenario: current.scenario,
      difficulty: current.difficulty,
      difficultyConfig: current.difficultyConfig,
    });
  },
});
