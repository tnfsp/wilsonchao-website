"use client";

import React from "react";
import IOBalanceBar from "./IOBalanceBar";
import MiniVitalsBar from "./MiniVitalsBar";
import { useProGameStore } from "@/lib/simulator/store";

interface ProGameLayoutProps {
  leftPanel: React.ReactNode;
  rightPanel: React.ReactNode;
  actionBar?: React.ReactNode;
}

const dangerPulseCSS = `
@keyframes dangerVignette {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 0.8; }
}
`;

export default function ProGameLayout({
  leftPanel,
  rightPanel,
  actionBar,
}: ProGameLayoutProps) {
  const severity = useProGameStore((s) => s.patient?.severity ?? 0);

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
              animation: dangerPulse ? "dangerVignette 2s ease-in-out infinite" : undefined,
              opacity: dangerPulse ? undefined : dangerOpacity,
            }}
          />
        </>
      )}

      {/* Top bar */}
      <IOBalanceBar />
      <MiniVitalsBar />

      {/* Desktop: side-by-side */}
      <div className="hidden lg:flex flex-1 overflow-hidden">
        <div
          className="w-[380px] flex-shrink-0 overflow-y-auto border-r border-white/8"
          style={{ scrollbarWidth: "thin", scrollbarColor: "#ffffff1a transparent" }}
        >
          <div className="p-3 space-y-3">{leftPanel}</div>
        </div>
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          <div className="flex-1 overflow-hidden">{rightPanel}</div>
        </div>
      </div>

      {/* Mobile: stacked — chat first so user sees conversation immediately;
           MiniVitalsBar (sticky above) provides always-visible vitals summary.
           Scroll down to reach the full vitals panel. */}
      <div className="lg:hidden flex-1 overflow-y-auto" style={{ scrollbarWidth: "thin", scrollbarColor: "#ffffff1a transparent" }}>
        <div className="min-h-[50vh]">{rightPanel}</div>
        <div className="p-3 space-y-3">{leftPanel}</div>
      </div>

      {/* Bottom Action Bar */}
      {actionBar && (
        <div className="flex-shrink-0 border-t border-white/8 bg-[#00202e]">
          {actionBar}
        </div>
      )}
    </div>
  );
}
