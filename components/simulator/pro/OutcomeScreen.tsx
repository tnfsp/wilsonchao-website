"use client";

import { useState, useEffect } from "react";
import { useProGameStore } from "@/lib/simulator/store";
import type { ScenarioOutcome } from "@/lib/simulator/types";

// ── Default outcomes (fallback when scenario doesn't define custom ones) ──

const DEFAULT_OUTCOMES: ScenarioOutcome[] = [
  {
    condition: "survived_good",
    emoji: "🌟",
    title: "病人穩定",
    narrative:
      "學長到場後聽完你的 SBAR，迅速評估情況。根據你的處置和判斷，學長決定帶病人回 OR re-exploration。手術順利完成，病人術後穩定轉回 ICU。你的及時處置和清楚的交班報告，讓學長能快速做出正確決策。",
  },
  {
    condition: "survived_poor",
    emoji: "⚠️",
    title: "病人存活，但過程驚險",
    narrative:
      "學長到場後發現情況比預期嚴重。由於部分關鍵處置延遲或遺漏，病人已經進入死亡三角的早期階段。學長緊急處理後，病人勉強穩定下來，但需要延長 ICU 住院時間。這次經驗提醒我們：早期積極處置的重要性。",
  },
  {
    condition: "died",
    emoji: "💀",
    title: "病人不幸過世",
    narrative:
      "儘管團隊全力搶救，病人最終因為血流動力學衰竭而過世。每一次這樣的經歷都是沉重的學習。讓我們回顧整個過程，看看哪些地方可以做得更好。",
  },
];

// ── Determine which outcome to show ──

function selectOutcome(
  outcomes: ScenarioOutcome[] | undefined,
  patientDied: boolean,
  calledSenior: boolean,
): ScenarioOutcome {
  const pool = outcomes && outcomes.length > 0 ? outcomes : DEFAULT_OUTCOMES;

  if (patientDied) {
    return pool.find((o) => o.condition === "died") ?? DEFAULT_OUTCOMES[2];
  }

  // 核心判定：有叫學長 = survived_good（學長是 definitive treatment 的關鍵）
  if (calledSenior) {
    return pool.find((o) => o.condition === "survived_good") ?? DEFAULT_OUTCOMES[0];
  }

  return pool.find((o) => o.condition === "survived_poor") ?? DEFAULT_OUTCOMES[1];
}

// ── Typewriter effect hook ──

function useTypewriter(text: string, speed = 30) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    setDisplayed("");
    setDone(false);
    let i = 0;
    const timer = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(timer);
        setDone(true);
      }
    }, speed);
    return () => clearInterval(timer);
  }, [text, speed]);

  return { displayed, done };
}

// ── OutcomeScreen ──

export default function OutcomeScreen() {
  const scenario = useProGameStore((s) => s.scenario);
  const deathCause = useProGameStore((s) => s.deathCause);
  const playerActions = useProGameStore((s) => s.playerActions);
  const endGame = useProGameStore((s) => s.endGame);

  // 判定是否有叫學長（outcome 核心條件）
  const calledSenior = playerActions.some((pa) => {
    const a = (pa.action ?? "").toLowerCase();
    return a.includes("consult") || a.includes("叫學長") || a.includes("call_senior") || a.includes("通知學長") || a.includes("通知vs");
  });

  const patientDied = !!deathCause;
  const outcome = selectOutcome(scenario?.outcomes, patientDied, calledSenior);

  const { displayed, done } = useTypewriter(outcome.narrative, 25);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-6 overflow-y-auto"
      style={{ background: "#001219" }}
    >
      <div className="max-w-xl w-full text-center space-y-8">
        {/* Emoji */}
        <div
          className="text-7xl animate-pulse"
          style={{ animationDuration: "3s" }}
        >
          {outcome.emoji}
        </div>

        {/* Title */}
        <h1
          className={`text-3xl font-bold tracking-tight ${
            patientDied ? "text-red-400" : calledSenior ? "text-emerald-400" : "text-amber-400"
          }`}
        >
          {outcome.title}
        </h1>

        {/* Narrative with typewriter */}
        <div className="min-h-[120px]">
          <p className="text-gray-300 text-base leading-relaxed">
            {displayed}
            {!done && <span className="animate-pulse text-cyan-400">|</span>}
          </p>
        </div>

        {/* Diagnosis reveal */}
        {done && scenario?.hiddenTitle && (
          <div className="animate-fadeIn">
            <div className="text-xs text-gray-600 uppercase tracking-widest mb-1">最終診斷</div>
            <div className="text-xl font-bold text-cyan-300">
              {scenario.title}
            </div>
          </div>
        )}

        {/* Continue button — appears after typewriter finishes */}
        {done && (
          <button
            onClick={endGame}
            className="mt-4 px-8 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white font-medium text-sm transition-all active:scale-95"
          >
            查看 Debrief →
          </button>
        )}
      </div>
    </div>
  );
}
