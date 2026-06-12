/**
 * Defibrillator slice — ACLS 電擊
 *（從 store.ts 機械搬移，零行為改變）
 */

import { dispatchCardiacArrest } from "@/lib/simulator/engine/biogears-engine";
import type { TimelineEntry, ShockResult } from "../types";
import { nextId } from "./helpers";
import type { ProGameStore, StoreSlice } from "./types";

export type DefibrillatorSlice = Pick<
  ProGameStore,
  "setDefibrillatorEnergy" | "setDefibrillatorMode" | "deliverShock"
>;

export const createDefibrillatorSlice: StoreSlice<DefibrillatorSlice> = (set, get) => ({
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
    if (!patient) {
      return { success: false, message: "無病人資料" };
    }
    if (phase !== "playing" && phase !== "sbar") {
      return { success: false, message: "遊戲尚未開始或已結束" };
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
      // Async shock — appropriate for VF/pulseless VT → convert to sinus tach
      result = { success: true, message: "電擊成功 — 節律恢復中" };
      shockEntry.content = `⚡ 電擊 ${energy}J（${mode === "sync" ? "同步" : "非同步"}）— VF/VT 電擊後節律恢復`;

      // Update rhythm to post-shock sinus tachycardia
      set((state) => ({
        patient: state.patient ? {
          ...state.patient,
          vitals: { ...state.patient.vitals, rhythmStrip: "sinus_tach" as const },
        } : state.patient,
      }));

      // ROSC — notify BioGears of successful defibrillation
      dispatchCardiacArrest(false);
    } else if (rhythm === "vt_pulse") {
      // Sync cardioversion for VT with pulse → convert to NSR
      const postRhythm = mode === "sync" ? "nsr" as const : "sinus_tach" as const;
      if (mode === "sync") {
        result = { success: true, message: "同步電擊成功 — VT 轉為竇性節律" };
        shockEntry.content = `⚡ 同步電擊 ${energy}J — VT with pulse → 節律轉換`;
      } else {
        result = { success: true, message: "非同步電擊 — VT 暫時轉換，注意：建議使用同步模式" };
        shockEntry.content = `⚡ 非同步電擊 ${energy}J — VT with pulse（⚠ 建議同步模式）`;
      }

      set((state) => ({
        patient: state.patient ? {
          ...state.patient,
          vitals: { ...state.patient.vitals, rhythmStrip: postRhythm },
        } : state.patient,
      }));

      // ROSC — notify BioGears of successful cardioversion
      dispatchCardiacArrest(false);
    } else if (rhythm === "asystole" || rhythm === "pea") {
      // Non-shockable rhythm — shock delivered but ineffective (BioGears handles physiology)
      // NOT blocking or auto-killing — let the game continue, debrief will flag this as error
      result = { success: false, message: `⚠ ${rhythm === "asystole" ? "Asystole" : "PEA"} — 電擊無效，非可電擊節律` };
      shockEntry.content = `⚡ 電擊 ${energy}J — ⚠ 對 ${rhythm === "asystole" ? "Asystole" : "PEA"} 電擊（無效！非可電擊節律）`;

      // Record but don't kill — severity may worsen naturally
      set((state) => ({
        defibrillator: { ...state.defibrillator, lastShockAt: clock.currentTime },
        timeline: [...state.timeline, { id: nextId("tl"), ...shockEntry }],
        playerActions: [...state.playerActions, { action: `${actionLabel}:inappropriate`, gameTime: clock.currentTime, category: "acls" }],
      }));
      return result;
    } else {
      // Non-shockable rhythm (NSR, sinus tach, afib, etc.) — inappropriate shock causes VF arrest
      result = { success: false, message: `不當電擊 — ${rhythm} 非電擊適應症` };
      shockEntry.content = `⚡ 電擊 ${energy}J — ⚠ 對 ${rhythm} 執行不當電擊！病人發生心室顫動`;

      // Record + trigger cardiac arrest (VF) → ACLS takes over
      set((state) => ({
        defibrillator: { ...state.defibrillator, lastShockAt: clock.currentTime },
        timeline: [...state.timeline, { id: nextId("tl"), ...shockEntry }],
        playerActions: [...state.playerActions, { action: actionLabel, gameTime: clock.currentTime, category: "acls" }],
      }));
      // Inappropriate shock on non-arrest rhythm → patient goes into VF (cardiac arrest)
      // Set VF directly since triggerCardiacArrest uses severityToRhythm which may not give VF
      const arrestCause = `對 ${rhythm} 執行不當電擊，誘發心室顫動`;
      const nurseName = get().scenario?.nurseProfile?.name ?? "護理師";
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
                rhythmStrip: "vf" as const,
              },
            }
          : s.patient,
        timeline: [
          ...s.timeline,
          {
            id: nextId("tl"),
            gameTime: clock.currentTime,
            type: "system_event" as const,
            content: `⚠️ CARDIAC ARREST — ${arrestCause}`,
            sender: "system" as const,
            isImportant: true,
          },
          {
            id: nextId("tl"),
            gameTime: clock.currentTime,
            type: "nurse_message" as const,
            content: `${nurseName}：醫師！病人沒有脈搏了！心室顫動！`,
            sender: "nurse" as const,
            isImportant: true,
          },
        ],
      }));
      return result;
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
});
