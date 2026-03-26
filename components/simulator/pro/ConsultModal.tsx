"use client";

import { useState, useMemo } from "react";
import { useProGameStore } from "@/lib/simulator/store";
import type { PendingEvent } from "@/lib/simulator/types";

// ── Consult options ──────────────────────────────────────────

type ConsultType = "senior" | "vs" | "other";

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
    emoji: "\ud83d\udcde",
    title: "\u53eb\u5b78\u9577\uff08R4 / Fellow\uff09",
    subtitle: "\u5e8a\u908a\u5354\u52a9\u8a55\u4f30\u8207\u6c7a\u7b56",
    urgencyColor: "amber",
    arrivalMinutes: 5,
  },
  {
    type: "vs",
    emoji: "\ud83d\udcde",
    title: "\u901a\u77e5\u4e3b\u6cbb\u91ab\u5e2b\uff08VS\uff09",
    subtitle: "\u9ad8\u5c64\u7d1a escalation \u2014 \u66f4\u5927\u6c7a\u7b56\u9700\u6c42",
    urgencyColor: "red",
    arrivalMinutes: 10,
  },
  {
    type: "other",
    emoji: "\ud83d\udccb",
    title: "\u5176\u4ed6\u79d1 Consult",
    subtitle: "\u8f38\u5165 consult \u539f\u56e0\uff0c\u9001\u51fa consult \u55ae",
    urgencyColor: "teal",
  },
];

// ── Component ────────────────────────────────────────────────

export function ConsultModal() {
  const activeModal = useProGameStore((s) => s.activeModal);
  const { scenario, clock, closeModal, addTimelineEntry, addPendingEvent, openModal } =
    useProGameStore();
  const patient = useProGameStore((s) => s.patient);
  const pendingEvents = useProGameStore((s) => s.pendingEvents);
  const firedEvents = useProGameStore((s) => s.firedEvents);
  const playerActions = useProGameStore((s) => s.playerActions);

  const [selected, setSelected] = useState<ConsultType | null>(null);
  const [consultReason, setConsultReason] = useState("");
  const [consultDept, setConsultDept]   = useState("");
  const [submitted, setSubmitted]       = useState(false);
  const [confirming, setConfirming]     = useState<ConsultType | null>(null);

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

  function handleConfirmCall(type: ConsultType) {
    if (type === "other") return;
    const opt = CONSULT_OPTIONS.find((o) => o.type === type)!;

    // Phase 2 recall: senior just left, comes back faster (3 min)
    const isRecall = isPhase2 && type === "senior";
    const arrival = isRecall ? 3 : (opt.arrivalMinutes ?? 5);
    const callLabel = isRecall
      ? "\u7dca\u6025\u53eb\u5b78\u9577\u56de\u4f86"
      : type === "senior" ? "\u53eb\u5b78\u9577\uff08R4/Fellow\uff09" : "\u901a\u77e5\u4e3b\u6cbb\u91ab\u5e2b\uff08VS\uff09";
    const arrivalLabel =
      type === "senior" ? "\u5b78\u9577" : "\u4e3b\u6cbb\u91ab\u5e2b\uff08VS\uff09";

    // Timeline: player action
    addTimelineEntry({
      gameTime: clock.currentTime,
      type: "player_action",
      content: isRecall
        ? "\ud83d\udcde \u4f60\u7dca\u6025\u6253\u96fb\u8a71\u53eb\u5b78\u9577\u56de\u4f86"
        : `\ud83d\udcde \u4f60\u6253\u96fb\u8a71\u7d66${callLabel}\u4e86`,
      sender: "player",
      isImportant: true,
    });

    // Timeline: nurse acknowledge
    addTimelineEntry({
      gameTime: clock.currentTime,
      type: "nurse_message",
      content: `${nurseName}\uff1a\u597d\u7684\uff0c\u6211\u4e5f\u5728\u3002`,
      sender: "nurse",
    });

    // Store playerAction for scoring
    const actionId = isRecall
      ? "recall_senior"
      : type === "senior" ? "call_senior" : "call_vs";
    useProGameStore.setState((state) => ({
      playerActions: [
        ...state.playerActions,
        { action: actionId, gameTime: clock.currentTime, category: "consult" },
      ],
    }));

    // Schedule senior_arrives event (fires when game time reaches triggerAt)
    const arrivalEvent: PendingEvent = {
      id: `ev_${type}_arrives_${Date.now()}`,
      triggerAt: clock.currentTime + arrival,
      type: "senior_arrives",
      data: {
        type,
        message: `\uff08${arrivalLabel}\u63a8\u9580\u9032\u4f86\uff09\u300c\u600e\u9ebc\u4e86\uff0c\u8ddf\u6211\u5831\u544a\u4e00\u4e0b\u3002\u300d`,
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
      content: `\u23f0 ${arrivalLabel}\u5df2\u806f\u7e6b\uff0c\u7d04 ${arrival} \u5206\u9418\u5f8c\u5230\u5834\u3002\u7e7c\u7e8c\u8655\u7406\u75c5\u4eba\u3002`,
      sender: "system",
    });

    // Close modal — game continues, no time advance
    setSubmitted(true);
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
                {"\u901a\u5831 / \u53eb\u4eba / \u4ea4\u73ed"}
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

            {/* ── SBAR handoff button — always available ── */}
            <button
              onClick={() => { closeModal(); openModal("sbar"); }}
              className="w-full text-left rounded-lg px-4 py-3.5 border transition-all border-teal-800/30 hover:border-teal-600/50 hover:bg-teal-950/20"
              style={{ backgroundColor: "transparent" }}
            >
              <div className="flex items-start gap-3">
                <span className="text-xl mt-0.5">{"\ud83d\udccb"}</span>
                <div>
                  <div className="text-sm font-semibold text-teal-300">
                    SBAR {"\u4ea4\u73ed\u5831\u544a"}
                  </div>
                  <div className="text-xs text-teal-500/50 mt-0.5">
                    {"\u5411\u5b78\u9577\u5831\u544a\u73fe\u6cc1\uff0c\u63d0\u4ea4\u6700\u7d42\u4ea4\u73ed\uff08\u904a\u6232\u7d50\u675f\uff09"}
                  </div>
                </div>
              </div>
            </button>

            {/* Confirm card for senior/VS */}
            {confirming && (
              <div
                className="rounded-lg border border-amber-700/40 p-4 mb-1"
                style={{ backgroundColor: "#1a1000" }}
              >
                {confirming === "senior" ? (
                  <>
                    <p className="text-amber-200 font-medium text-sm mb-1">
                      {isPhase2 ? "\u78ba\u5b9a\u8981\u7dca\u6025\u53eb\u5b78\u9577\u56de\u4f86\u55ce\uff1f" : "\u78ba\u5b9a\u8981\u53eb\u5b78\u9577\u55ce\uff1f"}
                    </p>
                    <p className="text-amber-400/70 text-xs leading-relaxed mb-3">
                      {isPhase2
                        ? "\u60c5\u6cc1\u5df2\u7d93\u6539\u8b8a\uff0c\u5b78\u9577\u9700\u8981\u56de\u4f86\u91cd\u65b0\u8a55\u4f30\u3002\u7d04 3 \u5206\u9418\u5f8c\u5230\u5834\u3002"
                        : "\u5b78\u9577\u7d04 5 \u5206\u9418\u5f8c\u5230\u5834\u3002\u904a\u6232\u7e7c\u7e8c\uff0c\u4f60\u53ef\u4ee5\u7e7c\u7e8c\u8655\u7406\u75c5\u4eba\u3002"}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-red-300 font-medium text-sm mb-1">
                      {"\u78ba\u5b9a\u901a\u77e5\u4e3b\u6cbb\u91ab\u5e2b\uff08VS\uff09\uff1f"}
                    </p>
                    <p className="text-red-400/70 text-xs leading-relaxed mb-3">
                      {"\u9019\u662f\u6700\u9ad8\u5c64\u7d1a\u7684 escalation\u3002VS \u7d04 10 \u5206\u9418\u5f8c\u62b5\u9054\u6216\u96fb\u8a71\u6307\u793a\u3002\u8acb\u78ba\u8a8d\u4f60\u5df2\u5145\u5206\u8a55\u4f30\u60c5\u6cc1\uff0c\u4e14\u60c5\u6cc1\u9700\u8981 VS \u6c7a\u7b56\u3002"}
                    </p>
                  </>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleConfirmCall(confirming)}
                    className={`flex-1 py-2 rounded-lg text-white text-sm font-medium transition-colors ${
                      confirming === "vs"
                        ? "bg-red-700 hover:bg-red-600 border border-red-600"
                        : "bg-amber-700 hover:bg-amber-600 border border-amber-600"
                    }`}
                  >
                    {"\u78ba\u5b9a\u6253\u96fb\u8a71"}
                  </button>
                  <button
                    onClick={() => setConfirming(null)}
                    className="flex-1 py-2 rounded-lg text-teal-400 text-sm border border-teal-800/40 hover:border-teal-700/60 transition-colors"
                  >
                    {"\u53d6\u6d88"}
                  </button>
                </div>
              </div>
            )}

            {/* Option buttons */}
            {CONSULT_OPTIONS.map((opt) => {
              if (confirming === opt.type) return null;

              // If senior already called and not yet arrived, disable senior button
              const isSeniorDisabled = opt.type === "senior" && seniorAlreadyCalled && !isPhase2;

              const colorMap: Record<string, string> = {
                amber: "border-amber-800/30 hover:border-amber-600/50 hover:bg-amber-950/20",
                red:   "border-red-800/30 hover:border-red-600/50 hover:bg-red-950/20",
                teal:  "border-teal-800/30 hover:border-teal-600/50 hover:bg-teal-950/20",
              };
              const textMap: Record<string, string> = {
                amber: "text-amber-300",
                red:   "text-red-300",
                teal:  "text-teal-300",
              };

              // Phase 2: override senior option labels
              const title = (isPhase2 && opt.type === "senior")
                ? "\u7dca\u6025\u53eb\u5b78\u9577\u56de\u4f86"
                : opt.title;
              const subtitle = (isPhase2 && opt.type === "senior")
                ? "\u5b78\u9577\u525b\u96e2\u958b\uff0c\u60c5\u6cc1\u6709\u8b8a \u2014 \u53eb\u4ed6\u56de\u4f86\uff01"
                : isSeniorDisabled
                  ? "\u5df2\u806f\u7e6b\u5b78\u9577\uff0c\u7b49\u5f85\u5230\u5834\u4e2d"
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
                              {"\u23f1"} {"\u9810\u8a08"} {(isPhase2 && opt.type === "senior") ? 3 : opt.arrivalMinutes} {"\u5206\u9418\u5f8c\u5230\u5834"}
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
                              placeholder="e.g. \u8840\u6db2\u79d1\u3001\u814e\u81df\u79d1..."
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
