"use client";

import { useEffect, useRef, useMemo } from "react";
import type { ECGMorphology } from "@/lib/simulator/engine/ecg-generator";
import { generateLeadSamples, generateInterpretation } from "@/lib/simulator/engine/ecg-generator";

// ── Props ──────────────────────────────────────────────────────

interface EcgCanvasProps {
  morphology: ECGMorphology;
  width?: number;
  height?: number;
  showGrid?: boolean;
  showLabels?: boolean;
  interpretation?: string;
}

// ── Layout constants (at standard 25mm/s, 10mm/mV) ────────────

// Standard ECG paper:
//   25mm/s — 1 small square = 0.04s = 40ms
//   10mm/mV — 1 small square = 0.1mV
//   1 large square = 5 small squares = 200ms / 0.5mV

const LEADS_ROW1 = ["I", "aVR", "V1"] as const;
const LEADS_ROW2 = ["II", "aVL", "V2"] as const;
const LEADS_ROW3 = ["III", "aVF", "V3"] as const;
const LEADS_RIGHT = ["V4", "V5", "V6"] as const;
const RHYTHM_LEAD = "II";

// Duration per column strip (2.5s for each lead cell in rows 1-3)
const STRIP_DURATION_MS = 2500;
// Rhythm strip: full 10s across bottom
const RHYTHM_DURATION_MS = 10000;

const SAMPLE_RATE = 250; // Hz

// Colors
const GRID_SMALL_COLOR = "rgba(0, 180, 160, 0.12)";
const GRID_LARGE_COLOR = "rgba(0, 180, 160, 0.28)";
const WAVEFORM_COLOR = "#00ff88";
const LABEL_COLOR = "rgba(0, 255, 136, 0.7)";
const HEADER_COLOR = "rgba(0, 255, 136, 0.5)";
const BG_COLOR = "#001219";

// ── Main component ─────────────────────────────────────────────

export function EcgCanvas({
  morphology,
  width = 720,
  height = 540,
  showGrid = true,
  showLabels = true,
  interpretation,
}: EcgCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Generate all lead data once per morphology change
  const leadData = useMemo(() => {
    const leads: Record<string, number[]> = {};

    // Row leads (2.5s each)
    const stripLeads = [
      ...LEADS_ROW1,
      ...LEADS_ROW2,
      ...LEADS_ROW3,
      ...LEADS_RIGHT,
      RHYTHM_LEAD,
    ];

    const uniqueLeads = Array.from(new Set(stripLeads));

    for (const lead of uniqueLeads) {
      // Generate 10s for rhythm lead, 2.5s for others
      const duration = lead === RHYTHM_LEAD ? RHYTHM_DURATION_MS : STRIP_DURATION_MS;
      leads[lead] = generateLeadSamples(morphology, lead, duration, SAMPLE_RATE);
    }

    return leads;
  }, [morphology]);

  const autoInterpretation = useMemo(
    () => interpretation ?? generateInterpretation(morphology),
    [morphology, interpretation]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d")!;
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;

    // Header area height
    const HEADER_H = 36;

    // Available canvas area below header
    const drawH = H - HEADER_H;

    // Layout:
    // 3 rows (row1, row2, row3) + rhythm strip row
    // Each row: 1/4 of drawH for 3 rows + 1/4 for rhythm strip
    // But right column has V4/V5/V6 stacked in rhythm-strip row area

    // We have 3 "grid rows" and 1 rhythm strip row
    const ROWS = 4;
    const rowH = drawH / ROWS;

    // 3 columns for rows 1-3
    const COLS = 3;
    const colW = W / COLS;

    // px per ms at 25mm/s: assuming ~3.75 px/mm for standard display
    // But we fit to cell width:
    // Each cell = 2.5s = 2500ms; cell width = colW px
    const pxPerMsMain = colW / STRIP_DURATION_MS;
    // Rhythm strip: 10s across full width
    const pxPerMsRhythm = W / RHYTHM_DURATION_MS;

    // Voltage scaling: fit 1.0 amplitude = half the row height (leaving margins)
    const VOLTAGE_MARGIN = 0.20; // 20% margin top/bottom per row
    const voltScale = (rowH * (1 - VOLTAGE_MARGIN * 2)) / 2; // px per unit amplitude

    // ── Clear ──
    ctx.fillStyle = BG_COLOR;
    ctx.fillRect(0, 0, W, H);

    // ── Header ──
    ctx.fillStyle = HEADER_COLOR;
    ctx.font = `11px monospace`;
    ctx.textAlign = "left";
    ctx.fillText(`12-Lead ECG  |  25mm/s  |  10mm/mV  |  ${morphology.rate} bpm`, 8, HEADER_H - 10);

    // Interpretation on the right
    const interpText = autoInterpretation.length > 80
      ? autoInterpretation.substring(0, 77) + "..."
      : autoInterpretation;
    ctx.textAlign = "right";
    ctx.fillText(interpText, W - 8, HEADER_H - 10);
    ctx.textAlign = "left";

    // ── Grid drawing helper ──
    function drawGrid(x: number, y: number, w: number, h: number, pxPerMs: number) {
      if (!showGrid) return;

      const smallSquareMs = 40;    // 40ms = 1 small square
      const largeSquareMs = 200;   // 200ms = 1 large square

      // Voltage grid: 0.1mV per small square, 0.5mV per large
      // In our normalized scale: 0.1mV ~= 0.1 * voltScale... but we work in normalized amplitude
      // Use fixed pixel spacing for voltage grid
      const smallSquarePxV = voltScale * 0.2;  // ~0.1mV at 10mm/mV
      const largeSquarePxV = voltScale * 1.0;  // ~0.5mV

      const smallSquarePxH = pxPerMs * smallSquareMs;
      const largeSquarePxH = pxPerMs * largeSquareMs;

      ctx.save();
      ctx.beginPath();
      ctx.rect(x, y, w, h);
      ctx.clip();

      // Horizontal small grid lines (voltage)
      const midY = y + h / 2;
      ctx.strokeStyle = GRID_SMALL_COLOR;
      ctx.lineWidth = 0.5;
      for (let gy = midY; gy > y; gy -= smallSquarePxV) {
        ctx.beginPath(); ctx.moveTo(x, gy); ctx.lineTo(x + w, gy); ctx.stroke();
      }
      for (let gy = midY + smallSquarePxV; gy < y + h; gy += smallSquarePxV) {
        ctx.beginPath(); ctx.moveTo(x, gy); ctx.lineTo(x + w, gy); ctx.stroke();
      }

      // Vertical small grid lines (time)
      for (let gx = x; gx < x + w; gx += smallSquarePxH) {
        ctx.beginPath(); ctx.moveTo(gx, y); ctx.lineTo(gx, y + h); ctx.stroke();
      }

      // Large grid — brighter
      ctx.strokeStyle = GRID_LARGE_COLOR;
      ctx.lineWidth = 0.8;
      for (let gy = midY; gy > y; gy -= largeSquarePxV) {
        ctx.beginPath(); ctx.moveTo(x, gy); ctx.lineTo(x + w, gy); ctx.stroke();
      }
      for (let gy = midY + largeSquarePxV; gy < y + h; gy += largeSquarePxV) {
        ctx.beginPath(); ctx.moveTo(x, gy); ctx.lineTo(x + w, gy); ctx.stroke();
      }
      for (let gx = x; gx < x + w; gx += largeSquarePxH) {
        ctx.beginPath(); ctx.moveTo(gx, y); ctx.lineTo(gx, y + h); ctx.stroke();
      }

      ctx.restore();
    }

    // ── Waveform drawing helper ──
    function drawLeadWaveform(
      samples: number[],
      x: number,
      y: number,
      w: number,
      h: number,
      pxPerMs: number
    ) {
      if (!samples.length) return;

      const midY = y + h / 2;
      const totalMs = (samples.length / SAMPLE_RATE) * 1000;
      const maxPx = Math.min(w, pxPerMs * totalMs);

      ctx.save();
      ctx.beginPath();
      ctx.rect(x, y, w, h);
      ctx.clip();

      ctx.strokeStyle = WAVEFORM_COLOR;
      ctx.lineWidth = 1.5;
      ctx.shadowColor = WAVEFORM_COLOR;
      ctx.shadowBlur = 2;
      ctx.beginPath();

      let started = false;
      for (let i = 0; i < samples.length; i++) {
        const px = x + (i / samples.length) * maxPx;
        const py = midY - samples[i] * voltScale;

        if (!started) {
          ctx.moveTo(px, py);
          started = true;
        } else {
          ctx.lineTo(px, py);
        }
      }

      ctx.stroke();
      ctx.restore();
    }

    // ── Lead label helper ──
    function drawLeadLabel(label: string, x: number, y: number) {
      if (!showLabels) return;
      ctx.fillStyle = LABEL_COLOR;
      ctx.font = "bold 10px monospace";
      ctx.textAlign = "left";
      ctx.fillText(label, x + 4, y + 14);
    }

    // ── Cell separator lines ──
    function drawCellBorder(x: number, y: number, w: number, h: number) {
      ctx.strokeStyle = "rgba(0, 180, 160, 0.15)";
      ctx.lineWidth = 0.5;
      ctx.strokeRect(x, y, w, h);
    }

    // ── Draw row 1-3 ──
    const rowLeads = [
      [...LEADS_ROW1],
      [...LEADS_ROW2],
      [...LEADS_ROW3],
    ];

    for (let row = 0; row < 3; row++) {
      const leads = rowLeads[row];
      const cellY = HEADER_H + row * rowH;

      for (let col = 0; col < 3; col++) {
        const lead = leads[col];
        const cellX = col * colW;

        drawCellBorder(cellX, cellY, colW, rowH);
        drawGrid(cellX, cellY, colW, rowH, pxPerMsMain);

        const samples = leadData[lead] ?? [];
        drawLeadWaveform(samples, cellX, cellY, colW, rowH, pxPerMsMain);
        drawLeadLabel(lead, cellX, cellY);
      }
    }

    // ── Draw rhythm strip row (row 4) ──
    // Left 2/3: rhythm strip (Lead II, 10s spanning 2 columns)
    // Right 1/3: V4, V5, V6 stacked (each 1/3 of the row height)

    const rhythmY = HEADER_H + 3 * rowH;
    const rhythmW = colW * 2; // 2/3 of canvas
    const rightX = colW * 2;  // start of right column
    const rightW = colW;

    // Rhythm strip: Lead II across 2/3 width
    drawCellBorder(0, rhythmY, rhythmW, rowH);
    drawGrid(0, rhythmY, rhythmW, rowH, pxPerMsRhythm);
    const rhythmSamples = leadData[RHYTHM_LEAD] ?? [];
    drawLeadWaveform(rhythmSamples, 0, rhythmY, rhythmW, rowH, pxPerMsRhythm);
    drawLeadLabel("II (rhythm)", 0, rhythmY);

    // Right 1/3: V4, V5, V6 each in 1/3 of rowH
    const rightRowH = rowH / 3;

    function drawSmallLeadWaveform(
      samples: number[],
      x: number,
      y: number,
      w: number,
      h: number
    ) {
      if (!samples.length) return;
      const midY = y + h / 2;
      const scaledVolt = h * 0.35;
      const maxPx = Math.min(w, pxPerMsMain * STRIP_DURATION_MS);

      ctx.save();
      ctx.beginPath();
      ctx.rect(x, y, w, h);
      ctx.clip();
      ctx.strokeStyle = WAVEFORM_COLOR;
      ctx.lineWidth = 1.2;
      ctx.shadowColor = WAVEFORM_COLOR;
      ctx.shadowBlur = 2;
      ctx.beginPath();
      let started = false;
      for (let j = 0; j < samples.length; j++) {
        const px = x + (j / samples.length) * maxPx;
        const py = midY - samples[j] * scaledVolt;
        if (!started) { ctx.moveTo(px, py); started = true; }
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
      ctx.restore();
    }

    LEADS_RIGHT.forEach((lead, i) => {
      const cellY = rhythmY + i * rightRowH;
      const samples = leadData[lead] ?? [];
      drawCellBorder(rightX, cellY, rightW, rightRowH);
      drawGrid(rightX, cellY, rightW, rightRowH, pxPerMsMain);
      drawSmallLeadWaveform(samples, rightX, cellY, rightW, rightRowH);
      drawLeadLabel(lead, rightX, cellY);
    });

  }, [leadData, morphology, showGrid, showLabels, autoInterpretation, width, height]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      style={{
        display: "block",
        width: "100%",
        height: "auto",
        backgroundColor: BG_COLOR,
        borderRadius: "4px",
      }}
    />
  );
}
