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

// A11y: color + icon + border style per severity
const severityStyles: Record<Severity, { text: string; border: string; icon: string }> = {
  normal:   { text: "text-green-400",  border: "border-transparent",            icon: "" },
  warning:  { text: "text-yellow-400", border: "border-yellow-500/50 border-dashed", icon: " \u26A0\uFE0F" },
  critical: { text: "text-red-400",    border: "border-red-500/70 border-solid",     icon: "" },
};

const miniVitalsPulseCSS = `
@keyframes mini-vital-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
.mini-vital-critical {
  animation: mini-vital-pulse 1.5s ease-in-out infinite;
}
`;

// ── Component ────────────────────────────────────────────────

export default function MiniVitalsBar() {
  const vitals = useProGameStore((s) => s.patient?.vitals);

  if (!vitals) return null;

  const items = [
    { label: "HR", value: String(Math.round(vitals.hr)), severity: hrSeverity(vitals.hr) },
    { label: "BP", value: `${Math.round(vitals.sbp)}/${Math.round(vitals.dbp)}`, severity: sbpSeverity(vitals.sbp) },
    { label: "SpO\u2082", value: `${Math.round(vitals.spo2)}%`, severity: spo2Severity(vitals.spo2) },
    { label: "CVP", value: String(Math.round(vitals.cvp)), severity: cvpSeverity(vitals.cvp) },
  ];

  const hasCritical = items.some((i) => i.severity === "critical");

  function scrollToVitals() {
    const el = document.getElementById("pro-vitals-panel");
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: miniVitalsPulseCSS }} />
      <button
        onClick={scrollToVitals}
        aria-label="Vitals summary - tap to expand"
        className="md:hidden sticky top-0 z-[60] w-full flex items-center justify-center gap-3 overflow-x-auto py-1.5 px-3 bg-slate-900/95 backdrop-blur border-b border-white/8 text-xs"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        {items.map((item) => {
          const s = severityStyles[item.severity];
          return (
            <span
              key={item.label}
              className={[
                "flex items-center gap-1 flex-shrink-0 rounded px-1.5 py-0.5 border",
                s.border,
                item.severity === "critical" ? "mini-vital-critical bg-red-500/10" : "",
              ].join(" ")}
            >
              <span className="text-gray-500">{item.label}</span>
              <span className={`font-mono font-bold ${s.text}`}>
                {item.value}{s.icon}
              </span>
            </span>
          );
        })}
        {hasCritical && (
          <span className="text-red-400 text-[10px] animate-pulse flex-shrink-0" aria-hidden="true">
            ALERT
          </span>
        )}
      </button>
    </>
  );
}
