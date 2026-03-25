"use client";

import React from "react";
import IOBalanceBar from "./IOBalanceBar";
import { useProGameStore } from "@/lib/simulator/store";

interface ProGameLayoutProps {
  /** Mobile top area: vitals rows + waveform + CT status (fixed, no scroll) */
  monitorPanel: React.ReactNode;
  /** Desktop-only left panel: full vitals + waveform + CT + vent (scrollable) */
  desktopLeftPanel: React.ReactNode;
  /** Chat timeline (scrollable area) */
  chatPanel: React.ReactNode;
  /** Message input bar */
  messageInput: React.ReactNode;
  /** Icon-only action bar */
  actionBar?: React.ReactNode;
}

const dangerPulseCSS = `
@keyframes dangerVignette {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 0.8; }
}
`;

export default function ProGameLayout({
  monitorPanel,
  desktopLeftPanel,
  chatPanel,
  messageInput,
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

      {/* ═══ Top bar — always visible ═══ */}
      <IOBalanceBar />

      {/* ═══ Desktop (lg+): side-by-side ═══ */}
      <div className="hidden lg:flex flex-1 overflow-hidden">
        {/* Left column: monitors (scrollable) */}
        <div
          className="w-[380px] flex-shrink-0 overflow-y-auto border-r border-white/8"
          style={{ scrollbarWidth: "thin", scrollbarColor: "#ffffff1a transparent" }}
        >
          <div className="p-3 space-y-3">{desktopLeftPanel}</div>
        </div>

        {/* Right column: chat + input + action bar */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          <div className="flex-1 overflow-hidden">{chatPanel}</div>
          <div className="flex-shrink-0">{messageInput}</div>
          {actionBar && (
            <div className="flex-shrink-0 border-t border-white/8 bg-[#00202e]">
              {actionBar}
            </div>
          )}
        </div>
      </div>

      {/* ═══ Mobile (<lg): Fixed layers, zero scroll ═══ */}
      <div className="lg:hidden flex flex-col flex-1 overflow-hidden">
        {/* Fixed monitor area: vitals rows + waveform + CT */}
        <div className="flex-shrink-0">{monitorPanel}</div>

        {/* Scrollable chat — the ONLY scrollable area */}
        <div className="flex-1 overflow-hidden">{chatPanel}</div>

        {/* Fixed message input */}
        <div className="flex-shrink-0">{messageInput}</div>

        {/* Fixed action bar */}
        {actionBar && (
          <div className="flex-shrink-0 border-t border-white/8 bg-[#00202e]">
            {actionBar}
          </div>
        )}
      </div>
    </div>
  );
}
