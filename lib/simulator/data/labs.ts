// ICU 模擬器 — Lab Panel 定義
// 每個 lab 用 OrderDefinition 型別，turnaroundTime = timeToResult

import type { OrderDefinition } from "../types";

// ============================================================
// CBC / DC (Complete Blood Count + Differential)
// ============================================================

export const cbcLab: OrderDefinition = {
  id: "cbc",
  name: "CBC/DC (Complete Blood Count)",
  category: "lab",
  subcategory: "hematology",
  defaultDose: "1",
  unit: "panel",
  route: "Blood draw",
  frequencies: ["STAT", "Q6H", "Q8H", "Q12H", "Q24H"],
  timeToEffect: 0,
  timeToResult: 30, // 30 game minutes
  effect: {
    type: "procedure",
    duration: 0,
    isCorrectTreatment: true,
    severityChange: 0,
  },
};

// ============================================================
// BCS (Basic Chemistry / Metabolic Panel)
// ============================================================

export const bcsLab: OrderDefinition = {
  id: "bcs",
  name: "BCS (Basic Chemistry — Na/K/Cl/BUN/Cr/Glucose)",
  category: "lab",
  subcategory: "chemistry",
  defaultDose: "1",
  unit: "panel",
  route: "Blood draw",
  frequencies: ["STAT", "Q6H", "Q8H", "Q12H", "Q24H"],
  timeToEffect: 0,
  timeToResult: 35,
  effect: {
    type: "procedure",
    duration: 0,
    isCorrectTreatment: true,
    severityChange: 0,
  },
};

// ============================================================
// Coagulation Panel
// PT / INR / aPTT / Fibrinogen
// ============================================================

export const coagLab: OrderDefinition = {
  id: "coag",
  name: "Coag Panel (PT / INR / aPTT / Fibrinogen)",
  category: "lab",
  subcategory: "coagulation",
  defaultDose: "1",
  unit: "panel",
  route: "Blood draw",
  frequencies: ["STAT", "Q6H", "Q8H", "Q12H"],
  timeToEffect: 0,
  timeToResult: 45, // Coag takes a bit longer
  effect: {
    type: "procedure",
    duration: 0,
    isCorrectTreatment: true,
    severityChange: 0,
  },
};

// ============================================================
// ABG (Arterial Blood Gas)
// ============================================================

export const abgLab: OrderDefinition = {
  id: "abg",
  name: "ABG (Arterial Blood Gas)",
  category: "lab",
  subcategory: "blood_gas",
  defaultDose: "1",
  unit: "draw",
  route: "Arterial line",
  frequencies: ["STAT", "Q2H", "Q4H", "Q6H"],
  timeToEffect: 0,
  timeToResult: 10, // POC — 快速
  effect: {
    type: "procedure",
    duration: 0,
    isCorrectTreatment: true,
    severityChange: 0,
  },
};

// ============================================================
// Lactate
// ============================================================

export const lactateLab: OrderDefinition = {
  id: "lactate",
  name: "Lactate",
  category: "lab",
  subcategory: "blood_gas",
  defaultDose: "1",
  unit: "draw",
  route: "Venous or arterial",
  frequencies: ["STAT", "Q2H", "Q4H"],
  timeToEffect: 0,
  timeToResult: 15,
  effect: {
    type: "procedure",
    duration: 0,
    isCorrectTreatment: true,
    severityChange: 0,
  },
};

// ============================================================
// iCa (Ionized Calcium)
// ============================================================

export const iCaLab: OrderDefinition = {
  id: "ica",
  name: "iCa (Ionized Calcium)",
  category: "lab",
  subcategory: "blood_gas",
  defaultDose: "1",
  unit: "draw",
  route: "Arterial or venous",
  frequencies: ["STAT", "Q2H", "Q4H", "Q6H"],
  timeToEffect: 0,
  timeToResult: 10, // POC
  effect: {
    type: "procedure",
    duration: 0,
    isCorrectTreatment: true,
    severityChange: 0,
  },
};

// ============================================================
// ACT (Activated Clotting Time) — 心外特有！
// ============================================================

export const actLab: OrderDefinition = {
  id: "act",
  name: "ACT (Activated Clotting Time)",
  category: "lab",
  subcategory: "coagulation",
  defaultDose: "1",
  unit: "draw",
  route: "Whole blood (bedside POC)",
  frequencies: ["STAT", "Q1H", "Q2H"],
  timeToEffect: 0,
  timeToResult: 10, // Bedside POC — 最快
  effect: {
    type: "procedure",
    duration: 0,
    isCorrectTreatment: true,
    severityChange: 0,
  },
};

// ============================================================
// Cardiac Markers — Troponin I/T
// ============================================================

export const troponinLab: OrderDefinition = {
  id: "troponin",
  name: "Cardiac Markers (Troponin I/T + CK-MB)",
  category: "lab",
  subcategory: "cardiac",
  defaultDose: "1",
  unit: "panel",
  route: "Blood draw",
  frequencies: ["STAT", "Serial Q6H", "Q12H"],
  timeToEffect: 0,
  timeToResult: 60,
  effect: {
    type: "procedure",
    duration: 0,
    isCorrectTreatment: true,
    severityChange: 0,
  },
};

// ============================================================
// Blood Culture
// ============================================================

export const bloodCultureLab: OrderDefinition = {
  id: "blood_culture",
  name: "Blood Culture × 2 sets",
  category: "lab",
  subcategory: "microbiology",
  defaultDose: "2",
  unit: "sets",
  route: "Peripheral venipuncture",
  frequencies: ["Once", "Q24H"],
  timeToEffect: 0,
  timeToResult: 2880, // 48 hours (game minutes) — prelim results
  effect: {
    type: "procedure",
    duration: 0,
    isCorrectTreatment: true,
    severityChange: 0,
  },
};

// ============================================================
// TEG / ROTEM (Thromboelastography / Rotational Thromboelastometry)
// 心外 ICU 特有！
// ============================================================

export const tegLab: OrderDefinition = {
  id: "teg",
  name: "TEG (Thromboelastography)",
  category: "lab",
  subcategory: "coagulation",
  defaultDose: "1",
  unit: "test",
  route: "Whole blood (bedside)",
  frequencies: ["STAT", "Once"],
  timeToEffect: 0,
  timeToResult: 20, // ~20 min for basic profile
  effect: {
    type: "procedure",
    duration: 0,
    isCorrectTreatment: true,
    severityChange: 0,
  },
};

export const rotemLab: OrderDefinition = {
  id: "rotem",
  name: "ROTEM (Rotational Thromboelastometry)",
  category: "lab",
  subcategory: "coagulation",
  defaultDose: "1",
  unit: "test",
  route: "Whole blood (bedside)",
  frequencies: ["STAT", "Once"],
  timeToEffect: 0,
  timeToResult: 20,
  effect: {
    type: "procedure",
    duration: 0,
    isCorrectTreatment: true,
    severityChange: 0,
  },
};

// ============================================================
// ALL LABS EXPORT
// ============================================================

export const allLabs: OrderDefinition[] = [
  cbcLab,
  bcsLab,
  coagLab,
  abgLab,
  lactateLab,
  iCaLab,
  actLab,
  troponinLab,
  bloodCultureLab,
  tegLab,
  rotemLab,
];

export const labCategories = {
  hematology: [cbcLab],
  chemistry: [bcsLab],
  coagulation: [coagLab, actLab, tegLab, rotemLab],
  blood_gas: [abgLab, lactateLab, iCaLab],
  cardiac: [troponinLab],
  microbiology: [bloodCultureLab],
};

/**
 * 術後出血情境必開 Labs（Critical Actions 用）
 */
export const CRITICAL_LABS_POSTOP_BLEEDING = [
  "cbc",
  "coag",
  "abg",
  "lactate",
  "ica",
  "act",
] as const;

export const getLabById = (id: string): OrderDefinition | undefined =>
  allLabs.find((l) => l.id === id);
