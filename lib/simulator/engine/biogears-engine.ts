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

  // 5. Death check from BioGears events
  if (bgState.patient.event_cardiac_arrest) {
    useProGameStore.getState().triggerDeath(
      "心臟停止 — BioGears 模擬引擎偵測到 cardiac arrest event。"
    );
  } else if (bgState.vitals.map < 25) {
    useProGameStore.getState().triggerDeath(
      "MAP 過低（< 25 mmHg），器官灌流不足導致多重器官衰竭。"
    );
  }
}

// ============================================================
// Action dispatch: Store actions → BioGears commands
// ============================================================

import { BIOGEARS_COMPOUNDS, BIOGEARS_DRUGS } from "./biogears-client";

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
      const doseMg = parseFloat(dose) || 1;
      if (nameLower.includes("drip") || nameLower.includes("infusion") || nameLower.includes("continuous")) {
        await client.drugInfusion(drugName[1], doseMg, 4);
      } else {
        await client.drugBolus(drugName[1], doseMg);
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
