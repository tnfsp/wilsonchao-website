"use client";

import { useEffect, useRef, useCallback, memo } from "react";
import { useProGameStore } from "@/lib/simulator/store";
import {
  createWaveformState,
  generateSamples,
  getDisplayBuffer,
  SAMPLE_RATE,
  BUFFER_SIZE,
  type WaveformState,
  type WaveformVitals,
} from "@/lib/simulator/engine/waveform-synth";

// ─── Config ─────────────────────────────────────────────────────────────────

const CANVAS_HEIGHT = 120;
const ECG_COLOR = "#22c55e";
const ART_COLOR = "#ef4444";
const BG_COLOR = "#000000";
const SWEEP_COLOR = "rgba(0, 0, 0, 0.6)";
const GRID_COLOR = "rgba(255, 255, 255, 0.04)";

// Traces: A-line (arterial) top half — PRIMARY for post-cardiac surgery ICU
//         ECG (Lead II) bottom half — secondary
const TRACES = [
  {
    label: "ART",
    color: ART_COLOR,
    yOffset: 0,
    height: 0.5, // fraction of canvas — top half, primary trace
    yMin: 0.15,
    yMax: 1.05,
    getBuffer: (s: WaveformState) => s.arterial,
  },
  {
    label: "II",
    color: ECG_COLOR,
    yOffset: 0.5,
    height: 0.5,
    yMin: -0.1,
    yMax: 1.1,
    getBuffer: (s: WaveformState) => s.ecg,
  },
] as const;

// How many samples to generate per animation tick (~60fps → ~17ms → 4 samples at 250Hz)
const SAMPLES_PER_TICK = Math.round(SAMPLE_RATE / 60);

// ─── Helpers ────────────────────────────────────────────────────────────────

function mapRhythm(
  strip: string,
): WaveformVitals["rhythm"] {
  switch (strip) {
    case "afib":
    case "aflutter":
      return "afib";
    case "vf":
      return "vfib";
    case "vt_pulse":
    case "vt_pulseless":
      return "vtach";
    case "asystole":
    case "pea":
      return "asystole";
    default:
      return "sinus";
  }
}

// ─── Component ──────────────────────────────────────────────────────────────

export default memo(function MiniWaveform() {
  const vitals = useProGameStore((s) => s.patient?.vitals);
  const phase = useProGameStore((s) => s.phase);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const waveformRef = useRef<WaveformState | null>(null);
  const rafRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);

  // Build WaveformVitals from store vitals
  const getWaveformVitals = useCallback((): WaveformVitals => {
    if (!vitals) {
      return { hr: 80, sbp: 120, dbp: 80, spo2: 98, rr: 14, etco2: 38, rhythm: "sinus" };
    }
    return {
      hr: vitals.hr,
      sbp: vitals.sbp,
      dbp: vitals.dbp,
      spo2: vitals.spo2,
      rr: vitals.rr,
      etco2: vitals.etco2 ?? 38,
      rhythm: mapRhythm(vitals.rhythmStrip),
    };
  }, [vitals]);

  // Draw loop
  const draw = useCallback(
    (timestamp: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Init waveform state on first frame
      if (!waveformRef.current) {
        waveformRef.current = createWaveformState();
      }

      // Generate new samples based on elapsed time
      const dt = lastTimeRef.current ? timestamp - lastTimeRef.current : 16;
      lastTimeRef.current = timestamp;
      const samplesToGen = Math.round((dt / 1000) * SAMPLE_RATE);
      if (samplesToGen > 0 && samplesToGen < 200) {
        generateSamples(waveformRef.current, getWaveformVitals(), samplesToGen);
      }

      const w = canvas.width;
      const h = canvas.height;
      const state = waveformRef.current;
      const writeIdx = state.writeIndex;

      // Clear
      ctx.fillStyle = BG_COLOR;
      ctx.fillRect(0, 0, w, h);

      // Subtle grid lines
      ctx.strokeStyle = GRID_COLOR;
      ctx.lineWidth = 1;
      for (let gy = 0; gy < h; gy += h / 4) {
        ctx.beginPath();
        ctx.moveTo(0, gy);
        ctx.lineTo(w, gy);
        ctx.stroke();
      }

      // Divider between ECG and ART
      ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
      ctx.beginPath();
      ctx.moveTo(0, h * 0.5);
      ctx.lineTo(w, h * 0.5);
      ctx.stroke();

      // Draw each trace
      for (const trace of TRACES) {
        const buffer = getDisplayBuffer(trace.getBuffer(state), writeIdx);
        const yTop = trace.yOffset * h;
        const traceH = trace.height * h;
        const range = trace.yMax - trace.yMin;

        ctx.strokeStyle = trace.color;
        ctx.lineWidth = 1.5;
        ctx.beginPath();

        for (let x = 0; x < w; x++) {
          const sampleIdx = Math.floor((x / w) * BUFFER_SIZE);
          const val = buffer[sampleIdx];
          // Map value to y coordinate (inverted: higher value = lower y)
          const normalized = (val - trace.yMin) / range;
          const y = yTop + traceH * (1 - normalized);

          if (x === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.stroke();
      }

      // Sweep line (eraser effect ahead of write position)
      const sweepX = ((writeIdx % BUFFER_SIZE) / BUFFER_SIZE) * w;
      const sweepWidth = w * 0.04;
      const gradient = ctx.createLinearGradient(sweepX, 0, sweepX + sweepWidth, 0);
      gradient.addColorStop(0, "rgba(0,0,0,0)");
      gradient.addColorStop(0.5, SWEEP_COLOR);
      gradient.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = gradient;
      ctx.fillRect(sweepX, 0, sweepWidth, h);

      // Trace labels
      ctx.font = "bold 10px monospace";
      for (const trace of TRACES) {
        const yTop = trace.yOffset * h;
        ctx.fillStyle = trace.color;
        ctx.fillText(trace.label, 4, yTop + 12);
      }

      // Numeric readouts — top right (ART primary, ECG secondary)
      const wv = getWaveformVitals();
      ctx.textAlign = "right";
      ctx.font = "bold 12px monospace";
      ctx.fillStyle = ART_COLOR;
      ctx.fillText(`${wv.sbp}/${wv.dbp}`, w - 6, 14);
      ctx.fillStyle = ECG_COLOR;
      ctx.fillText(`HR ${wv.hr}`, w - 6, h * 0.5 + 14);
      ctx.textAlign = "left";

      rafRef.current = requestAnimationFrame(draw);
    },
    [getWaveformVitals],
  );

  // Start/stop animation loop based on game phase
  useEffect(() => {
    if (phase !== "playing") {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = 0;
      }
      lastTimeRef.current = 0;
      return;
    }

    // Reset waveform state when game starts
    waveformRef.current = createWaveformState();
    lastTimeRef.current = 0;
    rafRef.current = requestAnimationFrame(draw);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = 0;
      }
    };
  }, [phase, draw]);

  // Handle canvas resize
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width } = entry.contentRect;
        if (width > 0) {
          const dpr = window.devicePixelRatio || 1;
          canvas.width = width * dpr;
          canvas.height = CANVAS_HEIGHT * dpr;
          const ctx = canvas.getContext("2d");
          if (ctx) ctx.scale(dpr, dpr);
          // Adjust logical drawing dimensions
          canvas.style.width = `${width}px`;
          canvas.style.height = `${CANVAS_HEIGHT}px`;
        }
      }
    });

    resizeObserver.observe(canvas.parentElement || canvas);
    return () => resizeObserver.disconnect();
  }, []);

  // Don't render during intro/debrief
  if (phase !== "playing") return null;

  return (
    <div className="w-full rounded-lg overflow-hidden border border-white/8 bg-black">
      <canvas
        ref={canvasRef}
        className="w-full"
        style={{ height: CANVAS_HEIGHT, display: "block" }}
      />
    </div>
  );
});
