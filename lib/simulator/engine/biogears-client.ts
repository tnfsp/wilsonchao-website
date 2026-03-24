// BioGears WebSocket Client
// Connects to the bg-bridge WebSocket server for physics-based patient simulation.

export interface BioGearsVitals {
  hr: number;
  sbp: number;
  dbp: number;
  map: number;
  spo2: number;       // fraction (0-1)
  cvp: number;
  rr: number;
  temperature: number; // °C
  etco2: number;       // fraction
  cardiac_output: number; // L/min
  blood_volume_mL: number;
  total_lung_volume_mL: number;
  tidal_volume_mL: number;
  ejection_fraction: number;
}

export interface BioGearsLabs {
  pH: number;
  spo2_fraction: number;
  hgb_g_per_dL: number;
  lactate_mg_per_dL: number;
  urine_production_mL_per_min: number;
}

export interface BioGearsPatientInfo {
  heart_rhythm: string;
  event_cardiac_arrest: boolean;
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

export interface BioGearsState {
  ok: boolean;
  time_s: number;
  vitals: BioGearsVitals;
  respiratory?: BioGearsRespiratory;
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

export class BioGearsClient {
  private ws: WebSocket | null = null;
  private url: string;
  private messageQueue: Array<{ resolve: (data: any) => void; reject: (err: Error) => void }> = [];
  private onMessage: MessageHandler | null = null;
  private onStatus: StatusHandler | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
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
          // Forward to stream handler too
          this.onMessage?.(data);

          // If there's a pending command, don't resolve it with status messages
          // (init will get both a status and a vitals response)
          return;
        }

        // Vitals data — resolve pending command or forward to stream handler
        if (this.messageQueue.length > 0) {
          const { resolve } = this.messageQueue.shift()!;
          resolve(data);
        } else {
          // Streaming data
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
        // Reject any pending commands
        while (this.messageQueue.length > 0) {
          const { reject } = this.messageQueue.shift()!;
          reject(new Error("WebSocket closed"));
        }
      };
    });
  }

  /** Send a command and wait for response */
  private async sendCommand(cmd: Record<string, any>): Promise<any> {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error("WebSocket not connected");
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        const idx = this.messageQueue.findIndex((q) => q.resolve === resolve);
        if (idx !== -1) this.messageQueue.splice(idx, 1);
        reject(new Error(`BioGears command timeout (30s): ${cmd.cmd}`));
      }, 30_000);
      this.messageQueue.push({
        resolve: (v: any) => { clearTimeout(timeout); resolve(v); },
        reject: (e: any) => { clearTimeout(timeout); reject(e); },
      });
      this.ws!.send(JSON.stringify(cmd));
    });
  }

  /** Initialize the engine with a patient (takes ~20s) */
  async initPatient(patient: string = "StandardMale"): Promise<BioGearsState> {
    const result = await this.sendCommand({ cmd: "init", patient });
    if (result.ok && result.vitals) {
      this._isInitialized = true;
    }
    return result;
  }

  /** Advance simulation by N seconds */
  async advance(seconds: number = 1): Promise<BioGearsState> {
    return this.sendCommand({ cmd: "advance", seconds });
  }

  /** Start hemorrhage */
  async hemorrhage(compartment: string = "Aorta", rateMlPerMin: number = 150): Promise<BioGearsState> {
    return this.sendCommand({
      cmd: "hemorrhage",
      compartment,
      rate_mL_per_min: rateMlPerMin,
    });
  }

  /** Stop hemorrhage */
  async stopHemorrhage(compartment: string = "Aorta"): Promise<BioGearsState> {
    return this.sendCommand({ cmd: "stop_hemorrhage", compartment });
  }

  /** Administer a drug bolus */
  async drugBolus(substance: string, doseMg: number): Promise<BioGearsState> {
    return this.sendCommand({
      cmd: "drug_bolus",
      substance,
      dose_mg: doseMg,
    });
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
    });
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
    });
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
    });
  }

  // ── Ventilator ──────────────────────────────────────────────────

  /** Intubate patient (required before mechanical ventilation) */
  async intubate(): Promise<BioGearsState> {
    return this.sendCommand({ cmd: "intubate" });
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
    });
  }

  /** Turn off mechanical ventilation */
  async ventilatorOff(): Promise<BioGearsState> {
    return this.sendCommand({ cmd: "ventilator_off" });
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
    return this.sendCommand({ cmd: "get_state" });
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

import type { VitalSigns, PatientState } from "../types";

/** Convert BioGears vitals to simulator VitalSigns */
export function biogearsToVitals(bg: BioGearsState): VitalSigns {
  const v = bg.vitals;
  return {
    hr: Math.round(v.hr),
    sbp: Math.round(v.sbp),
    dbp: Math.round(v.dbp),
    map: Math.round(v.map),
    spo2: Math.round(v.spo2 * 100 * 10) / 10,  // fraction → percentage
    cvp: Math.round(v.cvp * 10) / 10,
    rr: Math.round(v.rr),
    temperature: Math.round(v.temperature * 10) / 10,
    etco2: Math.round(v.etco2 * 760),  // fraction → mmHg (atmospheric pressure)
    bloodVolume: Math.round(v.blood_volume_mL),
    ejectionFraction: Math.round(v.ejection_fraction * 100),  // fraction → %
    aLineWaveform: inferALineWaveform(bg),
    rhythmStrip: "nsr",
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

/** BioGears compound name mapping for simulator actions */
export const BIOGEARS_COMPOUNDS = {
  // Blood products
  "pRBC": "Blood_ONegative",
  "FFP": "Blood_ONegative",      // BioGears doesn't distinguish FFP
  "platelets": "Blood_ONegative", // approximation
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
} as const;
