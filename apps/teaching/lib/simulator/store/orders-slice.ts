/**
 * Orders slice — 下單 / MTP / 呼吸器 / Chest tube milk
 *（從 store.ts 機械搬移，零行為改變）
 */

import {
  getLastBioGearsState,
  dispatchOrderToBioGears,
  adjustBioGearsVentilator,
  dispatchPericardialEffusion,
} from "@/lib/simulator/engine/biogears-engine";
import { recordMilkCt } from "@/lib/simulator/engine/ct-output-engine";
import type {
  PendingEvent,
  PlacedOrder,
  TimelineEntry,
  VentilatorState,
  LabResultData,
  OrderEffectData,
} from "../types";
import { nextId, validateOrderGuardRail } from "./helpers";
import type {
  ProGameStore,
  StoreSlice,
  PlaceOrderParams,
  PlaceOrderResult,
} from "./types";

export type OrdersSlice = Pick<
  ProGameStore,
  "placeOrder" | "activateMTP" | "updateVentilator" | "milkChestTube"
>;

export const createOrdersSlice: StoreSlice<OrdersSlice> = (set, get) => ({
  // ----------------------------------------------------------
  // placeOrder
  // ----------------------------------------------------------
  placeOrder: (params: PlaceOrderParams): PlaceOrderResult => {
    const { clock, phase, timeline } = get();
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

    // Dispatch to BioGears engine (fire-and-forget, outside set())
    dispatchOrderToBioGears(
      params.definition.name,
      params.dose ?? "",
      params.definition.category ?? "medication",
    );

    // Placing an order takes ~1 game-minute (skip for batch preset orders)
    if (!params.skipAdvance) {
      get().actionAdvance(1);
    }

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

    // Dispatch MTP blood products to BioGears (fire-and-forget, outside set())
    dispatchOrderToBioGears("pRBC", "500", "transfusion");
    dispatchOrderToBioGears("FFP", "500", "transfusion");
    dispatchOrderToBioGears("Platelet", "250", "transfusion");
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

    // Dispatch ventilator settings to BioGears (fire-and-forget, outside set())
    const merged = get().ventilator;
    adjustBioGearsVentilator({
      mode: merged.mode === "PC" ? "PC" : "VC",
      pip: merged.inspPressure,
      tv_mL: merged.tvSet,
      peep: merged.peep,
      rr: merged.rrSet,
      fio2: merged.fio2,
    });
  },

  // ----------------------------------------------------------
  // milkChestTube — extracted from ChestTubePanel for ActionBar access
  // ----------------------------------------------------------
  milkChestTube: () => {
    const { patient, phase, clock } = get();
    if (!patient || phase !== "playing") return;
    const ct = patient.chestTube;

    if (ct.isPatent) {
      // Already patent — no state change needed
    } else if (ct.hasClots) {
      const isTamponade = patient.pathology === "cardiac_tamponade" || patient.pathology === "tamponade";
      if (isTamponade) {
        // Record milk for ct-output-engine patency window
        const bgState = getLastBioGearsState();
        if (bgState) recordMilkCt(bgState.time_s);
        get().updateChestTube({ isPatent: true, currentRate: Math.max(ct.currentRate, 10), totalOutput: ct.totalOutput + 5 });
        get().updatePatientSeverity(Math.max(0, (patient.severity ?? 0) - 8));
        dispatchPericardialEffusion(10);
        setTimeout(() => dispatchPericardialEffusion(15), 3 * 60 * 1000);
      } else {
        // Record milk for ct-output-engine patency window
        const bgStateNonTamp = getLastBioGearsState();
        if (bgStateNonTamp) recordMilkCt(bgStateNonTamp.time_s);
        get().updateChestTube({ isPatent: true, totalOutput: ct.totalOutput + 50 });
        get().updatePatientSeverity(Math.max(0, (patient.severity ?? 0) - 5));
      }
    } else {
      get().updateChestTube({ isPatent: true });
    }

    // Short timeline note + open result modal instead of chat messages
    get().addTimelineEntry({
      gameTime: clock.currentTime,
      type: "player_action",
      content: "🔧 Milk/Strip Chest Tube",
      sender: "player",
    });
    get().openModal("milk_ct_result");

    set((state) => ({
      playerActions: [...state.playerActions, { action: "procedure:chest_tube_milk", gameTime: clock.currentTime, category: "procedure" }],
    }));
    get().actionAdvance(1);
  },
});
