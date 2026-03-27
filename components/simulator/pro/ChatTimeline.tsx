"use client";

import { useEffect, useRef, memo } from "react";
import { useProGameStore } from "@/lib/simulator/store";
import type { TimelineEntry, TimelineEntryType } from "@/lib/simulator/types";

// ─────────────────────────────────────────────
// Game-time formatter: minutes-since-start → "02:05 AM"
// ─────────────────────────────────────────────
function formatGameTime(gameMinutes: number, startHour: number): string {
  const totalMinutes = startHour * 60 + gameMinutes;
  const hours24 = Math.floor(totalMinutes / 60) % 24;
  const mins = totalMinutes % 60;
  const ampm = hours24 >= 12 ? "PM" : "AM";
  const hours12 = hours24 % 12 || 12;
  return `${String(hours12).padStart(2, "0")}:${String(mins).padStart(2, "0")} ${ampm}`;
}

// ─────────────────────────────────────────────
// Sender icon
// ─────────────────────────────────────────────
function SenderIcon({ sender }: { sender?: TimelineEntry["sender"] }) {
  switch (sender) {
    case "nurse":
      return <span title="護理師">🏥</span>;
    case "player":
      return <span title="你">👤</span>;
    case "system":
      return <span title="系統">⚙️</span>;
    case "senior":
      return <span title="學長">👨‍⚕️</span>;
    default:
      return <span>⚙️</span>;
  }
}

// ─────────────────────────────────────────────
// Entry renderers
// ─────────────────────────────────────────────

/** nurse_message — left-aligned, slate-700 bg */
const NurseMessage = memo(function NurseMessage({ entry, timeStr }: { entry: TimelineEntry; timeStr: string }) {
  return (
    <div className="flex items-start gap-2 max-w-[85%]">
      <div className="mt-1 text-lg shrink-0">
        <SenderIcon sender={entry.sender} />
      </div>
      <div className="flex flex-col gap-0.5">
        <span className="text-xs text-slate-400 pl-1">{timeStr}</span>
        <div className="relative rounded-2xl rounded-tl-sm px-3.5 py-2.5 bg-slate-700 text-slate-100 text-sm leading-relaxed shadow-sm">
          {entry.isImportant && (
            <span className="mr-1 text-yellow-400">⚠️</span>
          )}
          {entry.content}
        </div>
      </div>
    </div>
  );
});

/** player_message — right-aligned, cyan bg */
const PlayerMessage = memo(function PlayerMessage({ entry, timeStr }: { entry: TimelineEntry; timeStr: string }) {
  return (
    <div className="flex items-start gap-2 max-w-[85%] ml-auto flex-row-reverse">
      <div className="mt-1 text-lg shrink-0">
        <SenderIcon sender="player" />
      </div>
      <div className="flex flex-col items-end gap-0.5">
        <span className="text-xs text-slate-400 pr-1">{timeStr}</span>
        <div className="rounded-2xl rounded-tr-sm px-3.5 py-2.5 bg-cyan-600 text-white text-sm leading-relaxed shadow-sm">
          {entry.isImportant && <span className="mr-1 text-yellow-300">⚠️</span>}
          {entry.content}
        </div>
      </div>
    </div>
  );
});

/** player_action — right-aligned, semi-transparent border */
const PlayerAction = memo(function PlayerAction({ entry, timeStr }: { entry: TimelineEntry; timeStr: string }) {
  return (
    <div className="flex items-start gap-2 max-w-[85%] ml-auto flex-row-reverse">
      <div className="mt-1 text-lg shrink-0">
        <SenderIcon sender="player" />
      </div>
      <div className="flex flex-col items-end gap-0.5">
        <span className="text-xs text-slate-400 pr-1">{timeStr}</span>
        <div className="rounded-2xl rounded-tr-sm px-3.5 py-2.5 border border-cyan-500/40 bg-cyan-900/20 text-cyan-200 text-sm leading-relaxed shadow-sm">
          {entry.isImportant && <span className="mr-1 text-yellow-400">⚠️</span>}
          {entry.content}
        </div>
      </div>
    </div>
  );
});

/** system_event — centered, small gray text */
const SystemEvent = memo(function SystemEvent({ entry, timeStr }: { entry: TimelineEntry; timeStr: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5 my-1">
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <div className="h-px w-12 bg-slate-700" />
        <span>{timeStr}</span>
        <div className="h-px w-12 bg-slate-700" />
      </div>
      <span className="text-xs text-slate-400 italic px-4 text-center">
        {entry.isImportant && <span className="mr-1">⚠️</span>}
        {entry.content}
      </span>
    </div>
  );
});

/** lab_result — left-aligned, yellow border */
const LabResult = memo(function LabResult({ entry, timeStr }: { entry: TimelineEntry; timeStr: string }) {
  return (
    <div className="flex items-start gap-2 max-w-[90%]">
      <div className="mt-1 text-lg shrink-0">🧪</div>
      <div className="flex flex-col gap-0.5">
        <span className="text-xs text-slate-400 pl-1">{timeStr}</span>
        <div className="rounded-xl px-3.5 py-2.5 border border-yellow-500/60 bg-yellow-900/20 text-yellow-100 text-sm leading-relaxed shadow-sm font-mono whitespace-pre-wrap">
          {entry.isImportant && <span className="mr-1 text-yellow-400">⚠️</span>}
          {entry.content}
        </div>
      </div>
    </div>
  );
});

/** order_placed — right-aligned, green border */
const OrderPlaced = memo(function OrderPlaced({ entry, timeStr }: { entry: TimelineEntry; timeStr: string }) {
  return (
    <div className="flex items-start gap-2 max-w-[85%] ml-auto flex-row-reverse">
      <div className="mt-1 text-lg shrink-0">
        <SenderIcon sender="player" />
      </div>
      <div className="flex flex-col items-end gap-0.5">
        <span className="text-xs text-slate-400 pr-1">{timeStr}</span>
        <div className="rounded-2xl rounded-tr-sm px-3.5 py-2.5 border border-emerald-500/60 bg-emerald-900/20 text-emerald-200 text-sm leading-relaxed shadow-sm">
          {entry.isImportant && <span className="mr-1 text-yellow-400">⚠️</span>}
          {entry.content}
        </div>
      </div>
    </div>
  );
});

/** vitals_update — centered, very small */
const VitalsUpdate = memo(function VitalsUpdate({ entry, timeStr }: { entry: TimelineEntry; timeStr: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5 my-0.5">
      <span className="text-[11px] text-slate-500">
        <span className="text-slate-600 mr-1">{timeStr}</span>
        {entry.isImportant && <span className="mr-1 text-yellow-500">⚠️</span>}
        {entry.content}
      </span>
    </div>
  );
});

/** hint — left-aligned, orange bg, warning feel */
const HintEntry = memo(function HintEntry({ entry, timeStr }: { entry: TimelineEntry; timeStr: string }) {
  return (
    <div className="flex items-start gap-2 max-w-[88%]">
      <div className="mt-1 text-lg shrink-0">💡</div>
      <div className="flex flex-col gap-0.5">
        <span className="text-xs text-slate-400 pl-1">{timeStr}</span>
        <div className="rounded-xl px-3.5 py-2.5 bg-orange-900/50 border border-orange-500/50 text-orange-100 text-sm leading-relaxed shadow-sm">
          {entry.isImportant && <span className="mr-1 text-yellow-300">⚠️</span>}
          <span className="font-semibold text-orange-300 mr-1">提示：</span>
          {entry.content}
        </div>
      </div>
    </div>
  );
});

// ─────────────────────────────────────────────
// Entry dispatcher (M5: memoized to prevent re-renders)
// ─────────────────────────────────────────────
const TimelineEntryRow = memo(function TimelineEntryRow({
  entry,
  startHour,
}: {
  entry: TimelineEntry;
  startHour: number;
}) {
  const timeStr = formatGameTime(entry.gameTime, startHour);

  switch (entry.type) {
    case "nurse_message":
      return <NurseMessage entry={entry} timeStr={timeStr} />;
    case "player_message":
      return <PlayerMessage entry={entry} timeStr={timeStr} />;
    case "player_action":
      return <PlayerAction entry={entry} timeStr={timeStr} />;
    case "system_event":
      return <SystemEvent entry={entry} timeStr={timeStr} />;
    case "lab_result":
      return <LabResult entry={entry} timeStr={timeStr} />;
    case "order_placed":
      return <OrderPlaced entry={entry} timeStr={timeStr} />;
    case "vitals_update":
      return <VitalsUpdate entry={entry} timeStr={timeStr} />;
    case "hint":
      return <HintEntry entry={entry} timeStr={timeStr} />;
    default:
      return <SystemEvent entry={entry} timeStr={timeStr} />;
  }
});

// ─────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────
export default function ChatTimeline() {
  const timeline = useProGameStore((s) => s.timeline);
  const scenario = useProGameStore((s) => s.scenario);
  const startHour = scenario?.startHour ?? 2;

  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom whenever timeline changes
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [timeline]);

  return (
    <div
      className="flex flex-col h-full overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-slate-700 px-3 py-4 gap-3"
      style={{ background: "#0a1628" }}
    >
      {timeline.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-slate-600 text-sm gap-2">
          <span className="text-3xl">💬</span>
          <span>等待護理師來電...</span>
        </div>
      ) : (
        timeline.map((entry) => (
          <TimelineEntryRow
            key={entry.id}
            entry={entry}
            startHour={startHour}
          />
        ))
      )}
      <div ref={bottomRef} />
    </div>
  );
}
