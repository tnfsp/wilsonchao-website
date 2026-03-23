"use client";

import { useState, useRef, KeyboardEvent } from "react";
import { useProGameStore } from "@/lib/simulator/store";

export default function MessageInput() {
  const sendMessage = useProGameStore((s) => s.sendMessage);
  const addTimelineEntry = useProGameStore((s) => s.addTimelineEntry);
  const phase = useProGameStore((s) => s.phase);
  const patient = useProGameStore((s) => s.patient);
  const clock = useProGameStore((s) => s.clock);
  const placedOrders = useProGameStore((s) => s.placedOrders);
  const timeline = useProGameStore((s) => s.timeline);
  const scenario = useProGameStore((s) => s.scenario);

  const [text, setText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const isPlaying = phase === "playing";
  const canSend = isPlaying && text.trim().length > 0 && !isLoading;

  const handleSend = async () => {
    if (!canSend) return;
    const msgText = text.trim();
    setText("");

    // 1. Add player message
    sendMessage(msgText);

    // 2. Call nurse AI
    setIsLoading(true);
    try {
      // Build game state for API
      const labResults = placedOrders
        .filter((o) => o.definition.timeToResult !== undefined)
        .map((o) => ({
          name: o.definition.name,
          result: o.result ? JSON.stringify(o.result) : undefined,
        }));

      const activeOrders = placedOrders
        .filter((o) => o.status !== "completed")
        .map((o) => ({ name: o.definition.name, dose: o.dose }));

      const recentTimeline = timeline.slice(-8).map((t) => ({
        type: t.type,
        content: t.content,
      }));

      const gameState = {
        vitals: patient?.vitals,
        chestTube: patient?.chestTube,
        clock: { currentTime: clock.currentTime },
        labs: labResults,
        orders: activeOrders,
        timeline: recentTimeline,
      };

      const res = await fetch("/api/simulator/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msgText, gameState }),
      });

      if (res.ok) {
        const data = await res.json();
        const nurseName = scenario?.nurseProfile?.name ?? "林姐";

        // 3. Add nurse reply
        addTimelineEntry({
          gameTime: clock.currentTime + 1, // +1 min for conversation
          type: "nurse_message",
          content: `${nurseName}：${data.reply}`,
          sender: "nurse",
        });
      }
    } catch (err) {
      console.error("Nurse AI error:", err);
      // Fallback nurse message
      const nurseName = scenario?.nurseProfile?.name ?? "林姐";
      addTimelineEntry({
        gameTime: clock.currentTime + 1,
        type: "nurse_message",
        content: `${nurseName}：學長，系統有點問題，你稍等一下。`,
        sender: "nurse",
      });
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div
      className="w-full px-3 py-2.5 border-t border-slate-700/60 flex items-center gap-2"
      style={{ background: "#0d1f3c" }}
    >
      {/* Input */}
      <input
        ref={inputRef}
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={isPlaying ? "跟林姐說話..." : "等待情境開始..."}
        disabled={!isPlaying || isLoading}
        maxLength={300}
        className={[
          "flex-1 rounded-xl px-4 py-2.5 text-sm outline-none transition-colors",
          "bg-slate-800/80 border text-slate-100 placeholder-slate-500",
          isPlaying && !isLoading
            ? "border-slate-600 focus:border-cyan-500/70 focus:bg-slate-800"
            : "border-slate-700 text-slate-500 cursor-not-allowed opacity-60",
        ].join(" ")}
        autoComplete="off"
        spellCheck={false}
      />

      {/* Send Button */}
      <button
        onClick={handleSend}
        disabled={!canSend}
        className={[
          "shrink-0 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all active:scale-95",
          canSend
            ? "bg-cyan-600 hover:bg-cyan-500 text-white cursor-pointer"
            : "bg-slate-700/60 text-slate-500 cursor-not-allowed opacity-60",
        ].join(" ")}
        title="送出 (Enter)"
      >
        {isLoading ? "..." : "送出"}
      </button>
    </div>
  );
}
