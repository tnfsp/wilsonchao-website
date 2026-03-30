// BioGears WebSocket Client
// Connects to the bg-bridge WebSocket server for physics-based patient simulation.

import { nanoid } from "nanoid";

// ============================================================
// B14: Blood Product Type System
// ============================================================
// BioGears limitation: all blood products map to Blood_ONegative.
// The types below preserve clinical distinctions for teaching purposes.

/**
 * Clinical blood product types used in the simulator.
 *
 * BioGears only models a single blood substance (`Blood_ONegative`) and does
 * not distinguish between pRBC, FFP, platelets, cryoprecipitate, or whole
 * blood. The frontend tracks the specific product for scoring, teaching
 * feedback, and lethal-triad management even though the physics engine treats
 * them identically.
 */
export type BloodProductType =
  | "pRBC"
  | "FFP"
  | "platelets"
  | "cryoprecipitate"
  | "whole_blood";

/**
 * Clinical effect profile for each blood product type.
 *
 * These descriptions document the **real-world** physiological effects that
 * BioGears cannot model. They are consumed by the scoring engine and debrief
 * UI to explain *why* a specific product was the right (or wrong) choice.
 */
export interface BloodProductEffect {
  /** Human-readable product name */
  readonly label: string;
  /** Primary clinical indication */
  readonly indication: string;
  /** Key physiological effects */
  readonly effects: readonly string[];
  /** BioGears compound used (always Blood_ONegative) */
  readonly biogearsCompound: "Blood_ONegative";
  /** Typical volume per unit (mL) */
  readonly volumePerUnit_mL: number;
}

export const BLOOD_PRODUCT_EFFECTS: Readonly<Record<BloodProductType, BloodProductEffect>> = {
  pRBC: {
    label: "Packed Red Blood Cells",
    indication: "Increase oxygen-carrying capacity (Hgb/Hct)",
    effects: [
      "Raises Hgb ~1 g/dL per unit",
      "Raises Hct ~3% per unit",
      "Improves O2 delivery (DO2)",
      "Does NOT replace coagulation factors",
    ],
    biogearsCompound: "Blood_ONegative",
    volumePerUnit_mL: 350,
  },
  FFP: {
    label: "Fresh Frozen Plasma",
    indication: "Replace coagulation factors, correct coagulopathy (INR)",
    effects: [
      "Contains all coagulation factors (II, V, VII, VIII, IX, X, XI, fibrinogen)",
      "Corrects INR (target < 1.5 in active bleeding)",
      "Provides ~250 mL volume expansion per unit",
      "Does NOT significantly raise Hgb",
    ],
    biogearsCompound: "Blood_ONegative",
    volumePerUnit_mL: 250,
  },
  platelets: {
    label: "Platelets (Apheresis)",
    indication: "Address thrombocytopenia or platelet dysfunction",
    effects: [
      "Raises platelet count ~30-50K per apheresis dose",
      "Restores primary hemostasis",
      "Target Plt > 50K for active bleeding, > 100K for neurosurgery",
      "Does NOT correct coagulation factor deficiency",
    ],
    biogearsCompound: "Blood_ONegative",
    volumePerUnit_mL: 250,
  },
  cryoprecipitate: {
    label: "Cryoprecipitate",
    indication: "Fibrinogen replacement (target > 150 mg/dL in bleeding)",
    effects: [
      "Rich in fibrinogen, factor VIII, factor XIII, von Willebrand factor",
      "Raises fibrinogen ~50 mg/dL per 6-unit pool",
      "Small volume (~15 mL/unit) — less volume overload risk",
      "First-line for hypofibrinogenemia in massive transfusion",
    ],
    biogearsCompound: "Blood_ONegative",
    volumePerUnit_mL: 15,
  },
  whole_blood: {
    label: "Whole Blood",
    indication: "Combined RBC + plasma + platelets (trauma resuscitation)",
    effects: [
      "Contains RBCs, plasma, and functional platelets in physiologic ratio",
      "Avoids dilutional coagulopathy of component therapy",
      "Preferred in military/trauma settings when available",
      "Not widely available in civilian hospitals",
    ],
    biogearsCompound: "Blood_ONegative",
    volumePerUnit_mL: 500,
  },
} as const;

// ============================================================
// I1: BioGears Command & Response Types (discriminated union)
// ============================================================

/** Patient configuration name accepted by BioGears init */
export type BioGearsPatientConfig = string; // e.g. "StandardMale", "StandardFemale"

/**
 * Discriminated union of all commands the BioGears bridge accepts.
 * Each variant is keyed by `cmd` so TypeScript narrows the payload automatically.
 */
export type BioGearsCommand =
  | { cmd: "init"; patient: BioGearsPatientConfig }
  | { cmd: "advance"; seconds: number }
  | { cmd: "get_state" }
  | { cmd: "hemorrhage"; compartment: string; rate_mL_per_min: number }
  | { cmd: "stop_hemorrhage"; compartment: string }
  | { cmd: "drug_bolus"; substance: string; dose_mg: number }
  | { cmd: "drug_infusion"; substance: string; rate_mL_per_min: number; concentration_ug_per_mL: number }
  | { cmd: "compound_infusion"; compound: string; rate_mL_per_min: number; volume_mL: number }
  | { cmd: "fluid_bolus"; compound: string; rate_mL_per_min: number; volume_mL: number }
  | { cmd: "intubate" }
  | { cmd: "ventilator"; mode: "PC" | "VC"; pip: number; tv_mL: number; peep: number; rr: number; fio2: number }
  | { cmd: "ventilator_off" }
  | { cmd: "cardiac_arrest"; active: boolean }
  | { cmd: "start_cpr"; force_scale: number; rate_bpm: number; cv_ratio: string }
  | { cmd: "stop_cpr" }
  | { cmd: "pericardial_effusion"; rate_mL_per_min: number }
  | { cmd: "chest_tube"; side: string; active: boolean }
  | { cmd: "needle_decompression"; side: string; active: boolean }
  | { cmd: "start_stream"; interval_seconds: number; advance_seconds: number }
  | { cmd: "stop_stream" }
  | { cmd: "save_state"; file: string }
  | { cmd: "quit" };

/**
 * Typed response from the BioGears bridge.
 *
 * The bridge always returns `ok`. When vitals are present the response
 * represents a full simulation state snapshot (after init, advance, or an
 * action that triggers re-evaluation). Status-only responses carry a
 * `status` string (e.g. "streaming_started").
 */
export type BioGearsResponse = BioGearsState | BioGearsStatusMessage;

// ============================================================
// BioGears State & Sub-interfaces
// ============================================================

export interface BioGearsVitals {
  hr: number;
  sbp: number;
  dbp: number;
  map: number;
  spo2: number;       // fraction (0-1)
  cvp: number;
  rr: number;
  temperature: number; // °C
  etco2_fraction: number; // fraction (0-1)
  etco2_mmHg: number;     // mmHg (direct from bridge)
  cardiac_output: number; // L/min
  blood_volume_mL: number;
  total_lung_volume_mL: number;
  tidal_volume_mL: number;
  ejection_fraction: number;
  pericardium_volume_mL: number;
  heart_rhythm: string;
}

export interface BioGearsLabs {
  pH: number;
  spo2_fraction: number;
  svo2_fraction: number;
  hgb_g_per_dL: number;
  hematocrit: number;
  lactate_mg_per_dL: number;
  bicarbonate_mEq_per_L: number;
  base_excess: number;
  bun_mg_per_dL: number;
  creatinine_mg_per_dL: number;
  sodium_mEq_per_L: number;
  potassium_mEq_per_L: number;
  chloride_mEq_per_L: number;
  calcium_mg_per_dL: number;
  glucose_mg_per_dL: number;
  albumin_g_per_dL: number;
  total_bilirubin_mg_per_dL: number;
  wbc_per_uL: number;
  urine_production_mL_per_min: number;
}

export interface BioGearsPatientInfo {
  heart_rhythm: string;
  event_cardiac_arrest: boolean;
  event_asystole: boolean;
  event_cardiogenic_shock: boolean;
  event_hypovolemic_shock: boolean;
  event_irreversible_state: boolean;
  event_acute_respiratory_distress: boolean;
  event_severe_sepsis: boolean;
  event_seizures: boolean;
  event_hypoxia: boolean;
  event_tachycardia: boolean;
  event_bradycardia: boolean;
  event_metabolic_acidosis: boolean;
  event_lactic_acidosis: boolean;
}

export interface BioGearsRespiratory {
  inspiratory_flow_L_per_min: number;
  expiratory_flow_L_per_min: number;
  transpulmonary_pressure_cmH2O: number;
  alveolar_ventilation_L_per_min: number;
  carrico_index: number;   // PaO2/FiO2 ratio
  pao2_mmHg: number;
  paco2_mmHg: number;
}

export interface BioGearsHemodynamics {
  stroke_volume_mL: number;
  cardiac_index_mL_per_min_m2: number;
  svr_mmHg_s_per_mL: number;
  pvr_mmHg_s_per_mL: number;
  pulse_pressure_mmHg: number;
  pa_systolic_mmHg: number;
  pa_diastolic_mmHg: number;
  pa_mean_mmHg: number;
  pcwp_mmHg: number;
  cerebral_perfusion_pressure_mmHg: number;
  intracranial_pressure_mmHg: number;
  cerebral_blood_flow_mL_per_min: number;
  mean_cvp_mmHg: number;
  total_blood_volume_lost_mL: number;
}

export interface BioGearsNeuro {
  glasgow_coma_scale: number;
  rass: number;
  pain_vas: number;
  mental_status: number;
  left_pupil_size_modifier: number;
  left_pupil_reactivity_modifier: number;
  right_pupil_size_modifier: number;
  right_pupil_reactivity_modifier: number;
}

export interface BioGearsAssessments {
  sofa_total: number;
  sofa_respiratory: number;
  sofa_coagulation: number;
  sofa_liver: number;
  sofa_cardiovascular: number;
  sofa_cns: number;
  sofa_renal: number;
}

export interface BioGearsState {
  ok: boolean;
  time_s: number;
  vitals: BioGearsVitals;
  respiratory?: BioGearsRespiratory;
  hemodynamics?: BioGearsHemodynamics;
  neuro?: BioGearsNeuro;
  assessments?: BioGearsAssessments;
  labs: BioGearsLabs;
  patient: BioGearsPatientInfo;
  error?: string;
}

export interface BioGearsStatusMessage {
  ok?: boolean;
  status?: string;
  message?: string;
  error?: string;
}

type MessageHandler = (data: BioGearsState | BioGearsStatusMessage) => void;
type StatusHandler = (status: "connecting" | "connected" | "disconnected" | "initializing" | "ready" | "error") => void;

interface PendingRequest {
  resolve: (data: any) => void;
  reject: (err: Error) => void;
  timeout: ReturnType<typeof setTimeout>;
}

export class BioGearsClient {
  private ws: WebSocket | null = null;
  private url: string;
  private pendingRequests: Map<string, PendingRequest> = new Map();
  /** FIFO fallback queue — used only when the bridge does not echo requestId */
  private fifoOrder: string[] = [];
  private onMessage: MessageHandler | null = null;
  private onStatus: StatusHandler | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private _reconnectAttempt = 0;
  private _maxReconnectAttempts = 5;
  private _isReady = false;
  private _isInitialized = false;

  constructor(url: string = "ws://localhost:8770") {
    this.url = url;
  }

  get isReady(): boolean { return this._isReady; }
  get isInitialized(): boolean { return this._isInitialized; }

  /** Set handler for streaming vitals updates */
  setMessageHandler(handler: MessageHandler): void {
    this.onMessage = handler;
  }

  /** Set handler for connection status changes */
  setStatusHandler(handler: StatusHandler): void {
    this.onStatus = handler;
  }

  /** Connect to the WebSocket server */
  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.onStatus?.("connecting");

      try {
        this.ws = new WebSocket(this.url);
      } catch (err) {
        this.onStatus?.("error");
        reject(err);
        return;
      }

      this.ws.onopen = () => {
        this.onStatus?.("connected");
      };

      this.ws.onmessage = (event) => {
        let data: any;
        try {
          data = JSON.parse(event.data);
        } catch {
          console.warn("[BioGears] Invalid JSON:", event.data);
          return;
        }

        // First message is always the ready signal
        if (!this._isReady && data.status === "ready") {
          this._isReady = true;
          this.onStatus?.("ready");
          resolve();
          return;
        }

        // Status messages (initializing, streaming_started, etc.)
        if (data.status && !data.vitals) {
          if (data.status === "initializing") {
            this.onStatus?.("initializing");
          }

          // Resolve pending command if this is a response to it
          // (e.g., streaming_started, streaming_stopped, cpr_started, cpr_stopped)
          // But NOT "initializing" — init will get a separate vitals response
          if (data.status !== "initializing") {
            this.resolvePending(data);
          }

          // Forward to stream handler too
          this.onMessage?.(data);
          return;
        }

        // Vitals data — resolve pending command or forward to stream handler
        if (!this.resolvePending(data)) {
          // No pending request matched — this is streaming data
          this.onMessage?.(data);
        }
      };

      this.ws.onerror = (err) => {
        console.error("[BioGears] WebSocket error:", err);
        this.onStatus?.("error");
        if (!this._isReady) {
          reject(new Error("WebSocket connection failed"));
        }
      };

      this.ws.onclose = () => {
        this._isReady = false;
        this._isInitialized = false;
        this.onStatus?.("disconnected");
        // Reject all pending commands
        this.pendingRequests.forEach((pending) => {
          clearTimeout(pending.timeout);
          pending.reject(new Error("WebSocket closed"));
        });
        this.pendingRequests.clear();
        this.fifoOrder = [];

        // M14: Auto-reconnect with exponential backoff (max 5 attempts: 1s/2s/4s/8s/16s)
        if (this._reconnectAttempt < this._maxReconnectAttempts) {
          const delay = Math.pow(2, this._reconnectAttempt) * 1000;
          console.log(`[BioGears] Reconnecting in ${delay}ms (attempt ${this._reconnectAttempt + 1}/${this._maxReconnectAttempts})`);
          this.reconnectTimer = setTimeout(() => {
            this._reconnectAttempt++;
            this.connect()
              .then(() => {
                console.log("[BioGears] Reconnected successfully");
                this._reconnectAttempt = 0;
              })
              .catch((err) => {
                console.warn("[BioGears] Reconnect failed:", err);
              });
          }, delay);
        } else {
          console.error("[BioGears] Max reconnect attempts reached, giving up");
        }
      };
    });
  }

  /**
   * Resolve a pending request using requestId from the response.
   * Falls back to FIFO order when the bridge does not echo requestId.
   * Returns true if a pending request was resolved, false otherwise.
   */
  private resolvePending(data: any): boolean {
    if (this.pendingRequests.size === 0) return false;

    let id: string | undefined;

    // Prefer explicit requestId correlation
    if (data.requestId && this.pendingRequests.has(data.requestId)) {
      id = data.requestId;
    } else if (this.fifoOrder.length > 0) {
      // Fallback: FIFO order (backward compatibility with bridges that
      // don't echo requestId)
      id = this.fifoOrder[0];
    }

    if (!id) return false;

    const pending = this.pendingRequests.get(id);
    if (!pending) return false;

    clearTimeout(pending.timeout);
    this.pendingRequests.delete(id);
    const fifoIdx = this.fifoOrder.indexOf(id);
    if (fifoIdx !== -1) this.fifoOrder.splice(fifoIdx, 1);

    pending.resolve(data);
    return true;
  }

  /** Send a typed command and wait for the bridge response */
  private async sendCommand(cmd: BioGearsCommand): Promise<BioGearsResponse> {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error("WebSocket not connected");
    }

    const requestId = nanoid();

    return new Promise<BioGearsResponse>((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pendingRequests.delete(requestId);
        const fifoIdx = this.fifoOrder.indexOf(requestId);
        if (fifoIdx !== -1) this.fifoOrder.splice(fifoIdx, 1);
        reject(new Error(`BioGears command timeout (30s): ${cmd.cmd}`));
      }, 30_000);

      this.pendingRequests.set(requestId, { resolve, reject, timeout });
      this.fifoOrder.push(requestId);

      this.ws!.send(JSON.stringify({ ...cmd, requestId }));
    });
  }

  /** Initialize the engine with a patient (takes ~20s) */
  async initPatient(patient: BioGearsPatientConfig = "StandardMale"): Promise<BioGearsState> {
    const result = await this.sendCommand({ cmd: "init", patient });
    if ("ok" in result && result.ok && "vitals" in result) {
      this._isInitialized = true;
    }
    return result as BioGearsState;
  }

  /** Advance simulation by N seconds */
  async advance(seconds: number = 1): Promise<BioGearsState> {
    return this.sendCommand({ cmd: "advance", seconds }) as Promise<BioGearsState>;
  }

  /** Start hemorrhage */
  async hemorrhage(compartment: string = "Aorta", rateMlPerMin: number = 150): Promise<BioGearsState> {
    return this.sendCommand({
      cmd: "hemorrhage",
      compartment,
      rate_mL_per_min: rateMlPerMin,
    }) as Promise<BioGearsState>;
  }

  /** Stop hemorrhage */
  async stopHemorrhage(compartment: string = "Aorta"): Promise<BioGearsState> {
    return this.sendCommand({ cmd: "stop_hemorrhage", compartment }) as Promise<BioGearsState>;
  }

  /** Administer a drug bolus */
  async drugBolus(substance: string, doseMg: number): Promise<BioGearsState> {
    return this.sendCommand({
      cmd: "drug_bolus",
      substance,
      dose_mg: doseMg,
    }) as Promise<BioGearsState>;
  }

  /** Start a continuous drug infusion */
  async drugInfusion(
    substance: string,
    rateMlPerMin: number,
    concentrationUgPerMl: number
  ): Promise<BioGearsState> {
    return this.sendCommand({
      cmd: "drug_infusion",
      substance,
      rate_mL_per_min: rateMlPerMin,
      concentration_ug_per_mL: concentrationUgPerMl,
    }) as Promise<BioGearsState>;
  }

  /** Infuse a compound (blood, crystalloid, etc.) */
  async compoundInfusion(
    compound: string,
    rateMlPerMin: number = 100,
    volumeMl: number = 250
  ): Promise<BioGearsState> {
    return this.sendCommand({
      cmd: "compound_infusion",
      compound,
      rate_mL_per_min: rateMlPerMin,
      volume_mL: volumeMl,
    }) as Promise<BioGearsState>;
  }

  /** Fluid bolus (high-rate compound infusion) */
  async fluidBolus(
    compound: string = "RingersLactate",
    volumeMl: number = 500,
    rateMlPerMin: number = 999
  ): Promise<BioGearsState> {
    return this.sendCommand({
      cmd: "fluid_bolus",
      compound,
      rate_mL_per_min: rateMlPerMin,
      volume_mL: volumeMl,
    }) as Promise<BioGearsState>;
  }

  // ── Ventilator ──────────────────────────────────────────────────

  /** Intubate patient (required before mechanical ventilation) */
  async intubate(): Promise<BioGearsState> {
    return this.sendCommand({ cmd: "intubate" }) as Promise<BioGearsState>;
  }

  /** Start mechanical ventilation
   * @param mode "PC" (pressure control) or "VC" (volume control)
   * @param settings Ventilator parameters
   */
  async ventilator(settings: {
    mode: "PC" | "VC";
    pip?: number;       // cmH2O (PC mode, default 20)
    tv_mL?: number;     // mL (VC mode, default 500)
    peep?: number;      // cmH2O (default 5)
    rr?: number;        // breaths/min (default 14)
    fio2?: number;      // fraction 0-1 (default 0.21)
  }): Promise<BioGearsState> {
    return this.sendCommand({
      cmd: "ventilator",
      mode: settings.mode,
      pip: settings.pip ?? 20,
      tv_mL: settings.tv_mL ?? 500,
      peep: settings.peep ?? 5,
      rr: settings.rr ?? 14,
      fio2: settings.fio2 ?? 0.21,
    }) as Promise<BioGearsState>;
  }

  /** Turn off mechanical ventilation */
  async ventilatorOff(): Promise<BioGearsState> {
    return this.sendCommand({ cmd: "ventilator_off" }) as Promise<BioGearsState>;
  }

  // ── Cardiac Arrest & CPR ──────────────────────────────────────

  /** Trigger or resolve cardiac arrest */
  async cardiacArrest(active: boolean): Promise<void> {
    await this.sendCommand({ cmd: "cardiac_arrest", active });
  }

  /** Start server-side CPR auto-loop */
  async startCpr(
    forceScale: number = 0.7,
    rateBpm: number = 100,
    cvRatio: string = "30:2",
  ): Promise<void> {
    await this.sendCommand({
      cmd: "start_cpr",
      force_scale: forceScale ?? 0.7,
      rate_bpm: rateBpm ?? 100,
      cv_ratio: cvRatio ?? "30:2",
    });
  }

  /** Stop CPR auto-loop */
  async stopCpr(): Promise<void> {
    await this.sendCommand({ cmd: "stop_cpr" });
  }

  // ── Procedures ──────────────────────────────────────────────────

  /** Start or stop pericardial effusion (cardiac tamponade model). Set rate to 0 to stop. */
  async pericardialEffusion(rateMlPerMin: number): Promise<void> {
    await this.sendCommand({ cmd: "pericardial_effusion", rate_mL_per_min: rateMlPerMin });
  }

  /** Insert or remove a chest tube (for pneumothorax drainage) */
  async chestTube(side: string, active: boolean): Promise<void> {
    await this.sendCommand({ cmd: "chest_tube", side, active });
  }

  /** Perform or remove needle decompression (for tension pneumothorax) */
  async needleDecompression(side: string, active: boolean): Promise<void> {
    await this.sendCommand({ cmd: "needle_decompression", side, active });
  }

  // ── Stream ─────────────────────────────────────────────────────

  /** Start auto-advancing stream */
  async startStream(intervalSeconds: number = 1, advanceSeconds: number = 1): Promise<void> {
    await this.sendCommand({
      cmd: "start_stream",
      interval_seconds: intervalSeconds,
      advance_seconds: advanceSeconds,
    });
  }

  /** Stop auto-advancing stream */
  async stopStream(): Promise<void> {
    await this.sendCommand({ cmd: "stop_stream" });
  }

  /** Save engine state for fast reload */
  async saveState(filename: string = "snapshot.xml"): Promise<void> {
    await this.sendCommand({ cmd: "save_state", file: filename });
  }

  /** Get current state without advancing */
  async getState(): Promise<BioGearsState> {
    return this.sendCommand({ cmd: "get_state" }) as Promise<BioGearsState>;
  }

  /** Disconnect and clean up */
  async disconnect(): Promise<void> {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      try {
        if (this.ws.readyState === WebSocket.OPEN) {
          this.ws.send(JSON.stringify({ cmd: "quit" }));
        }
      } catch { /* ignore */ }
      this.ws.close();
      this.ws = null;
    }
    this._isReady = false;
    this._isInitialized = false;
  }
}

// ============================================================
// BioGears → Simulator Type Adapter
// ============================================================

import type { VitalSigns, PatientState, RhythmType } from "../types";

/** Map BioGears heart rhythm strings to simulator display strings */
function mapBioGearsRhythm(bgRhythm?: string): RhythmType {
  const map: Record<string, RhythmType> = {
    "NormalSinus": "nsr",
    "SinusTachycardia": "sinus_tach",
    "SinusBradycardia": "sinus_brady",
    "Asystole": "asystole",
    "CoarseVentricularFibrillation": "vf",
    "FineVentricularFibrillation": "vf",
    "PulselessElectricalActivity": "pea",
    "StableVentricularTachycardia": "vt_pulse",
    "UnstableVentricularTachycardia": "vt_pulseless",
  };
  if (bgRhythm && !map[bgRhythm]) {
    console.warn(`[BioGears] Unknown rhythm: "${bgRhythm}", defaulting to NSR`);
  }
  return map[bgRhythm ?? ""] ?? "nsr";
}

/** Convert BioGears vitals to simulator VitalSigns */
export function biogearsToVitals(bg: BioGearsState): VitalSigns | null {
  const v = bg?.vitals;
  if (!v || v.hr === undefined) return null;
  // BioGears can return negative pressures during cardiac arrest — clamp to 0
  const sbp = Math.max(0, Math.round(v.sbp));
  const dbp = Math.max(0, Math.round(v.dbp));
  const map = Math.max(0, Math.round(v.map));
  return {
    hr: Math.max(0, Math.round(v.hr)),
    sbp,
    dbp,
    map,
    spo2: Math.round(v.spo2 * 100 * 10) / 10,  // fraction → percentage
    cvp: Math.round(v.cvp * 10) / 10,
    rr: Math.max(0, Math.round(v.rr)),
    temperature: Math.round(v.temperature * 10) / 10,
    etco2: Math.round(v.etco2_mmHg),  // already in mmHg from bridge
    bloodVolume: Math.round(v.blood_volume_mL),
    ejectionFraction: Math.round(v.ejection_fraction * 100),  // fraction → %
    aLineWaveform: inferALineWaveform(bg),
    rhythmStrip: mapBioGearsRhythm(v.heart_rhythm),
  };
}

/** Infer A-line waveform pattern from BioGears state */
function inferALineWaveform(bg: BioGearsState): VitalSigns["aLineWaveform"] {
  const pp = bg.vitals.sbp - bg.vitals.dbp;  // pulse pressure
  const ef = bg.vitals.ejection_fraction;

  if (bg.patient.event_cardiac_arrest) return "low_amplitude";
  if (pp < 15) return "low_amplitude";
  if (pp < 25) return "dampened";
  if (ef < 0.3) return "pulsus_alternans";
  if (bg.vitals.blood_volume_mL < 4500) return "wide_pp_variation";
  return "normal";
}

/**
 * BioGears compound name mapping for simulator actions.
 *
 * **Blood product limitation (B14):**
 * BioGears models only a single blood substance — `Blood_ONegative`. All four
 * clinical blood products (pRBC, FFP, platelets, cryoprecipitate) and whole
 * blood are mapped to this one compound. The physics engine therefore cannot
 * differentiate their effects (e.g., FFP correcting INR or platelets raising
 * Plt count). The frontend uses {@link BLOOD_PRODUCT_EFFECTS} and the
 * transfusion order data in `data/transfusions.ts` to track and teach the
 * clinical differences independently of BioGears.
 */
export const BIOGEARS_COMPOUNDS = {
  // Blood products — all map to the same BioGears substance (see B14 note above)
  "pRBC": "Blood_ONegative",
  "FFP": "Blood_ONegative",
  "platelets": "Blood_ONegative",
  "cryoprecipitate": "Blood_ONegative",
  "whole_blood": "Blood_ONegative",

  // Crystalloids
  "NS": "Saline",
  "LR": "RingersLactate",
  "ringer_lactate": "RingersLactate",
  "normal_saline": "Saline",
} as const;

/** BioGears substance name mapping for drugs */
export const BIOGEARS_DRUGS = {
  "epinephrine": "Epinephrine",
  "norepinephrine": "Norepinephrine",
  "vasopressin": "Vasopressin",
  "morphine": "Morphine",
  "fentanyl": "Fentanyl",
  "midazolam": "Midazolam",
  "ketamine": "Ketamine",
  "propofol": "Propofol",
  "succinylcholine": "Succinylcholine",
  "rocuronium": "Rocuronium",
  "dobutamine": "Dobutamine",
  "milrinone": "Milrinone",
  "dopamine": "Dopamine",
  "amiodarone": "Amiodarone",
  "lidocaine": "Lidocaine",
  "protamine": "Protamine",
  "heparin": "Heparin",
  "vitamin_k": "VitaminK",
  "vancomycin": "Vancomycin",
  "adenosine": "Adenosine",
  "nicardipine": "Nicardipine",
  "dopamine_low": "DopamineLowDose",
} as const;
