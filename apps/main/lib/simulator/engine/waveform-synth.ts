/**
 * Waveform Synthesizer — Generate realistic ICU monitor waveforms from vitals
 *
 * Produces 4 traces at 250 Hz (standard bedside monitor sample rate):
 *   1. ECG (Lead II) — from HR + rhythm
 *   2. Arterial Line — from SBP/DBP + HR
 *   3. SpO2 Plethysmograph — from SpO2 + HR
 *   4. Capnography — from EtCO2 + RR
 *
 * Each trace is a ring buffer of normalized values [0, 1] displayed
 * as a scrolling waveform on canvas.
 */

export const SAMPLE_RATE = 250; // Hz — standard bedside monitor
export const DISPLAY_SECONDS = 6; // visible window
export const BUFFER_SIZE = SAMPLE_RATE * DISPLAY_SECONDS; // 1500 samples

// ─── Types ─────────────────────────────────────────────────────────────────

export interface WaveformVitals {
  hr: number;        // beats per minute
  sbp: number;       // mmHg
  dbp: number;       // mmHg
  spo2: number;      // 0-100%
  rr: number;        // breaths per minute
  etco2: number;     // mmHg (typically 35-45)
  rhythm: "sinus" | "afib" | "vtach" | "vfib" | "asystole";
}

export interface WaveformState {
  ecg: Float32Array;
  arterial: Float32Array;
  pleth: Float32Array;
  capno: Float32Array;
  writeIndex: number;
  phase: {
    ecg: number;     // phase within cardiac cycle [0, 1)
    resp: number;    // phase within respiratory cycle [0, 1)
  };
}

// ─── Create State ──────────────────────────────────────────────────────────

export function createWaveformState(): WaveformState {
  return {
    ecg: new Float32Array(BUFFER_SIZE),
    arterial: new Float32Array(BUFFER_SIZE),
    pleth: new Float32Array(BUFFER_SIZE),
    capno: new Float32Array(BUFFER_SIZE),
    writeIndex: 0,
    phase: { ecg: 0, resp: 0 },
  };
}

// ─── ECG Lead II Synthesis ─────────────────────────────────────────────────

/**
 * Generate one ECG sample given cardiac phase [0, 1).
 * Models P-QRS-T morphology of Lead II.
 * Returns value in range [-0.1, 1.0] (R-wave peak = 1.0, baseline = 0.15)
 */
function ecgSample(phase: number, rhythm: WaveformVitals["rhythm"]): number {
  if (rhythm === "asystole") return 0.15;

  if (rhythm === "vfib") {
    // Chaotic oscillation
    return 0.15 + 0.3 * Math.sin(phase * 37) * Math.sin(phase * 23) + 0.1 * Math.sin(phase * 71);
  }

  if (rhythm === "vtach") {
    // Wide QRS at high rate — sine-like
    const wide = Math.sin(phase * 2 * Math.PI);
    return 0.15 + 0.4 * wide;
  }

  // Normal sinus / AFib — standard PQRST
  const p = phase;

  // P wave: phase 0.06 - 0.12
  let v = 0.15; // baseline

  if (p >= 0.06 && p < 0.12) {
    const t = (p - 0.06) / 0.06;
    v += 0.08 * Math.sin(t * Math.PI);
  }

  // PR segment: 0.12 - 0.16 (baseline)

  // QRS complex: 0.16 - 0.24
  if (p >= 0.16 && p < 0.18) {
    // Q wave (small negative)
    const t = (p - 0.16) / 0.02;
    v -= 0.05 * Math.sin(t * Math.PI);
  } else if (p >= 0.18 && p < 0.21) {
    // R wave (tall positive)
    const t = (p - 0.18) / 0.03;
    v += 0.85 * Math.sin(t * Math.PI);
  } else if (p >= 0.21 && p < 0.24) {
    // S wave (small negative)
    const t = (p - 0.21) / 0.03;
    v -= 0.15 * Math.sin(t * Math.PI);
  }

  // ST segment: 0.24 - 0.35 (baseline, slight elevation OK)

  // T wave: 0.35 - 0.50
  if (p >= 0.35 && p < 0.50) {
    const t = (p - 0.35) / 0.15;
    v += 0.18 * Math.sin(t * Math.PI);
  }

  // Add AFib irregularity (fibrillatory baseline)
  if (rhythm === "afib") {
    v += 0.02 * Math.sin(p * 47) + 0.015 * Math.sin(p * 83);
  }

  return v;
}

// ─── Arterial Line Synthesis ───────────────────────────────────────────────

/**
 * Generate one arterial pressure waveform sample.
 * Phase [0, 1) within cardiac cycle.
 * Returns pressure in mmHg range, normalized later.
 */
function arterialSample(phase: number, sbp: number, dbp: number): number {
  const pp = sbp - dbp; // pulse pressure

  // Arterial waveform has:
  //   - Rapid upstroke (systolic phase: 0 - 0.15)
  //   - Systolic peak (0.15)
  //   - Dicrotic notch (0.35 - 0.40)
  //   - Diastolic runoff (0.40 - 1.0)

  let pressure = dbp;

  if (phase < 0.15) {
    // Systolic upstroke — rapid, steep
    const t = phase / 0.15;
    pressure = dbp + pp * Math.pow(Math.sin(t * Math.PI / 2), 0.7);
  } else if (phase < 0.35) {
    // Post-peak decline toward dicrotic notch
    const t = (phase - 0.15) / 0.20;
    pressure = sbp - pp * 0.25 * t;
  } else if (phase < 0.42) {
    // Dicrotic notch — brief dip then small bounce
    const t = (phase - 0.35) / 0.07;
    const notchDepth = pp * 0.12;
    pressure = sbp - pp * 0.25 - notchDepth * Math.sin(t * Math.PI);
    // Small reflected wave after notch
    if (t > 0.5) {
      pressure += pp * 0.06 * Math.sin((t - 0.5) * 2 * Math.PI);
    }
  } else {
    // Diastolic runoff — exponential decay
    const t = (phase - 0.42) / 0.58;
    const startP = sbp - pp * 0.30;
    pressure = dbp + (startP - dbp) * Math.exp(-3 * t);
  }

  return pressure;
}

// ─── SpO2 Plethysmograph ──────────────────────────────────────────────────

/**
 * SpO2 pleth waveform — similar shape to arterial but inverted and smoother.
 * Amplitude decreases with lower SpO2.
 */
function plethSample(phase: number, spo2: number): number {
  // Amplitude scales with perfusion (proxy: SpO2 > 90% = good perfusion)
  const amplitude = Math.max(0.1, Math.min(1.0, (spo2 - 70) / 30));

  // Pleth waveform: smooth systolic rise + dicrotic notch
  let v = 0;

  if (phase < 0.20) {
    // Systolic upstroke
    const t = phase / 0.20;
    v = amplitude * Math.pow(Math.sin(t * Math.PI / 2), 0.6);
  } else if (phase < 0.35) {
    // Post-peak
    const t = (phase - 0.20) / 0.15;
    v = amplitude * (1 - 0.2 * t);
  } else if (phase < 0.42) {
    // Dicrotic notch (subtle)
    const t = (phase - 0.35) / 0.07;
    v = amplitude * (0.8 - 0.05 * Math.sin(t * Math.PI));
  } else {
    // Diastolic runoff
    const t = (phase - 0.42) / 0.58;
    v = amplitude * 0.75 * Math.exp(-2.5 * t);
  }

  return v;
}

// ─── Capnography ───────────────────────────────────────────────────────────

/**
 * Capnography waveform — CO2 during respiratory cycle.
 * Phase [0, 1) within respiratory cycle.
 * Returns CO2 in mmHg (0 during inspiration, rising to EtCO2 during expiration).
 */
function capnoSample(respPhase: number, etco2: number): number {
  // Typical capnography:
  //   Inspiration (0 - 0.40): CO2 ≈ 0
  //   Phase II rise (0.40 - 0.50): rapid rise
  //   Phase III plateau (0.50 - 0.85): near EtCO2
  //   Phase 0 descent (0.85 - 0.95): rapid drop to 0
  //   Inspiration (0.95 - 1.0): CO2 = 0

  if (respPhase < 0.40) {
    // Inspiration — no CO2
    return 0;
  } else if (respPhase < 0.50) {
    // Phase II — rapid exponential rise
    const t = (respPhase - 0.40) / 0.10;
    return etco2 * (1 - Math.exp(-4 * t));
  } else if (respPhase < 0.85) {
    // Phase III — alveolar plateau (slight upslope is normal)
    const t = (respPhase - 0.50) / 0.35;
    return etco2 * (0.92 + 0.08 * t);
  } else if (respPhase < 0.95) {
    // Phase 0 — rapid inspiratory downstroke
    const t = (respPhase - 0.85) / 0.10;
    return etco2 * Math.exp(-6 * t);
  } else {
    return 0;
  }
}

// ─── Main Generator ────────────────────────────────────────────────────────

/**
 * Generate `count` samples and write into the waveform buffers.
 * Call this at regular intervals (e.g., every 40ms for 10 samples at 250Hz).
 */
export function generateSamples(
  state: WaveformState,
  vitals: WaveformVitals,
  count: number = 10,
): void {
  const { hr, sbp, dbp, spo2, rr, etco2, rhythm } = vitals;

  // Period calculations
  const cardiacPeriodSamples = (60 / Math.max(hr, 20)) * SAMPLE_RATE;
  const respPeriodSamples = (60 / Math.max(rr, 4)) * SAMPLE_RATE;

  const cardiacPhaseIncrement = 1 / cardiacPeriodSamples;
  const respPhaseIncrement = 1 / respPeriodSamples;

  // AFib: add RR variability
  let rrVariability = 0;
  if (rhythm === "afib") {
    rrVariability = 0.15; // ±15% RR interval variation
  }

  for (let i = 0; i < count; i++) {
    const idx = state.writeIndex % BUFFER_SIZE;

    // Apply AFib variability to cardiac phase increment
    let effectiveCardiacIncrement = cardiacPhaseIncrement;
    if (rrVariability > 0 && state.phase.ecg < 0.01) {
      // At start of new beat, randomize the interval
      const variation = 1 + (Math.random() * 2 - 1) * rrVariability;
      effectiveCardiacIncrement = cardiacPhaseIncrement * variation;
    }

    // ECG
    state.ecg[idx] = ecgSample(state.phase.ecg, rhythm);

    // Arterial line — phase delayed ~0.05 from ECG (pulse transit time)
    const artPhase = (state.phase.ecg + 0.92) % 1; // slight delay
    state.arterial[idx] = arterialSample(artPhase, sbp, dbp) / 200; // normalize to 0-1

    // SpO2 pleth — phase delayed ~0.10 from ECG
    const plethPhase = (state.phase.ecg + 0.88) % 1;
    state.pleth[idx] = plethSample(plethPhase, spo2);

    // Capnography
    state.capno[idx] = capnoSample(state.phase.resp, etco2) / 60; // normalize to 0-1

    // Advance phases
    state.phase.ecg = (state.phase.ecg + effectiveCardiacIncrement) % 1;
    state.phase.resp = (state.phase.resp + respPhaseIncrement) % 1;

    state.writeIndex++;
  }
}

// ─── Utilities ─────────────────────────────────────────────────────────────

/**
 * Get the display buffer as a sequential array starting from oldest sample.
 * Returns [oldest, ..., newest] for rendering left-to-right.
 */
export function getDisplayBuffer(buffer: Float32Array, writeIndex: number): Float32Array {
  const size = buffer.length;
  const start = writeIndex % size;
  const result = new Float32Array(size);

  // Copy from start to end, then from 0 to start
  result.set(buffer.subarray(start), 0);
  result.set(buffer.subarray(0, start), size - start);

  return result;
}
