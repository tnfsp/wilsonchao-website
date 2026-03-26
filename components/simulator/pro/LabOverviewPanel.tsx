"use client";

import { useMemo, useState } from "react";
import { useProGameStore } from "@/lib/simulator/store";
import type { LabValue } from "@/lib/simulator/types";
import { getLabDisplayName } from "@/lib/simulator/engine/lab-engine";

// ============================================================
// Constants
// ============================================================

/** Lab items grouped by panel for display columns */
const PANEL_GROUPS: { label: string; keys: string[] }[] = [
  {
    label: "CBC",
    keys: ["hb", "Hb", "hgb", "Hgb", "hct", "Hct", "wbc", "WBC", "plt", "Plt", "mcv", "MCV", "mch", "MCH"],
  },
  {
    label: "Coag",
    keys: ["pt", "PT", "inr", "INR", "aptt", "aPTT", "fib", "Fib", "fibrinogen", "Fibrinogen", "tt", "TT", "act", "ACT"],
  },
  {
    label: "ABG",
    keys: ["ph", "pH", "pao2", "PaO2", "paco2", "PaCO2", "hco3", "HCO3", "HCO\u2083", "be", "BE", "lactate", "Lactate", "sao2", "SaO2"],
  },
  {
    label: "Chemistry",
    keys: ["na", "Na", "k", "K", "cl", "Cl", "co2", "CO\u2082", "bun", "BUN", "cr", "Cr", "glucose", "Glucose"],
  },
  {
    label: "Other",
    keys: ["ica", "iCa", "iCa\u00B2\u207A", "troponin_i", "Troponin", "Troponin I", "ckmb", "CK-MB"],
  },
];

/** Key indicators for trend charts */
const TREND_KEYS: { key: string; aliases: string[]; label: string; color: string; normalLow?: number; normalHigh?: number }[] = [
  { key: "hb", aliases: ["hb", "Hb", "hgb", "Hgb"], label: "Hb (g/dL)", color: "#ef4444", normalLow: 12, normalHigh: 17 },
  { key: "plt", aliases: ["plt", "Plt"], label: "Plt (K/uL)", color: "#f59e0b", normalLow: 150, normalHigh: 400 },
  { key: "fibrinogen", aliases: ["fibrinogen", "Fibrinogen", "fib", "Fib"], label: "Fibrinogen (mg/dL)", color: "#8b5cf6", normalLow: 200, normalHigh: 400 },
  { key: "lactate", aliases: ["lactate", "Lactate"], label: "Lactate (mmol/L)", color: "#06b6d4", normalLow: 0.5, normalHigh: 1.6 },
  { key: "pH", aliases: ["pH"], label: "pH", color: "#10b981", normalLow: 7.35, normalHigh: 7.45 },
  { key: "inr", aliases: ["inr", "INR"], label: "INR", color: "#f472b6", normalLow: 0.9, normalHigh: 1.1 },
];

// ============================================================
// Helpers
// ============================================================

function formatGameTime(minutes: number, startHour: number): string {
  const totalMinutes = startHour * 60 + minutes;
  const h = Math.floor(totalMinutes / 60) % 24;
  const m = totalMinutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function FlagBadge({ flag }: { flag: LabValue["flag"] }) {
  if (!flag) return null;
  if (flag === "critical") {
    return (
      <span className="inline-flex items-center px-1 py-0.5 rounded text-[10px] font-bold bg-red-700/30 text-red-400 animate-pulse border border-red-600/50">
        CRIT
      </span>
    );
  }
  if (flag === "H") {
    return (
      <span className="inline-flex items-center px-1 py-0.5 rounded text-[10px] font-bold bg-red-900/40 text-red-400 border border-red-700/40">
        H
      </span>
    );
  }
  if (flag === "L") {
    return (
      <span className="inline-flex items-center px-1 py-0.5 rounded text-[10px] font-bold bg-blue-900/40 text-blue-400 border border-blue-700/40">
        L
      </span>
    );
  }
  return null;
}

function valueColor(flag: LabValue["flag"]): string {
  if (flag === "critical") return "text-red-400 font-bold";
  if (flag === "H") return "text-red-400";
  if (flag === "L") return "text-blue-400";
  return "text-emerald-300";
}

/** Trend arrow comparing latest two values */
function trendArrow(values: number[]): string {
  if (values.length < 2) return "";
  const prev = values[values.length - 2];
  const curr = values[values.length - 1];
  const delta = curr - prev;
  const threshold = Math.abs(prev) * 0.02; // 2% tolerance
  if (delta > threshold) return " \u2191";
  if (delta < -threshold) return " \u2193";
  return " \u2192";
}

// ============================================================
// Data collection types
// ============================================================

interface LabDataPoint {
  time: number;       // game minutes
  orderName: string;
  results: Record<string, LabValue>;
}

interface LabTimeSeries {
  key: string;
  points: { time: number; value: number }[];
}

// ============================================================
// Data collection hook
// ============================================================

function useLabData(): { dataPoints: LabDataPoint[]; timeSeries: Map<string, LabTimeSeries> } {
  const placedOrders = useProGameStore((s) => s.placedOrders);
  const firedEvents = useProGameStore((s) => s.firedEvents);

  return useMemo(() => {
    const dataPoints: LabDataPoint[] = [];

    // 1. From placedOrders (completed lab orders)
    for (const order of placedOrders) {
      if (
        order.definition.category === "lab" &&
        order.status === "completed" &&
        order.result != null &&
        typeof order.result === "object" &&
        Object.keys(order.result as Record<string, unknown>).length > 0
      ) {
        dataPoints.push({
          time: order.resultAvailableAt ?? order.placedAt,
          orderName: order.definition.name,
          results: order.result as Record<string, LabValue>,
        });
      }
    }

    // 2. From firedEvents with newLabResults
    for (const ev of firedEvents) {
      if (ev.fired && ev.data && typeof ev.data === "object") {
        const data = ev.data as { newLabResults?: Record<string, unknown> };
        if (data.newLabResults && typeof data.newLabResults === "object") {
          const results: Record<string, LabValue> = {};
          for (const [key, val] of Object.entries(data.newLabResults)) {
            if (val && typeof val === "object" && "value" in val) {
              results[key] = val as LabValue;
            }
          }
          if (Object.keys(results).length > 0) {
            dataPoints.push({
              time: ev.triggerAt,
              orderName: "Scripted Event",
              results,
            });
          }
        }
      }
    }

    // Sort by time ascending
    dataPoints.sort((a, b) => a.time - b.time);

    // Build time series for each lab key
    const seriesMap = new Map<string, LabTimeSeries>();
    for (const dp of dataPoints) {
      for (const [key, lv] of Object.entries(dp.results)) {
        const numVal = typeof lv.value === "number" ? lv.value : parseFloat(String(lv.value));
        if (isNaN(numVal)) continue;

        if (!seriesMap.has(key)) {
          seriesMap.set(key, { key, points: [] });
        }
        seriesMap.get(key)!.points.push({ time: dp.time, value: numVal });
      }
    }

    return { dataPoints, timeSeries: seriesMap };
  }, [placedOrders, firedEvents]);
}

// ============================================================
// Sparkline SVG component
// ============================================================

interface SparklineProps {
  points: { time: number; value: number }[];
  color: string;
  normalLow?: number;
  normalHigh?: number;
  baseline?: number;
  startHour: number;
}

function Sparkline({ points, color, normalLow, normalHigh, baseline, startHour }: SparklineProps) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  if (points.length === 0) {
    return (
      <div className="h-[60px] flex items-center justify-center text-zinc-600 text-xs">
        No data
      </div>
    );
  }

  const width = 220;
  const height = 60;
  const padX = 4;
  const padY = 6;

  const values = points.map((p) => p.value);
  const times = points.map((p) => p.time);

  let yMin = Math.min(...values);
  let yMax = Math.max(...values);

  // Include normal range and baseline in scale
  if (normalLow !== undefined) yMin = Math.min(yMin, normalLow);
  if (normalHigh !== undefined) yMax = Math.max(yMax, normalHigh);
  if (baseline !== undefined) { yMin = Math.min(yMin, baseline); yMax = Math.max(yMax, baseline); }

  // Add some padding to y range
  const yRange = yMax - yMin || 1;
  yMin -= yRange * 0.1;
  yMax += yRange * 0.1;

  const xMin = Math.min(...times);
  const xMax = Math.max(...times);
  const xRange = xMax - xMin || 1;

  function scaleX(t: number): number {
    return padX + ((t - xMin) / xRange) * (width - 2 * padX);
  }
  function scaleY(v: number): number {
    return height - padY - ((v - yMin) / (yMax - yMin)) * (height - 2 * padY);
  }

  // Build polyline
  const linePoints = points.map((p) => `${scaleX(p.time)},${scaleY(p.value)}`).join(" ");

  // Normal range band
  const hasNormalRange = normalLow !== undefined && normalHigh !== undefined;
  const bandY1 = hasNormalRange ? scaleY(normalHigh!) : 0;
  const bandY2 = hasNormalRange ? scaleY(normalLow!) : 0;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="w-full"
      style={{ height: "60px" }}
      onMouseLeave={() => setHoverIdx(null)}
    >
      {/* Normal range band */}
      {hasNormalRange && (
        <rect
          x={padX}
          y={bandY1}
          width={width - 2 * padX}
          height={Math.max(0, bandY2 - bandY1)}
          fill={color}
          opacity={0.08}
        />
      )}

      {/* Baseline dashed line */}
      {baseline !== undefined && (
        <>
          <line
            x1={padX}
            y1={scaleY(baseline)}
            x2={width - padX}
            y2={scaleY(baseline)}
            stroke={color}
            strokeWidth={1}
            strokeDasharray="4 3"
            opacity={0.4}
          />
          <text
            x={width - padX + 2}
            y={scaleY(baseline) + 3}
            fill={color}
            fontSize={8}
            opacity={0.5}
          >
            BL
          </text>
        </>
      )}

      {/* Line */}
      {points.length > 1 && (
        <polyline
          points={linePoints}
          fill="none"
          stroke={color}
          strokeWidth={1.5}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      )}

      {/* Data points (interactive) */}
      {points.map((p, i) => (
        <circle
          key={i}
          cx={scaleX(p.time)}
          cy={scaleY(p.value)}
          r={hoverIdx === i ? 4 : 2.5}
          fill={color}
          stroke="#001219"
          strokeWidth={1}
          className="cursor-pointer"
          onMouseEnter={() => setHoverIdx(i)}
        />
      ))}

      {/* Hover tooltip */}
      {hoverIdx !== null && points[hoverIdx] && (
        <g>
          <rect
            x={Math.min(scaleX(points[hoverIdx].time) - 30, width - 64)}
            y={Math.max(scaleY(points[hoverIdx].value) - 22, 0)}
            width={60}
            height={18}
            rx={3}
            fill="#0a1628"
            stroke={color}
            strokeWidth={0.5}
            opacity={0.95}
          />
          <text
            x={Math.min(scaleX(points[hoverIdx].time), width - 34)}
            y={Math.max(scaleY(points[hoverIdx].value) - 9, 11)}
            textAnchor="middle"
            fill={color}
            fontSize={9}
            fontFamily="monospace"
          >
            {points[hoverIdx].value} @ {formatGameTime(points[hoverIdx].time, startHour)}
          </text>
        </g>
      )}
    </svg>
  );
}

// ============================================================
// Summary Table: grouped by panel
// ============================================================

interface SummaryTableProps {
  dataPoints: LabDataPoint[];
  timeSeries: Map<string, LabTimeSeries>;
}

function SummaryTable({ dataPoints, timeSeries }: SummaryTableProps) {
  if (dataPoints.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 gap-2">
        <span className="text-3xl opacity-30">🔬</span>
        <p className="text-zinc-500 text-sm">No lab results yet</p>
        <p className="text-zinc-600 text-xs">Order labs and wait for results</p>
      </div>
    );
  }

  // Collect all unique keys from all data points
  const allKeys = new Set<string>();
  for (const dp of dataPoints) {
    for (const key of Object.keys(dp.results)) {
      allKeys.add(key);
    }
  }

  // Get latest value for each key
  const latestValues = new Map<string, LabValue>();
  // dataPoints are sorted ascending by time, so iterate forward and last write wins
  for (const dp of dataPoints) {
    for (const [key, lv] of Object.entries(dp.results)) {
      latestValues.set(key, lv);
    }
  }

  // Group keys by panel
  const groupedPanels: { label: string; items: { key: string; lv: LabValue; trend: string }[] }[] = [];
  const assignedKeys = new Set<string>();

  for (const group of PANEL_GROUPS) {
    const items: { key: string; lv: LabValue; trend: string }[] = [];
    for (const gk of group.keys) {
      if (latestValues.has(gk) && !assignedKeys.has(gk)) {
        const lv = latestValues.get(gk)!;
        const series = timeSeries.get(gk);
        const trend = series ? trendArrow(series.points.map((p) => p.value)) : "";
        items.push({ key: gk, lv, trend });
        assignedKeys.add(gk);
      }
    }
    if (items.length > 0) {
      groupedPanels.push({ label: group.label, items });
    }
  }

  // Collect any remaining unassigned keys into "Other"
  const otherItems: { key: string; lv: LabValue; trend: string }[] = [];
  for (const key of allKeys) {
    if (!assignedKeys.has(key)) {
      const lv = latestValues.get(key)!;
      const series = timeSeries.get(key);
      const trend = series ? trendArrow(series.points.map((p) => p.value)) : "";
      otherItems.push({ key, lv, trend });
    }
  }
  if (otherItems.length > 0) {
    const existing = groupedPanels.find((g) => g.label === "Other");
    if (existing) {
      existing.items.push(...otherItems);
    } else {
      groupedPanels.push({ label: "Other", items: otherItems });
    }
  }

  return (
    <div className="overflow-x-auto">
      <div className="flex gap-3 min-w-max pb-1">
        {groupedPanels.map((group) => (
          <div
            key={group.label}
            className="min-w-[200px] rounded-xl border border-[#1e3a47] overflow-hidden flex-shrink-0"
            style={{ background: "#071220" }}
          >
            {/* Panel header */}
            <div
              className="px-3 py-2 text-xs font-bold tracking-wider uppercase text-teal-400 border-b border-[#1a3040]"
              style={{ background: "#0a1628" }}
            >
              {group.label}
            </div>

            {/* Lab rows */}
            <table className="w-full text-xs">
              <tbody>
                {group.items.map(({ key, lv, trend }) => (
                  <tr
                    key={key}
                    className={`border-b border-[#0e2535] last:border-0 ${
                      lv.flag === "critical" ? "bg-red-950/20" : ""
                    }`}
                  >
                    {/* Name */}
                    <td className="py-1.5 pl-3 pr-2 text-zinc-400 font-medium whitespace-nowrap">
                      {getLabDisplayName(key)}
                    </td>
                    {/* Value + trend arrow */}
                    <td className={`py-1.5 pr-1 text-right font-mono ${valueColor(lv.flag)}`}>
                      {String(lv.value)}
                      {trend && (
                        <span className="text-zinc-500 text-[10px]">{trend}</span>
                      )}
                    </td>
                    {/* Unit */}
                    <td className="py-1.5 pr-1 text-zinc-600 whitespace-nowrap">
                      {lv.unit}
                    </td>
                    {/* Flag */}
                    <td className="py-1.5 pr-2">
                      <FlagBadge flag={lv.flag} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// Trend Charts Section
// ============================================================

interface TrendChartsProps {
  timeSeries: Map<string, LabTimeSeries>;
  startHour: number;
}

function TrendCharts({ timeSeries, startHour }: TrendChartsProps) {
  const scenario = useProGameStore((s) => s.scenario);

  // Get baseline value from scenario's availableLabs (initial lab definitions)
  function getBaseline(aliases: string[]): number | undefined {
    if (!scenario?.availableLabs) return undefined;
    const labs = scenario.availableLabs as Record<string, { results?: Record<string, LabValue> }>;
    for (const panel of Object.values(labs)) {
      if (!panel.results) continue;
      for (const alias of aliases) {
        const lv = panel.results[alias];
        if (lv && typeof lv.value === "number") return lv.value;
      }
    }
    return undefined;
  }

  // Only show trend charts for keys that have data
  const availableTrends = TREND_KEYS.filter((tk) =>
    tk.aliases.some((alias) => {
      const series = timeSeries.get(alias);
      return series && series.points.length > 0;
    })
  );

  if (availableTrends.length === 0) {
    return (
      <div className="text-center text-zinc-600 text-xs py-4">
        Trend charts will appear after lab results come in
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {availableTrends.map((tk) => {
        // Find the alias that has data
        const alias = tk.aliases.find((a) => {
          const s = timeSeries.get(a);
          return s && s.points.length > 0;
        });
        const series = alias ? timeSeries.get(alias) : null;
        if (!series) return null;

        return (
          <div
            key={tk.key}
            className="rounded-xl border border-[#1e3a47] overflow-hidden"
            style={{ background: "#071220" }}
          >
            <div
              className="px-3 py-1.5 text-xs font-semibold tracking-wide border-b border-[#1a3040] flex items-center justify-between"
              style={{ background: "#0a1628" }}
            >
              <span style={{ color: tk.color }}>{tk.label}</span>
              {series.points.length > 0 && (
                <span className="text-zinc-500 font-mono text-[10px]">
                  latest: {series.points[series.points.length - 1].value}
                </span>
              )}
            </div>
            <div className="px-2 py-1">
              <Sparkline
                points={series.points}
                color={tk.color}
                normalLow={tk.normalLow}
                normalHigh={tk.normalHigh}
                baseline={getBaseline(tk.aliases)}
                startHour={startHour}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ============================================================
// Main LabOverviewPanel (Modal)
// ============================================================

export default function LabOverviewPanel() {
  const activeModal = useProGameStore((s) => s.activeModal);
  const closeModal = useProGameStore((s) => s.closeModal);
  const scenario = useProGameStore((s) => s.scenario);

  const startHour = scenario?.startHour ?? 2;
  const { dataPoints, timeSeries } = useLabData();

  const [tab, setTab] = useState<"summary" | "trends">("summary");

  if (activeModal !== "lab_overview") return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 px-4">
      <div
        className="w-full max-w-4xl max-h-[85vh] rounded-2xl shadow-2xl border border-teal-700/40 flex flex-col overflow-hidden"
        style={{ background: "#001219" }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-3.5 border-b border-[#1a3040] flex-shrink-0"
          style={{ background: "#0a1628" }}
        >
          <div className="flex items-center gap-3">
            <span className="text-xl">📊</span>
            <h2 className="text-white font-bold tracking-wide">Lab Overview</h2>
            <span className="text-xs text-zinc-500">
              {dataPoints.length} result{dataPoints.length !== 1 ? "s" : ""}
            </span>
          </div>
          <button
            onClick={closeModal}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 px-4 pt-3 pb-1 flex-shrink-0">
          <button
            onClick={() => setTab("summary")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              tab === "summary"
                ? "bg-teal-600/30 text-teal-300 border border-teal-500/40"
                : "text-zinc-500 hover:text-zinc-300 hover:bg-white/5"
            }`}
          >
            Summary
          </button>
          <button
            onClick={() => setTab("trends")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              tab === "trends"
                ? "bg-teal-600/30 text-teal-300 border border-teal-500/40"
                : "text-zinc-500 hover:text-zinc-300 hover:bg-white/5"
            }`}
          >
            Trends
          </button>
        </div>

        {/* Content (scrollable) */}
        <div
          className="flex-1 overflow-y-auto px-4 py-3"
          style={{ scrollbarWidth: "thin", scrollbarColor: "#ffffff1a transparent" }}
        >
          {tab === "summary" && (
            <SummaryTable dataPoints={dataPoints} timeSeries={timeSeries} />
          )}
          {tab === "trends" && (
            <TrendCharts timeSeries={timeSeries} startHour={startHour} />
          )}
        </div>
      </div>
    </div>
  );
}
