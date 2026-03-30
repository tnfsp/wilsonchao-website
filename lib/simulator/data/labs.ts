// ICU 模擬器 — Lab 定義
// 設計原則：CBC / ABG 保持 bundle，其他全部拆成個別 item
// 教學目的：訓練學員思考「我到底需要看什麼 lab」

import type { OrderDefinition } from "../types";

// ============================================================
// BUNDLES — 臨床上一定一起出的 panel
// ============================================================

/** CBC/DC (Complete Blood Count) — bundle */
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
  timeToResult: 30,
  effect: {
    type: "procedure",
    duration: 0,
    isCorrectTreatment: true,
    severityChange: 0,
  },
};

/** ABG (Arterial Blood Gas) — bundle (pH/pCO₂/pO₂/HCO₃/BE/Lactate/SaO₂) */
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
  timeToResult: 10, // POC
  effect: {
    type: "procedure",
    duration: 0,
    isCorrectTreatment: true,
    severityChange: 0,
  },
};

// ============================================================
// INDIVIDUAL CHEMISTRY — 原 BCS panel 拆開
// ============================================================

export const naLab: OrderDefinition = {
  id: "na",
  name: "Na (Sodium)",
  category: "lab",
  subcategory: "chemistry",
  defaultDose: "1",
  unit: "test",
  route: "Blood draw",
  frequencies: ["STAT", "Q6H", "Q8H", "Q12H"],
  timeToEffect: 0,
  timeToResult: 35,
  effect: { type: "procedure", duration: 0, isCorrectTreatment: true, severityChange: 0 },
};

export const kLab: OrderDefinition = {
  id: "k",
  name: "K (Potassium)",
  category: "lab",
  subcategory: "chemistry",
  defaultDose: "1",
  unit: "test",
  route: "Blood draw",
  frequencies: ["STAT", "Q6H", "Q8H", "Q12H"],
  timeToEffect: 0,
  timeToResult: 35,
  effect: { type: "procedure", duration: 0, isCorrectTreatment: true, severityChange: 0 },
};

export const clLab: OrderDefinition = {
  id: "cl",
  name: "Cl (Chloride)",
  category: "lab",
  subcategory: "chemistry",
  defaultDose: "1",
  unit: "test",
  route: "Blood draw",
  frequencies: ["STAT", "Q6H", "Q8H", "Q12H"],
  timeToEffect: 0,
  timeToResult: 35,
  effect: { type: "procedure", duration: 0, isCorrectTreatment: true, severityChange: 0 },
};

export const co2Lab: OrderDefinition = {
  id: "co2",
  name: "CO₂ (Total CO₂)",
  category: "lab",
  subcategory: "chemistry",
  defaultDose: "1",
  unit: "test",
  route: "Blood draw",
  frequencies: ["STAT", "Q6H", "Q8H", "Q12H"],
  timeToEffect: 0,
  timeToResult: 35,
  effect: { type: "procedure", duration: 0, isCorrectTreatment: true, severityChange: 0 },
};

export const bunLab: OrderDefinition = {
  id: "bun",
  name: "BUN (Blood Urea Nitrogen)",
  category: "lab",
  subcategory: "chemistry",
  defaultDose: "1",
  unit: "test",
  route: "Blood draw",
  frequencies: ["STAT", "Q6H", "Q8H", "Q12H"],
  timeToEffect: 0,
  timeToResult: 35,
  effect: { type: "procedure", duration: 0, isCorrectTreatment: true, severityChange: 0 },
};

export const crLab: OrderDefinition = {
  id: "cr",
  name: "Cr (Creatinine)",
  category: "lab",
  subcategory: "chemistry",
  defaultDose: "1",
  unit: "test",
  route: "Blood draw",
  frequencies: ["STAT", "Q6H", "Q8H", "Q12H"],
  timeToEffect: 0,
  timeToResult: 35,
  effect: { type: "procedure", duration: 0, isCorrectTreatment: true, severityChange: 0 },
};

export const glucoseLab: OrderDefinition = {
  id: "glucose",
  name: "Glucose (血糖)",
  category: "lab",
  subcategory: "chemistry",
  defaultDose: "1",
  unit: "test",
  route: "Blood draw / Fingerstick",
  frequencies: ["STAT", "Q4H", "Q6H", "Q8H"],
  timeToEffect: 0,
  timeToResult: 10, // Fingerstick POC
  effect: { type: "procedure", duration: 0, isCorrectTreatment: true, severityChange: 0 },
};

// ============================================================
// INDIVIDUAL COAGULATION — 原 Coag panel 拆開
// ============================================================

export const ptInrLab: OrderDefinition = {
  id: "pt_inr",
  name: "PT / INR",
  category: "lab",
  subcategory: "coagulation",
  defaultDose: "1",
  unit: "test",
  route: "Blood draw (blue-top)",
  frequencies: ["STAT", "Q6H", "Q8H", "Q12H"],
  timeToEffect: 0,
  timeToResult: 45,
  effect: { type: "procedure", duration: 0, isCorrectTreatment: true, severityChange: 0 },
};

export const apttLab: OrderDefinition = {
  id: "aptt",
  name: "aPTT",
  category: "lab",
  subcategory: "coagulation",
  defaultDose: "1",
  unit: "test",
  route: "Blood draw (blue-top)",
  frequencies: ["STAT", "Q6H", "Q8H", "Q12H"],
  timeToEffect: 0,
  timeToResult: 45,
  effect: { type: "procedure", duration: 0, isCorrectTreatment: true, severityChange: 0 },
};

export const fibrinogenLab: OrderDefinition = {
  id: "fibrinogen",
  name: "Fibrinogen",
  category: "lab",
  subcategory: "coagulation",
  defaultDose: "1",
  unit: "test",
  route: "Blood draw (blue-top)",
  frequencies: ["STAT", "Q6H", "Q8H", "Q12H"],
  timeToEffect: 0,
  timeToResult: 45,
  effect: { type: "procedure", duration: 0, isCorrectTreatment: true, severityChange: 0 },
};

// ============================================================
// INDIVIDUAL — 其他檢驗
// ============================================================

/** Lactate（可以獨立開，也含在 ABG 裡） */
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
  effect: { type: "procedure", duration: 0, isCorrectTreatment: true, severityChange: 0 },
};

/** iCa (Ionized Calcium) */
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
  effect: { type: "procedure", duration: 0, isCorrectTreatment: true, severityChange: 0 },
};

/** ACT (Activated Clotting Time) — 心外特有 */
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
  timeToResult: 10,
  effect: { type: "procedure", duration: 0, isCorrectTreatment: true, severityChange: 0 },
};

/** Troponin I */
export const troponinLab: OrderDefinition = {
  id: "troponin",
  name: "Troponin I",
  category: "lab",
  subcategory: "cardiac",
  defaultDose: "1",
  unit: "test",
  route: "Blood draw",
  frequencies: ["STAT", "Serial Q6H", "Q12H"],
  timeToEffect: 0,
  timeToResult: 60,
  effect: { type: "procedure", duration: 0, isCorrectTreatment: true, severityChange: 0 },
};

/** Type & Screen / Crossmatch */
export const typeScreenLab: OrderDefinition = {
  id: "type_screen",
  name: "Type & Screen / Crossmatch",
  category: "lab",
  subcategory: "blood_bank",
  defaultDose: "1",
  unit: "set",
  route: "Blood draw (red-top)",
  frequencies: ["STAT", "Once"],
  timeToEffect: 0,
  timeToResult: 30, // Blood bank 配血時間
  effect: { type: "procedure", duration: 0, isCorrectTreatment: true, severityChange: 0 },
};

/** Blood Culture × 2 sets */
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
  timeToResult: 2880, // 48 hours
  effect: { type: "procedure", duration: 0, isCorrectTreatment: true, severityChange: 0 },
};

/** TEG (Thromboelastography) — 心外 ICU 特有 */
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
  timeToResult: 20,
  effect: { type: "procedure", duration: 0, isCorrectTreatment: true, severityChange: 0 },
};

/** ROTEM (Rotational Thromboelastometry) */
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
  effect: { type: "procedure", duration: 0, isCorrectTreatment: true, severityChange: 0 },
};

// ============================================================
// NEW LABS — Expanded for BioGears-first GDD
// ============================================================

/** NT-proBNP (Cardiac biomarker) */
export const ntprobnpLab: OrderDefinition = {
  id: "ntprobnp",
  name: "NT-proBNP",
  category: "lab",
  subcategory: "cardiac",
  defaultDose: "1",
  unit: "test",
  route: "Blood draw",
  frequencies: ["STAT", "Q12H", "Q24H"],
  timeToEffect: 0,
  timeToResult: 60,
  effect: { type: "procedure", duration: 0, isCorrectTreatment: true, severityChange: 0 },
};

/** CK-MB (Cardiac enzyme) */
export const ckmbLab: OrderDefinition = {
  id: "ckmb",
  name: "CK-MB",
  category: "lab",
  subcategory: "cardiac",
  defaultDose: "1",
  unit: "test",
  route: "Blood draw",
  frequencies: ["STAT", "Serial Q6H", "Q12H"],
  timeToEffect: 0,
  timeToResult: 60,
  effect: { type: "procedure", duration: 0, isCorrectTreatment: true, severityChange: 0 },
};

/** D-dimer */
export const ddimerLab: OrderDefinition = {
  id: "ddimer",
  name: "D-dimer",
  category: "lab",
  subcategory: "coagulation",
  defaultDose: "1",
  unit: "test",
  route: "Blood draw",
  frequencies: ["STAT", "Once"],
  timeToEffect: 0,
  timeToResult: 45,
  effect: { type: "procedure", duration: 0, isCorrectTreatment: true, severityChange: 0 },
};

/** Procalcitonin */
export const pctLab: OrderDefinition = {
  id: "pct",
  name: "Procalcitonin (PCT)",
  category: "lab",
  subcategory: "infection",
  defaultDose: "1",
  unit: "test",
  route: "Blood draw",
  frequencies: ["STAT", "Q12H", "Q24H"],
  timeToEffect: 0,
  timeToResult: 60,
  effect: { type: "procedure", duration: 0, isCorrectTreatment: true, severityChange: 0 },
};

/** CRP (C-Reactive Protein) */
export const crpLab: OrderDefinition = {
  id: "crp",
  name: "CRP (C-Reactive Protein)",
  category: "lab",
  subcategory: "infection",
  defaultDose: "1",
  unit: "test",
  route: "Blood draw",
  frequencies: ["STAT", "Q12H", "Q24H"],
  timeToEffect: 0,
  timeToResult: 45,
  effect: { type: "procedure", duration: 0, isCorrectTreatment: true, severityChange: 0 },
};

/** ESR (Erythrocyte Sedimentation Rate) */
export const esrLab: OrderDefinition = {
  id: "esr",
  name: "ESR (Erythrocyte Sedimentation Rate)",
  category: "lab",
  subcategory: "infection",
  defaultDose: "1",
  unit: "test",
  route: "Blood draw",
  frequencies: ["STAT", "Q24H"],
  timeToEffect: 0,
  timeToResult: 60,
  effect: { type: "procedure", duration: 0, isCorrectTreatment: true, severityChange: 0 },
};

/** Magnesium */
export const mgLab: OrderDefinition = {
  id: "mg",
  name: "Mg (Magnesium)",
  category: "lab",
  subcategory: "chemistry",
  defaultDose: "1",
  unit: "test",
  route: "Blood draw",
  frequencies: ["STAT", "Q6H", "Q8H", "Q12H"],
  timeToEffect: 0,
  timeToResult: 35,
  effect: { type: "procedure", duration: 0, isCorrectTreatment: true, severityChange: 0 },
};

/** Phosphate */
export const phosphateLab: OrderDefinition = {
  id: "phosphate",
  name: "Phosphate (PO₄)",
  category: "lab",
  subcategory: "chemistry",
  defaultDose: "1",
  unit: "test",
  route: "Blood draw",
  frequencies: ["STAT", "Q8H", "Q12H"],
  timeToEffect: 0,
  timeToResult: 35,
  effect: { type: "procedure", duration: 0, isCorrectTreatment: true, severityChange: 0 },
};

/** AST */
export const astLab: OrderDefinition = {
  id: "ast",
  name: "AST (Aspartate Aminotransferase)",
  category: "lab",
  subcategory: "chemistry",
  defaultDose: "1",
  unit: "test",
  route: "Blood draw",
  frequencies: ["STAT", "Q12H", "Q24H"],
  timeToEffect: 0,
  timeToResult: 45,
  effect: { type: "procedure", duration: 0, isCorrectTreatment: true, severityChange: 0 },
};

/** ALT */
export const altLab: OrderDefinition = {
  id: "alt",
  name: "ALT (Alanine Aminotransferase)",
  category: "lab",
  subcategory: "chemistry",
  defaultDose: "1",
  unit: "test",
  route: "Blood draw",
  frequencies: ["STAT", "Q12H", "Q24H"],
  timeToEffect: 0,
  timeToResult: 45,
  effect: { type: "procedure", duration: 0, isCorrectTreatment: true, severityChange: 0 },
};

/** LDH */
export const ldhLab: OrderDefinition = {
  id: "ldh",
  name: "LDH (Lactate Dehydrogenase)",
  category: "lab",
  subcategory: "chemistry",
  defaultDose: "1",
  unit: "test",
  route: "Blood draw",
  frequencies: ["STAT", "Q24H"],
  timeToEffect: 0,
  timeToResult: 45,
  effect: { type: "procedure", duration: 0, isCorrectTreatment: true, severityChange: 0 },
};

/** Uric Acid */
export const uricAcidLab: OrderDefinition = {
  id: "uric_acid",
  name: "Uric Acid",
  category: "lab",
  subcategory: "chemistry",
  defaultDose: "1",
  unit: "test",
  route: "Blood draw",
  frequencies: ["STAT", "Q24H"],
  timeToEffect: 0,
  timeToResult: 45,
  effect: { type: "procedure", duration: 0, isCorrectTreatment: true, severityChange: 0 },
};

/** Thrombin Time */
export const thrombinTimeLab: OrderDefinition = {
  id: "thrombin_time",
  name: "Thrombin Time (TT)",
  category: "lab",
  subcategory: "coagulation",
  defaultDose: "1",
  unit: "test",
  route: "Blood draw (blue-top)",
  frequencies: ["STAT", "Q6H"],
  timeToEffect: 0,
  timeToResult: 45,
  effect: { type: "procedure", duration: 0, isCorrectTreatment: true, severityChange: 0 },
};

/** Ammonia */
export const ammoniaLab: OrderDefinition = {
  id: "ammonia",
  name: "Ammonia",
  category: "lab",
  subcategory: "chemistry",
  defaultDose: "1",
  unit: "test",
  route: "Blood draw (on ice)",
  frequencies: ["STAT", "Q12H"],
  timeToEffect: 0,
  timeToResult: 30,
  effect: { type: "procedure", duration: 0, isCorrectTreatment: true, severityChange: 0 },
};

/** Urinalysis */
export const urinalysisLab: OrderDefinition = {
  id: "urinalysis",
  name: "Urinalysis (UA)",
  category: "lab",
  subcategory: "urine",
  defaultDose: "1",
  unit: "sample",
  route: "Urine collection",
  frequencies: ["STAT", "Once"],
  timeToEffect: 0,
  timeToResult: 30,
  effect: { type: "procedure", duration: 0, isCorrectTreatment: true, severityChange: 0 },
};

/** Urine Electrolytes / FeNa */
export const urineElectrolytesLab: OrderDefinition = {
  id: "urine_electrolytes",
  name: "Urine Na / FeNa",
  category: "lab",
  subcategory: "urine",
  defaultDose: "1",
  unit: "sample",
  route: "Urine collection + Blood draw",
  frequencies: ["STAT", "Once"],
  timeToEffect: 0,
  timeToResult: 45,
  effect: { type: "procedure", duration: 0, isCorrectTreatment: true, severityChange: 0 },
};

/** SvO₂ (Mixed Venous Oxygen Saturation) — BioGears native */
export const svo2Lab: OrderDefinition = {
  id: "svo2",
  name: "SvO₂ (Mixed Venous O₂ Saturation)",
  category: "lab",
  subcategory: "blood_gas",
  defaultDose: "1",
  unit: "draw",
  route: "PA catheter / Central line",
  frequencies: ["STAT", "Q2H", "Q4H"],
  timeToEffect: 0,
  timeToResult: 10,
  effect: { type: "procedure", duration: 0, isCorrectTreatment: true, severityChange: 0 },
};

/** Total Calcium — BioGears native */
export const totalCaLab: OrderDefinition = {
  id: "total_ca",
  name: "Total Ca (Calcium)",
  category: "lab",
  subcategory: "chemistry",
  defaultDose: "1",
  unit: "test",
  route: "Blood draw",
  frequencies: ["STAT", "Q6H", "Q12H"],
  timeToEffect: 0,
  timeToResult: 35,
  effect: { type: "procedure", duration: 0, isCorrectTreatment: true, severityChange: 0 },
};

/** Albumin — BioGears native */
export const albuminLab: OrderDefinition = {
  id: "albumin",
  name: "Albumin",
  category: "lab",
  subcategory: "chemistry",
  defaultDose: "1",
  unit: "test",
  route: "Blood draw",
  frequencies: ["STAT", "Q12H", "Q24H"],
  timeToEffect: 0,
  timeToResult: 45,
  effect: { type: "procedure", duration: 0, isCorrectTreatment: true, severityChange: 0 },
};

/** Total Bilirubin — BioGears native */
export const tbilLab: OrderDefinition = {
  id: "tbil",
  name: "T-Bil (Total Bilirubin)",
  category: "lab",
  subcategory: "chemistry",
  defaultDose: "1",
  unit: "test",
  route: "Blood draw",
  frequencies: ["STAT", "Q12H", "Q24H"],
  timeToEffect: 0,
  timeToResult: 45,
  effect: { type: "procedure", duration: 0, isCorrectTreatment: true, severityChange: 0 },
};

// ============================================================
// ALL LABS EXPORT
// ============================================================

export const allLabs: OrderDefinition[] = [
  // Bundles
  cbcLab,
  abgLab,
  // Individual chemistry
  naLab,
  kLab,
  clLab,
  // co2Lab removed from allLabs (Session 051: ABG covers PaCO₂/HCO₃)
  bunLab,
  crLab,
  glucoseLab,
  mgLab,
  phosphateLab,
  astLab,
  altLab,
  ldhLab,
  uricAcidLab,
  ammoniaLab,
  totalCaLab,
  albuminLab,
  tbilLab,
  // Individual coagulation
  ptInrLab,
  apttLab,
  fibrinogenLab,
  ddimerLab,
  thrombinTimeLab,
  // Blood gas
  lactateLab,
  iCaLab,
  svo2Lab,
  // Individual others
  actLab,
  troponinLab,
  ntprobnpLab,
  ckmbLab,
  typeScreenLab,
  bloodCultureLab,
  tegLab,
  rotemLab,
  // Infection markers
  pctLab,
  crpLab,
  esrLab,
  // Urine
  urinalysisLab,
  urineElectrolytesLab,
];

export const labCategories = {
  hematology: [cbcLab],
  blood_gas: [abgLab, lactateLab, iCaLab, svo2Lab],
  // co2Lab removed: ABG already provides PaCO₂/HCO₃ (Session 051 decision)
  chemistry: [naLab, kLab, clLab, bunLab, crLab, glucoseLab, mgLab, phosphateLab, astLab, altLab, ldhLab, uricAcidLab, ammoniaLab, totalCaLab, albuminLab, tbilLab],
  coagulation: [ptInrLab, apttLab, fibrinogenLab, ddimerLab, thrombinTimeLab, actLab, tegLab, rotemLab],
  cardiac: [troponinLab, ntprobnpLab, ckmbLab],
  blood_bank: [typeScreenLab],
  microbiology: [bloodCultureLab],
  infection: [pctLab, crpLab, esrLab],
  urine: [urinalysisLab, urineElectrolytesLab],
};

/**
 * 術後出血情境必開 Labs（Critical Actions 用）
 */
export const CRITICAL_LABS_POSTOP_BLEEDING = [
  "cbc",
  "pt_inr",
  "aptt",
  "fibrinogen",
  "abg",
  "lactate",
  "ica",
  "act",
] as const;

export const getLabById = (id: string): OrderDefinition | undefined =>
  allLabs.find((l) => l.id === id);
