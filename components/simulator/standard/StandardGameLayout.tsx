"use client";

import React from "react";
import { useProGameStore } from "@/lib/simulator/store";
import GuidanceBubble from "./GuidanceBubble";
import type { GuidanceMessage } from "./GuidanceBubble";
import MiniVitalsBar from "../pro/MiniVitalsBar";

// ── CSS ─────────────────────────────────────────────────────────────────────

const dangerPulseCSS = `
@keyframes stdDangerVignette {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 0.8; }
}
`;

// ── Layout ──────────────────────────────────────────────────────────────────

interface StandardGameLayoutProps {
  vitalsPanel: React.ReactNode;
  chatTimeline: React.ReactNode;
  actionBar: React.ReactNode;
  guidanceMessages: GuidanceMessage[];
  onDismissGuidance: (id: string) => void;
}

export default function StandardGameLayout({
  vitalsPanel,
  chatTimeline,
  actionBar,
  guidanceMessages,
  onDismissGuidance,
}: StandardGameLayoutProps) {
  const severity = useProGameStore((s) => s.patient?.severity ?? 0);

  // Danger vignette
  const showDanger = severity > 60;
  const dangerOpacity = showDanger ? Math.min((severity - 60) / 40, 1) : 0;
  const dangerPulse = severity > 80;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col overflow-hidden"
      style={{ background: "#001219" }}
    >
      {/* Danger vignette overlay */}
      {showDanger && (
        <>
          <style dangerouslySetInnerHTML={{ __html: dangerPulseCSS }} />
          <div
            className="pointer-events-none fixed inset-0 z-[55]"
            style={{
              boxShadow: `inset 0 0 ${60 + dangerOpacity * 80}px ${10 + dangerOpacity * 30}px rgba(220, 38, 38, ${dangerOpacity * 0.4})`,
              animation: dangerPulse ? "stdDangerVignette 2s ease-in-out infinite" : undefined,
              opacity: dangerPulse ? undefined : dangerOpacity,
            }}
          />
        </>
      )}

      {/* Header bar */}
      <div className="flex-shrink-0 flex items-center justify-between px-4 py-2 border-b border-white/8 bg-[#00202e]">
        <div className="flex items-center gap-2">
          <span className="text-lg">{"\uD83E\uDE7A"}</span>
          <span className="text-sm font-semibold text-white">
            {"\u6559\u5B78\u6A21\u5F0F"}
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-900/40 text-amber-400 border border-amber-500/30">
            Standard
          </span>
        </div>
        <div className="text-xs text-gray-500 font-mono">
          {"\u6A21\u64EC ICU"}
        </div>
      </div>
      {/* Sticky mini vitals bar — visible on mobile only, mirrors Pro mode */}
      <MiniVitalsBar />

      {/* Desktop: side-by-side */}
      <div className="hidden lg:flex flex-1 overflow-hidden">
        {/* Left: vitals */}
        <div
          className="w-[340px] flex-shrink-0 overflow-y-auto border-r border-white/8 p-3 space-y-3"
          style={{ scrollbarWidth: "thin", scrollbarColor: "#ffffff1a transparent" }}
        >
          {vitalsPanel}
        </div>

        {/* Right: chat + guidance */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          {/* Guidance bubble overlay */}
          <div className="flex-shrink-0 px-3 pt-2">
            <GuidanceBubble
              messages={guidanceMessages}
              onDismiss={onDismissGuidance}
            />
          </div>
          <div className="flex-1 overflow-hidden">{chatTimeline}</div>
        </div>
      </div>

      {/* Mobile: stacked — chat first so user sees conversation immediately;
           MiniVitalsBar (sticky above) provides always-visible vitals summary.
           Scroll down to reach the full vitals panel. */}
      <div
        className="lg:hidden flex-1 overflow-y-auto"
        style={{ scrollbarWidth: "thin", scrollbarColor: "#ffffff1a transparent" }}
      >
        {/* Guidance bubble */}
        <div className="px-3 pt-2">
          <GuidanceBubble
            messages={guidanceMessages}
            onDismiss={onDismissGuidance}
          />
        </div>
        <div className="min-h-[50vh]" id="std-chat-area">{chatTimeline}</div>
        <div className="p-3 space-y-3" id="vitals-panel">{vitalsPanel}</div>
      </div>

      {/* Bottom Action Bar */}
      <div className="flex-shrink-0 border-t border-white/8">
        {actionBar}
      </div>
    </div>
  );
}
