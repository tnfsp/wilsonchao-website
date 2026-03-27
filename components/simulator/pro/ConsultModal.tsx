"use client";

import { useState, useMemo } from "react";
import { useProGameStore } from "@/lib/simulator/store";
import type { PendingEvent } from "@/lib/simulator/types";

// ── Consult options ──────────────────────────────────────────

type ConsultType = "senior" | "other";

interface ConsultOption {
  type: ConsultType;
  emoji: string;
  title: string;
  subtitle: string;
  urgencyColor: string;
  arrivalMinutes?: number;
}

const CONSULT_OPTIONS: ConsultOption[] = [
  {
    type: "senior",
    emoji: "📞",
    title: "叫學長",
    subtitle: "通報現況、SBAR 交班、請學長來評估",
    urgencyColor: "amber",
    arrivalMinutes: 5,
  },
  {
    type: "other",
    emoji: "📋",
    title: "其他科 Consult",
    subtitle: "輸入 consult 原因，送出 consult 單",
    urgencyColor: "teal",
  },
];

// ── Component ────────────────────────────────────────────────

export function ConsultModal() {
  const activeModal = useProGameStore((s) => s.activeModal);
  const scenario = useProGameStore((s) => s.scenario);
  const clock = useProGameStore((s) => s.clock);
  const closeModal = useProGameStore((s) => s.closeModal);
  const addTimelineEntry = useProGameStore((s) => s.addTimelineEntry);
  const addPendingEvent = useProGameStore((s) => s.addPendingEvent);
  const openModal = useProGameStore((s) => s.openModal);
  const patient = useProGameStore((s) => s.patient);
  const pendingEvents = useProGameStore((s) => s.pendingEvents);
  const firedEvents = useProGameStore((s) => s.firedEvents);
  const playerActions = useProGameStore((s) => s.playerActions);

  const [selected, setSelected] = useState<ConsultType | null>(null);
  const [consultReason, setConsultReason] = useState("");
  const [consultDept, setConsultDept]   = useState("");
  const [submitted, setSubmitted]       = useState(false);
  const [confirming, setConfirming]     = useState<ConsultType | null>(null);

  // SBAR handoff state (required first time calling senior)
  const [showSbarForm, setShowSbarForm] = useState(false);
  const [sbarText, setSbarText] = useState("");
  const [sbarSubmitting, setSbarSubmitting] = useState(false);
  const [sbarFeedback, setSbarFeedback] = useState<string | null>(null);
  const sbarPhase1 = useProGameStore((s) => s.sbarPhase1);

  // ── Derived: senior status ─────────────────────────────────

  const seniorStatus = useMemo(() => {
    // Check if senior has been called
    const hasCalled = playerActions.some(
      (pa) => pa.action === "call_senior" || pa.action === "recall_senior"
    );
    if (!hasCalled) return "not_called" as const;

    // Check if senior_arrives event has fired
    const seniorArrivesEvent = [...firedEvents, ...pendingEvents].find(
      (ev) => ev.type === "senior_arrives" && (ev.data as Record<string, unknown>)?.type === "senior"
    );

    if (seniorArrivesEvent?.fired) return "arrived" as const;

    // Senior called but not yet arrived — compute remaining time
    const pending = pendingEvents.find(
      (ev) => ev.type === "senior_arrives" && !ev.fired && (ev.data as Record<string, unknown>)?.type === "senior"
    );
    const remainingMin = pending ? Math.max(0, Math.ceil(pending.triggerAt - clock.currentTime)) : 0;
    return { status: "en_route" as const, remainingMin };
  }, [playerActions, pendingEvents, firedEvents, clock.currentTime]);

  if (activeModal !== "consult" || !scenario) return null;

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const safeScenario = scenario!;
  const nurseName = safeScenario.nurseProfile.name ?? "\u8b77\u7406\u5e2b";

  // Multi-phase: Phase 2 = pathology has changed from scenario's initial pathology
  const isMultiPhase = !!scenario.phasedFindings;
  const isPhase2 = isMultiPhase && patient?.pathology !== scenario.pathology;

  const seniorAlreadyCalled = seniorStatus !== "not_called";
  const seniorHasArrived = seniorStatus === "arrived";
  // Recall = senior has arrived AND we're in Phase 2 (pathology changed)
  // In Phase 1 of multi-phase scenarios, senior arriving is normal — not a "recall"
  const isRecallContext = seniorHasArrived && isPhase2;

  // ── Handlers ────────────────────────────────────────────────

  function handleSelectOption(type: ConsultType) {
    if (type === "other") {
      setSelected(type);
      setConfirming(null);
    } else {
      setConfirming(type);
      setSelected(null);
    }
  }

  // Submit handoff report to API for AI evaluation
  async function handleSbarSubmit() {
    setSbarSubmitting(true);
    try {
      // Store report for scoring (wrap in SBAR-compatible shape)
      useProGameStore.setState({ sbarPhase1: { situation: sbarText, background: "", assessment: "", recommendation: "" } });

      // Try to get AI feedback (non-blocking)
      try {
        const resp = await fetch("/api/evaluate-handoff", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sbar: { freeText: sbarText },
            vitals: patient?.vitals,
            pathology: patient?.pathology,
            severity: patient?.severity,
            gameTime: clock.currentTime,
          }),
        });
        if (resp.ok) {
          const data = await resp.json();
          setSbarFeedback(data.feedback ?? null);
        }
      } catch {
        // AI feedback is optional; continue without it
      }

      // Proceed with the call regardless of quality
      proceedWithSeniorCall(false);
    } finally {
      setSbarSubmitting(false);
    }
  }

  function proceedWithSeniorCall(isRecall: boolean) {
    const opt = CONSULT_OPTIONS.find((o) => o.type === "senior")!;
    const arrival = isRecall ? 3 : 5; // Senior always arrives in 5 min (or 3 for recall)

    const callLabel = isRecall ? "緊急叫學長回來" : "叫學長（R4/Fellow）";
    const arrivalLabel = "學長";

    // Timeline: player action
    addTimelineEntry({
      gameTime: clock.currentTime,
      type: "player_action",
      content: isRecall ? "📞 你緊急打電話叫學長回來" : `📞 你打電話給${callLabel}了`,
      sender: "player",
      isImportant: true,
    });

    // Timeline: nurse acknowledge
    addTimelineEntry({
      gameTime: clock.currentTime,
      type: "nurse_message",
      content: `${nurseName}：好的，我也在。`,
      sender: "nurse",
    });

    // Store playerAction for scoring
    const actionId = isRecall ? "recall_senior" : "call_senior";
    useProGameStore.setState((state) => ({
      playerActions: [
        ...state.playerActions,
        { action: actionId, gameTime: clock.currentTime, category: "consult" },
      ],
    }));

    // Schedule senior_arrives event
    const arrivalEvent: PendingEvent = {
      id: `ev_senior_arrives_${Date.now()}`,
      triggerAt: clock.currentTime + arrival,
      type: "senior_arrives",
      data: {
        type: "senior",
        message: `（${arrivalLabel}推門進來）「怎麼了，跟我報告一下。」`,
        label: arrivalLabel,
      },
      fired: false,
      priority: 0,
    };
    addPendingEvent(arrivalEvent);

    // Timeline: waiting message
    addTimelineEntry({
      gameTime: clock.currentTime,
      type: "system_event",
      content: `⏰ ${arrivalLabel}已聯繫，約 ${arrival} 分鐘後到場。繼續處理病人。`,
      sender: "system",
    });

    setSubmitted(true);
  }

  function handleConfirmCall(type: ConsultType) {
    if (type === "other") return;

    // Senior call (the only non-other option now)
    const isRecall = isRecallContext;
    if (!isRecall && !sbarPhase1) {
      // First time calling senior — require SBAR
      setShowSbarForm(true);
      setConfirming(null);
      return;
    }
    // Already has SBAR or is a recall
    proceedWithSeniorCall(isRecall);
  }

  function handleSubmitOtherConsult() {
    if (!consultDept.trim()) return;

    const text = `\ud83d\udccb Consult \u9001\u51fa \u2192 ${consultDept}${consultReason ? `\uff1a${consultReason}` : ""}`;

    addTimelineEntry({
      gameTime: clock.currentTime,
      type: "player_action",
      content: text,
      sender: "player",
    });

    addTimelineEntry({
      gameTime: clock.currentTime,
      type: "nurse_message",
      content: `${nurseName}\uff1a\u597d\uff0c\u6211\u5e6b\u4f60\u6253\u96fb\u8a71\u904e\u53bb\u3002`,
      sender: "nurse",
    });

    useProGameStore.setState((state) => ({
      playerActions: [
        ...state.playerActions,
        { action: `consult:${consultDept}`, gameTime: clock.currentTime, category: "consult" },
      ],
    }));

    setSubmitted(true);
  }

  // ── Render ───────────────────────────────────────────────────

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.78)" }}
    >
      <div
        className="w-full max-w-md rounded-xl border border-amber-800/30 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        style={{ backgroundColor: "#001219" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-amber-900/30">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{"\ud83d\udcde"}</span>
            <div>
              <h2 className="text-white font-semibold text-lg leading-tight">
                叫學長 / Consult
              </h2>
            </div>
          </div>
          <button
            onClick={closeModal}
            className="text-amber-500/50 hover:text-white transition-colors text-xl font-light"
            aria-label="\u95dc\u9589"
          >
            {"\u2715"}
          </button>
        </div>

        {/* Submitted state */}
        {submitted ? (
          <div className="flex-1 flex flex-col items-center justify-center px-6 py-10 text-center gap-4">
            <div className="text-4xl">{"\u2705"}</div>
            <p className="text-white font-medium text-base">{"\u5df2\u8655\u7406\u5b8c\u6210"}</p>
            <p className="text-teal-400/60 text-sm">{"\u5df2\u8a18\u9304\u5230 Timeline"}</p>
            <button
              onClick={closeModal}
              className="mt-4 px-6 py-2.5 rounded-lg bg-teal-700 hover:bg-teal-600 text-white text-sm font-medium transition-colors"
            >
              {"\u95dc\u9589"}
            </button>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-3">

            {/* ── Senior status banner ── */}
            {seniorAlreadyCalled && !seniorHasArrived && typeof seniorStatus === "object" && (
              <div className="rounded-lg border border-amber-700/40 px-4 py-3 mb-1" style={{ backgroundColor: "#1a1000" }}>
                <div className="flex items-center gap-2">
                  <span className="text-base animate-pulse">{"\ud83d\udeb6"}</span>
                  <p className="text-amber-300 text-sm font-medium">
                    {"\u5b78\u9577\u5df2\u806f\u7e6b\uff0c"}
                    {seniorStatus.remainingMin > 0
                      ? `\u7d04 ${seniorStatus.remainingMin} \u5206\u9418\u5f8c\u5230\u5834`
                      : "\u5373\u5c07\u5230\u5834"}
                  </p>
                </div>
              </div>
            )}
            {seniorHasArrived && (
              <div className="rounded-lg border border-green-700/40 px-4 py-3 mb-1" style={{ backgroundColor: "#001a10" }}>
                <div className="flex items-center gap-2">
                  <span className="text-base">{"\u2705"}</span>
                  <p className="text-green-300 text-sm font-medium">{"\u5b78\u9577\u5df2\u5230\u5834"}</p>
                </div>
              </div>
            )}

            {/* ── SBAR Form (shown when first calling senior) ── */}
            {showSbarForm && (
              <div className="rounded-lg border border-amber-700/40 p-4" style={{ backgroundColor: "#1a1000" }}>
                <h3 className="text-amber-200 font-semibold text-sm mb-2">
                  📞 學長接起電話了
                </h3>
                <p className="text-amber-400/60 text-xs mb-3">
                  「怎麼了，報告一下。」— 用你自己的話交班，像打電話一樣講就好。
                </p>
                <textarea
                  value={sbarText}
                  onChange={(e) => setSbarText(e.target.value)}
                  placeholder="學長好，我是值班 R1，床 3 的林伯伯..."
                  rows={5}
                  className="w-full rounded-lg px-3 py-2.5 text-sm text-white border border-amber-800/40 focus:border-amber-600 focus:outline-none transition-colors resize-none leading-relaxed placeholder:text-amber-900/60"
                  style={{ backgroundColor: "#002030" }}
                  autoFocus
                />

                {sbarFeedback && (
                  <div className="rounded-lg border border-teal-700/40 px-3 py-2.5 mt-3" style={{ backgroundColor: "#001a20" }}>
                    <p className="text-teal-300 text-xs font-medium mb-1">學長回饋：</p>
                    <p className="text-teal-400/80 text-xs leading-relaxed">{sbarFeedback}</p>
                  </div>
                )}

                <div className="flex gap-2 mt-3">
                  <button
                    onClick={handleSbarSubmit}
                    disabled={sbarSubmitting || sbarText.trim().length < 20}
                    className="flex-1 py-2.5 rounded-lg bg-amber-700 hover:bg-amber-600 disabled:bg-amber-900/40 disabled:text-amber-600 text-white text-sm font-medium transition-colors border border-amber-600 disabled:border-amber-800/30"
                  >
                    {sbarSubmitting ? "報告中..." : "📞 報告完畢"}
                  </button>
                  <button
                    onClick={() => { setShowSbarForm(false); setConfirming(null); }}
                    className="px-4 py-2.5 rounded-lg text-amber-400 text-sm border border-amber-800/40 hover:border-amber-700/60 transition-colors"
                  >
                    取消
                  </button>
                </div>
              </div>
            )}

            {/* Confirm card for senior/VS */}
            {confirming && (
              <div
                className="rounded-lg border border-amber-700/40 p-4 mb-1"
                style={{ backgroundColor: "#1a1000" }}
              >
                <p className="text-amber-200 font-medium text-sm mb-1">
                  {isRecallContext ? "確定要再叫學長回來嗎？" : "確定要叫學長嗎？"}
                </p>
                <p className="text-amber-400/70 text-xs leading-relaxed mb-3">
                  {isRecallContext
                    ? "情況有變化，需要學長回來重新評估。約 3 分鐘後到場。"
                    : "學長約 5 分鐘後到場。遊戲繼續，你可以繼續處理病人。"}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleConfirmCall(confirming)}
                    className="flex-1 py-2 rounded-lg text-white text-sm font-medium transition-colors bg-amber-700 hover:bg-amber-600 border border-amber-600"
                  >
                    確定打電話
                  </button>
                  <button
                    onClick={() => setConfirming(null)}
                    className="flex-1 py-2 rounded-lg text-teal-400 text-sm border border-teal-800/40 hover:border-teal-700/60 transition-colors"
                  >
                    取消
                  </button>
                </div>
              </div>
            )}

            {/* Option buttons */}
            {CONSULT_OPTIONS.map((opt) => {
              if (confirming === opt.type) return null;

              // If senior already called and not yet arrived, disable senior button
              // Disable senior button only if already called AND not yet arrived AND not Phase 2
              // Phase 2: always allow recall (even if senior already arrived — situation changed)
              // Senior arrived: allow calling again (new situation may need re-escalation)
              const isSeniorDisabled = opt.type === "senior" && seniorAlreadyCalled && !seniorHasArrived && !isRecallContext;

              const colorMap: Record<string, string> = {
                amber: "border-amber-800/30 hover:border-amber-600/50 hover:bg-amber-950/20",
                teal:  "border-teal-800/30 hover:border-teal-600/50 hover:bg-teal-950/20",
              };
              const textMap: Record<string, string> = {
                amber: "text-amber-300",
                teal:  "text-teal-300",
              };

              // Phase 2: override senior option labels
              const title = (isRecallContext && opt.type === "senior")
                ? "再叫學長回來"
                : opt.title;
              const subtitle = (isRecallContext && opt.type === "senior")
                ? "情況有變化，叫學長回來重新評估"
                : isSeniorDisabled
                  ? "已聯繫學長，等待到場中"
                  : opt.subtitle;

              return (
                <div key={opt.type}>
                  {opt.type !== "other" ? (
                    <button
                      onClick={() => !isSeniorDisabled && handleSelectOption(opt.type)}
                      disabled={isSeniorDisabled}
                      className={`w-full text-left rounded-lg px-4 py-3.5 border transition-all ${
                        isSeniorDisabled
                          ? "border-slate-700/30 opacity-50 cursor-not-allowed"
                          : colorMap[opt.urgencyColor]
                      }`}
                      style={{ backgroundColor: "transparent" }}
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-xl mt-0.5">{opt.emoji}</span>
                        <div>
                          <div className={`text-sm font-semibold ${isSeniorDisabled ? "text-slate-500" : textMap[opt.urgencyColor]}`}>
                            {title}
                          </div>
                          <div className="text-xs text-teal-500/50 mt-0.5">
                            {subtitle}
                          </div>
                          {opt.arrivalMinutes && !isSeniorDisabled && (
                            <div className="text-xs text-teal-500/40 mt-0.5">
                              {"\u23f1"} 預計 {(isRecallContext && opt.type === "senior") ? 3 : opt.arrivalMinutes} 分鐘後到場
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                  ) : (
                    /* Other consult — inline form */
                    <div>
                      <button
                        onClick={() => handleSelectOption("other")}
                        className={`w-full text-left rounded-lg px-4 py-3.5 border transition-all ${
                          selected === "other"
                            ? "border-teal-600 bg-teal-900/20"
                            : colorMap[opt.urgencyColor]
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <span className="text-xl mt-0.5">{opt.emoji}</span>
                          <div>
                            <div className={`text-sm font-semibold ${textMap[opt.urgencyColor]}`}>
                              {opt.title}
                            </div>
                            <div className="text-xs text-teal-500/50 mt-0.5">
                              {opt.subtitle}
                            </div>
                          </div>
                        </div>
                      </button>

                      {selected === "other" && (
                        <div
                          className="mt-2 rounded-lg border border-teal-800/30 p-4 flex flex-col gap-3"
                          style={{ backgroundColor: "#001a27" }}
                        >
                          <div>
                            <label className="text-xs text-teal-500/60 uppercase tracking-widest block mb-1.5">
                              {"\u79d1\u5225"}
                            </label>
                            <input
                              type="text"
                              value={consultDept}
                              onChange={(e) => setConsultDept(e.target.value)}
                              placeholder="e.g. 血液科、腎臟科..."
                              className="w-full rounded-lg px-3 py-2 text-sm text-white border border-teal-800/40 focus:border-teal-600 focus:outline-none transition-colors"
                              style={{ backgroundColor: "#002030" }}
                            />
                          </div>
                          <div>
                            <label className="text-xs text-teal-500/60 uppercase tracking-widest block mb-1.5">
                              Consult {"\u539f\u56e0\uff08\u9078\u586b\uff09"}
                            </label>
                            <textarea
                              value={consultReason}
                              onChange={(e) => setConsultReason(e.target.value)}
                              placeholder={"\u8acb\u8aaa\u660e consult \u539f\u56e0\u3001\u76ee\u524d\u72c0\u6cc1\u53ca\u9700\u8981\u5354\u52a9\u7684\u554f\u984c..."}
                              rows={3}
                              className="w-full rounded-lg px-3 py-2 text-sm text-white border border-teal-800/40 focus:border-teal-600 focus:outline-none transition-colors resize-none leading-relaxed"
                              style={{ backgroundColor: "#002030" }}
                            />
                          </div>
                          <button
                            onClick={handleSubmitOtherConsult}
                            disabled={!consultDept.trim()}
                            className="w-full py-2.5 rounded-lg bg-teal-700 hover:bg-teal-600 disabled:bg-teal-900/40 disabled:text-teal-600 text-white text-sm font-medium transition-colors border border-teal-600 disabled:border-teal-800/30"
                          >
                            {"\ud83d\udccb"} {"\u9001\u51fa Consult \u55ae"}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
