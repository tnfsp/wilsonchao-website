/**
 * ICU 值班模擬器 Pro — zustand Store（façade）
 *
 * 設計原則：
 * - Store 不 import engine 函數（避免循環引用）
 * - Engine 邏輯由 component 層 call 後 dispatch 到 store
 * - Store 提供完整的 setter / updater 讓 engine 可以 dispatch
 *
 * 例外：getOrderEffect / getMTPRoundEffect 在 placeOrder / activateMTP 時直接 dispatch，
 * 以避免需要 component 層中繼，且不造成循環引用（order-engine 不 import store）。
 *
 * 結構：邏輯按職責拆分到 ./store/ 子目錄的 slices，
 * 此檔案只負責組裝與 re-export — 對外 import 路徑與 public API 完全不變。
 *
 * - store/types.ts          — ProGameStore interface + helper types
 * - store/action-patterns.ts — ACTION_PATTERNS（scoring + hint 共用）
 * - store/helpers.ts        — 內部共用 helpers（nextId, guard rail 等）
 * - store/initial-state.ts  — 初始狀態與難度設定
 * - store/scoring.ts        — computeBasicScore / computeSBARScore
 * - store/lifecycle-slice.ts — 載入 / 開始 / SBAR / 結束 / 重置
 * - store/time-slice.ts     — advanceTime / actionAdvance（事件觸發核心）
 * - store/orders-slice.ts   — placeOrder / MTP / 呼吸器 / milk CT
 * - store/patient-slice.ts  — 病人狀態更新與 engine dispatch setters
 * - store/emergency-slice.ts — arrest / death / rescue / senior / ROSC
 * - store/defibrillator-slice.ts — ACLS 電擊
 * - store/ui-slice.ts       — timeline / modal / 訊息 / guidance / hint
 */

import { create } from "zustand";
import { createDefibrillatorSlice } from "./store/defibrillator-slice";
import { createEmergencySlice } from "./store/emergency-slice";
import { initialState } from "./store/initial-state";
import { createLifecycleSlice } from "./store/lifecycle-slice";
import { createOrdersSlice } from "./store/orders-slice";
import { createPatientSlice } from "./store/patient-slice";
import { createTimeSlice } from "./store/time-slice";
import type { ProGameStore } from "./store/types";
import { createUiSlice } from "./store/ui-slice";

// Re-exports — public API 不變
export { ACTION_PATTERNS } from "./store/action-patterns";
export type { ProGameStore, PlaceOrderParams, PlaceOrderResult } from "./store/types";

// ============================================================
// Store
// ============================================================

export const useProGameStore = create<ProGameStore>((set, get, api) => ({
  ...initialState,
  ...createLifecycleSlice(set, get, api),
  ...createTimeSlice(set, get, api),
  ...createOrdersSlice(set, get, api),
  ...createPatientSlice(set, get, api),
  ...createEmergencySlice(set, get, api),
  ...createDefibrillatorSlice(set, get, api),
  ...createUiSlice(set, get, api),
}));
