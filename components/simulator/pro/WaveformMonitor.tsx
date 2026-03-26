"use client";

import { useEffect, useRef, useCallback, useMemo, memo } from "react";
import { useProGameStore } from "@/lib/simulator/store";
import {
  createWaveformState,
  generateSamples,
  getDisplayBuffer,
  SAMPLE_RATE,
  BUFFER_SIZE,
  DISPLAY_SECONDS,
  type WaveformState,
  type WaveformVitals,
} from "@/lib/simulator/engine/waveform-synth";
import { applyVitalsFog, FOG_PRESETS } from "@/lib/simulator/engine/fog-of-war";

// ─── Config ─────────────────────────────────────────────────────────────────

interface TraceConfig {
  label: string;
  color: string;
  heightRatio: number; // fraction of total canvas height
  yMin: number;        // data range min
  yMax: number;        // data range max
  getBuffer: (state: WaveformState) => Float32Array;
  valueLabel?: (vitals: WaveformVitals) => string;
  valueLabelColor?: string;
}

const TRACES: TraceConfig[] = [
  {
    label: "II",
    color: "#22c55e",         // green — standard ECG Lead II
    heightRatio: 0.30,
    yMin: -0.1,
    yMax: 1.1,
    getBuffer: (s) => s.ecg,
    valueLabel: (v) => `${v.hr}`,
    valueLabelColor: "#22c55e",
  },
  {
    label: "ART",
    color: "#ef4444",         // red — arterial line
    heightRatio: 0.25,
    yMin: 0.15,               // ~30 mmHg / 200
    yMax: 1.05,               // ~210 mmHg / 200
    getBuffer: (s) => s.arterial,
    valueLabel: (v) => `${v.sbp}/${v.dbp}`,
    valueLabelColor: "#ef4444",
  },
  {
    label: "SpO₂",
    color: "#3b82f6",         // blue — pleth
    heightRatio: 0.20,
    yMin: -0.1,
    yMax: 1.1,
    getBuffer: (s) => s.pleth,
    valueLabel: (v) => `${v.spo2}%`,
    valueLabelColor: "#3b82f6",
  },
  {
    label: "CO₂",
    color: "#eab308",         // yellow — capnography
    heightRatio: 0.25,
    yMin: -0.05,
    yMax: 0.85,               // etco2 45 / 60 = 0.75
    getBuffer: (s) => s.capno,
    valueLabel: (v) => `${v.etco2}`,
    valueLabelColor: "#eab308",
  },
];

// ─── Canvas Renderer ────────────────────────────────────────────────────────

function drawWaveforms(
  canvas: HTMLCanvasElement,
  wfState: WaveformState,
  vitals: WaveformVitals,
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const W = canvas.width;
  const H = canvas.height;
  const dpr = window.devicePixelRatio || 1;

  // Clear with dark background
  ctx.fillStyle = "#000d14";
  ctx.fillRect(0, 0, W, H);

  // Dim grid lines
  ctx.strokeStyle = "rgba(255,255,255,0.04)";
  ctx.lineWidth = 1 * dpr;

  // Vertical grid (1 second intervals)
  for (let s = 1; s < DISPLAY_SECONDS; s++) {
    const x = (s / DISPLAY_SECONDS) * W;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, H);
    ctx.stroke();
  }

  // Sweep cursor position
  const cursorX = ((wfState.writeIndex % BUFFER_SIZE) / BUFFER_SIZE) * W;

  // Draw each trace
  let yOffset = 0;

  for (const trace of TRACES) {
    const traceH = H * trace.heightRatio;
    const y0 = yOffset;
    const y1 = yOffset + traceH;

    // Horizontal separator
    ctx.strokeStyle = "rgba(255,255,255,0.06)";
    ctx.beginPath();
    ctx.moveTo(0, y1);
    ctx.lineTo(W, y1);
    ctx.stroke();

    // Get display buffer
    const buffer = getDisplayBuffer(trace.getBuffer(wfState), wfState.writeIndex);

    // Draw waveform
    ctx.strokeStyle = trace.color;
    ctx.lineWidth = 1.5 * dpr;
    ctx.lineJoin = "round";
    ctx.beginPath();

    for (let i = 0; i < BUFFER_SIZE; i++) {
      const x = (i / BUFFER_SIZE) * W;

      // Gap near the cursor (erasing ahead effect)
      const distFromCursor = Math.abs(x - cursorX);
      if (distFromCursor < W * 0.02) continue;

      const val = buffer[i];
      const normalized = (val - trace.yMin) / (trace.yMax - trace.yMin);
      const y = y1 - normalized * traceH;

      if (i === 0 || distFromCursor < W * 0.025) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.stroke();

    // Trace label (top-left of trace area)
    ctx.font = `${10 * dpr}px ui-monospace, monospace`;
    ctx.fillStyle = trace.color;
    ctx.globalAlpha = 0.6;
    ctx.fillText(trace.label, 4 * dpr, y0 + 14 * dpr);
    ctx.globalAlpha = 1;

    // Value label (top-right of trace area)
    if (trace.valueLabel) {
      const text = trace.valueLabel(vitals);
      ctx.font = `bold ${16 * dpr}px ui-monospace, monospace`;
      ctx.fillStyle = trace.valueLabelColor ?? trace.color;
      const metrics = ctx.measureText(text);
      ctx.fillText(text, W - metrics.width - 8 * dpr, y0 + 20 * dpr);
    }

    yOffset = y1;
  }

  // Sweep cursor line
  ctx.strokeStyle = "rgba(255,255,255,0.15)";
  ctx.lineWidth = 2 * dpr;
  ctx.beginPath();
  ctx.moveTo(cursorX, 0);
  ctx.lineTo(cursorX, H);
  ctx.stroke();
}

// ─── Component ──────────────────────────────────────────────────────────────

interface WaveformMonitorProps {
  className?: string;
  /** Height in pixels (CSS). Default: 320. */
  height?: number;
}

function WaveformMonitorInner({ className = "", height = 320 }: WaveformMonitorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wfStateRef = useRef<WaveformState>(createWaveformState());
  const animRef = useRef<number>(0);
  const lastTickRef = useRef<number>(0);

  // Read vitals from store
  const rawVitals = useProGameStore((s) => s.patient?.vitals);
  const phase = useProGameStore((s) => s.phase);
  const fogLevel = useProGameStore((s) => s.difficultyConfig.fogLevel ?? "none");
  const gameTime = useProGameStore((s) => s.clock.currentTime);

  // Apply fog-of-war to vitals (same transform as ProVitalsPanel)
  const fogConfig = FOG_PRESETS[fogLevel] ?? FOG_PRESETS.none;
  const vitals = useMemo(() => {
    if (!rawVitals) return undefined;
    return applyVitalsFog(rawVitals, fogConfig, Math.floor(gameTime * 1000)).displayVitals;
  }, [rawVitals, fogConfig, gameTime]);

  // Convert store vitals to waveform vitals
  const getWaveformVitals = useCallback((): WaveformVitals => {
    if (!vitals) {
      return { hr: 72, sbp: 120, dbp: 80, spo2: 98, rr: 16, etco2: 38, rhythm: "sinus" };
    }
    return {
      hr: vitals.hr,
      sbp: vitals.sbp,
      dbp: vitals.dbp,
      spo2: vitals.spo2,
      rr: vitals.rr,
      etco2: vitals.etco2 ?? 38,
      rhythm: "sinus", // TODO: map from patient state
    };
  }, [vitals]);

  // Animation loop
  useEffect(() => {
    if (phase !== "playing" && phase !== "sbar") return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set canvas size with DPR
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;

    lastTickRef.current = performance.now();

    const tick = (now: number) => {
      const elapsed = now - lastTickRef.current;
      lastTickRef.current = now;

      // Generate samples for elapsed time (target: 250 Hz)
      const samplesToGenerate = Math.round((elapsed / 1000) * SAMPLE_RATE);
      if (samplesToGenerate > 0) {
        const wv = getWaveformVitals();
        generateSamples(
          wfStateRef.current,
          wv,
          Math.min(samplesToGenerate, SAMPLE_RATE), // cap at 1s worth
        );
        drawWaveforms(canvas, wfStateRef.current, wv);
      }

      animRef.current = requestAnimationFrame(tick);
    };

    animRef.current = requestAnimationFrame(tick);

    return () => {
      if (animRef.current) {
        cancelAnimationFrame(animRef.current);
      }
    };
  }, [phase, getWaveformVitals]);

  // Handle resize
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const observer = new ResizeObserver(() => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
    });

    observer.observe(canvas);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      className={`rounded-xl border border-white/8 bg-[#000d14] overflow-hidden ${className}`}
      style={{ height }}
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ display: "block" }}
      />
    </div>
  );
}

export const WaveformMonitor = memo(WaveformMonitorInner);
export default WaveformMonitor;
