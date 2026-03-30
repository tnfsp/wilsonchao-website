"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useProGameStore } from "@/lib/simulator/store";

/**
 * SeniorDialogModal — AI-driven 學長到場對話
 *
 * 學長到場後的互動式對話，基於 /api/simulator/senior-chat (mode: "in_person")。
 * 玩家報告情況 → 學長追問/評估 → 學長做決定離開。
 *
 * Fallback: API 失敗 8 秒後降級回 scripted 對話。
 */

interface ChatMessage {
  role: "senior" | "player";
  content: string;
  isAction?: boolean; // 動作描述（斜體）
}

// Scripted fallback（API 失敗時使用）
const FALLBACK_LINES = [
  "（看了一眼監視器）「跟我報告一下目前狀況。」",
  "「嗯⋯⋯我看看 CT 和 vitals。」",
  "「好，我去聯絡開刀房，有變化馬上叫我。」",
];

export function SeniorDialogModal() {
  const activeModal = useProGameStore((s) => s.activeModal);
  const closeModal = useProGameStore((s) => s.closeModal);
  const addTimelineEntry = useProGameStore((s) => s.addTimelineEntry);
  const updatePatientSeverity = useProGameStore((s) => s.updatePatientSeverity);
  const patient = useProGameStore((s) => s.patient);
  const clock = useProGameStore((s) => s.clock);
  const scenario = useProGameStore((s) => s.scenario);
  const placedOrders = useProGameStore((s) => s.placedOrders);
  const playerActions = useProGameStore((s) => s.playerActions);
  const sbarPhase1 = useProGameStore((s) => s.sbarPhase1);
  const addPendingEvent = useProGameStore((s) => s.addPendingEvent);
  const pendingEvents = useProGameStore((s) => s.pendingEvents);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [turnCount, setTurnCount] = useState(0);
  const [capturedDecision, setCapturedDecision] = useState<{ action: string; message: string } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const isVisible = activeModal === "senior_dialog";

  // Build game state for API
  const buildGameState = useCallback(() => ({
    vitals: patient?.vitals,
    chestTube: patient?.chestTube,
    clock: { currentTime: clock.currentTime },
    labs: placedOrders
      .filter((o) => o.definition.category === "lab" && o.status === "completed")
      .map((o) => ({ name: o.definition.name, summary: o.result ? String(o.result) : undefined })),
    orders: placedOrders.map((o) => ({ name: o.definition.name, status: o.status })),
    pathology: patient?.pathology,
    scenario: { patientInfo: scenario?.patient ? `${scenario.patient.age}${scenario.patient.sex === "M" ? "M" : "F"}, ${scenario.patient.surgery}` : undefined },
    severity: patient?.severity,
    playerActions: playerActions.slice(-10).map((a) => a.action),
    sbarPhase1: sbarPhase1 ? Object.values(sbarPhase1).join(" ") : undefined,
  }), [patient, clock, placedOrders, playerActions, scenario, sbarPhase1]);

  // AI chat call
  const callSeniorAI = useCallback(async (
    userMessage: string,
    history: ChatMessage[],
    mode: "in_person" | "arrival_greeting",
  ): Promise<string> => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    try {
      const conversationHistory = history
        .filter((m) => !m.isAction)
        .map((m) => ({
          role: m.role === "senior" ? "assistant" as const : "user" as const,
          content: m.content,
        }));

      const res = await fetch("/api/simulator/senior-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage,
          gameState: buildGameState(),
          conversationHistory,
          mode,
          turnCount: history.filter((m) => m.role === "player").length,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeout);
      if (!res.ok) throw new Error(`API ${res.status}`);
      const data = await res.json();
      return data.reply ?? FALLBACK_LINES[1];
    } catch {
      clearTimeout(timeout);
      // Fallback — count only player turns (not greeting) to pick the right line
      const playerTurns = history.filter((m) => m.role === "player").length;
      const fallbackIdx = Math.min(playerTurns, FALLBACK_LINES.length - 1);
      return FALLBACK_LINES[fallbackIdx];
    }
  }, [buildGameState]);

  // Initial greeting when modal opens
  useEffect(() => {
    if (!isVisible || messages.length > 0) return;

    const greet = async () => {
      setIsLoading(true);
      const greeting = await callSeniorAI(
        "學長剛到場，請基於目前病人狀態生成到場開場白。",
        [],
        "arrival_greeting",
      );
      setMessages([
        { role: "senior", content: "（推門進來，快步走到床邊看了一眼監視器）", isAction: true },
        { role: "senior", content: greeting },
      ]);
      setIsLoading(false);
      inputRef.current?.focus();
    };
    greet();
  }, [isVisible, messages.length, callSeniorAI]);

  // Auto-scroll
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  // Reset state when dialog becomes visible (prevent stale state from previous opening)
  useEffect(() => {
    if (isVisible) {
      setMessages([]);
      setInput("");
      setIsDone(false);
      setTurnCount(0);
      setCapturedDecision(null);
    }
  }, [isVisible]);

  // Rule-based decision guard
  function getSeniorDecision(): { action: string; message: string } {
    const pathology = patient?.pathology ?? "";
    const orAlreadyPrepping = pendingEvents.some(
      (e) => e.type === "or_ready" && !e.fired
    );

    if (pathology === "cardiac_tamponade" || pathology === "tamponade") {
      if (orAlreadyPrepping) {
        // B2T recall: senior comes back, OR already prepping → stay at bedside
        return {
          action: "stay_at_bedside",
          message: "「不只是出血了，是 tamponade。OR 差不多好了，我留在這裡。繼續 resuscitate，有什麼變化我直接處理。」",
        };
      }
      return {
        action: "go_to_or",
        message: "「Tamponade。通知 OR，準備 re-sternotomy。你繼續 resuscitate，volume 不要停。我去準備。」",
      };
    }
    if (pathology === "surgical_bleeding" && (patient?.severity ?? 0) > 30) {
      return {
        action: "go_to_or",
        message: "「出血量太大，保守治療不夠。我去聯絡開刀房 re-explore，你先繼續穩住他——血品繼續跑，Norepi 不要停。」",
      };
    }
    return {
      action: "continue_monitoring",
      message: "「好，目前先繼續觀察和 resuscitate。有什麼變化馬上再叫我。我去聯絡一下 OR 備著。」",
    };
  }

  async function handleSend() {
    if (!input.trim() || isLoading || isDone) return;
    const msg = input.trim();
    setInput("");

    const newMessages: ChatMessage[] = [...messages, { role: "player", content: msg }];
    setMessages(newMessages);
    setTurnCount((t) => t + 1);
    setIsLoading(true);

    // Get AI response
    const reply = await callSeniorAI(msg, newMessages, "in_person");

    const updatedMessages: ChatMessage[] = [...newMessages, { role: "senior", content: reply }];

    // After 3+ player turns, senior makes a decision (capture once to prevent divergence)
    if (turnCount + 1 >= 3) {
      const decision = getSeniorDecision();
      setCapturedDecision(decision);
      const isLeaving = decision.action === "go_to_or";
      updatedMessages.push(
        { role: "senior", content: decision.message },
        { role: "senior", content: isLeaving ? "（學長快步離開 ICU）" : "（學長留在床邊）", isAction: true },
      );
      setIsDone(true);
    }

    setMessages(updatedMessages);
    setIsLoading(false);
  }

  function handleClose() {
    // Record timeline
    addTimelineEntry({
      gameTime: clock.currentTime,
      type: "system_event",
      content: `🩺 學長到場對話（${messages.filter((m) => m.role === "player").length} 輪）`,
      sender: "system",
      isImportant: true,
    });

    // Severity -5 (calming effect of senior presence)
    if (patient) {
      updatePatientSeverity(Math.max(0, patient.severity - 5));
    }

    // Use captured decision from handleSend (prevents divergence if state changed between send and close)
    const decision = capturedDecision ?? getSeniorDecision();

    if (decision.action === "go_to_or") {
      // Senior leaves to prep OR
      useProGameStore.getState().setSeniorPresence("left_for_or");

      addPendingEvent({
        id: `ev_or_ready_${Date.now()}`,
        triggerAt: clock.currentTime + 15, // 15 game-min OR prep
        type: "or_ready",
        data: { message: "學長回來了：「OR ready，anesthesia 在等了。搬病人，走。」" },
        fired: false,
        priority: 0,
      });

      addTimelineEntry({
        gameTime: clock.currentTime,
        type: "system_event",
        content: "🏥 學長離開去準備 OR，預估 15 分鐘。繼續 resuscitate。",
        sender: "system",
        isImportant: true,
      });
    } else if (decision.action === "stay_at_bedside") {
      // Senior stays — OR already prepping (B2T recall scenario)
      // seniorPresence stays "present" (already set when senior arrived)
      addTimelineEntry({
        gameTime: clock.currentTime,
        type: "system_event",
        content: "🩺 學長留在 bedside 監控。OR 準備中。",
        sender: "system",
        isImportant: true,
      });
    }
    // "continue_monitoring" → seniorPresence stays "present", no OR scheduling

    // Record playerAction
    useProGameStore.setState((state) => ({
      playerActions: [
        ...state.playerActions,
        { action: `senior_decision:${decision.action}`, gameTime: clock.currentTime, category: "consult" as const },
      ],
    }));

    // Reset for next use
    setMessages([]);
    setInput("");
    setIsDone(false);
    setTurnCount(0);
    setCapturedDecision(null);
    closeModal();
  }

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-[#1a1a2e] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="px-6 pt-5 pb-3 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🩺</span>
            <div>
              <h3 className="text-white font-bold text-lg">學長（現場）</h3>
              <p className="text-gray-400 text-xs">R4 / Fellow — 在你旁邊</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-white transition-colors text-xl"
            aria-label="關閉"
          >
            ✕
          </button>
          {isDone && (
            <span className="text-xs px-2 py-1 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30">
              對話結束
            </span>
          )}
        </div>

        {/* Chat area */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-4 space-y-3 min-h-[200px]">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "player" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                  msg.isAction
                    ? "text-gray-500 italic bg-transparent px-0"
                    : msg.role === "senior"
                      ? "bg-white/5 text-gray-200 rounded-bl-sm"
                      : "bg-teal-700/40 text-white rounded-br-sm"
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="px-4 py-2.5 rounded-2xl bg-white/5 text-gray-400 text-sm animate-pulse">
                學長正在看⋯⋯
              </div>
            </div>
          )}
        </div>

        {/* Input / Close */}
        <div className="px-6 pb-5 pt-3 border-t border-white/5">
          {isDone ? (
            <button
              onClick={handleClose}
              className="w-full px-5 py-3 rounded-xl bg-teal-700 hover:bg-teal-600 active:scale-[0.97] text-white text-sm font-medium transition-all"
            >
              知道了，繼續處理
            </button>
          ) : (
            <form
              onSubmit={(e) => { e.preventDefault(); handleSend(); }}
              className="flex gap-2"
            >
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="跟學長報告⋯⋯"
                disabled={isLoading}
                className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-teal-500/50 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="px-4 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-600 disabled:opacity-30 disabled:cursor-not-allowed text-white text-sm font-medium transition-all"
              >
                送出
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
