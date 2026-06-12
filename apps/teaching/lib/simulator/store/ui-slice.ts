/**
 * UI slice — Timeline / Modal / 訊息 / 暫停思考 / Guidance / Hint
 *（從 store.ts 機械搬移，零行為改變）
 */

import type { TimelineEntry, ModalType, TrackedAction } from "../types";
import { ACTION_PATTERNS } from "./action-patterns";
import { nextId, capTimeline } from "./helpers";
import type { ProGameStore, StoreSlice } from "./types";

export type UiSlice = Pick<
  ProGameStore,
  | "addTimelineEntry"
  | "sendMessage"
  | "openModal"
  | "closeModal"
  | "usePauseThink"
  | "checkGuidance"
  | "setGuidanceHighlight"
  | "useHint"
>;

export const createUiSlice: StoreSlice<UiSlice> = (set, get) => ({
  // ----------------------------------------------------------
  // addTimelineEntry
  // ----------------------------------------------------------
  addTimelineEntry: (entry: Omit<TimelineEntry, "id">) => {
    const newEntry: TimelineEntry = {
      id: nextId("tl"),
      ...entry,
    };
    set((state) => ({
      timeline: capTimeline([...state.timeline, newEntry]),
    }));
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

    // 檢查訊息是否提到正確診斷或手術計畫（用於 prepare-resternotomy 評分）
    const mentionsDiagnosis = /tamponade|心包填塞|pericardial|cardiac.?tamponade|填塞/i.test(text);
    const mentionsSurgery = /resternotomy|re.?sternotomy|開胸|手術|開刀|送\s*OR|通知\s*OR|準備\s*OR|去\s*OR|回\s*OR/i.test(text);
    const mentionsCorrectPlan = mentionsDiagnosis || mentionsSurgery;

    const newActions: TrackedAction[] = [
      { action: `message:${text.slice(0, 50)}`, gameTime: clock.currentTime, category: "message" },
    ];
    if (mentionsCorrectPlan) {
      // 叫學長時有提到診斷或手術計畫
      newActions.push({
        action: "senior_call_correct_plan",
        gameTime: clock.currentTime,
        category: "consult",
      });
    }

    set((state) => ({
      timeline: [...state.timeline, playerEntry],
      playerActions: [...state.playerActions, ...newActions],
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
    const { phase, clock } = get();
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
      timeline: [...state.timeline, entry],
      playerActions: [...state.playerActions, { action: "pause_think:used", gameTime: clock.currentTime }],
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
  // useHint — AI-powered contextual hint (最多 3 次)
  // ----------------------------------------------------------
  useHint: () => {
    const { phase, hintsUsed, scenario, playerActions, clock, hintLoading } = get();
    if (phase !== "playing" || hintsUsed >= get().difficultyConfig.hintLimit || !scenario || hintLoading) return;

    // Find first unmet critical action
    const unmetAction = scenario.expectedActions.find((expected) => {
      if (!expected.critical) return false;
      const pattern = ACTION_PATTERNS[expected.id];
      const matched = pattern
        ? playerActions.some((pa) => pattern.test(pa.action))
        : playerActions.some((pa) => pa.action.toLowerCase().includes(expected.action.toLowerCase()));
      return !matched;
    });

    if (!unmetAction) return;

    // Immediately increment hintsUsed and set loading to prevent double-click
    set({ hintLoading: true, hintsUsed: get().hintsUsed + 1 });

    // Build request body
    const state = get();
    const patient = state.patient;
    const v = patient?.vitals;
    const labOrders = state.placedOrders.filter(
      (o) => o.definition.category === "lab" && o.status === "completed" && o.result
    );
    const labSummaryParts: string[] = [];
    for (const order of labOrders) {
      const results = order.result as Record<string, { value: number | string; flag?: string; unit?: string }>;
      for (const [k, v] of Object.entries(results)) {
        if (v.flag) labSummaryParts.push(`${k}: ${v.value}${v.unit ? " " + v.unit : ""} (${v.flag})`);
      }
    }

    const allExpectedActions = scenario.expectedActions.map((ea) => {
      const pattern = ACTION_PATTERNS[ea.id];
      const met = pattern
        ? playerActions.some((pa) => pattern.test(pa.action))
        : playerActions.some((pa) => pa.action.toLowerCase().includes(ea.action.toLowerCase()));
      return { id: ea.id, description: ea.description, met, critical: ea.critical };
    });

    const recentTimeline = state.timeline.slice(-5).map((t) => `[${t.type}] ${t.content}`);

    const body = {
      unmetAction: {
        id: unmetAction.id,
        description: unmetAction.description,
        hint: unmetAction.hint,
        rationale: unmetAction.rationale,
        howTo: unmetAction.howTo,
      },
      gameState: {
        vitals: v ? { hr: v.hr, sbp: v.sbp, dbp: v.dbp, spo2: v.spo2, rr: v.rr, temperature: v.temperature } : {},
        chestTube: patient?.chestTube ? { currentRate: patient.chestTube.currentRate, totalOutput: patient.chestTube.totalOutput, color: patient.chestTube.color } : undefined,
        elapsedMinutes: clock.currentTime,
        pathology: patient?.pathology ?? "unknown",
      },
      playerActions: playerActions.slice(-10).map((pa) => pa.action),
      recentTimeline,
      labSummary: labSummaryParts.join(", ") || "No labs yet",
      scenarioInfo: {
        correctDiagnosis: scenario.debrief?.correctDiagnosis ?? "",
        patientSummary: `${scenario.patient.age}y ${scenario.patient.sex}, ${scenario.patient.surgery}, POD${scenario.patient.postOpDay}`,
      },
      allExpectedActions,
    };

    // Async fetch — fire-and-forget pattern (store action stays sync)
    fetch("/api/simulator/hint", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(15000),
    })
      .then((res) => res.json())
      .then((data) => {
        const hintText = data.hint || unmetAction.hint;
        const hintEntry: Omit<TimelineEntry, "id"> = {
          gameTime: clock.currentTime,
          type: "hint",
          content: `💡 提示：${hintText}`,
          sender: "system",
          isImportant: true,
        };
        set((s) => ({
          hintLoading: false,
          timeline: [...s.timeline, { id: nextId("tl"), ...hintEntry }],
          playerActions: [...s.playerActions, { action: `hint:${unmetAction.id}`, gameTime: clock.currentTime }],
        }));
      })
      .catch(() => {
        // Fallback to static hint on any failure
        const hintEntry: Omit<TimelineEntry, "id"> = {
          gameTime: clock.currentTime,
          type: "hint",
          content: `💡 提示：${unmetAction.hint}`,
          sender: "system",
          isImportant: true,
        };
        set((s) => ({
          hintLoading: false,
          timeline: [...s.timeline, { id: nextId("tl"), ...hintEntry }],
          playerActions: [...s.playerActions, { action: `hint:${unmetAction.id}`, gameTime: clock.currentTime }],
        }));
      });
  },
});
