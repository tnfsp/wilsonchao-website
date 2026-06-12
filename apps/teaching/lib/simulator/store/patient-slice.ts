/**
 * Patient slice — 病人狀態更新與 engine dispatch setters
 *（從 store.ts 機械搬移，零行為改變）
 */

import { severityToRhythm } from "@/lib/simulator/engine/phase-engine";
import type {
  PendingEvent,
  GameScore,
  VitalSigns,
  ChestTubeState,
  ActiveEffect,
  LethalTriadState,
  IOBalance,
  Pathology,
  OrderStatus,
} from "../types";
import { buildRhythmContext } from "./helpers";
import type { ProGameStore, StoreSlice } from "./types";

export type PatientSlice = Pick<
  ProGameStore,
  | "updateVitals"
  | "updateChestTube"
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
>;

export const createPatientSlice: StoreSlice<PatientSlice> = (set) => ({
  // ----------------------------------------------------------
  // updateVitals
  // ----------------------------------------------------------
  updateVitals: (changes: Partial<VitalSigns>) => {
    set((state) => {
      if (!state.patient) return state;
      const newVitals = { ...state.patient.vitals, ...changes };
      // Track MAP < 40 for prolonged hypotension (VF risk)
      const effectiveMap = changes.map ?? state.patient.vitals.map;
      const newMapTracker = effectiveMap < 40
        ? (state.mapBelowThresholdSince ?? state.clock.currentTime)
        : null;
      const newPatient = {
        ...state.patient,
        vitals: newVitals,
      };
      return { patient: newPatient, mapBelowThresholdSince: newMapTracker };
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
      // I3: Auto-update rhythm based on severity (severity→rhythm→arrest chain)
      const rhythmCtx = buildRhythmContext(state);
      const newRhythm = severityToRhythm(severity, rhythmCtx);

      // Track MAP < 40 duration for prolonged hypotension detection
      const currentMap = state.patient.vitals.map;
      const newMapTracker = currentMap < 40
        ? (state.mapBelowThresholdSince ?? state.clock.currentTime)
        : null;

      return {
        mapBelowThresholdSince: newMapTracker,
        patient: {
          ...state.patient,
          severity,
          vitals: { ...state.patient.vitals, rhythmStrip: newRhythm },
        },
      };
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
});
