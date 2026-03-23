// ICU 模擬器 — Order Engine
// validateOrder / getOrderEffect / activateMTP / drug interaction checks

import type {
  OrderDefinition,
  PlacedOrder,
  PatientState,
  ActiveEffect,
  MTPState,
  DrugInteraction,
} from "../types";
import {
  allMedications,
  getMedicationById,
} from "../data/medications";
import {
  allTransfusions,
  getTransfusionById,
  mtpRoundEffect,
  MTP_ROUND_CONTENT,
} from "../data/transfusions";
import { allLabs, getLabById } from "../data/labs";

// ============================================================
// Validation Result Types
// ============================================================

export interface ValidationResult {
  valid: boolean;
  warning?: string;     // 護理師問「確定嗎？」— 可以 override
  rejection?: string;   // 護理師拒絕 — 不可 override
}

export interface OrderPlacementResult {
  success: boolean;
  placedOrder?: PlacedOrder;
  validationResult: ValidationResult;
}

// ============================================================
// All known order definitions (merged lookup)
// ============================================================

const allDefinitions: OrderDefinition[] = [
  ...allMedications,
  ...allTransfusions,
  ...allLabs,
];

export function getOrderDefinitionById(id: string): OrderDefinition | undefined {
  return allDefinitions.find((d) => d.id === id);
}

// ============================================================
// validateOrder
// ============================================================

/**
 * Validates an order before placing it.
 *
 * @param definition  - The OrderDefinition for what's being ordered
 * @param doseValue   - Numeric dose the player entered
 * @param currentState - Current PatientState (for active drug checks)
 * @returns ValidationResult with valid flag and optional warning/rejection
 */
export function validateOrder(
  definition: OrderDefinition,
  doseValue: number,
  currentState: PatientState
): ValidationResult {
  const { guardRail } = definition;

  // ── 1. No guard rail → always valid ──────────────────────
  if (!guardRail) {
    return { valid: true };
  }

  // ── 2. rejectAbove check ─────────────────────────────────
  if (
    guardRail.rejectAbove !== undefined &&
    doseValue > guardRail.rejectAbove
  ) {
    return {
      valid: false,
      rejection:
        guardRail.rejectMessage ??
        `學長，這個劑量太高了（上限 ${guardRail.rejectAbove} ${definition.unit}），要不要重開？`,
    };
  }

  // ── 3. warnAbove check ───────────────────────────────────
  if (
    guardRail.warnAbove !== undefined &&
    doseValue > guardRail.warnAbove
  ) {
    // Still valid — nurse will ask for confirmation
    return {
      valid: true,
      warning:
        guardRail.warnMessage ??
        `學長，${definition.name} ${doseValue} ${definition.unit} 這個劑量有點高欸，確定嗎？`,
    };
  }

  // ── 4. Below minimum ─────────────────────────────────────
  if (guardRail.min !== undefined && doseValue < guardRail.min) {
    return {
      valid: true,
      warning: `學長，${definition.name} 劑量偏低（建議最低 ${guardRail.min} ${definition.unit}），確認嗎？`,
    };
  }

  // ── 5. Drug interaction checks ───────────────────────────
  if (guardRail.interactions && guardRail.interactions.length > 0) {
    const activeOrderIds = getActiveOrderIds(currentState);

    for (const interaction of guardRail.interactions) {
      if (activeOrderIds.includes(interaction.withDrug)) {
        if (interaction.severity === "block") {
          return {
            valid: false,
            rejection: interaction.message,
          };
        }
        if (interaction.severity === "warning") {
          return {
            valid: true,
            warning: interaction.message,
          };
        }
        // "info" — just note, don't warn in validation
      }
    }
  }

  // ── 6. Special rule: Calcium Chloride central line check ─
  if (definition.id === "calcium_chloride") {
    // Always warn to confirm central access
    return {
      valid: true,
      warning:
        "⚠️ Calcium Chloride 必須走中央靜脈（CVC / arterial line），確認有 central access 嗎？外周注射會造成嚴重組織壞死！",
    };
  }

  // ── 7. KCl rate / central check ──────────────────────────
  if (definition.id === "kcl_iv" && doseValue > 10) {
    return {
      valid: true,
      warning:
        "學長，KCl > 10 mEq/hr 需走中央靜脈，速度不可超過 20 mEq/hr。注意致命心律不整風險！",
    };
  }

  return { valid: true };
}

// ============================================================
// getOrderEffect
// ============================================================

/**
 * Calculate the ActiveEffect for a given placed order.
 * Used by PatientEngine to apply to PatientState.activeEffects.
 *
 * @param order - The PlacedOrder (has definition + placed time)
 * @param weight - Patient weight in kg (for weight-based dosing)
 * @returns ActiveEffect ready to inject into PatientState
 */
export function getOrderEffect(
  order: PlacedOrder,
  weight: number = 70
): ActiveEffect | null {
  const { definition, placedAt } = order;

  if (!definition.effect) return null;

  const effectTemplate = definition.effect;

  // Weight-based dose scaling for vasopressors / inotropes
  const doseNum = parseFloat(order.dose);
  let scaleFactor = 1;

  if (
    definition.subcategory === "vasopressor" ||
    definition.subcategory === "inotrope"
  ) {
    // Effect scales with actual dose relative to default
    const defaultDoseNum = parseFloat(definition.defaultDose);
    if (!isNaN(doseNum) && !isNaN(defaultDoseNum) && defaultDoseNum > 0) {
      scaleFactor = doseNum / defaultDoseNum;
    }
  }

  // Scale vitalChanges
  const scaledVitalChanges = effectTemplate.vitalChanges
    ? scaleVitalChanges(effectTemplate.vitalChanges, scaleFactor)
    : undefined;

  const activeEffect: ActiveEffect = {
    id: `${order.id}_effect`,
    source: definition.name,
    type: effectTemplate.type ?? "procedure",
    startTime: placedAt + definition.timeToEffect,
    duration: effectTemplate.duration ?? 0,
    vitalChanges: scaledVitalChanges ?? {},
    temperatureChange: effectTemplate.temperatureChange,
    severityChange: effectTemplate.severityChange !== undefined
      ? effectTemplate.severityChange * scaleFactor
      : undefined,
    isCorrectTreatment: effectTemplate.isCorrectTreatment ?? false,
  };

  return activeEffect;
}

// ============================================================
// activateMTP
// ============================================================

/**
 * Activates MTP and schedules the first 1:1:1 round.
 * Returns the updated MTPState and a list of PlacedOrders for the round.
 *
 * @param currentTime - Current game time in minutes
 * @param currentMTPState - Current MTP state
 * @returns { newMTPState, roundOrders } — round orders go into the queue
 */
export interface MTPActivationResult {
  newMTPState: MTPState;
  roundOrders: PlacedOrder[];
  message: string;
}

export function activateMTP(
  currentTime: number,
  currentMTPState: MTPState
): MTPActivationResult {
  if (currentMTPState.activated) {
    // MTP already active — deliver next round
    return deliverMTPRound(currentTime, currentMTPState);
  }

  // Fresh activation
  const newMTPState: MTPState = {
    activated: true,
    activatedAt: currentTime,
    roundsDelivered: 0,
  };

  const { roundOrders, updatedState } = buildMTPRoundOrders(
    currentTime,
    newMTPState
  );

  return {
    newMTPState: updatedState,
    roundOrders,
    message:
      "🚨 MTP 已啟動！血庫收到通知，第一輪 pRBC 2U + FFP 2U + Plt 1 dose 準備中，預計 15 分鐘內送到。",
  };
}

function deliverMTPRound(
  currentTime: number,
  currentMTPState: MTPState
): MTPActivationResult {
  const { roundOrders, updatedState } = buildMTPRoundOrders(
    currentTime,
    currentMTPState
  );

  const roundNum = updatedState.roundsDelivered;

  return {
    newMTPState: updatedState,
    roundOrders,
    message: `🩸 MTP Round ${roundNum}：pRBC 2U + FFP 2U + Plt 1 dose 已送出。`,
  };
}

function buildMTPRoundOrders(
  currentTime: number,
  state: MTPState
): { roundOrders: PlacedOrder[]; updatedState: MTPState } {
  const prbcDef = getTransfusionById("prbc_2u")!;
  const ffpDef = getTransfusionById("ffp_2u")!;
  const pltDef = getTransfusionById("platelet_1dose")!;

  const timestamp = Date.now();

  const roundOrders: PlacedOrder[] = [
    {
      id: `mtp_prbc_${timestamp}`,
      definition: prbcDef,
      dose: String(MTP_ROUND_CONTENT.prbc),
      frequency: "Rapid infusion",
      placedAt: currentTime,
      status: "in_progress",
      resultAvailableAt: currentTime + prbcDef.timeToEffect,
    },
    {
      id: `mtp_ffp_${timestamp}`,
      definition: ffpDef,
      dose: String(MTP_ROUND_CONTENT.ffp),
      frequency: "Rapid infusion",
      placedAt: currentTime,
      status: "in_progress",
      resultAvailableAt: currentTime + ffpDef.timeToEffect,
    },
    {
      id: `mtp_plt_${timestamp}`,
      definition: pltDef,
      dose: String(MTP_ROUND_CONTENT.platelet),
      frequency: "Over 30min",
      placedAt: currentTime,
      status: "in_progress",
      resultAvailableAt: currentTime + pltDef.timeToEffect,
    },
  ];

  const updatedState: MTPState = {
    ...state,
    roundsDelivered: state.roundsDelivered + 1,
  };

  return { roundOrders, updatedState };
}

/**
 * Get the combined ActiveEffect for one MTP round.
 * This is applied to PatientState once the round is "delivered".
 */
export function getMTPRoundEffect(deliveredAt: number): ActiveEffect {
  return {
    id: `mtp_round_effect_${deliveredAt}`,
    source: "MTP Round (pRBC 2U + FFP 2U + Plt 1 dose)",
    type: "blood_product",
    startTime: deliveredAt,
    duration: mtpRoundEffect.duration,
    vitalChanges: mtpRoundEffect.vitalChanges,
    temperatureChange: mtpRoundEffect.temperatureChange,
    severityChange: mtpRoundEffect.severityChange,
    isCorrectTreatment: mtpRoundEffect.isCorrectTreatment,
  };
}

// ============================================================
// Helper: Drug Interaction Check (standalone, for UI pre-check)
// ============================================================

/**
 * Check if a drug has any interactions with currently active drugs.
 * Returns all triggered interactions.
 */
export function checkDrugInteractions(
  definition: OrderDefinition,
  currentState: PatientState
): DrugInteraction[] {
  if (!definition.guardRail?.interactions) return [];

  const activeIds = getActiveOrderIds(currentState);
  const triggered: DrugInteraction[] = [];

  for (const interaction of definition.guardRail.interactions) {
    if (activeIds.includes(interaction.withDrug)) {
      triggered.push(interaction);
    }
  }

  return triggered;
}

// ============================================================
// Helper: Get IDs of currently active orders from PatientState
// ============================================================

function getActiveOrderIds(state: PatientState): string[] {
  return state.activeEffects.map((e) => {
    // Source is the drug name — match by lowercased id convention
    return e.source.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
  });
}

// ============================================================
// Helper: Scale vital changes by a factor
// ============================================================

function scaleVitalChanges(
  changes: Partial<{ hr: number; sbp: number; dbp: number; map: number; spo2: number; cvp: number; temperature: number; rr: number }>,
  factor: number
): typeof changes {
  const result: typeof changes = {};
  for (const key of Object.keys(changes) as Array<keyof typeof changes>) {
    const val = changes[key];
    if (val !== undefined) {
      (result as Record<string, number>)[key] = Math.round(val * factor * 10) / 10;
    }
  }
  return result;
}

// ============================================================
// Place Order (Full Flow)
// ============================================================

/**
 * Full order placement flow:
 * 1. Validate
 * 2. If rejected → return failure
 * 3. Build PlacedOrder
 * 4. Return result with validationResult (warning if any)
 */
export function placeOrder(
  definition: OrderDefinition,
  dose: string,
  frequency: string,
  currentTime: number,
  currentState: PatientState
): OrderPlacementResult {
  const doseNum = parseFloat(dose);

  // Handle NaN dose gracefully
  const validDose = isNaN(doseNum) ? 0 : doseNum;
  const validation = validateOrder(definition, validDose, currentState);

  if (!validation.valid) {
    return {
      success: false,
      validationResult: validation,
    };
  }

  const placedOrder: PlacedOrder = {
    id: `order_${definition.id}_${currentTime}_${Date.now()}`,
    definition,
    dose,
    frequency,
    placedAt: currentTime,
    status: "in_progress",
    resultAvailableAt: definition.timeToResult
      ? currentTime + definition.timeToResult
      : undefined,
    warning: validation.warning,
  };

  return {
    success: true,
    placedOrder,
    validationResult: validation,
  };
}

// ============================================================
// Exports
// ============================================================

export {
  allDefinitions as allOrderDefinitions,
};
