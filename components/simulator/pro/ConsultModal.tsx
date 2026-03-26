"use client";

import { useState } from "react";
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
    emoji: "📞",
    title: "叫學長（R4 / Fellow）",
    subtitle: "床邊協助評估與決策",
    urgencyColor: "amber",
    arrivalMinutes: 5,
  },
  {
    type: "vs",
    emoji: "📞",
    title: "通知主治醫師（VS）",
    subtitle: "高層級 escalation — 更大決策需求",
    urgencyColor: "red",
    arrivalMinutes: 10,
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
  const { scenario, clock, closeModal, addTimelineEntry, advanceTime, addPendingEvent, openModal } =
    useProGameStore();
  const patient = useProGameStore((s) => s.patient);

  const [selected, setSelected] = useState<ConsultType | null>(null);
  const [consultReason, setConsultReason] = useState("");
  const [consultDept, setConsultDept]   = useState("");
  const [submitted, setSubmitted]       = useState(false);
  const [confirming, setConfirming]     = useState<ConsultType | null>(null);

  if (activeModal !== "consult" || !scenario) return null;

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const safeScenario = scenario!;
  const nurseName = safeScenario.nurseProfile.name ?? "護理師";

  // Multi-phase: Phase 2 = pathology has changed from scenario's initial pathology
  const isMultiPhase = !!scenario.phasedFindings;
  const isPhase2 = isMultiPhase && patient?.pathology !== scenario.pathology;

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
      ? "緊急叫學長回來"
      : type === "senior" ? "叫學長（R4/Fellow）" : "通知主治醫師（VS）";
    const arrivalLabel =
      type === "senior" ? "學長" : "主治醫師（VS）";

    // Timeline: player action
    addTimelineEntry({
      gameTime: clock.currentTime,
      type: "player_action",
      content: isRecall
        ? "📞 你緊急打電話叫學長回來"
        : `📞 你打電話給${callLabel}了`,
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
    // Phase 2 recall uses "recall_senior" to match act-recall-senior scoring pattern
    const actionId = isRecall
      ? "recall_senior"
      : type === "senior" ? "call_senior" : "call_vs";
    useProGameStore.setState((state) => ({
      playerActions: [
        ...state.playerActions,
        { action: actionId, gameTime: clock.currentTime, category: "consult" },
      ],
    }));

    // Schedule senior_arrives event
    const arrivalEvent: PendingEvent = {
      id: `ev_${type}_arrives_${Date.now()}`,
      triggerAt: clock.currentTime + arrival,
      type: "senior_arrives",
      data: {
        type,
        message: `（${arrivalLabel}推門進來）「怎麼了，跟我報告一下。」`,
        label: arrivalLabel,
      },
      fired: false,
      priority: 0,
    };
    addPendingEvent(arrivalEvent);

    // Advance time to show waiting
    addTimelineEntry({
      gameTime: clock.currentTime,
      type: "system_event",
      content: `⏰ 等待 ${arrivalLabel}到場中（約 ${arrival} 分鐘）...`,
      sender: "system",
    });

    // Actually advance time
    advanceTime(arrival);

    // Arrival message
    addTimelineEntry({
      gameTime: clock.currentTime + arrival,
      type: "system_event",
      content: `🚶 ${arrivalLabel}抵達 ${safeScenario.patient.bed}`,
      sender: "system",
      isImportant: true,
    });

    setSubmitted(true);
  }

  function handleSubmitOtherConsult() {
    if (!consultDept.trim()) return;

    const text = `📋 Consult 送出 → ${consultDept}${consultReason ? `：${consultReason}` : ""}`;

    addTimelineEntry({
      gameTime: clock.currentTime,
      type: "player_action",
      content: text,
      sender: "player",
    });

    addTimelineEntry({
      gameTime: clock.currentTime,
      type: "nurse_message",
      content: `${nurseName}：好，我幫你打電話過去。`,
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
            <span className="text-2xl">📞</span>
            <div>
              <h2 className="text-white font-semibold text-lg leading-tight">
                {isPhase2 ? "通報 / 交班" : "叫人 / Consult"}
              </h2>
            </div>
          </div>
          <button
            onClick={closeModal}
            className="text-amber-500/50 hover:text-white transition-colors text-xl font-light"
            aria-label="關閉"
          >
            ✕
          </button>
        </div>

        {/* Submitted state */}
        {submitted ? (
          <div className="flex-1 flex flex-col items-center justify-center px-6 py-10 text-center gap-4">
            <div className="text-4xl">✅</div>
            <p className="text-white font-medium text-base">已處理完成</p>
            <p className="text-teal-400/60 text-sm">已記錄到 Timeline</p>
            <button
              onClick={closeModal}
              className="mt-4 px-6 py-2.5 rounded-lg bg-teal-700 hover:bg-teal-600 text-white text-sm font-medium transition-colors"
            >
              關閉
            </button>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-3">
            {/* Confirm card for senior/VS */}
            {confirming && (
              <div
                className="rounded-lg border border-amber-700/40 p-4 mb-1"
                style={{ backgroundColor: "#1a1000" }}
              >
                {confirming === "senior" ? (
                  <>
                    <p className="text-amber-200 font-medium text-sm mb-1">
                      {isPhase2 ? "確定要緊急叫學長回來嗎？" : "確定要叫學長嗎？"}
                    </p>
                    <p className="text-amber-400/70 text-xs leading-relaxed mb-3">
                      {isPhase2
                        ? "情況已經改變，學長需要回來重新評估。約 3 分鐘後到場。"
                        : "學長約 5 分鐘後到場。到場後需要對學長做 SBAR 報告。"}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-red-300 font-medium text-sm mb-1">
                      確定通知主治醫師（VS）？
                    </p>
                    <p className="text-red-400/70 text-xs leading-relaxed mb-3">
                      這是最高層級的 escalation。VS 約 10 分鐘後抵達或電話指示。
                      請確認你已充分評估情況，且情況需要 VS 決策。
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

            {/* Phase 2: SBAR handoff button */}
            {isPhase2 && (
              <button
                onClick={() => { closeModal(); openModal("sbar"); }}
                className="w-full text-left rounded-lg px-4 py-3.5 border transition-all border-teal-800/30 hover:border-teal-600/50 hover:bg-teal-950/20"
                style={{ backgroundColor: "transparent" }}
              >
                <div className="flex items-start gap-3">
                  <span className="text-xl mt-0.5">📋</span>
                  <div>
                    <div className="text-sm font-semibold text-teal-300">
                      SBAR 交班報告
                    </div>
                    <div className="text-xs text-teal-500/50 mt-0.5">
                      向學長報告現況，提交最終交班
                    </div>
                  </div>
                </div>
              </button>
            )}

            {/* Option buttons */}
            {CONSULT_OPTIONS.map((opt) => {
              if (confirming === opt.type) return null;
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
                ? "緊急叫學長回來"
                : opt.title;
              const subtitle = (isPhase2 && opt.type === "senior")
                ? "學長剛離開，情況有變 — 叫他回來！"
                : opt.subtitle;

              return (
                <div key={opt.type}>
                  {opt.type !== "other" ? (
                    <button
                      onClick={() => handleSelectOption(opt.type)}
                      className={`w-full text-left rounded-lg px-4 py-3.5 border transition-all ${colorMap[opt.urgencyColor]}`}
                      style={{ backgroundColor: "transparent" }}
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-xl mt-0.5">{opt.emoji}</span>
                        <div>
                          <div className={`text-sm font-semibold ${textMap[opt.urgencyColor]}`}>
                            {title}
                          </div>
                          <div className="text-xs text-teal-500/50 mt-0.5">
                            {subtitle}
                          </div>
                          {opt.arrivalMinutes && (
                            <div className="text-xs text-teal-500/40 mt-0.5">
                              ⏱ 預計 {(isPhase2 && opt.type === "senior") ? 3 : opt.arrivalMinutes} 分鐘後到場
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
                              科別
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
                              Consult 原因（選填）
                            </label>
                            <textarea
                              value={consultReason}
                              onChange={(e) => setConsultReason(e.target.value)}
                              placeholder="請說明 consult 原因、目前狀況及需要協助的問題..."
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
                            📋 送出 Consult 單
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {/* TODO: Move consult timing education to Debrief */}
          </div>
        )}
      </div>
    </div>
  );
}
