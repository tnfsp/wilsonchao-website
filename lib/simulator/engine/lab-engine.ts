/**
 * Dynamic Lab Engine — Compute lab values from BioGears state + game context
 *
 * Architecture:
 *   Lab order placed → snapshot BioGears state → compute after turnaround delay
 *
 * Three data sources:
 *   A. BioGears Native (12 items) — direct from engine
 *   B. Derived (14 items) — formulas from design doc D1-D12
 *   C. Scenario Static (4 items) — troponin, blood culture
 */

import type { BioGearsState } from "./biogears-client";
import type { LabValue } from "../types";

// ============================================================
// Transfusion & medication context (passed from store)
// ============================================================

export interface LabContext {
  /** Total pRBC units transfused */
  prbcUnits: number;
  /** Total FFP units transfused */
  ffpUnits: number;
  /** Total platelet doses transfused */
  plateletDoses: number;
  /** Total cryoprecipitate doses */
  cryoDoses: number;
  /** Total CaCl2 given in mL */
  cacl2_mL: number;
  /** Whether protamine has been administered */
  protamineGiven: boolean;
  /** Total TXA given in grams */
  txaGiven: boolean;
  /** Game time in minutes since start */
  gameTimeMinutes: number;
}

// ============================================================
// Normal ranges for flagging
// ============================================================

interface NormalRange {
  unit: string;
  normal: string;
  low?: number;
  high?: number;
  criticalLow?: number;
  criticalHigh?: number;
}

const RANGES: Record<string, NormalRange> = {
  // CBC
  hgb:         { unit: "g/dL",    normal: "12-17",    low: 12,  high: 17,  criticalLow: 7,   criticalHigh: 20 },
  hct:         { unit: "%",       normal: "36-51",    low: 36,  high: 51,  criticalLow: 21,  criticalHigh: 60 },
  plt:         { unit: "×10³/μL", normal: "150-400",  low: 150, high: 400, criticalLow: 50,  criticalHigh: 1000 },
  wbc:         { unit: "×10³/μL", normal: "4.5-11",   low: 4.5, high: 11,  criticalLow: 2,   criticalHigh: 30 },
  // Coag
  pt:          { unit: "sec",     normal: "11-13.5",  low: 11,  high: 13.5, criticalHigh: 30 },
  inr:         { unit: "",        normal: "0.9-1.1",  high: 1.1, criticalHigh: 3.0 },
  aptt:        { unit: "sec",     normal: "25-35",    low: 25,  high: 35,  criticalHigh: 100 },
  fibrinogen:  { unit: "mg/dL",   normal: "200-400",  low: 200, high: 400, criticalLow: 100 },
  // ABG
  pH:          { unit: "",        normal: "7.35-7.45", low: 7.35, high: 7.45, criticalLow: 7.2, criticalHigh: 7.6 },
  pao2:        { unit: "mmHg",    normal: "80-100",   low: 80,  high: 100, criticalLow: 60 },
  paco2:       { unit: "mmHg",    normal: "35-45",    low: 35,  high: 45,  criticalLow: 20,  criticalHigh: 60 },
  hco3:        { unit: "mEq/L",   normal: "22-26",    low: 22,  high: 26,  criticalLow: 15,  criticalHigh: 35 },
  be:          { unit: "mEq/L",   normal: "-2 to +2", low: -2,  high: 2,   criticalLow: -10, criticalHigh: 10 },
  lactate:     { unit: "mg/dL",   normal: "4.5-19.8", low: 4.5, high: 19.8, criticalHigh: 36 },
  // BCS
  na:          { unit: "mEq/L",   normal: "135-145",  low: 135, high: 145, criticalLow: 120, criticalHigh: 160 },
  k:           { unit: "mEq/L",   normal: "3.5-5.0",  low: 3.5, high: 5.0, criticalLow: 2.5, criticalHigh: 6.0 },
  cl:          { unit: "mEq/L",   normal: "98-106",   low: 98,  high: 106 },
  bun:         { unit: "mg/dL",   normal: "7-20",     low: 7,   high: 20 },
  cr:          { unit: "mg/dL",   normal: "0.7-1.3",  low: 0.7, high: 1.3, criticalHigh: 4.0 },
  glucose:     { unit: "mg/dL",   normal: "70-110",   low: 70,  high: 110, criticalLow: 40,  criticalHigh: 400 },
  // Ionized Calcium
  ica:         { unit: "mmol/L",  normal: "1.10-1.30", low: 1.10, high: 1.30, criticalLow: 0.9 },
  // ACT
  act:         { unit: "sec",     normal: "80-120",   low: 80,  high: 120, criticalHigh: 200 },
  // TEG
  teg_r:       { unit: "min",     normal: "5-10",     low: 5,   high: 10 },
  teg_k:       { unit: "min",     normal: "1-3",      low: 1,   high: 3 },
  teg_alpha:   { unit: "°",       normal: "53-72",    low: 53,  high: 72 },
  teg_ma:      { unit: "mm",      normal: "50-70",    low: 50,  high: 70,  criticalLow: 40 },
  teg_ly30:    { unit: "%",       normal: "0-8",      high: 8,  criticalHigh: 15 },
  // Troponin
  troponin_i:  { unit: "ng/mL",   normal: "<0.04",    high: 0.04, criticalHigh: 2.0 },
  ckmb:        { unit: "U/L",     normal: "<25",      high: 25 },
  // UOP
  uop:         { unit: "mL/min",  normal: "0.5-1.0",  low: 0.5, high: 1.0, criticalLow: 0.2 },
};

// ============================================================
// Helpers
// ============================================================

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

function round(v: number, decimals: number = 1): number {
  const f = Math.pow(10, decimals);
  return Math.round(v * f) / f;
}

function flag(value: number, key: string): LabValue["flag"] {
  const r = RANGES[key];
  if (!r) return undefined;

  if (r.criticalLow !== undefined && value < r.criticalLow) return "critical";
  if (r.criticalHigh !== undefined && value > r.criticalHigh) return "critical";
  if (r.low !== undefined && value < r.low) return "L";
  if (r.high !== undefined && value > r.high) return "H";
  return undefined;
}

function labVal(value: number, key: string, decimals: number = 1): LabValue {
  const r = RANGES[key];
  return {
    value: round(value, decimals),
    unit: r?.unit ?? "",
    normal: r?.normal ?? "",
    flag: flag(round(value, decimals), key),
  };
}

// ============================================================
// Derived Formulas (from DESIGN-BIOGEARS-LABS-IMAGING.md)
// ============================================================

/** D1: HCO3 from Henderson-Hasselbalch */
function computeHCO3(pH: number, paCO2: number): number {
  // pH = 6.1 + log10(HCO3 / (0.03 × PaCO2))
  // HCO3 = 0.03 × PaCO2 × 10^(pH - 6.1)
  return 0.03 * paCO2 * Math.pow(10, pH - 6.1);
}

/** D2: Base Excess (Van Slyke simplified) */
function computeBE(pH: number, hco3: number): number {
  return hco3 - 24.4 + (2.3 * (7.4 - pH) * (9.5 + 1.63 * (7.4 - pH)));
}

/** D3: Platelet estimate */
function computePlatelets(bloodVolumeFraction: number, prbcUnits: number, plateletDoses: number): number {
  // Baseline 250, drops with hemodilution and consumption
  const baseline = 250;
  // Dilution: each unit pRBC without platelets dilutes ~5%
  const dilutionFactor = Math.max(0.2, bloodVolumeFraction - (prbcUnits * 0.03));
  // Platelet dose restores ~30k each
  const restoration = plateletDoses * 30;
  // Consumption from bleeding
  const consumptionDrop = Math.max(0, (1 - bloodVolumeFraction) * 150);
  return clamp(baseline * dilutionFactor - consumptionDrop + restoration, 10, 500);
}

/** D4: INR estimate */
function computeINR(
  bloodVolumeFraction: number,
  temperature: number,
  ffpUnits: number,
  prbcUnits: number
): number {
  let inr = 1.0;
  // Hypothermia effect: each °C below 36 adds ~0.15
  if (temperature < 36) {
    inr += (36 - temperature) * 0.15;
  }
  // Hemodilution: massive transfusion without FFP
  const dilutionEffect = Math.max(0, (prbcUnits - ffpUnits) * 0.08);
  inr += dilutionEffect;
  // Volume loss consumption
  if (bloodVolumeFraction < 0.7) {
    inr += (0.7 - bloodVolumeFraction) * 2.5;
  }
  // FFP correction
  inr -= ffpUnits * 0.05;
  return clamp(inr, 0.8, 6.0);
}

/** D5: aPTT (correlated with INR) */
function computeAPTT(inr: number): number {
  // Roughly: aPTT ≈ 28 × INR (simplified)
  return clamp(28 * inr, 20, 180);
}

/** D6: Fibrinogen */
function computeFibrinogen(
  bloodVolumeFraction: number,
  cryoDoses: number,
  prbcUnits: number
): number {
  const baseline = 300;
  // Consumption + dilution
  const loss = Math.max(0, (1 - bloodVolumeFraction) * 200);
  const dilution = prbcUnits * 10;
  // Cryo restores ~50 per dose
  const restoration = cryoDoses * 50;
  return clamp(baseline - loss - dilution + restoration, 30, 600);
}

/** D7: Ionized Calcium — CITRATE TOXICITY MODEL (key teaching point) */
function computeICA(prbcUnits: number, ffpUnits: number, cacl2_mL: number): number {
  const baseline = 1.15;
  // Each unit of blood product (pRBC or FFP) contains ~3g citrate
  // Citrate chelates calcium: ~0.05 mmol/L drop per unit
  const citrateDrop = (prbcUnits + ffpUnits) * 0.05;
  // CaCl2 10% (100mg/mL Ca): each 10mL restores ~0.1 mmol/L
  const calciumRestore = (cacl2_mL / 10) * 0.1;
  return clamp(baseline - citrateDrop + calciumRestore, 0.5, 1.5);
}

/** D8: ACT (Activated Clotting Time) */
function computeACT(protamineGiven: boolean, gameTimeMinutes: number): number {
  // Post-CPB baseline without protamine: ~180-220
  // With protamine: normalizes to ~110-130
  if (protamineGiven) {
    // Protamine normalizes over ~10 min
    return clamp(120 + Math.random() * 10 - 5, 100, 140);
  }
  // Without protamine, ACT stays elevated, slowly drops
  const naturalDecline = Math.min(gameTimeMinutes * 0.5, 40);
  return clamp(200 - naturalDecline + Math.random() * 10 - 5, 140, 220);
}

/** D9: TEG composite */
function computeTEG(
  plt: number,
  fibrinogen: number,
  inr: number,
  txaGiven: boolean
): { r: number; k: number; alpha: number; ma: number; ly30: number } {
  // R-time (clotting initiation): prolonged with high INR
  const r = clamp(5 + (inr - 1.0) * 8, 2, 30);
  // K-time (clot kinetics): prolonged with low fibrinogen
  const k = clamp(2 + Math.max(0, (200 - fibrinogen) / 100) * 4, 0.5, 15);
  // Alpha angle: inversely related to K
  const alpha = clamp(72 - (k - 2) * 6, 20, 80);
  // MA (max amplitude): depends on platelets + fibrinogen
  const ma = clamp(30 + plt * 0.12 + fibrinogen * 0.04, 20, 75);
  // LY30 (fibrinolysis): low normally, TXA keeps it low
  const ly30 = txaGiven ? clamp(1 + Math.random() * 2, 0, 5) : clamp(3 + Math.random() * 5, 0, 20);
  return { r, k, alpha, ma, ly30 };
}

/** D10: WBC */
function computeWBC(gameTimeMinutes: number): number {
  // Post-surgical stress response: baseline elevated 10-14
  const baseline = 12;
  // Slowly normalizes over hours
  const stressBonus = Math.max(0, 3 - gameTimeMinutes * 0.02);
  return clamp(baseline + stressBonus + (Math.random() - 0.5) * 1, 4, 25);
}

/** D11: BUN/Creatinine */
function computeRenalFunction(
  uop_mL_per_min: number,
  bloodVolumeFraction: number,
  gameTimeMinutes: number
): { bun: number; cr: number } {
  const baseBUN = 15;
  const baseCr = 1.0;
  // Renal hypoperfusion increases over time
  const hypoperfusionFactor = uop_mL_per_min < 0.5
    ? Math.min(gameTimeMinutes * 0.02, 3)
    : 0;
  // Blood volume loss → pre-renal azotemia
  const volumeFactor = bloodVolumeFraction < 0.7 ? (0.7 - bloodVolumeFraction) * 10 : 0;
  return {
    bun: clamp(baseBUN + hypoperfusionFactor + volumeFactor, 5, 80),
    cr: clamp(baseCr + hypoperfusionFactor * 0.3 + volumeFactor * 0.2, 0.5, 8),
  };
}

/** D12: Electrolytes */
function computeElectrolytes(
  pH: number,
  bloodVolumeFraction: number
): { na: number; k: number; cl: number; glucose: number } {
  // Na: relatively stable
  const na = clamp(140 + (Math.random() - 0.5) * 2, 130, 155);
  // K: rises with acidosis (0.6 mEq/L per 0.1 pH drop below 7.4)
  let k = 4.0;
  if (pH < 7.4) {
    k += (7.4 - pH) * 6; // 0.6 per 0.1 pH
  }
  // Massive transfusion can raise K (stored blood has high K)
  k = clamp(k + (Math.random() - 0.5) * 0.3, 2.5, 8.0);
  // Cl: follows Na roughly
  const cl = clamp(na - 38 + (Math.random() - 0.5) * 2, 90, 115);
  // Glucose: stress response in post-op
  const glucose = clamp(150 + (1 - bloodVolumeFraction) * 80 + (Math.random() - 0.5) * 20, 60, 400);
  return { na, k, cl, glucose };
}

// ============================================================
// PaO2 from SpO2 (simplified dissociation curve)
// ============================================================

function spo2ToPaO2(spo2Fraction: number): number {
  // Simplified: SpO2 0.97 → ~90, 0.95 → ~80, 0.90 → ~60, 0.85 → ~50
  const spo2 = spo2Fraction * 100;
  if (spo2 >= 99) return 120;
  if (spo2 >= 97) return 90 + (spo2 - 97) * 15;
  if (spo2 >= 90) return 60 + (spo2 - 90) * (30 / 7);
  if (spo2 >= 80) return 45 + (spo2 - 80) * 1.5;
  return 30 + spo2 * 0.15;
}

// ============================================================
// Main: computeLabSnapshot
// ============================================================

export type LabPanelId = "cbc" | "coag" | "abg" | "lactate" | "bcs" | "ica" | "act" | "teg" | "rotem" | "troponin" | "blood_culture";

/**
 * Compute a lab panel from BioGears state + game context.
 * Returns null if BioGears state is unavailable (caller should fall back to static).
 */
export function computeLabSnapshot(
  bgState: BioGearsState | null,
  ctx: LabContext,
  panelId: LabPanelId
): Record<string, LabValue> | null {
  if (!bgState || !bgState.ok) return null;

  const { vitals, labs } = bgState;
  const bloodVolumeFraction = (vitals.blood_volume_mL ?? 5500) / 5500;
  const temp = vitals.temperature;
  const paCO2 = (vitals.etco2 ?? 0.04) * 760 * 1.1; // EtCO2 fraction → mmHg, ×1.1 for PaCO2 approx

  switch (panelId) {
    case "cbc": {
      const hgb = labs.hgb_g_per_dL;
      const hct = hgb * 3;
      const plt = computePlatelets(bloodVolumeFraction, ctx.prbcUnits, ctx.plateletDoses);
      const wbc = computeWBC(ctx.gameTimeMinutes);
      return {
        Hgb: labVal(hgb, "hgb"),
        Hct: labVal(hct, "hct", 0),
        Plt: labVal(plt, "plt", 0),
        WBC: labVal(wbc, "wbc"),
      };
    }

    case "coag": {
      const inr = computeINR(bloodVolumeFraction, temp, ctx.ffpUnits, ctx.prbcUnits);
      const pt = clamp(12 * inr, 8, 60);
      const aptt = computeAPTT(inr);
      const fibrinogen = computeFibrinogen(bloodVolumeFraction, ctx.cryoDoses, ctx.prbcUnits);
      return {
        PT: labVal(pt, "pt"),
        INR: labVal(inr, "inr", 2),
        aPTT: labVal(aptt, "aptt", 0),
        Fibrinogen: labVal(fibrinogen, "fibrinogen", 0),
      };
    }

    case "abg": {
      const pH = labs.pH;
      const pao2 = spo2ToPaO2(labs.spo2_fraction);
      const hco3 = computeHCO3(pH, paCO2);
      const be = computeBE(pH, hco3);
      const lactateVal = labs.lactate_mg_per_dL;
      return {
        pH: labVal(pH, "pH", 3),
        PaO2: labVal(pao2, "pao2", 0),
        PaCO2: labVal(paCO2, "paco2", 0),
        "HCO₃": labVal(hco3, "hco3"),
        BE: labVal(be, "be"),
        Lactate: labVal(lactateVal, "lactate"),
      };
    }

    case "lactate": {
      return {
        Lactate: labVal(labs.lactate_mg_per_dL, "lactate"),
      };
    }

    case "bcs": {
      const elec = computeElectrolytes(labs.pH, bloodVolumeFraction);
      const renal = computeRenalFunction(
        labs.urine_production_mL_per_min,
        bloodVolumeFraction,
        ctx.gameTimeMinutes
      );
      return {
        Na: labVal(elec.na, "na", 0),
        K: labVal(elec.k, "k"),
        Cl: labVal(elec.cl, "cl", 0),
        BUN: labVal(renal.bun, "bun", 0),
        Cr: labVal(renal.cr, "cr", 2),
        Glucose: labVal(elec.glucose, "glucose", 0),
      };
    }

    case "ica": {
      const ica = computeICA(ctx.prbcUnits, ctx.ffpUnits, ctx.cacl2_mL);
      return {
        "iCa²⁺": labVal(ica, "ica", 2),
      };
    }

    case "act": {
      const act = computeACT(ctx.protamineGiven, ctx.gameTimeMinutes);
      return {
        ACT: labVal(act, "act", 0),
      };
    }

    case "teg":
    case "rotem": {
      // Need intermediate values
      const inr = computeINR(bloodVolumeFraction, temp, ctx.ffpUnits, ctx.prbcUnits);
      const plt = computePlatelets(bloodVolumeFraction, ctx.prbcUnits, ctx.plateletDoses);
      const fibrinogen = computeFibrinogen(bloodVolumeFraction, ctx.cryoDoses, ctx.prbcUnits);
      const teg = computeTEG(plt, fibrinogen, inr, ctx.txaGiven);
      return {
        "R-time": labVal(teg.r, "teg_r"),
        "K-time": labVal(teg.k, "teg_k"),
        "α-angle": labVal(teg.alpha, "teg_alpha", 0),
        MA: labVal(teg.ma, "teg_ma", 0),
        LY30: labVal(teg.ly30, "teg_ly30"),
      };
    }

    case "troponin": {
      // Always mildly elevated post-cardiac surgery
      return {
        "Troponin I": labVal(0.85 + Math.random() * 0.3, "troponin_i", 2),
        "CK-MB": labVal(45 + Math.random() * 15, "ckmb", 0),
      };
    }

    case "blood_culture": {
      return {
        Status: {
          value: "Pending (48-72 hrs)",
          unit: "",
          normal: "No growth",
          flag: undefined,
        },
      };
    }

    default:
      return null;
  }
}

// ============================================================
// Build LabContext from store state
// ============================================================

interface PlacedOrderLike {
  definition: { id?: string; subcategory?: string };
  dose: string;
  status: string;
}

/**
 * Extract transfusion/medication context from placed orders.
 * Call this with useProGameStore.getState().placedOrders
 */
export function buildLabContext(
  placedOrders: PlacedOrderLike[],
  gameTimeMinutes: number
): LabContext {
  let prbcUnits = 0;
  let ffpUnits = 0;
  let plateletDoses = 0;
  let cryoDoses = 0;
  let cacl2_mL = 0;
  let protamineGiven = false;
  let txaGiven = false;

  for (const order of placedOrders) {
    const id = (order.definition as Record<string, unknown>).id as string | undefined;
    const subcat = order.definition.subcategory;

    // Only count administered orders
    if (order.status !== "active" && order.status !== "completed") continue;

    if (subcat === "prbc" || id?.startsWith("prbc")) {
      const units = parseInt(order.dose) || 1;
      prbcUnits += units;
    } else if (subcat === "ffp" || id?.startsWith("ffp")) {
      const units = parseInt(order.dose) || 1;
      ffpUnits += units;
    } else if (subcat === "platelet" || id?.startsWith("platelet")) {
      plateletDoses += 1;
    } else if (subcat === "cryo" || id?.startsWith("cryo")) {
      cryoDoses += 1;
    } else if (id === "calcium_chloride") {
      cacl2_mL += parseFloat(order.dose) || 10;
    } else if (id === "protamine") {
      protamineGiven = true;
    } else if (id === "txa" || id === "tranexamic_acid") {
      txaGiven = true;
    }
  }

  // Also count MTP rounds (each round = 2 pRBC + 2 FFP + 1 Plt)
  // MTP is tracked separately in some store implementations
  // The individual orders from MTP should already be in placedOrders

  return {
    prbcUnits,
    ffpUnits,
    plateletDoses,
    cryoDoses,
    cacl2_mL,
    protamineGiven,
    txaGiven,
    gameTimeMinutes,
  };
}
