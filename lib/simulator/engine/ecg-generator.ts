/**
 * ECG Waveform Generator
 * Generates realistic 12-lead ECG waveforms mathematically.
 * No image assets required — pure math.
 *
 * Educational use only. Not for clinical diagnosis.
 */

import type { BioGearsState } from "./biogears-client";

// ── Types ──────────────────────────────────────────────────────

export type ECGRhythm =
  | "normal_sinus"
  | "sinus_tachycardia"
  | "sinus_bradycardia"
  | "atrial_fibrillation"
  | "ventricular_tachycardia"
  | "ventricular_fibrillation"
  | "asystole"
  | "pea";

export interface ECGMorphology {
  rhythm: ECGRhythm;
  rate: number;             // BPM
  pWave: boolean;
  prInterval: number;       // ms
  qrsDuration: number;      // ms
  stSegment: "normal" | "elevated" | "depressed";
  tWave: "normal" | "inverted" | "peaked" | "flattened";
  qtc: number;              // ms
  lowVoltage: boolean;
  electricalAlternans: boolean;
  osbornWave: boolean;
}

export interface ECGLeadData {
  lead: string;             // "I", "II", "III", "aVR", "aVL", "aVF", "V1"-"V6"
  samples: number[];        // normalized -1 to 1
  annotations?: string[];
}

// Clinical state hints that can override BioGears
export interface ClinicalStateHint {
  hyperkalemia?: boolean;   // K > 5.5
  tamponade?: boolean;
  hypothermia?: boolean;    // temp < 33°C
  sepsis?: boolean;
  pathology?: string;
}

// ── Lead axis angles (degrees) ─────────────────────────────────

const LEAD_ANGLES: Record<string, number> = {
  I:   0,
  II:  60,
  III: 120,
  aVR: -150,
  aVL: -30,
  aVF: 90,
  // Precordial leads: V1-V6 transition from right to left
  V1: -30,   // dominant S, small r
  V2:  10,
  V3:  40,
  V4:  60,
  V5:  70,
  V6:  75,
};

// Precordial R-wave progression multipliers
// V1 has small R, V5-V6 have dominant R
const PRECORDIAL_R_FACTOR: Record<string, number> = {
  V1: 0.15,
  V2: 0.30,
  V3: 0.55,
  V4: 0.80,
  V5: 1.00,
  V6: 0.85,
};

const PRECORDIAL_S_FACTOR: Record<string, number> = {
  V1: 0.90,
  V2: 0.70,
  V3: 0.45,
  V4: 0.25,
  V5: 0.10,
  V6: 0.05,
};

// ── Gaussian helper ────────────────────────────────────────────

/** Gaussian bump: value at x given center, amplitude, and width (sigma) */
function gaussian(x: number, center: number, amplitude: number, sigma: number): number {
  const diff = x - center;
  return amplitude * Math.exp(-(diff * diff) / (2 * sigma * sigma));
}

// ── Morphology generator ───────────────────────────────────────

/**
 * Map BioGears vitals + clinical hints to ECG morphology.
 */
export function generateECGMorphology(
  bgState: BioGearsState | null,
  clinicalHint?: ClinicalStateHint
): ECGMorphology {
  // Default: normal sinus at 75 bpm
  let hr = bgState?.vitals?.hr ?? 75;
  let rhythm: ECGRhythm = "normal_sinus";
  let pWave = true;
  let prInterval = 160;    // ms
  let qrsDuration = 80;    // ms
  let stSegment: ECGMorphology["stSegment"] = "normal";
  let tWave: ECGMorphology["tWave"] = "normal";
  let qtc = 420;
  let lowVoltage = false;
  let electricalAlternans = false;
  let osbornWave = false;

  // ── HR-based rhythm classification ──
  if (hr < 60) {
    rhythm = "sinus_bradycardia";
  } else if (hr >= 100 && hr < 150) {
    rhythm = "sinus_tachycardia";
  }

  // ── Check BioGears patient event ──
  if (bgState?.patient?.event_cardiac_arrest) {
    rhythm = "asystole";
    pWave = false;
    qrsDuration = 80;
  }

  // ── Clinical overrides ──

  // Cardiac tamponade: low voltage + electrical alternans
  if (clinicalHint?.tamponade) {
    lowVoltage = true;
    electricalAlternans = true;
    // Sinus tach is common in tamponade
    if (hr >= 100) rhythm = "sinus_tachycardia";
  }

  // Hyperkalemia: peaked T, wide QRS
  if (clinicalHint?.hyperkalemia) {
    tWave = "peaked";
    qrsDuration = 120;  // wide QRS
    qtc = 480;
  }

  // Hypothermia: Osborn waves, bradycardia
  if (clinicalHint?.hypothermia) {
    osbornWave = true;
    rhythm = "sinus_bradycardia";
    if (hr > 50) hr = Math.min(hr, 50);
  }

  // Pathology-specific overrides
  if (clinicalHint?.pathology === "cardiac_tamponade") {
    lowVoltage = true;
    electricalAlternans = true;
  }

  // Apply temperature from BioGears
  const temp = bgState?.vitals?.temperature;
  if (temp !== undefined && temp < 33) {
    osbornWave = true;
  }

  // Clamp HR
  hr = Math.max(20, Math.min(250, hr));

  // Adjust QTc for rate (simplified Bazett-like)
  const rr = 60000 / hr;
  const baseQt = 380;  // ms at 60 bpm
  qtc = Math.round(baseQt + 0.4 * Math.sqrt(rr));

  return {
    rhythm,
    rate: hr,
    pWave,
    prInterval,
    qrsDuration,
    stSegment,
    tWave,
    qtc,
    lowVoltage,
    electricalAlternans,
    osbornWave,
  };
}

// ── Beat waveform generator ────────────────────────────────────

/**
 * Generate one cardiac cycle waveform for a specific lead.
 * Time is normalized: beatDuration = 1.0 (one RR interval worth of samples).
 *
 * Returns array of sample values in normalized -1..1 range.
 *
 * @param morphology ECG morphology settings
 * @param lead lead name
 * @param nSamples number of samples for one beat
 * @param beatIndex which beat (for electrical alternans)
 */
function generateOneBeat(
  morphology: ECGMorphology,
  lead: string,
  nSamples: number,
  beatIndex: number
): number[] {
  const samples = new Array<number>(nSamples).fill(0);
  const { rhythm, qrsDuration, prInterval } = morphology;

  // Flat-line rhythms
  if (rhythm === "asystole") {
    return addNoise(samples, 0.01);
  }

  if (rhythm === "ventricular_fibrillation") {
    // Chaotic oscillation 3-8 Hz — simulate with multiple overlapping sinusoids
    for (let i = 0; i < nSamples; i++) {
      const t = i / nSamples;
      const chaos =
        0.3 * Math.sin(2 * Math.PI * 4.5 * t + Math.random() * 0.5) +
        0.2 * Math.sin(2 * Math.PI * 6.0 * t + beatIndex * 0.7) +
        0.15 * Math.sin(2 * Math.PI * 3.2 * t);
      samples[i] = chaos;
    }
    return addNoise(samples, 0.05);
  }

  // Lead-specific amplitude scaling
  const isLimb = ["I", "II", "III", "aVR", "aVL", "aVF"].includes(lead);
  const isPrecordial = ["V1", "V2", "V3", "V4", "V5", "V6"].includes(lead);

  const axisAngleDeg = LEAD_ANGLES[lead] ?? 60;
  const axisAngleRad = (axisAngleDeg * Math.PI) / 180;

  // QRS electrical axis: ~60° for normal
  const qrsAxisRad = (60 * Math.PI) / 180;
  const qrsProjection = Math.cos(axisAngleRad - qrsAxisRad);

  // P-wave axis: ~60°
  const pAxisRad = (60 * Math.PI) / 180;
  const pProjection = Math.cos(axisAngleRad - pAxisRad);

  // T-wave axis: ~60°
  const tProjection = qrsProjection; // simplified

  // Voltage scaling
  let voltageScale = morphology.lowVoltage ? 0.45 : 1.0;

  // Electrical alternans: every other beat is lower voltage
  if (morphology.electricalAlternans && beatIndex % 2 === 1) {
    voltageScale *= 0.55;
  }

  // ── Beat timing (as fraction of beat cycle 0..1) ──

  // RR interval in ms (for reference, but we work in normalized 0..1)
  // Map timing in ms to fraction of beat:
  const rrMs = 60000 / morphology.rate;  // ms per beat

  // Timing landmarks (ms from start of beat)
  const pStart = 0.05 * rrMs;
  const pPeak = pStart + 40;
  const pEnd = pPeak + 40;
  const qrsStart = Math.min(pEnd + (prInterval - 80), 0.3 * rrMs);
  const qPeak = qrsStart + 15;
  const rPeak = qrsStart + qrsDuration * 0.3;
  const sPeak = qrsStart + qrsDuration * 0.7;
  const qrsEnd = qrsStart + qrsDuration;
  const tStart = qrsEnd + 40;   // ST segment
  const tPeak = tStart + 80;
  const tEnd = tPeak + 100;

  // Convert to sample indices
  const toIdx = (ms: number) => Math.round((ms / rrMs) * nSamples);

  // ── Build waveform ──

  // AFib: no P wave, irregular (handled at higher level via RR variation)
  const rhythmStr = rhythm as string;
  const hasPWave = morphology.pWave && rhythmStr !== "atrial_fibrillation" && rhythmStr !== "ventricular_tachycardia";
  const hasQRS = rhythmStr !== "asystole" && rhythmStr !== "ventricular_fibrillation";

  if (hasPWave) {
    const pIdx = toIdx(pPeak);
    const pSigma = Math.max(3, toIdx(pPeak) - toIdx(pStart));
    const pAmplitude = 0.15 * pProjection * voltageScale;
    for (let i = 0; i < nSamples; i++) {
      samples[i] += gaussian(i, pIdx, pAmplitude, pSigma);
    }
  }

  if (hasQRS) {
    // Limb leads: use axis projection
    // Precordial: use R/S progression factors
    let rAmp: number;
    let sAmp: number;
    let qAmp: number;

    if (isPrecordial) {
      rAmp = (PRECORDIAL_R_FACTOR[lead] ?? 0.5) * voltageScale;
      sAmp = -(PRECORDIAL_S_FACTOR[lead] ?? 0.5) * voltageScale;
      qAmp = -0.05 * voltageScale;
    } else {
      // Limb leads: use projection
      rAmp = 0.9 * Math.max(0, qrsProjection) * voltageScale;
      sAmp = -0.3 * Math.max(0, -qrsProjection) * voltageScale;
      qAmp = -0.1 * voltageScale * Math.sign(qrsProjection);

      // aVR: mostly inverted
      if (lead === "aVR") {
        rAmp = -0.6 * voltageScale;
        sAmp = 0.1 * voltageScale;
        qAmp = 0.05 * voltageScale;
      }
    }

    // VTach: wide, monomorphic QRS, different morphology
    if (rhythm === "ventricular_tachycardia") {
      // Wide bizarre QRS (>120ms), no P waves
      const vtQrsSigma = Math.max(8, toIdx(qrsStart + 80) - toIdx(qrsStart));
      const vtRAmplitude = isPrecordial ? rAmp * 1.2 : 0.8 * Math.sign(rAmp || 1) * voltageScale;
      const rIdx = toIdx(rPeak);
      for (let i = 0; i < nSamples; i++) {
        samples[i] += gaussian(i, rIdx, vtRAmplitude, vtQrsSigma);
        // Add secondary notch for wide QRS look
        samples[i] += gaussian(i, rIdx + vtQrsSigma, vtRAmplitude * 0.3, vtQrsSigma * 0.5);
      }
    } else {
      // Normal QRS: Q + R + S
      const qIdx = toIdx(qPeak);
      const rIdx = toIdx(rPeak);
      const sIdx = toIdx(sPeak);

      const qSigma = Math.max(2, toIdx(qrsStart + 10) - toIdx(qrsStart));
      const rSigma = Math.max(3, toIdx(qrsStart + qrsDuration * 0.25) - toIdx(qrsStart));
      const sSigma = Math.max(2, toIdx(qrsStart + 10) - toIdx(qrsStart));

      for (let i = 0; i < nSamples; i++) {
        samples[i] += gaussian(i, qIdx, qAmp, qSigma);
        samples[i] += gaussian(i, rIdx, rAmp, rSigma);
        samples[i] += gaussian(i, sIdx, sAmp, sSigma);
      }
    }

    // ── T wave ──
    let tAmplitude: number;
    switch (morphology.tWave) {
      case "inverted":
        tAmplitude = -0.2 * Math.abs(tProjection) * voltageScale;
        break;
      case "peaked":
        tAmplitude = 0.5 * Math.abs(tProjection) * voltageScale;
        break;
      case "flattened":
        tAmplitude = 0.05 * Math.abs(tProjection) * voltageScale;
        break;
      default: // normal
        tAmplitude = 0.25 * Math.max(0.2, Math.abs(tProjection)) * voltageScale;
        if (isPrecordial) {
          // Precordial T: positive in V4-V6, may invert in V1-V2
          if (lead === "V1" || lead === "V2") tAmplitude = Math.abs(tAmplitude) * -0.3;
          else tAmplitude = Math.abs(tAmplitude) * (PRECORDIAL_R_FACTOR[lead] ?? 0.5);
        }
    }

    // aVR T usually inverted
    if (lead === "aVR") tAmplitude = -Math.abs(tAmplitude);

    const tIdx = toIdx(tPeak);
    const tSigma = Math.max(5, toIdx(tEnd) - toIdx(tStart));
    for (let i = 0; i < nSamples; i++) {
      samples[i] += gaussian(i, tIdx, tAmplitude, tSigma);
    }

    // ── ST segment deviation ──
    if (morphology.stSegment !== "normal") {
      const stDeviation = morphology.stSegment === "elevated" ? 0.1 : -0.1;
      const stStartIdx = toIdx(qrsEnd);
      const stEndIdx = toIdx(tStart);
      for (let i = stStartIdx; i < stEndIdx && i < nSamples; i++) {
        samples[i] += stDeviation * voltageScale;
      }
    }

    // ── Osborn wave (hypothermia) ──
    // J-point elevation notch at the end of QRS
    if (morphology.osbornWave) {
      const jIdx = toIdx(qrsEnd);
      const jSigma = Math.max(3, toIdx(qrsEnd + 20) - toIdx(qrsEnd));
      const jAmplitude = 0.2 * voltageScale * (lead === "V5" || lead === "V6" ? 1.5 : 1.0);
      for (let i = 0; i < nSamples; i++) {
        samples[i] += gaussian(i, jIdx, jAmplitude, jSigma);
      }
    }
  }

  return addNoise(samples, 0.012);
}

/** Add small Gaussian noise to samples */
function addNoise(samples: number[], magnitude: number): number[] {
  return samples.map((s) => s + (Math.random() - 0.5) * 2 * magnitude);
}

// ── Main sample generator ──────────────────────────────────────

/**
 * Generate waveform samples for one lead.
 *
 * @param morphology ECG morphology
 * @param lead lead name (I, II, III, aVR, aVL, aVF, V1-V6)
 * @param durationMs total duration in milliseconds
 * @param sampleRate samples per second (default 250 Hz)
 */
export function generateLeadSamples(
  morphology: ECGMorphology,
  lead: string,
  durationMs: number,
  sampleRate = 250
): number[] {
  const totalSamples = Math.round((durationMs / 1000) * sampleRate);
  const result = new Array<number>(totalSamples).fill(0);

  const { rhythm, rate } = morphology;

  if (rhythm === "asystole") {
    return addNoise(result, 0.012);
  }

  if (rhythm === "ventricular_fibrillation") {
    // Continuous chaos — don't use beat-based generation
    for (let i = 0; i < totalSamples; i++) {
      const t = i / sampleRate;
      result[i] =
        0.35 * Math.sin(2 * Math.PI * 4.8 * t + Math.random() * 0.3) +
        0.25 * Math.sin(2 * Math.PI * 6.3 * t) +
        0.15 * Math.sin(2 * Math.PI * 3.1 * t + 1.2) +
        0.10 * Math.sin(2 * Math.PI * 7.5 * t + Math.random() * 0.4);
    }
    return addNoise(result, 0.06);
  }

  // Beat-based generation
  const rrMs = 60000 / rate;
  let currentMs = 0;
  let beatIndex = 0;

  while (currentMs < durationMs) {
    // AFib: irregular RR intervals (±15-25% jitter)
    let thisBeatMs = rrMs;
    if (rhythm === "atrial_fibrillation") {
      const jitter = 1 + (Math.random() - 0.5) * 0.4; // ±20%
      thisBeatMs = rrMs * jitter;
    }

    const beatSamples = Math.round((thisBeatMs / 1000) * sampleRate);
    const startIdx = Math.round((currentMs / 1000) * sampleRate);

    const beatWaveform = generateOneBeat(morphology, lead, beatSamples, beatIndex);

    // Copy beat waveform into result
    for (let j = 0; j < beatSamples && startIdx + j < totalSamples; j++) {
      result[startIdx + j] = beatWaveform[j];
    }

    currentMs += thisBeatMs;
    beatIndex++;
  }

  return result;
}

// ── 12-Lead snapshot ───────────────────────────────────────────

const ALL_LEADS = ["I", "II", "III", "aVR", "aVL", "aVF", "V1", "V2", "V3", "V4", "V5", "V6"];

/**
 * Generate all 12 leads at once.
 *
 * @param morphology ECG morphology
 * @param durationMs duration in ms (default 10000 = 10s)
 * @param sampleRate Hz (default 250)
 */
export function generate12LeadSnapshot(
  morphology: ECGMorphology,
  durationMs = 10000,
  sampleRate = 250
): ECGLeadData[] {
  return ALL_LEADS.map((lead) => ({
    lead,
    samples: generateLeadSamples(morphology, lead, durationMs, sampleRate),
    annotations: buildAnnotations(morphology),
  }));
}

/** Build interpretation annotations */
function buildAnnotations(morphology: ECGMorphology): string[] {
  const ann: string[] = [];

  ann.push(`Rate: ${morphology.rate} bpm`);

  switch (morphology.rhythm) {
    case "normal_sinus":
      ann.push("Normal sinus rhythm");
      break;
    case "sinus_tachycardia":
      ann.push("Sinus tachycardia");
      break;
    case "sinus_bradycardia":
      ann.push("Sinus bradycardia");
      break;
    case "atrial_fibrillation":
      ann.push("Atrial fibrillation — irregular rhythm, no P waves");
      break;
    case "ventricular_tachycardia":
      ann.push("Ventricular tachycardia — wide QRS, no P waves");
      break;
    case "ventricular_fibrillation":
      ann.push("⚠️ Ventricular fibrillation — DEFIBRILLATE");
      break;
    case "asystole":
      ann.push("⚠️ Asystole — CPR indicated");
      break;
    case "pea":
      ann.push("⚠️ PEA — organized rhythm, no pulse — CPR indicated");
      break;
  }

  if (morphology.lowVoltage) ann.push("Low voltage QRS");
  if (morphology.electricalAlternans) ann.push("Electrical alternans — consider tamponade");
  if (morphology.osbornWave) ann.push("Osborn (J) waves — consider hypothermia");
  if (morphology.stSegment === "elevated") ann.push("ST elevation");
  if (morphology.stSegment === "depressed") ann.push("ST depression");
  if (morphology.tWave === "peaked") ann.push("Peaked T waves — consider hyperkalemia");
  if (morphology.tWave === "inverted") ann.push("T wave inversions");
  if (morphology.qrsDuration > 120) ann.push(`Wide QRS (${morphology.qrsDuration}ms)`);
  if (morphology.qtc > 480) ann.push(`Prolonged QTc (${morphology.qtc}ms)`);

  return ann;
}

/**
 * Auto-generate a text interpretation for the ECG.
 */
export function generateInterpretation(morphology: ECGMorphology): string {
  const parts: string[] = [];

  // Rhythm
  const rhythmText: Record<ECGRhythm, string> = {
    normal_sinus: "Normal sinus rhythm",
    sinus_tachycardia: "Sinus tachycardia",
    sinus_bradycardia: "Sinus bradycardia",
    atrial_fibrillation: "Atrial fibrillation",
    ventricular_tachycardia: "Ventricular tachycardia",
    ventricular_fibrillation: "Ventricular fibrillation",
    asystole: "Asystole",
    pea: "PEA (pulseless electrical activity)",
  };
  parts.push(`${rhythmText[morphology.rhythm]}, rate ${morphology.rate} bpm.`);

  if (morphology.lowVoltage) parts.push("Low voltage QRS complexes.");
  if (morphology.electricalAlternans) parts.push("Electrical alternans present — suspect cardiac tamponade.");
  if (morphology.osbornWave) parts.push("Osborn (J) waves noted — consistent with hypothermia.");
  if (morphology.qrsDuration > 120) parts.push(`Widened QRS (${morphology.qrsDuration}ms).`);
  if (morphology.stSegment === "elevated") parts.push("ST-segment elevation.");
  if (morphology.stSegment === "depressed") parts.push("ST-segment depression.");
  if (morphology.tWave === "peaked") parts.push("Peaked T waves — rule out hyperkalemia.");
  if (morphology.tWave === "inverted") parts.push("T-wave inversions.");
  if (morphology.qtc > 480) parts.push(`Prolonged QTc (${morphology.qtc}ms).`);

  return parts.join(" ");
}
