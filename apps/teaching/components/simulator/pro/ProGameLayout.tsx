"use client";

import React from "react";
import IOBalanceBar from "./IOBalanceBar";
import BioGearsStatusBadge from "./BioGearsStatusBadge";
import ACLSModal from "./ACLSModal";
import { useProGameStore } from "@/lib/simulator/store";
import { useMediaQuery } from "@/lib/hooks/useMediaQuery";

/** Floating OR countdown banner — shows time remaining until OR ready */
function ORCountdownBanner() {
  const pendingEvents = useProGameStore((s) => s.pendingEvents);
  const currentTime = useProGameStore((s) => s.clock.currentTime);
  const seniorPresence = useProGameStore((s) => s.seniorPresence);
  const phase = useProGameStore((s) => s.phase);

  if (phase !== "playing") return null;

  const orEvent = pendingEvents.find((e) => e.type === "or_ready" && !e.fired);
  if (!orEvent) return null;

  const remainingMin = Math.max(0, Math.ceil(orEvent.triggerAt - currentTime));
  const isUrgent = remainingMin <= 3;
  const seniorGone = seniorPresence === "left_for_or";

  return (
    <div
      className={[
        "fixed top-10 left-1/2 -translate-x-1/2 z-[55] px-4 py-2 rounded-xl border text-xs font-mono tracking-wide",
        "transition-all duration-500 shadow-lg",
        isUrgent
          ? "bg-amber-900/90 border-amber-500/50 text-amber-200 animate-pulse"
          : "bg-slate-900/90 border-slate-600/40 text-slate-300",
      ].join(" ")}
    >
      <span className="mr-2">{seniorGone ? "🏥" : "🩺"}</span>
      OR ready in <span className={`font-bold ${isUrgent ? "text-amber-100" : "text-white"}`}>{remainingMin}</span> min
      {seniorGone && <span className="ml-2 text-slate-500">| 學長在備 OR</span>}
    </div>
  );
}

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
  const isDesktop = useMediaQuery("(min-width: 1024px)");

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

      {/* ═══ ACLS Modal — overlays everything when cardiac arrest detected ═══ */}
      <ACLSModal />

      {/* ═══ Top bar — always visible ═══ */}
      <IOBalanceBar />

      {/* BioGears connection toggle — floats at top-right, near the game clock area */}
      <div className="fixed top-1.5 right-2 z-[56]">
        <BioGearsStatusBadge />
      </div>

      {/* OR countdown banner — shows when OR is being prepped */}
      <ORCountdownBanner />

      {/* Single subtree: only one of desktop / mobile is mounted at a time so
          ChatTimeline / MessageInput / ActionBar each have a single instance
          (was rendered twice via `hidden lg:flex` + `lg:hidden`). */}
      {isDesktop ? (
        <div className="flex flex-1 overflow-hidden">
          <div
            className="w-[380px] flex-shrink-0 overflow-y-auto border-r border-white/8"
            style={{ scrollbarWidth: "thin", scrollbarColor: "#ffffff1a transparent" }}
          >
            <div className="p-3 space-y-3">{desktopLeftPanel}</div>
          </div>

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
      ) : (
        <div className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-shrink-0">{monitorPanel}</div>
          <div className="flex-1 overflow-hidden">{chatPanel}</div>
          <div className="flex-shrink-0">{messageInput}</div>
          {actionBar && (
            <div className="flex-shrink-0 border-t border-white/8 bg-[#00202e]">
              {actionBar}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
