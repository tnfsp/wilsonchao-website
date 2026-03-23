"use client";

import { useState } from "react";
import { useProGameStore } from "@/lib/simulator/store";
import type { PendingEvent } from "@/lib/simulator/types";

// ── Imaging options ──────────────────────────────────────────

type ImagingType = "cxr_portable" | "bedside_echo";

interface ImagingOption {
  key: ImagingType;
  emoji: string;
  title: string;
  subtitle: string;
  turnaround: "immediate" | number; // "immediate" or minutes
  turnaroundLabel: string;
  note?: string;
}

const IMAGING_OPTIONS: ImagingOption[] = [
  {
    key: "cxr_portable",
    emoji: "📷",
    title: "Portable CXR",
    subtitle: "床邊胸部 X 光",
    turnaround: 15,
    turnaroundLabel: "結果約 15 分鐘後回來",
    note: "排 X 光技師 → 照相 → 上傳 PACS — 需要等",
  },
  {
    key: "bedside_echo",
    emoji: "🫀",
    title: "Bedside Echo",
    subtitle: "床邊心臟超音波（完整）",
    turnaround: "immediate",
    turnaroundLabel: "即時結果",
    note: "比 POCUS 更完整的正式超音波，即時取像",
  },
];

// ── CXR result map (scenario key → scenario availableImaging key) ──────────

const IMAGING_KEY_MAP: Record<ImagingType, string> = {
  cxr_portable: "cxr_portable",
  bedside_echo: "bedside_echo",   // may not be in every scenario
};

// ── Component ────────────────────────────────────────────────

export function ImagingModal() {
  const activeModal = useProGameStore((s) => s.activeModal);
  const { scenario, clock, closeModal, addTimelineEntry, addPendingEvent, advanceTime } =
    useProGameStore();

  const [selected, setSelected]   = useState<ImagingType | null>(null);
  const [ordered, setOrdered]     = useState<Set<ImagingType>>(new Set());
  const [showResult, setShowResult] = useState<ImagingType | null>(null);
  const [pendingCXR, setPendingCXR] = useState(false);
  const [cxrReady, setCxrReady]   = useState(false);

  if (activeModal !== "imaging" || !scenario) return null;

  const availableImaging = scenario.availableImaging as Record<string, string>;
  const nurseName = scenario.nurseProfile.name ?? "護理師";

  // ── Order handler ────────────────────────────────────────────

  function handleOrder(opt: ImagingOption) {
    if (ordered.has(opt.key)) return;

    if (opt.turnaround === "immediate") {
      // Show result right away
      addTimelineEntry({
        gameTime: clock.currentTime,
        type: "player_action",
        content: `🫀 開了 ${opt.title}`,
        sender: "player",
      });
      addTimelineEntry({
        gameTime: clock.currentTime,
        type: "nurse_message",
        content: `${nurseName}：好，馬上叫超音波過來。`,
        sender: "nurse",
      });

      useProGameStore.setState((state) => ({
        playerActions: [...state.playerActions, `imaging:${opt.key}`],
      }));

      setOrdered((prev) => new Set(prev).add(opt.key));
      setSelected(opt.key);
      setTimeout(() => setShowResult(opt.key), 400);
    } else {
      // CXR — deferred result
      const turnaroundMinutes = opt.turnaround as number;

      addTimelineEntry({
        gameTime: clock.currentTime,
        type: "player_action",
        content: `📷 開了 ${opt.title}（結果約 ${turnaroundMinutes} 分鐘後回來）`,
        sender: "player",
      });
      addTimelineEntry({
        gameTime: clock.currentTime,
        type: "nurse_message",
        content: `${nurseName}：好，我打電話給 X 光室。`,
        sender: "nurse",
      });

      useProGameStore.setState((state) => ({
        playerActions: [...state.playerActions, `imaging:${opt.key}`],
      }));

      // Schedule result event
      const resultEvent: PendingEvent = {
        id: `ev_${opt.key}_result_${Date.now()}`,
        triggerAt: clock.currentTime + turnaroundMinutes,
        type: "lab_result",
        data: {
          imagingKey: opt.key,
          imagingType: "cxr",
          label: opt.title,
        },
        fired: false,
        priority: 1,
      };
      addPendingEvent(resultEvent);

      // Timeline: system note about pending
      addTimelineEntry({
        gameTime: clock.currentTime,
        type: "system_event",
        content: `⏳ ${opt.title} 已排程 — 結果將在 ${turnaroundMinutes} 分鐘內回來`,
        sender: "system",
      });

      setOrdered((prev) => new Set(prev).add(opt.key));
      setPendingCXR(true);
      setSelected(opt.key);

      // For demo: simulate time advance and then show result
      // In real engine, this would fire via pendingEvent handler
      setTimeout(() => {
        addTimelineEntry({
          gameTime: clock.currentTime + turnaroundMinutes,
          type: "lab_result",
          content: `📷 ${opt.title} 結果已上傳 PACS`,
          sender: "system",
          isImportant: true,
        });
        setCxrReady(true);
        setPendingCXR(false);
      }, 1500); // short delay for UX; real advance triggered separately
    }
  }

  function handleViewCXR() {
    setShowResult("cxr_portable");
  }

  // ── Render helpers ───────────────────────────────────────────

  function renderResult(key: ImagingType) {
    const scenarioKey = IMAGING_KEY_MAP[key];
    const text = availableImaging[scenarioKey];

    if (!text) {
      return (
        <div
          className="rounded-lg border border-teal-900/30 p-4 text-center"
          style={{ backgroundColor: "#001a27" }}
        >
          <p className="text-teal-500/40 text-sm italic">
            此項影像在本情境中不可用
          </p>
        </div>
      );
    }

    const opt = IMAGING_OPTIONS.find((o) => o.key === key)!;

    return (
      <div
        className="rounded-lg border border-teal-800/30 overflow-hidden"
        style={{ backgroundColor: "#001e2e" }}
      >
        {/* Header */}
        <div className="px-4 py-2.5 border-b border-teal-900/30 flex items-center gap-2">
          <span className="text-lg">{opt.emoji}</span>
          <span className="text-teal-200 font-medium text-sm">{opt.title}</span>
          <span className="ml-auto text-xs text-teal-500/50 uppercase tracking-widest">
            {opt.turnaround === "immediate" ? "即時" : "Portable"}
          </span>
        </div>

        {/* Result text */}
        <div className="px-4 py-4">
          <p className="text-xs text-teal-500/60 uppercase tracking-widest mb-2">
            Report
          </p>
          <div
            className="text-teal-100 text-sm leading-relaxed whitespace-pre-line"
            dangerouslySetInnerHTML={{
              __html: text
                .trim()
                .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                .replace(/- /g, "• "),
            }}
          />
        </div>

        {/* Clinical relevance note */}
        {key === "cxr_portable" && (
          <div className="mx-4 mb-4 px-3 py-2 rounded bg-teal-900/20 border border-teal-700/25">
            <p className="text-teal-300/70 text-xs leading-relaxed">
              💡 在術後出血情境下，CXR 主要用來排除 hemothorax、評估縱膈腔寬度（tamponade 早期徵象）、確認管路位置。
            </p>
          </div>
        )}
        {key === "bedside_echo" && (
          <div className="mx-4 mb-4 px-3 py-2 rounded bg-teal-900/20 border border-teal-700/25">
            <p className="text-teal-300/70 text-xs leading-relaxed">
              💡 Bedside Echo 比 POCUS 更完整。可以精確評估 pericardial effusion、LV/RV function，是排除 tamponade 的最佳工具。
            </p>
          </div>
        )}
      </div>
    );
  }

  // ── Main render ──────────────────────────────────────────────

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.78)" }}
    >
      <div
        className="w-full max-w-lg rounded-xl border border-teal-800/40 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        style={{ backgroundColor: "#001219" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-teal-900/40">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🩻</span>
            <div>
              <h2 className="text-white font-semibold text-lg leading-tight">
                影像檢查
              </h2>
              <p className="text-teal-400/60 text-xs">
                Portable CXR / Bedside Echo
              </p>
            </div>
          </div>
          <button
            onClick={closeModal}
            className="text-teal-500/50 hover:text-white transition-colors text-xl font-light"
            aria-label="關閉"
          >
            ✕
          </button>
        </div>

        {/* Options + results */}
        <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4">
          {IMAGING_OPTIONS.map((opt) => {
            const isOrdered = ordered.has(opt.key);
            const isSelected = selected === opt.key;
            const showingResult = showResult === opt.key;
            const isCXRPending = opt.key === "cxr_portable" && pendingCXR;

            return (
              <div key={opt.key}>
                {/* Option card */}
                {!isOrdered ? (
                  <button
                    onClick={() => handleOrder(opt)}
                    className="w-full text-left rounded-lg px-4 py-3.5 border border-teal-800/30 hover:border-teal-600/50 hover:bg-teal-950/20 transition-all"
                    style={{ backgroundColor: "transparent" }}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-xl mt-0.5">{opt.emoji}</span>
                      <div className="flex-1">
                        <div className="text-teal-200 text-sm font-semibold">
                          {opt.title}
                        </div>
                        <div className="text-teal-500/60 text-xs mt-0.5">
                          {opt.subtitle}
                        </div>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full border ${
                              opt.turnaround === "immediate"
                                ? "text-teal-400 border-teal-700/40 bg-teal-900/20"
                                : "text-amber-400 border-amber-700/40 bg-amber-900/20"
                            }`}
                          >
                            {opt.turnaroundLabel}
                          </span>
                        </div>
                        {opt.note && (
                          <div className="text-teal-600/50 text-xs mt-1">
                            {opt.note}
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                ) : (
                  /* Ordered state */
                  <div
                    className={`rounded-lg border px-4 py-3 flex items-center gap-3 ${
                      isCXRPending
                        ? "border-amber-800/30 bg-amber-950/10"
                        : "border-teal-800/30 bg-teal-950/10"
                    }`}
                  >
                    <span className="text-xl">{opt.emoji}</span>
                    <div className="flex-1">
                      <div className="text-teal-200 text-sm font-medium">
                        {opt.title}
                      </div>
                      {isCXRPending ? (
                        <div className="text-amber-400/70 text-xs mt-0.5 flex items-center gap-1">
                          <span className="animate-pulse">⏳</span>
                          結果準備中...（約 15 分鐘）
                        </div>
                      ) : (
                        <div className="text-teal-400/60 text-xs mt-0.5">
                          ✓ 已開單
                          {cxrReady && opt.key === "cxr_portable" && " — 結果已回"}
                        </div>
                      )}
                    </div>

                    {/* View result button */}
                    {!isCXRPending && (
                      <button
                        onClick={() =>
                          setShowResult(showingResult ? null : opt.key)
                        }
                        className="text-xs text-teal-400 hover:text-teal-200 px-2 py-1 rounded border border-teal-800/30 hover:border-teal-700/50 transition-colors"
                      >
                        {showingResult ? "收合" : "查看結果"}
                      </button>
                    )}

                    {/* CXR ready — view button */}
                    {opt.key === "cxr_portable" && cxrReady && !showingResult && (
                      <button
                        onClick={handleViewCXR}
                        className="text-xs text-amber-400 hover:text-amber-200 px-2 py-1 rounded border border-amber-800/30 hover:border-amber-700/50 transition-colors"
                      >
                        查看 CXR
                      </button>
                    )}
                  </div>
                )}

                {/* Result panel */}
                {showingResult && (
                  <div className="mt-2">
                    {renderResult(opt.key)}
                  </div>
                )}
              </div>
            );
          })}

          {/* Teaching note */}
          {ordered.size === 0 && (
            <div
              className="rounded-lg border border-teal-900/20 px-4 py-3"
              style={{ backgroundColor: "#001520" }}
            >
              <p className="text-teal-500/40 text-xs leading-relaxed">
                💡 <strong className="text-teal-400/50">臨床提示：</strong>
                Portable CXR 排影像技師需要等，Bedside Echo 即時。
                急性出血情境下，POCUS（cardiac）比等 CXR 更快排除 tamponade。
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-teal-900/30 px-5 py-3 flex items-center justify-between">
          <span className="text-teal-400/40 text-xs">
            {ordered.size > 0
              ? `已開 ${ordered.size} 項影像`
              : "選擇影像項目"}
          </span>
          {ordered.size > 0 && (
            <button
              onClick={closeModal}
              className="text-xs text-teal-400 hover:text-teal-200 transition-colors"
            >
              關閉 →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
