"use client";

import { useEffect, useState, useCallback, useRef } from "react";

// ── CSS ─────────────────────────────────────────────────────────────────────

const guidanceBubbleCSS = `
@keyframes slideInLeft {
  from { transform: translateX(-100%); opacity: 0; }
  to   { transform: translateX(0);     opacity: 1; }
}
@keyframes slideOutLeft {
  from { transform: translateX(0);     opacity: 1; }
  to   { transform: translateX(-100%); opacity: 0; }
}
.guidance-slide-in {
  animation: slideInLeft 0.35s ease-out forwards;
}
.guidance-slide-out {
  animation: slideOutLeft 0.25s ease-in forwards;
}
`;

// ── Types ───────────────────────────────────────────────────────────────────

export type GuidanceSeverity = "info" | "warning" | "critical";

export interface GuidanceMessage {
  id: string;
  text: string;
  severity: GuidanceSeverity;
}

// ── Severity config ─────────────────────────────────────────────────────────

const SEVERITY_STYLES: Record<GuidanceSeverity, { bg: string; border: string; icon: string }> = {
  info: {
    bg: "bg-sky-900/60",
    border: "border-sky-500/40",
    icon: "\uD83D\uDCA1",
  },
  warning: {
    bg: "bg-amber-900/60",
    border: "border-amber-500/50",
    icon: "\u26A0\uFE0F",
  },
  critical: {
    bg: "bg-red-900/60",
    border: "border-red-500/60",
    icon: "\uD83D\uDEA8",
  },
};

const AUTO_DISMISS_MS: Record<GuidanceSeverity, number | null> = {
  info: 8000,
  warning: null, // persist until acknowledged
  critical: null,
};

// ── Component ───────────────────────────────────────────────────────────────

export default function GuidanceBubble({
  messages,
  onDismiss,
}: {
  messages: GuidanceMessage[];
  onDismiss: (id: string) => void;
}) {
  const [current, setCurrent] = useState<GuidanceMessage | null>(null);
  const [exiting, setExiting] = useState(false);
  const dismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const shownRef = useRef<Set<string>>(new Set());

  const dismiss = useCallback(() => {
    if (!current) return;
    setExiting(true);
    const id = current.id;
    setTimeout(() => {
      setExiting(false);
      setCurrent(null);
      onDismiss(id);
    }, 260);
  }, [current, onDismiss]);

  // Pick next message from queue — critical messages jump ahead of info/warning
  useEffect(() => {
    if (current) return;
    const pending = messages.filter((m) => !shownRef.current.has(m.id));
    // Priority order: critical > warning > info
    const SEVERITY_PRIORITY: Record<GuidanceSeverity, number> = {
      critical: 0,
      warning: 1,
      info: 2,
    };
    const next = pending.sort(
      (a, b) => SEVERITY_PRIORITY[a.severity] - SEVERITY_PRIORITY[b.severity],
    )[0];
    if (next) {
      shownRef.current.add(next.id);
      setCurrent(next);
    }
  }, [messages, current]);

  // Interrupt current info/warning message if a critical message is waiting
  useEffect(() => {
    if (!current) return;
    if (current.severity === "critical") return; // already showing critical
    const hasPendingCritical = messages.some(
      (m) => !shownRef.current.has(m.id) && m.severity === "critical",
    );
    if (hasPendingCritical) {
      // Fast-dismiss current non-critical to show critical ASAP
      if (dismissTimer.current) clearTimeout(dismissTimer.current);
      dismiss();
    }
  }, [messages, current, dismiss]);

  // Auto-dismiss for info severity
  useEffect(() => {
    if (dismissTimer.current) clearTimeout(dismissTimer.current);
    if (!current) return;

    const ms = AUTO_DISMISS_MS[current.severity];
    if (ms !== null) {
      dismissTimer.current = setTimeout(dismiss, ms);
    }
    return () => {
      if (dismissTimer.current) clearTimeout(dismissTimer.current);
    };
  }, [current, dismiss]);

  if (!current) return null;

  const severity = SEVERITY_STYLES[current.severity];

  return (
    <>
      <style>{guidanceBubbleCSS}</style>
      <div
        className={[
          "flex items-start gap-3 rounded-xl border-2 px-4 py-3 shadow-lg max-w-md",
          severity.bg,
          severity.border,
          exiting ? "guidance-slide-out" : "guidance-slide-in",
        ].join(" ")}
        role="alert"
        aria-live="assertive"
      >
        {/* Nurse avatar */}
        <span className="text-2xl flex-shrink-0" role="img" aria-label="Nurse">
          {"\uD83D\uDC69\u200D\u2695\uFE0F"}
        </span>

        {/* Message body */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-xs">{severity.icon}</span>
            <span className="text-xs font-semibold text-gray-300 uppercase tracking-wide">
              {"\u8B77\u7406\u5E2B\u63D0\u793A"}
            </span>
          </div>
          <p className="text-sm text-gray-100 leading-relaxed">{current.text}</p>
        </div>

        {/* Dismiss button (always visible for warning/critical; hidden for auto-dismiss info) */}
        {AUTO_DISMISS_MS[current.severity] === null && (
          <button
            onClick={dismiss}
            className="flex-shrink-0 text-gray-400 hover:text-white text-lg leading-none mt-0.5 transition-colors"
            aria-label="Dismiss"
          >
            {"\u2715"}
          </button>
        )}
      </div>
    </>
  );
}
