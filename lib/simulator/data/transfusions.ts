// ICU 模擬器 — 輸血 + MTP 定義

import type { OrderDefinition, MTPState } from "../types";

// ============================================================
// pRBC (Packed Red Blood Cells)
// ============================================================

export const prbc1u: OrderDefinition = {
  id: "prbc_1u",
  name: "pRBC 1 Unit",
  category: "transfusion",
  subcategory: "prbc",
  defaultDose: "1",
  unit: "unit",
  route: "IV",
  frequencies: ["Over 2hr", "Over 4hr", "Rapid infusion"],
  timeToEffect: 15,
  guardRail: {
    min: 1,
    max: 1,
    interactions: [
      {
        withDrug: "furosemide",
        message: "輸血後考慮給 Furosemide 預防 TACO（Transfusion-Associated Circulatory Overload）。",
        severity: "info",
      },
    ],
  },
  effect: {
    type: "blood_product",
    duration: 120,
    isCorrectTreatment: true,
    vitalChanges: { sbp: 5, map: 4 },
    severityChange: -5,
    temperatureChange: -0.3, // 冷血品降溫
  },
  scenarioOverrides: {
    surgical_bleeding: { duration: 20 },
    cardiac_tamponade: { duration: 20 },
  },
};

export const prbc2u: OrderDefinition = {
  id: "prbc_2u",
  name: "pRBC 2 Units",
  category: "transfusion",
  subcategory: "prbc",
  defaultDose: "2",
  unit: "units",
  route: "IV",
  frequencies: ["Over 2hr", "Over 4hr", "Rapid infusion"],
  timeToEffect: 15,
  guardRail: {
    min: 2,
    max: 2,
    interactions: [
      {
        withDrug: "furosemide",
        message: "輸血後考慮給 Furosemide 預防 TACO。",
        severity: "info",
      },
    ],
  },
  effect: {
    type: "blood_product",
    duration: 120,
    isCorrectTreatment: true,
    vitalChanges: { sbp: 10, map: 8, cvp: 2 },
    severityChange: -10,
    temperatureChange: -0.5,
  },
  scenarioOverrides: {
    surgical_bleeding: { duration: 20 },
    cardiac_tamponade: { duration: 20 },
  },
};

export const prbc4u: OrderDefinition = {
  id: "prbc_4u",
  name: "pRBC 4 Units",
  category: "transfusion",
  subcategory: "prbc",
  defaultDose: "4",
  unit: "units",
  route: "IV",
  frequencies: ["Over 2hr", "Rapid infusion"],
  timeToEffect: 15,
  guardRail: {
    min: 4,
    max: 4,
    warnAbove: 4,
    warnMessage: "醫師，一次輸 4U pRBC，確認已 crossmatch 且備好 FFP 補凝血因子嗎？iCa 也要追喔。",
    interactions: [
      {
        withDrug: "calcium_gluconate",
        message: "大量輸血後 iCa 常低，記得追 Calcium！",
        severity: "info",
      },
    ],
  },
  effect: {
    type: "blood_product",
    duration: 120,
    isCorrectTreatment: true,
    vitalChanges: { sbp: 18, map: 14, cvp: 4 },
    severityChange: -18,
    temperatureChange: -0.8,
  },
  scenarioOverrides: {
    surgical_bleeding: { duration: 20 },
    cardiac_tamponade: { duration: 20 },
  },
};

// ============================================================
// FFP (Fresh Frozen Plasma)
// ============================================================

export const ffp2u: OrderDefinition = {
  id: "ffp_2u",
  name: "FFP 2 Units",
  category: "transfusion",
  subcategory: "ffp",
  defaultDose: "2",
  unit: "units",
  route: "IV",
  frequencies: ["Over 1hr", "Over 2hr", "Rapid infusion"],
  timeToEffect: 20,
  guardRail: {
    min: 2,
    max: 2,
  },
  effect: {
    type: "blood_product",
    duration: 90,
    isCorrectTreatment: true,
    vitalChanges: { sbp: 3, map: 2, cvp: 1 },
    severityChange: -6,
    temperatureChange: -0.2,
  },
  scenarioOverrides: {
    surgical_bleeding: { duration: 20 },
    cardiac_tamponade: { duration: 20 },
  },
};

export const ffp4u: OrderDefinition = {
  id: "ffp_4u",
  name: "FFP 4 Units",
  category: "transfusion",
  subcategory: "ffp",
  defaultDose: "4",
  unit: "units",
  route: "IV",
  frequencies: ["Over 1hr", "Rapid infusion"],
  timeToEffect: 20,
  guardRail: {
    min: 4,
    max: 4,
    warnAbove: 4,
    warnMessage: "醫師，4U FFP 量不少，確認凝血確實需要嗎？（INR > 1.5 or active bleeding）",
  },
  effect: {
    type: "blood_product",
    duration: 90,
    isCorrectTreatment: true,
    vitalChanges: { sbp: 5, map: 4, cvp: 2 },
    severityChange: -10,
    temperatureChange: -0.4,
  },
  scenarioOverrides: {
    surgical_bleeding: { duration: 20 },
    cardiac_tamponade: { duration: 20 },
  },
};

// ============================================================
// Platelet
// ============================================================

export const platelet1dose: OrderDefinition = {
  id: "platelet_1dose",
  name: "Platelet 1 dose (Apheresis)",
  category: "transfusion",
  subcategory: "platelet",
  defaultDose: "1",
  unit: "dose",
  route: "IV",
  frequencies: ["Over 30min", "Over 1hr"],
  timeToEffect: 30,
  guardRail: {
    min: 1,
    max: 1,
  },
  effect: {
    type: "blood_product",
    duration: 120,
    isCorrectTreatment: true,
    severityChange: -4,
  },
  scenarioOverrides: {
    surgical_bleeding: { duration: 20 },
    cardiac_tamponade: { duration: 20 },
  },
};

export const platelet2dose: OrderDefinition = {
  id: "platelet_2dose",
  name: "Platelet 2 doses (Apheresis)",
  category: "transfusion",
  subcategory: "platelet",
  defaultDose: "2",
  unit: "doses",
  route: "IV",
  frequencies: ["Over 1hr"],
  timeToEffect: 30,
  guardRail: {
    min: 2,
    max: 2,
    warnAbove: 2,
    warnMessage: "醫師，2 doses Platelet，確認 Plt < 50K 且有 active bleeding 嗎？",
  },
  effect: {
    type: "blood_product",
    duration: 120,
    isCorrectTreatment: true,
    severityChange: -7,
  },
  scenarioOverrides: {
    surgical_bleeding: { duration: 20 },
    cardiac_tamponade: { duration: 20 },
  },
};

// ============================================================
// Cryoprecipitate (Cryo)
// ============================================================

export const cryo6u: OrderDefinition = {
  id: "cryo_6u",
  name: "Cryoprecipitate 6 Units",
  category: "transfusion",
  subcategory: "cryo",
  defaultDose: "6",
  unit: "units",
  route: "IV",
  frequencies: ["Over 30min"],
  timeToEffect: 25,
  guardRail: {
    min: 6,
    max: 6,
  },
  effect: {
    type: "blood_product",
    duration: 90,
    isCorrectTreatment: true,
    severityChange: -5,
  },
  scenarioOverrides: {
    surgical_bleeding: { duration: 20 },
    cardiac_tamponade: { duration: 20 },
  },
};

export const cryo10u: OrderDefinition = {
  id: "cryo_10u",
  name: "Cryoprecipitate 10 Units",
  category: "transfusion",
  subcategory: "cryo",
  defaultDose: "10",
  unit: "units",
  route: "IV",
  frequencies: ["Over 30min"],
  timeToEffect: 25,
  guardRail: {
    min: 10,
    max: 10,
    warnAbove: 10,
    warnMessage: "醫師，10U Cryo 量很大，確認 Fibrinogen < 150 mg/dL 且有 active bleeding 嗎？",
  },
  effect: {
    type: "blood_product",
    duration: 90,
    isCorrectTreatment: true,
    severityChange: -8,
  },
  scenarioOverrides: {
    surgical_bleeding: { duration: 20 },
    cardiac_tamponade: { duration: 20 },
  },
};

// ============================================================
// MTP (Massive Transfusion Protocol)
// ============================================================

/**
 * MTP 啟動觸發條件（教學用，供 UI 顯示）
 */
export const MTP_ACTIVATION_CRITERIA = [
  "預估失血 > 1 blood volume（約 5L）",
  "持續需要 ≥4U pRBC within 1 hour",
  "Hemodynamically unstable despite initial resuscitation",
  "ABC Score ≥ 2（Penetrating injury / SBP ≤ 90 / HR ≥ 120 / FAST+）",
] as const;

/**
 * MTP 1:1:1 比例一個 Round 的內容
 */
export const MTP_ROUND_CONTENT = {
  prbc: 2,       // 2U pRBC
  ffp: 2,        // 2U FFP
  platelet: 1,   // 1 dose Platelet
} as const;

/**
 * MTP 狀態初始值
 */
export const initialMTPState: MTPState = {
  activated: false,
  activatedAt: undefined,
  roundsDelivered: 0,
};

/**
 * MTP Round 效果（每個 round 的 vitals 變化）
 */
export const mtpRoundEffect = {
  type: "blood_product" as const,
  duration: 20,   // Shortened for acute bleeding — per-min: -0.75 (was -0.25 with 60min)
  isCorrectTreatment: true,
  vitalChanges: { sbp: 12, map: 9, cvp: 3 },
  severityChange: -15,
  temperatureChange: -0.6, // 大量血品降溫
};

// ============================================================
// ALL TRANSFUSIONS EXPORT
// ============================================================

export const allTransfusions: OrderDefinition[] = [
  prbc1u,
  prbc2u,
  prbc4u,
  ffp2u,
  ffp4u,
  platelet1dose,
  platelet2dose,
  cryo6u,
  cryo10u,
];

export const transfusionCategories = {
  prbc: [prbc1u, prbc2u, prbc4u],
  ffp: [ffp2u, ffp4u],
  platelet: [platelet1dose, platelet2dose],
  cryo: [cryo6u, cryo10u],
};

export const getTransfusionById = (id: string): OrderDefinition | undefined =>
  allTransfusions.find((t) => t.id === id);
