/**
 * Emergency slice — 心跳停止 / 死亡 / Rescue window / Senior presence / ROSC
 *（從 store.ts 機械搬移，零行為改變）
 */

import { severityToRhythm } from "@/lib/simulator/engine/phase-engine";
import {
  checkRescueActivation,
  evaluateRescueActions,
  getRescueStabilizeValues,
} from "@/lib/simulator/engine/rescue-engine";
import type {
  GameClock,
  TimelineEntry,
  RescueState,
  SeniorPresence,
} from "../types";
import { buildRhythmContext, nextId } from "./helpers";
import type { ProGameStore, StoreSlice } from "./types";

export type EmergencySlice = Pick<
  ProGameStore,
  | "triggerCardiacArrest"
  | "triggerDeath"
  | "setRescueState"
  | "setSeniorPresence"
  | "tickRescueCountdown"
  | "notifyRosc"
>;

export const createEmergencySlice: StoreSlice<EmergencySlice> = (set, get) => ({
  // ----------------------------------------------------------
  // triggerCardiacArrest — sets arrest vitals so ACLSModal takes over
  // Death only happens via ACLS termination (20 min or player choice)
  // ----------------------------------------------------------
  triggerCardiacArrest: (cause: string) => {
    const state = get();
    if (state.phase !== "playing" || !state.patient) return;

    // Guard: already in arrest (hr === 0 or arrest rhythm) → skip
    const currentRhythm = state.patient.vitals.rhythmStrip;
    const arrestRhythms = ["vf", "vt_pulseless", "pea", "asystole"];
    if (state.patient.vitals.hr === 0 || arrestRhythms.includes(currentRhythm)) {
      return; // ACLS is already handling this
    }

    // Guard: ROSC grace period — prevent immediate re-arrest after ROSC
    if (state.roscGraceUntil && state.clock.currentTime < state.roscGraceUntil) {
      return;
    }

    // Determine arrest rhythm from severity via severityToRhythm
    const severity = state.patient.severity ?? 0;
    const rhythmCtx = buildRhythmContext(state);
    let arrestRhythm = severityToRhythm(severity, rhythmCtx);
    // If severityToRhythm returns a non-arrest rhythm (e.g. severity < 80),
    // force PEA as the default arrest rhythm
    if (!arrestRhythms.includes(arrestRhythm)) {
      arrestRhythm = "pea";
    }

    const nurseName = state.scenario?.nurseProfile?.name ?? "護理師";
    const arrestEntry: TimelineEntry = {
      id: nextId("tl"),
      gameTime: state.clock.currentTime,
      type: "system_event",
      content: `⚠️ CARDIAC ARREST — ${cause}`,
      sender: "system",
      isImportant: true,
    };
    const nurseEntry: TimelineEntry = {
      id: nextId("tl"),
      gameTime: state.clock.currentTime,
      type: "nurse_message",
      content: `${nurseName}：醫師！病人沒有脈搏了！心跳停止！`,
      sender: "nurse",
      isImportant: true,
    };

    set((s) => ({
      patient: s.patient
        ? {
            ...s.patient,
            vitals: {
              ...s.patient.vitals,
              hr: 0,
              sbp: 0,
              dbp: 0,
              map: 0,
              rhythmStrip: arrestRhythm,
            },
          }
        : s.patient,
      timeline: [...s.timeline, arrestEntry, nurseEntry],
    }));

    // If senior is prepping OR → auto rush back (nurse notifies)
    if (get().seniorPresence === "left_for_or") {
      set({ seniorPresence: "rushing_back" as SeniorPresence });
      get().addPendingEvent({
        id: `ev_senior_rushback_${Date.now()}`,
        triggerAt: state.clock.currentTime + 2, // 2 game-min
        type: "senior_rushback",
        data: { message: "（學長從 OR 衝回來）" },
        fired: false,
        priority: 0,
      });
      get().addTimelineEntry({
        gameTime: state.clock.currentTime,
        type: "system_event",
        content: "⚠️ 護理師緊急通知學長——學長從 OR 趕回來中（約 2 分鐘）",
        sender: "nurse",
        isImportant: true,
      });
    }
  },

  // ----------------------------------------------------------
  // triggerDeath (with rescue window interception for Standard)
  // ----------------------------------------------------------
  triggerDeath: (cause: string) => {
    const state = get();
    if (state.phase !== "playing") return;

    // Standard mode: intercept death → activate rescue window instead
    // Limit to 2 rescue attempts to prevent infinite rescue loops
    const maxRescues = 2;
    if (state.difficulty !== "pro" && state.difficultyConfig.rescueWindowSeconds && !state.rescueState && state.rescueCount < maxRescues) {
      const rescueState: RescueState = {
        active: true,
        startedAt: state.clock.currentTime,
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

  setSeniorPresence: (seniorPresence: SeniorPresence) => {
    set({ seniorPresence });
  },

  // ----------------------------------------------------------
  // tickRescueCountdown
  // ----------------------------------------------------------
  tickRescueCountdown: () => {
    const state = get();
    if (!state.rescueState?.active) return;
    if (state.phase !== "playing") return;

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
          rescueCount: s.rescueCount + 1,
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
          rescueCount: s.rescueCount + 1,
          timeline: [...s.timeline, stabilizeEntry],
        }));
      }
      return;
    }

    // Decrement countdown
    const remaining = state.rescueState.remainingSeconds - 1;
    if (remaining <= 0) {
      // Rescue window expired → actual death
      const cause = state.rescueState.cause;
      set({ rescueState: null });
      get().triggerDeath(cause);
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
  // notifyRosc — cap severity + set grace period after ROSC
  // Prevents immediate re-arrest loop (severity still high → next tick re-triggers arrest)
  // ----------------------------------------------------------
  notifyRosc: () => {
    const state = get();
    if (!state.patient) return;

    // Cap severity to 70 (below arrest threshold of 80)
    const cappedSeverity = Math.min(state.patient.severity, 70);
    // Grace period: 2 minutes game time — no re-arrest during post-ROSC stabilization
    const graceUntil = state.clock.currentTime + 2;

    set((s) => ({
      roscGraceUntil: graceUntil,
      patient: s.patient
        ? {
            ...s.patient,
            severity: cappedSeverity,
            vitals: {
              ...s.patient.vitals,
              // Restore minimal hemodynamics post-ROSC
              hr: s.patient.vitals.hr === 0 ? 110 : s.patient.vitals.hr,
              sbp: s.patient.vitals.sbp === 0 ? 75 : s.patient.vitals.sbp,
              dbp: s.patient.vitals.dbp === 0 ? 45 : s.patient.vitals.dbp,
              map: s.patient.vitals.map === 0 ? 55 : s.patient.vitals.map,
              rhythmStrip: "sinus_tach",
            },
          }
        : s.patient,
    }));
  },
});
