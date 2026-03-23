"use client";

import { useState, useMemo } from "react";
import { useProGameStore } from "@/lib/simulator/store";
import type { TimelineEntry } from "@/lib/simulator/types";

// ─── Types ────────────────────────────────────────────────────────────────────

interface DataPoint {
  time: number;   // game minutes
  hr: number;
  sbp: number;
  spo2: number;
}

// ─── Chart constants ──────────────────────────────────────────────────────────

const W = 480;
const H = 140;
const PAD = { top: 12, right: 12, bottom: 28, left: 36 };
const PLOT_W = W - PAD.left - PAD.right;
const PLOT_H = H - PAD.top - PAD.bottom;

const HR_RANGE  = { min: 50,  max: 160 };
const SBP_RANGE = { min: 50,  max: 160 };
const SPO2_RANGE= { min: 80,  max: 100 };

function toX(time: number, maxTime: number): number {
  if (maxTime === 0) return PAD.left;
  return PAD.left + (time / maxTime) * PLOT_W;
}

function toY(value: number, range: { min: number; max: number }): number {
  const clamped = Math.max(range.min, Math.min(range.max, value));
  const frac = 1 - (clamped - range.min) / (range.max - range.min);
  return PAD.top + frac * PLOT_H;
}

function buildPolyline(points: { x: number; y: number }[]): string {
  return points.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
}

// ─── Extract data from timeline ───────────────────────────────────────────────

function extractDataPoints(timeline: TimelineEntry[]): DataPoint[] {
  const points: DataPoint[] = [];
  let lastHr = 0, lastSbp = 0, lastSpo2 = 0;

  for (const entry of timeline) {
    if (entry.type === "vitals_update" && entry.content) {
      // Parse vitals from content string like "HR 108, BP 95/55, SpO2 96"
      const hrMatch  = /HR\s*(\d+)/i.exec(entry.content);
      const sbpMatch = /BP\s*(\d+)\/(\d+)/i.exec(entry.content);
      const spo2Match= /SpO2\s*(\d+)/i.exec(entry.content);

      if (hrMatch)   lastHr   = parseInt(hrMatch[1]);
      if (sbpMatch)  lastSbp  = parseInt(sbpMatch[1]);
      if (spo2Match) lastSpo2 = parseInt(spo2Match[1]);

      if (lastHr && lastSbp && lastSpo2) {
        points.push({
          time: entry.gameTime,
          hr:   lastHr,
          sbp:  lastSbp,
          spo2: lastSpo2,
        });
      }
    }
  }

  return points;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function VitalTrendGraph() {
  const { timeline, patient, clock } = useProGameStore();
  const [expanded, setExpanded] = useState(false);

  // Build data — seed with current vitals at time 0
  const points = useMemo<DataPoint[]>(() => {
    const extracted = extractDataPoints(timeline);

    // Always include current vitals as the latest point
    if (patient?.vitals) {
      const v = patient.vitals;
      const currentPoint: DataPoint = {
        time: clock.currentTime,
        hr: v.hr,
        sbp: v.sbp,
        spo2: v.spo2,
      };

      // Merge without duplicate times
      const filtered = extracted.filter((p) => p.time < clock.currentTime);
      return [...filtered, currentPoint];
    }

    return extracted;
  }, [timeline, patient?.vitals, clock.currentTime]);

  const maxTime = Math.max(1, clock.currentTime);

  // Build SVG polylines
  const hrPoints   = points.map((p) => ({ x: toX(p.time, maxTime), y: toY(p.hr,   HR_RANGE)   }));
  const sbpPoints  = points.map((p) => ({ x: toX(p.time, maxTime), y: toY(p.sbp,  SBP_RANGE)  }));
  const spo2Points = points.map((p) => ({ x: toX(p.time, maxTime), y: toY(p.spo2, SPO2_RANGE) }));

  // X-axis ticks (every 5 minutes)
  const tickInterval = maxTime <= 10 ? 2 : 5;
  const xTicks: number[] = [];
  for (let t = 0; t <= maxTime; t += tickInterval) xTicks.push(t);

  // Y-axis labels (left side, single axis for readability)
  const yLabels = [
    { value: HR_RANGE.max,  y: toY(HR_RANGE.max,  HR_RANGE), label: "160" },
    { value: 100,           y: toY(100,            HR_RANGE), label: "100" },
    { value: HR_RANGE.min,  y: toY(HR_RANGE.min,  HR_RANGE), label: "50"  },
  ];

  return (
    <div
      className="rounded-xl border border-white/10 overflow-hidden"
      style={{ background: "#001219" }}
    >
      {/* Toggle header */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-3 text-sm">
          <span className="text-gray-400">📈 Vital Trend</span>
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1">
              <span className="inline-block w-3 h-0.5 bg-red-400 rounded" /> HR
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block w-3 h-0.5 bg-white/70 rounded" /> SBP
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block w-3 h-0.5 bg-blue-400 rounded" /> SpO₂
            </span>
          </div>
        </div>
        <span className="text-gray-500 text-xs">{expanded ? "▲ 收合" : "▼ 展開"}</span>
      </button>

      {/* Chart */}
      {expanded && (
        <div className="px-3 pb-3">
          <svg
            viewBox={`0 0 ${W} ${H}`}
            width="100%"
            preserveAspectRatio="xMidYMid meet"
            className="overflow-visible"
          >
            {/* Grid lines */}
            {yLabels.map((yl) => (
              <line
                key={yl.value}
                x1={PAD.left}
                x2={W - PAD.right}
                y1={yl.y}
                y2={yl.y}
                stroke="rgba(255,255,255,0.07)"
                strokeDasharray="3,3"
              />
            ))}

            {/* Y-axis labels */}
            {yLabels.map((yl) => (
              <text
                key={yl.value}
                x={PAD.left - 5}
                y={yl.y + 4}
                textAnchor="end"
                fontSize="9"
                fill="rgba(255,255,255,0.35)"
              >
                {yl.label}
              </text>
            ))}

            {/* X-axis ticks */}
            {xTicks.map((t) => {
              const x = toX(t, maxTime);
              return (
                <g key={t}>
                  <line
                    x1={x} x2={x}
                    y1={PAD.top + PLOT_H}
                    y2={PAD.top + PLOT_H + 3}
                    stroke="rgba(255,255,255,0.2)"
                  />
                  <text
                    x={x}
                    y={PAD.top + PLOT_H + 13}
                    textAnchor="middle"
                    fontSize="9"
                    fill="rgba(255,255,255,0.35)"
                  >
                    {t}m
                  </text>
                </g>
              );
            })}

            {/* Axes */}
            <line
              x1={PAD.left} x2={PAD.left}
              y1={PAD.top} y2={PAD.top + PLOT_H}
              stroke="rgba(255,255,255,0.15)"
            />
            <line
              x1={PAD.left} x2={W - PAD.right}
              y1={PAD.top + PLOT_H} y2={PAD.top + PLOT_H}
              stroke="rgba(255,255,255,0.15)"
            />

            {/* Lines — only if ≥ 2 data points */}
            {points.length >= 2 && (
              <>
                {/* SBP — white */}
                <polyline
                  points={buildPolyline(sbpPoints)}
                  fill="none"
                  stroke="rgba(255,255,255,0.75)"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                />

                {/* HR — red */}
                <polyline
                  points={buildPolyline(hrPoints)}
                  fill="none"
                  stroke="#f87171"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                />

                {/* SpO2 — blue */}
                <polyline
                  points={buildPolyline(spo2Points)}
                  fill="none"
                  stroke="#60a5fa"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                />
              </>
            )}

            {/* Data points (dots) */}
            {points.map((p, i) => {
              const x = toX(p.time, maxTime);
              return (
                <g key={i}>
                  <circle cx={x} cy={toY(p.hr,   HR_RANGE)}   r="2.5" fill="#f87171" />
                  <circle cx={x} cy={toY(p.sbp,  SBP_RANGE)}  r="2.5" fill="rgba(255,255,255,0.8)" />
                  <circle cx={x} cy={toY(p.spo2, SPO2_RANGE)} r="2.5" fill="#60a5fa" />
                </g>
              );
            })}

            {/* Empty state */}
            {points.length < 2 && (
              <text
                x={W / 2} y={H / 2 + 4}
                textAnchor="middle"
                fontSize="11"
                fill="rgba(255,255,255,0.2)"
              >
                數據點不足（遊戲進行中會更新）
              </text>
            )}
          </svg>
        </div>
      )}
    </div>
  );
}
