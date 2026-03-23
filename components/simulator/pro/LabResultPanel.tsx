"use client";

import { useState } from "react";
import { useProGameStore } from "@/lib/simulator/store";
import type { PlacedOrder, LabValue } from "@/lib/simulator/types";

// ============================================================
// Helpers
// ============================================================

function formatGameTime(minutes: number, startHour: number): string {
  const totalMinutes = startHour * 60 + minutes;
  const h = Math.floor(totalMinutes / 60) % 24;
  const m = totalMinutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

// ============================================================
// Flag badge
// ============================================================

function FlagBadge({ flag }: { flag: LabValue["flag"] }) {
  if (!flag) return null;

  if (flag === "critical") {
    return (
      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-bold bg-red-700/30 text-red-400 animate-pulse border border-red-600/50">
        ‼ CRITICAL
      </span>
    );
  }

  if (flag === "H") {
    return (
      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-bold bg-red-900/40 text-red-400 border border-red-700/40">
        H
      </span>
    );
  }

  if (flag === "L") {
    return (
      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-bold bg-blue-900/40 text-blue-400 border border-blue-700/40">
        L
      </span>
    );
  }

  return null;
}

// ============================================================
// Value text colour
// ============================================================

function valueColor(flag: LabValue["flag"]): string {
  if (flag === "critical") return "text-red-400 font-bold";
  if (flag === "H") return "text-red-400";
  if (flag === "L") return "text-blue-400";
  return "text-emerald-300";
}

// ============================================================
// Single lab result card (collapsible)
// ============================================================

interface LabResultCardProps {
  order: PlacedOrder;
  startHour: number;
  defaultOpen?: boolean;
}

function LabResultCard({ order, startHour, defaultOpen = false }: LabResultCardProps) {
  const [open, setOpen] = useState(defaultOpen);

  const resultEntries = Object.entries(
    order.result as Record<string, LabValue>
  );

  const hasCritical = resultEntries.some(([, v]) => v.flag === "critical");
  const hasAbnormal = resultEntries.some(([, v]) => v.flag);

  const borderColor = hasCritical
    ? "border-red-600/70"
    : hasAbnormal
    ? "border-yellow-600/40"
    : "border-[#1e3a47]";

  const headerBg = hasCritical
    ? "bg-red-950/30"
    : "bg-[#0a1628]";

  return (
    <div
      className={`rounded-xl border overflow-hidden transition-all ${borderColor}`}
      style={{ background: "#071220" }}
    >
      {/* Card header / toggle */}
      <button
        onClick={() => setOpen((o) => !o)}
        className={`w-full flex items-center gap-3 px-4 py-3 text-left transition hover:brightness-110 ${headerBg}`}
      >
        {/* Expand icon */}
        <span
          className={`text-zinc-400 text-xs transition-transform duration-200 ${
            open ? "rotate-90" : "rotate-0"
          }`}
        >
          ▶
        </span>

        {/* Lab name */}
        <span className="flex-1 font-semibold text-sm text-white tracking-wide">
          🔬 {order.definition.name}
        </span>

        {/* Flags summary */}
        <div className="flex items-center gap-1.5">
          {hasCritical && (
            <span className="text-xs text-red-400 font-bold animate-pulse">
              ‼ CRITICAL
            </span>
          )}
          {!hasCritical && hasAbnormal && (
            <span className="text-xs text-yellow-400">⚠ 異常</span>
          )}
        </div>

        {/* Time */}
        <span className="text-xs text-zinc-500 ml-2 flex-shrink-0">
          {formatGameTime(order.placedAt, startHour)}
        </span>
      </button>

      {/* Table */}
      {open && (
        <div className="px-4 pb-4 pt-1">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="text-xs text-zinc-500 uppercase tracking-wider border-b border-[#1a3040]">
                <th className="py-2 text-left font-medium pr-3">項目</th>
                <th className="py-2 text-right font-medium pr-3">數值</th>
                <th className="py-2 text-left font-medium pr-3">單位</th>
                <th className="py-2 text-left font-medium pr-3">正常範圍</th>
                <th className="py-2 text-left font-medium">標記</th>
              </tr>
            </thead>
            <tbody>
              {resultEntries.map(([key, lv]) => (
                <tr
                  key={key}
                  className={`border-b border-[#0e2535] last:border-0 ${
                    lv.flag === "critical" ? "bg-red-950/20" : ""
                  }`}
                >
                  {/* Name */}
                  <td className="py-2 pr-3 text-zinc-300 font-medium whitespace-nowrap">
                    {key}
                  </td>

                  {/* Value */}
                  <td className={`py-2 pr-3 text-right font-mono ${valueColor(lv.flag)}`}>
                    {String(lv.value)}
                  </td>

                  {/* Unit */}
                  <td className="py-2 pr-3 text-zinc-500 text-xs whitespace-nowrap">
                    {lv.unit}
                  </td>

                  {/* Normal range */}
                  <td className="py-2 pr-3 text-zinc-500 text-xs whitespace-nowrap">
                    {lv.normal}
                  </td>

                  {/* Flag */}
                  <td className="py-2">
                    <FlagBadge flag={lv.flag} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ============================================================
// Main LabResultPanel
// ============================================================

export default function LabResultPanel() {
  const [panelOpen, setPanelOpen] = useState(false);

  const placedOrders = useProGameStore((s) => s.placedOrders);
  const scenario = useProGameStore((s) => s.scenario);

  const startHour = scenario?.startHour ?? 2;

  // Filter: lab orders that are completed and have results
  const labResults: PlacedOrder[] = placedOrders
    .filter(
      (o) =>
        o.definition.category === "lab" &&
        o.status === "completed" &&
        o.result != null &&
        typeof o.result === "object" &&
        Object.keys(o.result).length > 0
    )
    // Sort descending by placedAt (latest first)
    .sort((a, b) => b.placedAt - a.placedAt);

  const hasResults = labResults.length > 0;

  // Count abnormal/critical across all results
  const criticalCount = labResults.filter((o) =>
    Object.values(o.result as Record<string, LabValue>).some(
      (v) => v.flag === "critical"
    )
  ).length;

  const abnormalCount = labResults.filter((o) =>
    Object.values(o.result as Record<string, LabValue>).some(
      (v) => v.flag && v.flag !== "critical"
    )
  ).length;

  return (
    <div
      className="rounded-2xl border border-[#1a3040] overflow-hidden"
      style={{ background: "#001219" }}
    >
      {/* Panel header / toggle */}
      <button
        onClick={() => setPanelOpen((o) => !o)}
        className="w-full flex items-center gap-3 px-5 py-3.5 text-left transition hover:brightness-110"
        style={{ background: "#0a1628" }}
      >
        {/* Chevron */}
        <span
          className={`text-zinc-400 text-xs transition-transform duration-200 ${
            panelOpen ? "rotate-90" : "rotate-0"
          }`}
        >
          ▶
        </span>

        {/* Title */}
        <span className="font-bold text-white text-sm tracking-wide flex-1">
          📋 Lab 結果
        </span>

        {/* Badges */}
        <div className="flex items-center gap-2">
          {criticalCount > 0 && (
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-red-700/30 text-red-400 border border-red-600/50 animate-pulse">
              {criticalCount} CRITICAL
            </span>
          )}
          {abnormalCount > 0 && (
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-yellow-700/20 text-yellow-400 border border-yellow-600/30">
              {abnormalCount} 異常
            </span>
          )}
          <span className="text-xs text-zinc-500">
            {hasResults ? `${labResults.length} 筆` : "暫無"}
          </span>
        </div>
      </button>

      {/* Panel body */}
      {panelOpen && (
        <div className="px-4 py-4">
          {!hasResults ? (
            <div className="flex flex-col items-center justify-center py-8 gap-2">
              <span className="text-3xl opacity-30">🔬</span>
              <p className="text-zinc-500 text-sm">暫無 Lab 結果</p>
              <p className="text-zinc-600 text-xs">送出 Lab 檢查後，結果將顯示於此</p>
            </div>
          ) : (
            <div className="space-y-3">
              {labResults.map((order, idx) => (
                <LabResultCard
                  key={order.id}
                  order={order}
                  startHour={startHour}
                  defaultOpen={idx === 0} // expand latest by default
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
