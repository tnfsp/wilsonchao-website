/**
 * BioGears Engine Hook — Drop-in replacement for formula-based patient-engine
 *
 * Architecture:
 *   useGameTick (formula)  →  useBioGearsEngine (physics)
 *   updatePatientState()   →  BioGears WS advance + vitals push
 *
 * The BioGears engine takes over:
 * - Vitals computation (HR, BP, SpO2, CVP, RR, Temp, EtCO2)
 * - Labs (pH, lactate, Hgb)
 * - Hemorrhage / drug / fluid actions
 * - Death detection (cardiac arrest event from BioGears)
 *
 * The store still handles:
 * - Timeline / chat
 * - Orders / MTP UI flow
 * - Scoring / debrief
 * - Chest tube (BioGears doesn't model chest tubes)
 */

import { BioGearsClient, biogearsToVitals } from "./biogears-client";
import type { BioGearsState } from "./biogears-client";
import { useProGameStore } from "../store";
import type { VitalSigns, LethalTriadState } from "../types";

// ============================================================
// Singleton client (shared across hooks)
// ============================================================

let _client: BioGearsClient | null = null;
let _lastState: BioGearsState | null = null;

/**
 * Resolve BioGears WebSocket URL based on environment:
 * - env override: NEXT_PUBLIC_BIOGEARS_WS_URL
 * - localhost dev: ws://localhost:8770
 * - Vercel / remote: wss://zhaoyixiangdemac-mini.tail1416ee.ts.net (Tailscale Funnel)
 */
function resolveBioGearsUrl(): string {
  // Allow explicit override
  const envUrl = typeof process !== "undefined"
    ? process.env.NEXT_PUBLIC_BIOGEARS_WS_URL
    : undefined;
  if (envUrl) return envUrl;

  if (typeof window === "undefined") return "ws://localhost:8770";

  const host = window.location.hostname;
  const isLocal = host === "localhost" || host === "127.0.0.1" || host.endsWith(".local");

  if (isLocal) {
    return "ws://localhost:8770";
  }

  // Remote (Vercel, etc.) → Tailscale Funnel WSS
  return "wss://zhaoyixiangdemac-mini.tail1416ee.ts.net";
}

export function getBioGearsClient(): BioGearsClient {
  if (!_client) {
    _client = new BioGearsClient(resolveBioGearsUrl());
  }
  return _client;
}

export function getLastBioGearsState(): BioGearsState | null {
  return _lastState;
}

// ============================================================
// State sync: BioGears → Store
// ============================================================

/**
 * Push a BioGears state snapshot into the zustand store.
 * Called on every advance / stream tick.
 */
export function syncBioGearsToStore(bgState: BioGearsState): void {
  _lastState = bgState;

  const store = useProGameStore.getState();
  if (!store.patient || store.phase !== "playing") return;

  // 1. Convert vitals
  const newVitals: VitalSigns = biogearsToVitals(bgState);

  // 2. Update lethal triad from BioGears labs
  const labs = bgState.labs;
  const lethalTriad: LethalTriadState = {
    hypothermia: newVitals.temperature < 36,
    acidosis: labs.pH < 7.25,   // approximate BE < -6
    coagulopathy: false,        // BioGears doesn't track INR/fibrinogen directly
    count: 0,
  };
  lethalTriad.count = [lethalTriad.hypothermia, lethalTriad.acidosis, lethalTriad.coagulopathy]
    .filter(Boolean).length;

  // 3. Compute severity from BioGears physiology
  //    Map blood volume loss + lactate + pH to a 0-100 severity score
  const baselineVolume = 5500; // StandardMale ~5500mL
  const volumeLoss = Math.max(0, baselineVolume - bgState.vitals.blood_volume_mL);
  const volumeLossPct = volumeLoss / baselineVolume;

  // Severity formula:
  //   Volume loss: 0-20% → 0-30, 20-40% → 30-70, 40%+ → 70-100
  //   Lactate penalty: +5 per 5 mg/dL above normal
  //   pH penalty: +10 per 0.1 below 7.35
  let severity = 0;
  if (volumeLossPct < 0.20) {
    severity = volumeLossPct * 150;  // 0-30
  } else if (volumeLossPct < 0.40) {
    severity = 30 + (volumeLossPct - 0.20) * 200;  // 30-70
  } else {
    severity = 70 + Math.min(30, (volumeLossPct - 0.40) * 150);  // 70-100
  }

  // Lactate penalty
  if (labs.lactate_mg_per_dL > 2) {
    severity += (labs.lactate_mg_per_dL - 2) * 1;
  }

  // pH penalty
  if (labs.pH < 7.35) {
    severity += (7.35 - labs.pH) * 100;
  }

  severity = Math.max(0, Math.min(100, severity));

  // 4. Update store
  useProGameStore.setState((state) => ({
    patient: state.patient ? {
      ...state.patient,
      vitals: newVitals,
      severity,
      lethalTriad,
    } : state.patient,
  }));

  // 5. Death check from BioGears events (scenario-aware messages)
  if (bgState.patient.event_cardiac_arrest || bgState.vitals.map < 25) {
    const scenarioId = useProGameStore.getState().scenario?.id ?? "";
    const isArrest = !!bgState.patient.event_cardiac_arrest;

    let cause: string;
    if (scenarioId.includes("septic")) {
      cause = isArrest
        ? "敗血性休克導致心臟停止。"
        : "敗血性休克致血管麻痺，MAP 崩潰（< 25 mmHg），多重器官衰竭。";
    } else if (scenarioId.includes("tamponade")) {
      cause = isArrest
        ? "心包填塞壓迫心臟，心輸出量歸零，心臟停止。"
        : "心包填塞致心輸出量歸零，MAP 崩潰（< 25 mmHg）。";
    } else if (scenarioId.includes("bleeding")) {
      cause = isArrest
        ? "失血性休克導致心臟停止。"
        : "失血性休克，MAP 過低（< 25 mmHg），器官灌流不足致多重器官衰竭。";
    } else {
      cause = isArrest
        ? "心臟停止。"
        : "MAP 過低（< 25 mmHg），器官灌流不足導致多重器官衰竭。";
    }

    useProGameStore.getState().triggerDeath(cause);
  }
}

// ============================================================
// Action dispatch: Store actions → BioGears commands
// ============================================================

import { BIOGEARS_COMPOUNDS, BIOGEARS_DRUGS } from "./biogears-client";

// ============================================================
// Drug concentration map (B15 fix)
// Standard ICU infusion concentrations in ug/mL
// ============================================================

const DRUG_CONCENTRATIONS: Record<string, number> = {
  "Epinephrine": 16,       // 4 mg/250mL = 16 ug/mL
  "Norepinephrine": 16,    // 4 mg/250mL = 16 ug/mL (common: 4mg/250mL or 8mg/250mL)
  "Vasopressin": 0.04,     // 20 units/500mL ≈ 0.04 units/mL
  "Dopamine": 1600,        // 400 mg/250mL = 1600 ug/mL
  "Dobutamine": 1000,      // 250 mg/250mL = 1000 ug/mL
  "Milrinone": 200,        // 50 mg/250mL = 200 ug/mL
  "Nitroglycerin": 200,    // 50 mg/250mL = 200 ug/mL
  "Nicardipine": 100,      // 25 mg/250mL = 100 ug/mL
  "Amiodarone": 1800,      // 450 mg/250mL = 1800 ug/mL (loading)
  "Fentanyl": 10,          // 2500 mcg/250mL = 10 ug/mL
  "Propofol": 10000,       // 10 mg/mL = 10000 ug/mL
  "Midazolam": 1000,       // 250 mg/250mL = 1000 ug/mL (if infusion)
  "Morphine": 1000,        // 250 mg/250mL = 1000 ug/mL
  "Ketamine": 1000,        // 250 mg/250mL = 1000 ug/mL
};

// Default infusion duration in minutes by drug type.
// Push drugs get shorter durations; maintenance infusions default to 60 min.
const DEFAULT_INFUSION_DURATION_MIN: Record<string, number> = {
  "Epinephrine": 60,
  "Norepinephrine": 60,
  "Vasopressin": 60,
  "Dopamine": 60,
  "Dobutamine": 60,
  "Milrinone": 60,
  "Nitroglycerin": 60,
  "Nicardipine": 60,
  "Amiodarone": 10,       // loading dose over 10 min
  "Fentanyl": 60,
  "Propofol": 60,
  "Midazolam": 60,
  "Morphine": 60,
  "Ketamine": 60,
};

/**
 * Translate a simulator order into BioGears commands.
 * Called by the store's placeOrder / activateMTP flow.
 */
export async function dispatchOrderToBioGears(
  orderName: string,
  dose: string,
  category: string,
): Promise<void> {
  const client = getBioGearsClient();
  if (!client.isInitialized) return;

  try {
    const nameLower = orderName.toLowerCase();

    // Blood products
    if (category === "transfusion" || nameLower.includes("prbc") || nameLower.includes("blood")) {
      const volumeMl = parseFloat(dose) || 250;
      await client.compoundInfusion("Blood_ONegative", 200, volumeMl);
      return;
    }

    // Fluids
    if (category === "fluid" || nameLower.includes("ns") || nameLower.includes("ringer") || nameLower.includes("lactate") || nameLower.includes("saline")) {
      const compound = nameLower.includes("ringer") || nameLower.includes("lactate")
        ? "RingersLactate" : "Saline";
      const volumeMl = parseFloat(dose) || 500;
      await client.fluidBolus(compound, volumeMl);
      return;
    }

    // Drugs
    const drugName = Object.entries(BIOGEARS_DRUGS).find(
      ([key]) => nameLower.includes(key)
    );
    if (drugName) {
      const substanceName = drugName[1];
      const doseMg = parseFloat(dose) || 1;
      if (nameLower.includes("drip") || nameLower.includes("infusion") || nameLower.includes("continuous")) {
        // B3 fix: proper dose → rate conversion
        // doseMg is the total dose in mg; convert to ug/min then to mL/min
        const durationMin = DEFAULT_INFUSION_DURATION_MIN[substanceName] ?? 60;
        const doseUgPerMin = (doseMg * 1000) / durationMin;
        const concentration = DRUG_CONCENTRATIONS[substanceName] ?? 4;
        const rateMlPerMin = doseUgPerMin / concentration;
        await client.drugInfusion(substanceName, rateMlPerMin, concentration);
      } else {
        await client.drugBolus(substanceName, doseMg);
      }
      return;
    }

    // Unknown — no BioGears equivalent, let formula engine handle
    console.warn(`[BioGears] No mapping for order: ${orderName}`);
  } catch (err) {
    console.warn(`[BioGears] dispatchOrder failed for "${orderName}":`, err);
    // Silently fail — formula engine handles fallback
  }
}

/**
 * Start hemorrhage in BioGears.
 * Called when scenario triggers bleeding.
 */
export async function startBioGearsHemorrhage(
  compartment: string = "Aorta",
  rateMlPerMin: number = 150,
): Promise<void> {
  const client = getBioGearsClient();
  if (!client.isInitialized) return;
  await client.hemorrhage(compartment, rateMlPerMin);
}

/**
 * Stop hemorrhage in BioGears.
 * Called when surgical intervention or scenario resolves bleeding.
 */
export async function stopBioGearsHemorrhage(
  compartment: string = "Aorta",
): Promise<void> {
  const client = getBioGearsClient();
  if (!client.isInitialized) return;
  await client.stopHemorrhage(compartment);
}

// ============================================================
// Ventilator dispatch
// ============================================================

/**
 * Intubate and start mechanical ventilation.
 * Called when an "intubation" or "ventilator" order is placed.
 */
export async function startBioGearsVentilator(settings: {
  mode: "PC" | "VC";
  pip?: number;
  tv_mL?: number;
  peep?: number;
  rr?: number;
  fio2?: number;
}): Promise<void> {
  const client = getBioGearsClient();
  if (!client.isInitialized) return;
  await client.intubate();
  await client.ventilator(settings);
}

/**
 * Stop mechanical ventilation (extubate).
 */
export async function stopBioGearsVentilator(): Promise<void> {
  const client = getBioGearsClient();
  if (!client.isInitialized) return;
  await client.ventilatorOff();
}

/**
 * Change ventilator settings without re-intubating.
 */
export async function adjustBioGearsVentilator(settings: {
  mode: "PC" | "VC";
  pip?: number;
  tv_mL?: number;
  peep?: number;
  rr?: number;
  fio2?: number;
}): Promise<void> {
  const client = getBioGearsClient();
  if (!client.isInitialized) return;
  await client.ventilator(settings);
}

/**
 * Advance BioGears by game-minutes and sync state.
 * 1 game-minute = 60 sim-seconds.
 */
export async function advanceBioGears(gameMinutes: number): Promise<void> {
  const client = getBioGearsClient();
  if (!client.isInitialized) return;

  const seconds = gameMinutes * 60;
  const result = await client.advance(seconds);
  if (result.ok) {
    syncBioGearsToStore(result);
  }
}

// ============================================================
// Additional action dispatch (B4 fix)
// ============================================================

/**
 * Start or stop pericardial effusion (cardiac tamponade simulation).
 * @param rateMlPerMin - fluid accumulation rate; 0 stops the effusion.
 * Bridge command: {"cmd":"pericardial_effusion","rate_mL_per_min":N}
 */
export async function dispatchPericardialEffusion(rateMlPerMin: number): Promise<void> {
  const client = getBioGearsClient();
  if (!client.isInitialized) return;
  try {
    await (client as any).pericardialEffusion(rateMlPerMin);
  } catch (err) {
    console.error("[BioGears] pericardialEffusion failed:", err);
  }
}

/**
 * Trigger or resolve cardiac arrest.
 * @param active - true = arrest, false = ROSC
 * Bridge command: {"cmd":"cardiac_arrest","active":"true"|"false"}
 */
export async function dispatchCardiacArrest(active: boolean): Promise<void> {
  const client = getBioGearsClient();
  if (!client.isInitialized) return;
  try {
    await (client as any).cardiacArrest(active);
  } catch (err) {
    console.error("[BioGears] cardiacArrest failed:", err);
  }
}

/**
 * Start CPR (chest compressions).
 * @param forceScale - 0.0-1.0 fraction of max force (default 0.7)
 * @param rateBpm - compressions per minute (default 100 → period 0.6s)
 * Bridge command: {"cmd":"chest_compression","force_scale":N,"period_s":N}
 */
export async function dispatchStartCpr(
  forceScale: number = 0.7,
  rateBpm: number = 100,
): Promise<void> {
  const client = getBioGearsClient();
  if (!client.isInitialized) return;
  try {
    await (client as any).startCpr(forceScale, rateBpm);
  } catch (err) {
    console.error("[BioGears] startCpr failed:", err);
  }
}

/**
 * Stop CPR.
 */
export async function dispatchStopCpr(): Promise<void> {
  const client = getBioGearsClient();
  if (!client.isInitialized) return;
  try {
    await (client as any).stopCpr();
  } catch (err) {
    console.error("[BioGears] stopCpr failed:", err);
  }
}

/**
 * Insert or remove a chest tube.
 * @param side - "Left" or "Right"
 * @param active - true = insert, false = remove
 * Bridge command: {"cmd":"chest_tube","side":"Left"|"Right","active":"true"|"false"}
 */
export async function dispatchChestTube(side: string, active: boolean): Promise<void> {
  const client = getBioGearsClient();
  if (!client.isInitialized) return;
  try {
    await (client as any).chestTube(side, active);
  } catch (err) {
    console.error("[BioGears] chestTube failed:", err);
  }
}

/**
 * Needle decompression for tension pneumothorax.
 * @param side - "Left" or "Right"
 * @param active - true = decompress, false = remove
 * Bridge command: {"cmd":"needle_decompression","side":"Left"|"Right","active":"true"|"false"}
 */
export async function dispatchNeedleDecompression(side: string, active: boolean): Promise<void> {
  const client = getBioGearsClient();
  if (!client.isInitialized) return;
  try {
    await (client as any).needleDecompression(side, active);
  } catch (err) {
    console.error("[BioGears] needleDecompression failed:", err);
  }
}

// ============================================================
// BioGears Lab Results
// ============================================================

/**
 * Generate lab results from the current BioGears state.
 * Returns formatted results matching the simulator's lab panel format.
 */
export function getBioGearsLabResults(): Record<string, { value: string; unit: string; flag?: string }> | null {
  if (!_lastState) return null;

  const labs = _lastState.labs;
  const vitals = _lastState.vitals;

  return {
    pH: {
      value: labs.pH.toFixed(3),
      unit: "",
      flag: labs.pH < 7.35 ? "L" : labs.pH > 7.45 ? "H" : undefined,
    },
    Hgb: {
      value: labs.hgb_g_per_dL.toFixed(1),
      unit: "g/dL",
      flag: labs.hgb_g_per_dL < 10 ? "L" : undefined,
    },
    Lactate: {
      value: labs.lactate_mg_per_dL.toFixed(1),
      unit: "mg/dL",
      flag: labs.lactate_mg_per_dL > 2 ? "H" : undefined,
    },
    SpO2: {
      value: (labs.spo2_fraction * 100).toFixed(1),
      unit: "%",
      flag: labs.spo2_fraction < 0.94 ? "L" : undefined,
    },
    CO: {
      value: vitals.cardiac_output.toFixed(2),
      unit: "L/min",
      flag: vitals.cardiac_output < 4 ? "L" : undefined,
    },
    EF: {
      value: (vitals.ejection_fraction * 100).toFixed(0),
      unit: "%",
      flag: vitals.ejection_fraction < 0.4 ? "L" : undefined,
    },
    UOP: {
      value: (labs.urine_production_mL_per_min * 60).toFixed(0),
      unit: "mL/hr",
      flag: labs.urine_production_mL_per_min * 60 < 30 ? "L" : undefined,
    },
    BloodVolume: {
      value: vitals.blood_volume_mL.toFixed(0),
      unit: "mL",
      flag: vitals.blood_volume_mL < 4500 ? "critical" : vitals.blood_volume_mL < 5000 ? "L" : undefined,
    },
  };
}
