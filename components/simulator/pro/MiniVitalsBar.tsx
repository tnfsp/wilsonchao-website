"use client";

import { useProGameStore } from "@/lib/simulator/store";

// ── Threshold helpers ────────────────────────────────────────

type Severity = "normal" | "warning" | "critical";

function hrSeverity(hr: number): Severity {
  if (hr > 120 || hr < 50) return "critical";
  if (hr > 100 || hr < 60) return "warning";
  return "normal";
}

function sbpSeverity(sbp: number): Severity {
  if (sbp < 90) return "critical";
  if (sbp < 100) return "warning";
  return "normal";
}

function spo2Severity(spo2: number): Severity {
  if (spo2 < 92) return "critical";
  if (spo2 < 95) return "warning";
  return "normal";
}

function cvpSeverity(cvp: number): Severity {
  if (cvp < 4 || cvp > 12) return "critical";
  if (cvp < 5 || cvp > 10) return "warning";
  return "normal";
}

const severityColor: Record<Severity, string> = {
  normal: "text-green-400",
  warning: "text-yellow-400",
  critical: "text-red-400",
};

// ── Component ────────────────────────────────────────────────

export default function MiniVitalsBar() {
  const vitals = useProGameStore((s) => s.patient?.vitals);

  if (!vitals) return null;

  const items = [
    { label: "HR", value: Math.round(vitals.hr), severity: hrSeverity(vitals.hr) },
    { label: "BP", value: `${Math.round(vitals.sbp)}/${Math.round(vitals.dbp)}`, severity: sbpSeverity(vitals.sbp) },
    { label: "SpO₂", value: `${Math.round(vitals.spo2)}%`, severity: spo2Severity(vitals.spo2) },
    { label: "CVP", value: Math.round(vitals.cvp), severity: cvpSeverity(vitals.cvp) },
  ];

  function scrollToVitals() {
    const el = document.getElementById("pro-vitals-panel");
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <button
      onClick={scrollToVitals}
      className="md:hidden w-full flex items-center gap-2 overflow-x-auto py-1 px-3 bg-slate-900/95 backdrop-blur border-b border-white/8 text-xs"
      style={{ WebkitOverflowScrolling: "touch" }}
    >
      {items.map((item) => (
        <span key={item.label} className="flex items-center gap-1 flex-shrink-0">
          <span className="text-gray-500">{item.label}</span>
          <span className={`font-mono font-bold ${severityColor[item.severity]}`}>
            {item.value}
          </span>
        </span>
      ))}
    </button>
  );
}
