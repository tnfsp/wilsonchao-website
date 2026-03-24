// ICU 模擬器 — 藥物定義
// 包含完整 Guard Rails + Drug Interactions

import type { OrderDefinition, Pathology } from "../types";

// ============================================================
// VASOPRESSORS
// ============================================================

export const norepinephrine: OrderDefinition = {
  id: "norepinephrine",
  name: "Norepinephrine (Levophed)",
  category: "medication",
  subcategory: "vasopressor",
  defaultDose: "0.05",
  unit: "mcg/kg/min",
  route: "IV central",
  frequencies: ["Continuous"],
  timeToEffect: 5,
  guardRail: {
    min: 0.01,
    max: 1.0,
    warnAbove: 0.3,
    rejectAbove: 1.0,
    warnMessage: "醫師，Norepinephrine 已到 0.3 mcg/kg/min，這個劑量有點高欸，確定要繼續嗎？",
    rejectMessage: "醫師，這個劑量超過 1.0 mcg/kg/min 太高了，藥局不會配，要不要重開？",
    interactions: [
      {
        withDrug: "epinephrine",
        message: "同時使用 Norepinephrine + Epinephrine：加乘升壓效果，注意心律不整風險。",
        severity: "warning",
      },
    ],
  },
  effect: {
    type: "vasopressor",
    duration: 0, // continuous
    isCorrectTreatment: true,
    vitalChanges: { sbp: 15, dbp: 10, map: 12, hr: 5 },
    severityChange: -5,
  },
  scenarioOverrides: {
    septic_shock: { isCorrectTreatment: true, severityChange: -8 },
  },
};

export const epinephrine: OrderDefinition = {
  id: "epinephrine",
  name: "Epinephrine (Adrenaline)",
  category: "medication",
  subcategory: "vasopressor",
  defaultDose: "0.05",
  unit: "mcg/kg/min",
  route: "IV central",
  frequencies: ["Continuous"],
  timeToEffect: 3,
  guardRail: {
    min: 0.01,
    max: 0.5,
    warnAbove: 0.2,
    rejectAbove: 0.5,
    warnMessage: "醫師，Epinephrine 已到 0.2 mcg/kg/min，注意心律不整風險，確定嗎？",
    rejectMessage: "醫師，Epinephrine 超過 0.5 mcg/kg/min 太高，不建議開這個劑量。",
    interactions: [
      {
        withDrug: "norepinephrine",
        message: "同時使用 Epinephrine + Norepinephrine：加乘升壓效果，監測心律。",
        severity: "warning",
      },
    ],
  },
  effect: {
    type: "vasopressor",
    duration: 0,
    isCorrectTreatment: true,
    vitalChanges: { sbp: 20, dbp: 8, map: 15, hr: 15 },
    severityChange: -4,
  },
};

export const vasopressin: OrderDefinition = {
  id: "vasopressin",
  name: "Vasopressin (ADH)",
  category: "medication",
  subcategory: "vasopressor",
  defaultDose: "0.03",
  unit: "units/min",
  route: "IV central",
  frequencies: ["Continuous"],
  timeToEffect: 5,
  guardRail: {
    min: 0.01,
    max: 0.06,
    warnAbove: 0.04,
    rejectAbove: 0.06,
    warnMessage: "醫師，Vasopressin 超過 0.04 units/min 是 off-label 高劑量，確定嗎？",
    rejectMessage: "醫師，Vasopressin 不能超過 0.06 units/min，會有嚴重缺血風險。",
  },
  effect: {
    type: "vasopressor",
    duration: 0,
    isCorrectTreatment: true,
    vitalChanges: { sbp: 12, dbp: 8, map: 9, hr: -2 },
    severityChange: -3,
  },
  scenarioOverrides: {
    septic_shock: { isCorrectTreatment: true, severityChange: -5 },
  },
};

export const dopamine: OrderDefinition = {
  id: "dopamine",
  name: "Dopamine",
  category: "medication",
  subcategory: "vasopressor",
  defaultDose: "5",
  unit: "mcg/kg/min",
  route: "IV central",
  frequencies: ["Continuous"],
  timeToEffect: 5,
  guardRail: {
    min: 2,
    max: 25,
    warnAbove: 15,
    rejectAbove: 25,
    warnMessage: "醫師，Dopamine > 15 mcg/kg/min 心律不整風險明顯增加，確定嗎？",
    rejectMessage: "醫師，Dopamine 超過 25 mcg/kg/min 太高，要不要重開？",
  },
  effect: {
    type: "vasopressor",
    duration: 0,
    isCorrectTreatment: false, // 心外首選 Norepinephrine
    vitalChanges: { sbp: 10, dbp: 5, map: 7, hr: 12 },
  },
};

// ============================================================
// INOTROPES
// ============================================================

export const dobutamine: OrderDefinition = {
  id: "dobutamine",
  name: "Dobutamine",
  category: "medication",
  subcategory: "inotrope",
  defaultDose: "5",
  unit: "mcg/kg/min",
  route: "IV central",
  frequencies: ["Continuous"],
  timeToEffect: 5,
  guardRail: {
    min: 2.5,
    max: 25,
    warnAbove: 15,
    rejectAbove: 25,
    warnMessage: "醫師，Dobutamine > 15 mcg/kg/min 可能誘發心律不整，確定嗎？",
    rejectMessage: "醫師，Dobutamine 超過 25 mcg/kg/min 超出一般範圍，不開。",
    interactions: [
      {
        withDrug: "milrinone",
        message: "Dobutamine + Milrinone 同時使用：加乘正性肌力效果，注意低血壓與心律不整。",
        severity: "warning",
      },
    ],
  },
  effect: {
    type: "inotrope",
    duration: 0,
    isCorrectTreatment: true,
    vitalChanges: { hr: 10, sbp: 8, map: 5 },
  },
};

export const milrinone: OrderDefinition = {
  id: "milrinone",
  name: "Milrinone (Primacor)",
  category: "medication",
  subcategory: "inotrope",
  defaultDose: "0.375",
  unit: "mcg/kg/min",
  route: "IV central",
  frequencies: ["Continuous"],
  timeToEffect: 10,
  guardRail: {
    min: 0.125,
    max: 1.0,
    warnAbove: 0.5,
    rejectAbove: 1.0,
    warnMessage: "醫師，Milrinone > 0.5 mcg/kg/min 低血壓風險增加，確定嗎？",
    rejectMessage: "醫師，Milrinone 超過 1.0 mcg/kg/min 不建議，要不要重開？",
    interactions: [
      {
        withDrug: "dobutamine",
        message: "Milrinone + Dobutamine：協同正性肌力，但血管擴張效果加乘，注意低血壓。",
        severity: "warning",
      },
    ],
  },
  effect: {
    type: "inotrope",
    duration: 0,
    isCorrectTreatment: true,
    vitalChanges: { hr: 5, sbp: 5, map: 3, cvp: -2 },
  },
};

// ============================================================
// HEMOSTATICS（心外特有！）
// ============================================================

export const protamine: OrderDefinition = {
  id: "protamine",
  name: "Protamine Sulfate",
  category: "hemostatic",
  subcategory: "heparin_reversal",
  defaultDose: "50",
  unit: "mg",
  route: "IV slow push",
  frequencies: ["STAT", "Once"],
  timeToEffect: 10,
  guardRail: {
    min: 10,
    max: 100,
    warnAbove: 50,
    rejectAbove: 100,
    warnMessage: "醫師，Protamine 超過 50 mg — 推太快或劑量太高可能造成低血壓、過敏反應，確定？",
    rejectMessage: "醫師，Protamine 超過 100 mg 單次劑量太高了。",
    interactions: [
      {
        withDrug: "heparin",
        message: "Protamine 用於中和 Heparin，推注速度不可超過 5 mg/min，否則可能低血壓/支氣管痙攣。",
        severity: "info",
      },
    ],
  },
  effect: {
    type: "hemostatic",
    duration: 60,
    isCorrectTreatment: true,
    severityChange: -8,
  },
};

export const txa: OrderDefinition = {
  id: "txa",
  name: "Tranexamic Acid (TXA)",
  category: "hemostatic",
  subcategory: "antifibrinolytic",
  defaultDose: "1000",
  unit: "mg",
  route: "IV",
  frequencies: ["Over 10min", "Once"],
  timeToEffect: 15,
  guardRail: {
    min: 500,
    max: 3000,
    warnAbove: 2000,
    rejectAbove: 3000,
    warnMessage: "醫師，TXA 超過 2g 單次不常見，確定嗎？",
    rejectMessage: "醫師，TXA 單次不超過 3g。",
    interactions: [
      {
        withDrug: "aminocaproic_acid",
        message: "TXA + Aminocaproic acid：同類藥物，不建議同時使用。",
        severity: "block",
      },
    ],
  },
  effect: {
    type: "hemostatic",
    duration: 90,
    isCorrectTreatment: true,
    severityChange: -10,
  },
};

export const aminocaproicAcid: OrderDefinition = {
  id: "aminocaproic_acid",
  name: "Aminocaproic Acid (Amicar)",
  category: "hemostatic",
  subcategory: "antifibrinolytic",
  defaultDose: "5000",
  unit: "mg",
  route: "IV",
  frequencies: ["Loading then 1g/hr", "Once"],
  timeToEffect: 20,
  guardRail: {
    min: 1000,
    max: 10000,
    warnAbove: 5000,
    rejectAbove: 10000,
    warnMessage: "醫師，Aminocaproic acid loading dose 確認是 5g 嗎？",
    rejectMessage: "醫師，Aminocaproic acid 超過 10g 劑量不對。",
    interactions: [
      {
        withDrug: "txa",
        message: "Aminocaproic acid + TXA：同類藥物，不建議同時使用。",
        severity: "block",
      },
    ],
  },
  effect: {
    type: "hemostatic",
    duration: 120,
    isCorrectTreatment: true,
    severityChange: -8,
  },
};

export const ddavp: OrderDefinition = {
  id: "ddavp",
  name: "DDAVP (Desmopressin)",
  category: "hemostatic",
  subcategory: "platelet_enhancer",
  defaultDose: "0.3",
  unit: "mcg/kg",
  route: "IV",
  frequencies: ["Over 30min", "Once"],
  timeToEffect: 30,
  guardRail: {
    min: 0.1,
    max: 0.4,
    warnAbove: 0.3,
    rejectAbove: 0.4,
    warnMessage: "醫師，DDAVP 劑量確認是 0.3 mcg/kg 嗎？注意低血壓與低血鈉。",
    rejectMessage: "醫師，DDAVP 超過 0.4 mcg/kg 不建議。",
  },
  effect: {
    type: "hemostatic",
    duration: 240,
    isCorrectTreatment: true,
    severityChange: -5,
  },
};

export const vitaminK: OrderDefinition = {
  id: "vitamin_k",
  name: "Vitamin K (Phytonadione)",
  category: "hemostatic",
  subcategory: "warfarin_reversal",
  defaultDose: "10",
  unit: "mg",
  route: "IV slow",
  frequencies: ["Once", "Q24H"],
  timeToEffect: 360, // 6 hours for warfarin reversal
  guardRail: {
    min: 1,
    max: 25,
    warnAbove: 10,
    rejectAbove: 25,
    warnMessage: "醫師，Vitamin K > 10 mg 有 anaphylaxis 風險，要慢推，確定嗎？",
    rejectMessage: "醫師，Vitamin K 超過 25 mg 太高了。",
  },
  effect: {
    type: "hemostatic",
    duration: 480,
    isCorrectTreatment: true,
    severityChange: -3,
  },
};

// ============================================================
// FLUIDS
// ============================================================

export const normalSaline: OrderDefinition = {
  id: "ns",
  name: "0.9% Normal Saline (NS)",
  category: "fluid",
  defaultDose: "500",
  unit: "mL",
  route: "IV",
  frequencies: ["Bolus", "Over 1hr", "Over 4hr", "Over 8hr"],
  timeToEffect: 10,
  guardRail: {
    min: 100,
    max: 2000,
    warnAbove: 1000,
    rejectAbove: 2000,
    warnMessage: "醫師，NS 1L 以上要評估 volume status，cardiogenic shock 要小心欸。",
    rejectMessage: "醫師，單次超過 2L 不安全，分次開吧。",
  },
  effect: {
    type: "fluid",
    duration: 60,
    isCorrectTreatment: true,
    vitalChanges: { sbp: 8, map: 5, cvp: 2 },
  },
};

export const lactatedRingers: OrderDefinition = {
  id: "lr",
  name: "Lactated Ringer's (LR)",
  category: "fluid",
  defaultDose: "500",
  unit: "mL",
  route: "IV",
  frequencies: ["Bolus", "Over 1hr", "Over 4hr", "Over 8hr"],
  timeToEffect: 10,
  guardRail: {
    min: 100,
    max: 2000,
    warnAbove: 1000,
    rejectAbove: 2000,
    warnMessage: "醫師，LR 1L 以上要評估 volume status，確定嗎？",
    rejectMessage: "醫師，單次超過 2L 不安全，分次開吧。",
  },
  effect: {
    type: "fluid",
    duration: 60,
    isCorrectTreatment: true,
    vitalChanges: { sbp: 8, map: 5, cvp: 2 },
  },
};

export const albumin5: OrderDefinition = {
  id: "albumin_5",
  name: "5% Albumin",
  category: "fluid",
  defaultDose: "250",
  unit: "mL",
  route: "IV",
  frequencies: ["Over 1hr", "Over 2hr", "Over 4hr"],
  timeToEffect: 20,
  guardRail: {
    min: 100,
    max: 500,
    warnAbove: 500,
    rejectAbove: 1000,
    warnMessage: "醫師，Albumin 單次 500 mL 確認這是必要的嗎？",
    rejectMessage: "醫師，Albumin 單次超過 1L 不建議。",
  },
  effect: {
    type: "fluid",
    duration: 120,
    isCorrectTreatment: true,
    vitalChanges: { sbp: 10, map: 7, cvp: 3 },
  },
};

// ============================================================
// ELECTROLYTES
// ============================================================

export const calciumGluconate: OrderDefinition = {
  id: "calcium_gluconate",
  name: "Calcium Gluconate",
  category: "electrolyte",
  defaultDose: "1000",
  unit: "mg",
  route: "IV peripheral or central",
  frequencies: ["Over 10min", "Over 30min", "PRN", "STAT"],
  timeToEffect: 5,
  guardRail: {
    min: 500,
    max: 3000,
    warnAbove: 2000,
    rejectAbove: 3000,
    warnMessage: "醫師，Calcium gluconate > 2g 確認適應症嗎？",
    rejectMessage: "醫師，Calcium gluconate 超過 3g 單次不建議。",
    interactions: [
      {
        withDrug: "calcium_chloride",
        message: "不建議同時使用兩種 Calcium 製劑，會重複給藥。",
        severity: "block",
      },
    ],
  },
  effect: {
    type: "electrolyte",
    duration: 30,
    isCorrectTreatment: true,
    vitalChanges: { sbp: 5, map: 3 },
  },
};

export const calciumChloride: OrderDefinition = {
  id: "calcium_chloride",
  name: "Calcium Chloride (10%)",
  category: "electrolyte",
  defaultDose: "1000",
  unit: "mg",
  route: "IV central ONLY",
  frequencies: ["Over 10min", "STAT", "PRN"],
  timeToEffect: 3,
  guardRail: {
    min: 500,
    max: 2000,
    warnAbove: 1000,
    rejectAbove: 2000,
    warnMessage: "⚠️ Calcium Chloride 必須走中央靜脈（CVC/arterial line）！外周注射會造成嚴重組織壞死。確認是中央靜脈嗎？",
    rejectMessage: "醫師，Calcium Chloride 超過 2g 不建議。",
    interactions: [
      {
        withDrug: "calcium_gluconate",
        message: "不建議同時使用兩種 Calcium 製劑。",
        severity: "block",
      },
    ],
  },
  effect: {
    type: "electrolyte",
    duration: 30,
    isCorrectTreatment: true,
    vitalChanges: { sbp: 8, map: 5 },
  },
};

export const kclIV: OrderDefinition = {
  id: "kcl_iv",
  name: "KCl (Potassium Chloride)",
  category: "electrolyte",
  defaultDose: "20",
  unit: "mEq",
  route: "IV central (≥20 mEq) or peripheral (≤10 mEq/hr)",
  frequencies: ["Over 1hr", "Over 2hr", "Over 4hr"],
  timeToEffect: 30,
  guardRail: {
    min: 10,
    max: 40,
    warnAbove: 20,
    rejectAbove: 40,
    warnMessage: "醫師，KCl > 20 mEq 需要中央靜脈，速度不可超過 20 mEq/hr（致命心律不整風險！），確定嗎？",
    rejectMessage: "醫師，KCl 單次超過 40 mEq 太高，危險！",
  },
  effect: {
    type: "electrolyte",
    duration: 60,
    isCorrectTreatment: true,
    severityChange: -2,
  },
};

export const mgso4: OrderDefinition = {
  id: "mgso4",
  name: "MgSO4 (Magnesium Sulfate)",
  category: "electrolyte",
  defaultDose: "2000",
  unit: "mg",
  route: "IV",
  frequencies: ["Over 30min", "Over 1hr", "Over 2hr"],
  timeToEffect: 20,
  guardRail: {
    min: 1000,
    max: 4000,
    warnAbove: 2000,
    rejectAbove: 4000,
    warnMessage: "醫師，MgSO4 > 2g 注意低血壓與呼吸抑制，確定嗎？",
    rejectMessage: "醫師，MgSO4 超過 4g 單次不建議。",
  },
  effect: {
    type: "electrolyte",
    duration: 90,
    isCorrectTreatment: true,
    vitalChanges: { hr: -5 },
    severityChange: -2,
  },
};

// ============================================================
// DIURETICS
// ============================================================

export const furosemide: OrderDefinition = {
  id: "furosemide",
  name: "Furosemide (Lasix)",
  category: "medication",
  subcategory: "diuretic",
  defaultDose: "40",
  unit: "mg",
  route: "IV",
  frequencies: ["STAT", "Q8H", "Q12H", "Q24H", "Continuous"],
  timeToEffect: 15,
  guardRail: {
    min: 10,
    max: 200,
    warnAbove: 80,
    rejectAbove: 200,
    warnMessage: "醫師，Furosemide > 80 mg 單次，確認腎功能正常嗎？",
    rejectMessage: "醫師，Furosemide 單次超過 200 mg IV，考慮改 continuous infusion。",
  },
  effect: {
    type: "fluid",
    duration: 180,
    isCorrectTreatment: false, // 出血情境中利尿不正確
    vitalChanges: { cvp: -2 },
  },
};

// ============================================================
// ANTIBIOTICS
// ============================================================

export const ceftriaxone: OrderDefinition = {
  id: "ceftriaxone",
  name: "Ceftriaxone (Rocephin)",
  category: "medication",
  subcategory: "antibiotic",
  defaultDose: "2",
  unit: "g",
  route: "IV",
  frequencies: ["Q24H", "Q12H"],
  timeToEffect: 60,
  guardRail: {
    min: 1,
    max: 4,
    warnAbove: 2,
    rejectAbove: 4,
    warnMessage: "醫師，Ceftriaxone 單次 > 2g，確認一天總劑量不超過 4g 嗎？",
    rejectMessage: "醫師，Ceftriaxone 超過 4g 不建議。",
  },
  effect: {
    type: "procedure",
    duration: 0,
    isCorrectTreatment: false,
    severityChange: 0,
  },
  scenarioOverrides: {
    septic_shock: { isCorrectTreatment: true, severityChange: -6 },
  },
};

export const pipTazo: OrderDefinition = {
  id: "piptazo",
  name: "Piperacillin/Tazobactam (Zosyn)",
  category: "medication",
  subcategory: "antibiotic",
  defaultDose: "4.5",
  unit: "g",
  route: "IV",
  frequencies: ["Q6H", "Q8H"],
  timeToEffect: 60,
  guardRail: {
    min: 2.25,
    max: 4.5,
    warnAbove: 4.5,
    rejectAbove: 9,
    warnMessage: "醫師，Pip/Tazo 單次 4.5g，確認腎功能嗎？",
    rejectMessage: "醫師，Pip/Tazo 單次超過 9g 不建議。",
  },
  effect: {
    type: "procedure",
    duration: 0,
    isCorrectTreatment: false,
    severityChange: 0,
  },
  scenarioOverrides: {
    septic_shock: { isCorrectTreatment: true, severityChange: -10 },
  },
};

export const vancomycin: OrderDefinition = {
  id: "vancomycin",
  name: "Vancomycin",
  category: "medication",
  subcategory: "antibiotic",
  defaultDose: "1",
  unit: "g",
  route: "IV",
  frequencies: ["Q12H", "Q24H", "Q8H"],
  timeToEffect: 60,
  guardRail: {
    min: 0.5,
    max: 3,
    warnAbove: 2,
    rejectAbove: 3,
    warnMessage: "醫師，Vancomycin 單次 > 2g，確認腎功能 + 先抽 trough level？",
    rejectMessage: "醫師，Vancomycin 單次超過 3g 不建議，腎毒性風險。",
  },
  effect: {
    type: "procedure",
    duration: 0,
    isCorrectTreatment: false,
    severityChange: 0,
  },
  scenarioOverrides: {
    septic_shock: { isCorrectTreatment: true, severityChange: -8 },
  },
};

// ============================================================
// SEDATION / ANALGESICS
// ============================================================

export const propofol: OrderDefinition = {
  id: "propofol",
  name: "Propofol (Diprivan)",
  category: "medication",
  subcategory: "sedation",
  defaultDose: "5",
  unit: "mcg/kg/min",
  route: "IV central",
  frequencies: ["Continuous"],
  timeToEffect: 3,
  guardRail: {
    min: 1,
    max: 80,
    warnAbove: 50,
    rejectAbove: 80,
    warnMessage: "醫師，Propofol > 50 mcg/kg/min 高劑量，注意 Propofol Infusion Syndrome（PRIS）風險，確定嗎？",
    rejectMessage: "醫師，Propofol 超過 80 mcg/kg/min 不建議，PRIS 風險很高。",
  },
  effect: {
    type: "procedure",
    duration: 0,
    isCorrectTreatment: true,
    vitalChanges: { hr: -5, sbp: -10, map: -8 },
  },
};

export const fentanyl: OrderDefinition = {
  id: "fentanyl",
  name: "Fentanyl",
  category: "medication",
  subcategory: "analgesic",
  defaultDose: "25",
  unit: "mcg/hr",
  route: "IV",
  frequencies: ["Continuous", "PRN", "Q1H PRN"],
  timeToEffect: 5,
  guardRail: {
    min: 12.5,
    max: 200,
    warnAbove: 100,
    rejectAbove: 200,
    warnMessage: "醫師，Fentanyl > 100 mcg/hr，確認鎮靜深度嗎？",
    rejectMessage: "醫師，Fentanyl 超過 200 mcg/hr 不建議。",
  },
  effect: {
    type: "procedure",
    duration: 0,
    isCorrectTreatment: true,
    vitalChanges: { hr: -3 },
  },
};

export const midazolam: OrderDefinition = {
  id: "midazolam",
  name: "Midazolam (Versed)",
  category: "medication",
  subcategory: "sedation",
  defaultDose: "2",
  unit: "mg/hr",
  route: "IV",
  frequencies: ["Continuous", "PRN", "STAT"],
  timeToEffect: 5,
  guardRail: {
    min: 1,
    max: 20,
    warnAbove: 10,
    rejectAbove: 20,
    warnMessage: "醫師，Midazolam > 10 mg/hr 高劑量，注意低血壓，確定嗎？",
    rejectMessage: "醫師，Midazolam 超過 20 mg/hr 不建議。",
    interactions: [
      {
        withDrug: "propofol",
        message: "Midazolam + Propofol 同時使用：加乘鎮靜效果，低血壓風險增加。",
        severity: "warning",
      },
    ],
  },
  effect: {
    type: "procedure",
    duration: 0,
    isCorrectTreatment: true,
    vitalChanges: { hr: -5, sbp: -8, map: -6 },
  },
};

// ============================================================
// STEROIDS
// ============================================================

export const hydrocortisone: OrderDefinition = {
  id: "hydrocortisone",
  name: "Hydrocortisone",
  category: "medication",
  subcategory: "steroid",
  defaultDose: "50",
  unit: "mg",
  route: "IV",
  frequencies: ["Q6H", "Q8H", "Q12H"],
  timeToEffect: 30,
  guardRail: {
    min: 25,
    max: 200,
    warnAbove: 100,
    rejectAbove: 200,
    warnMessage: "醫師，Hydrocortisone > 100 mg 單次，確認是 stress dose 嗎？",
    rejectMessage: "醫師，Hydrocortisone 超過 200 mg 單次不建議。",
  },
  effect: {
    type: "procedure",
    duration: 240,
    isCorrectTreatment: false,
    vitalChanges: { sbp: 5, map: 3 },
    severityChange: -2,
  },
  scenarioOverrides: {
    septic_shock: { isCorrectTreatment: true, severityChange: -4 },
  },
};

// ============================================================
// ALL MEDICATIONS EXPORT
// ============================================================

export const allMedications: OrderDefinition[] = [
  // Vasopressors
  norepinephrine,
  epinephrine,
  vasopressin,
  dopamine,
  // Inotropes
  dobutamine,
  milrinone,
  // Hemostatics
  protamine,
  txa,
  aminocaproicAcid,
  ddavp,
  vitaminK,
  // Fluids
  normalSaline,
  lactatedRingers,
  albumin5,
  // Electrolytes
  calciumGluconate,
  calciumChloride,
  kclIV,
  mgso4,
  // Diuretics
  furosemide,
  // Antibiotics
  ceftriaxone,
  pipTazo,
  vancomycin,
  // Sedation / Analgesics
  propofol,
  fentanyl,
  midazolam,
  // Steroids
  hydrocortisone,
];

export const medicationCategories = {
  vasopressors: [norepinephrine, epinephrine, vasopressin, dopamine],
  inotropes: [dobutamine, milrinone],
  hemostatics: [protamine, txa, aminocaproicAcid, ddavp, vitaminK],
  fluids: [normalSaline, lactatedRingers, albumin5],
  electrolytes: [calciumGluconate, calciumChloride, kclIV, mgso4],
  diuretics: [furosemide],
  antibiotics: [ceftriaxone, pipTazo, vancomycin],
  sedation: [propofol, fentanyl, midazolam],
  steroids: [hydrocortisone],
};

export const getMedicationById = (id: string): OrderDefinition | undefined =>
  allMedications.find((m) => m.id === id);
