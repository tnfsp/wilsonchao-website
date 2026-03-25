"use client";

import { useState, useRef, KeyboardEvent } from "react";
import { useProGameStore } from "@/lib/simulator/store";
import { getMedicationById } from "@/lib/simulator/data/medications";
import { getLabById } from "@/lib/simulator/data/labs";
import { getTransfusionById } from "@/lib/simulator/data/transfusions";
import type { NurseAction } from "@/lib/simulator/engine/nurse-action-types";

// Helper: resolve order definition from any category
function getOrderDefinitionById(id: string) {
  return getMedicationById(id) ?? getLabById(id) ?? getTransfusionById(id);
}

// Words that mean "yes / confirm / go ahead"
const CONFIRM_WORDS = ["好", "對", "確認", "ok", "yes", "run", "開", "沒錯", "正確", "go"];
const CONFIRM_PHRASES = ["好的", "好吧", "好啊", "ok開", "沒問題", "可以", "行", "開吧", "給他開", "幫我開"];

function isConfirmReply(text: string): boolean {
  const normalized = text.trim().toLowerCase().replace(/\s/g, "");
  if (CONFIRM_PHRASES.some((p) => normalized === p)) return true;
  return CONFIRM_WORDS.some((w) => normalized === w || normalized === w + "啊" || normalized === w + "啦");
}

export default function MessageInput() {
  const sendMessage = useProGameStore((s) => s.sendMessage);
  const addTimelineEntry = useProGameStore((s) => s.addTimelineEntry);
  const placeOrder = useProGameStore((s) => s.placeOrder);
  const phase = useProGameStore((s) => s.phase);
  const patient = useProGameStore((s) => s.patient);
  const clock = useProGameStore((s) => s.clock);
  const placedOrders = useProGameStore((s) => s.placedOrders);
  const timeline = useProGameStore((s) => s.timeline);
  const scenario = useProGameStore((s) => s.scenario);

  const [text, setText] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Pending confirmation queue for confirm_order flow (supports multiple simultaneous confirms)
  const [pendingConfirmQueue, setPendingConfirmQueue] = useState<Array<{
    medicationId: string;
    dose: string;
    frequency: string;
  }>>([]);

  const inputRef = useRef<HTMLInputElement>(null);

  const isPlaying = phase === "playing";
  const canSend = isPlaying && text.trim().length > 0 && !isLoading;

  const nurseName = scenario?.nurseProfile?.name ?? "林姐";

  // Execute a single place_order action
  const executePlaceOrder = (action: NurseAction) => {
    const definition = getOrderDefinitionById(action.medicationId);
    if (!definition) {
      console.warn(`[NurseAI] Unknown medicationId: ${action.medicationId}`);
      return;
    }

    const result = placeOrder({
      definition,
      dose: action.dose ?? definition.defaultDose,
      frequency: action.frequency ?? (definition.category === "lab" ? "STAT" : "Continuous"),
    });

    if (result.warning) {
      addTimelineEntry({
        gameTime: clock.currentTime + 1,
        type: "system_event",
        content: `⚠️ ${result.warning}`,
        sender: "system",
      });
    }

    if (result.rejected && result.rejectMessage) {
      addTimelineEntry({
        gameTime: clock.currentTime + 1,
        type: "system_event",
        content: `❌ ${result.rejectMessage}`,
        sender: "system",
      });
    }
  };

  const handleSend = async () => {
    if (!canSend) return;
    const msgText = text.trim();

    // ── Pending confirmation flow ──────────────────────────────
    if (pendingConfirmQueue.length > 0 && isConfirmReply(msgText)) {
      setText("");
      // Show player message
      sendMessage(msgText);

      // Consume the first item in the queue
      const top = pendingConfirmQueue[0];
      const definition = getOrderDefinitionById(top.medicationId);

      if (!definition) {
        console.warn(`[NurseAI] pendingConfirm medicationId not found: ${top.medicationId}`);
        addTimelineEntry({
          gameTime: clock.currentTime + 1,
          type: "nurse_message",
          content: `${nurseName}：學長，我找不到這個藥，你再說一次看看？`,
          sender: "nurse",
        });
        setPendingConfirmQueue((q) => q.slice(1));
        inputRef.current?.focus();
        return;
      }

      const displayName = definition.name;

      const result = placeOrder({
        definition,
        dose: top.dose,
        frequency: top.frequency,
      });

      // Nurse confirms
      addTimelineEntry({
        gameTime: clock.currentTime + 1,
        type: "nurse_message",
        content: `${nurseName}：好，${displayName} 我幫你開了。`,
        sender: "nurse",
      });

      if (result.warning) {
        addTimelineEntry({
          gameTime: clock.currentTime + 1,
          type: "system_event",
          content: `⚠️ ${result.warning}`,
          sender: "system",
        });
      }

      if (result.rejected && result.rejectMessage) {
        addTimelineEntry({
          gameTime: clock.currentTime + 1,
          type: "system_event",
          content: `❌ ${result.rejectMessage}`,
          sender: "system",
        });
      }

      setPendingConfirmQueue((q) => q.slice(1));
      inputRef.current?.focus();
      return;
    }

    // ── Normal flow ────────────────────────────────────────────
    setText("");
    sendMessage(msgText);
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
        pathology: patient?.pathology,
      };

      // Build conversation history from timeline (last 5 exchanges)
      const chatEntries = timeline
        .filter((t) => t.type === "player_message" || t.type === "nurse_message")
        .slice(-10); // last 10 entries ≈ 5 exchanges

      const conversationHistory = chatEntries.map((t) => ({
        role: t.type === "player_message" ? "user" as const : "assistant" as const,
        content: t.type === "nurse_message"
          ? t.content.replace(/^[^：]+：/, "") // strip nurse name prefix
          : t.content.replace(/^[^：]+：/, ""), // strip player prefix if any
      }));

      const res = await fetch("/api/simulator/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msgText, gameState, conversationHistory }),
      });

      if (res.ok) {
        const data = await res.json();

        // Add nurse reply to timeline
        addTimelineEntry({
          gameTime: clock.currentTime + 1,
          type: "nurse_message",
          content: `${nurseName}：${data.reply}`,
          sender: "nurse",
        });

        // Process actions
        const actions: NurseAction[] = Array.isArray(data.actions) ? data.actions : [];

        for (const action of actions) {
          if (action.type === "place_order") {
            executePlaceOrder(action);
          } else if (action.type === "confirm_order") {
            // Enqueue pending confirmation so next "好" triggers placeOrder
            const definition = getOrderDefinitionById(action.medicationId);
            setPendingConfirmQueue((q) => [
              ...q,
              {
                medicationId: action.medicationId,
                dose: action.dose ?? definition?.defaultDose ?? "1",
                frequency: action.frequency ?? (definition?.category === "lab" ? "STAT" : "Continuous"),
              },
            ]);
            // Note: nurse already asked in reply, no extra timeline entry needed
          }
        }
      }
    } catch (err) {
      console.error("Nurse AI error:", err);
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
        placeholder={
          pendingConfirmQueue.length > 0
            ? "回「好」確認，或輸入其他指令..."
            : isPlaying
            ? "跟林姐說話..."
            : "等待情境開始..."
        }
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
