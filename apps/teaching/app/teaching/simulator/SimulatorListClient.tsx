"use client";

import { useEffect, useState } from "react";
import { scenarioList } from "@/lib/simulator/scenarios";
import { proScenarioList } from "@/lib/simulator/scenarios/pro";
import Link from "next/link";

const PROGRESS_KEY = "icu-sim-progress";

interface CaseProgress {
  bestScore: number;
  lastPlayed: string;
  rating: number;
}

function ratingStars(rating: number): string {
  return "⭐".repeat(rating);
}

const difficultyColors: Record<string, string> = {
  beginner: "bg-green-500/10 text-green-400 border-green-500/20",
  intermediate: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  advanced: "bg-red-500/10 text-red-400 border-red-500/20",
};

const difficultyLabels: Record<string, string> = {
  beginner: "入門",
  intermediate: "進階",
  advanced: "挑戰",
};

export default function SimulatorPage() {
  const [progress, setProgress] = useState<Record<string, CaseProgress>>({});

  useEffect(() => {
    try {
      const raw = localStorage.getItem(PROGRESS_KEY);
      if (raw) setProgress(JSON.parse(raw));
    } catch { /* ignore */ }
  }, []);
  return (
    <div className="min-h-screen bg-[#001219] text-white">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <div className="text-5xl mb-4">🎮</div>
          <h1 className="text-3xl font-bold">ICU Case Simulator</h1>
          <p className="text-gray-400 mt-2 max-w-lg mx-auto">
            互動式模擬 — 真實值班情境，真實臨床決策。
          </p>
        </div>

        {/* Pro Scenarios */}
        {proScenarioList.length > 0 && (
          <div className="mb-12">
            <h2 className="text-lg font-semibold text-cyan-400 mb-4 flex items-center gap-2">
              <span>🩺</span> ICU 值班模擬
            </h2>
            <p className="text-gray-500 text-sm mb-4">
              三種身份、三種體驗 — 一般民眾、醫學生、住院醫師各有專屬模式。
            </p>
            <div className="grid gap-4">
              {proScenarioList.map((s) => {
                const p = progress[s.id];
                return (
                <Link
                  key={s.id}
                  href={`/teaching/simulator/${s.id}`}
                  className="group block bg-cyan-500/[0.03] hover:bg-cyan-500/[0.08] border border-cyan-500/10 hover:border-cyan-500/30 rounded-xl p-6 transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-xl font-bold text-white group-hover:text-cyan-300 transition">
                          {s.title}
                        </h3>
                        {p ? (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-500/15 text-yellow-400 border border-yellow-500/20 font-mono">
                            {ratingStars(p.rating)} {p.bestScore}/100
                          </span>
                        ) : (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-gray-500">
                            未玩
                          </span>
                        )}
                      </div>
                      <p className="text-gray-400 mt-1">{s.subtitle}</p>
                      <div className="flex flex-wrap gap-2 mt-3">
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full border ${difficultyColors[s.difficulty]}`}
                        >
                          {difficultyLabels[s.difficulty]}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-gray-400">
                          ⏱ {s.duration}
                        </span>
                        {s.tags.slice(0, 5).map((t: string) => (
                          <span
                            key={t}
                            className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-gray-500"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                    <span className="text-gray-600 group-hover:text-cyan-400 text-xl transition">
                      →
                    </span>
                  </div>
                </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Legacy Classic Branching Scenarios */}
        {scenarioList.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-purple-400 mb-4 flex items-center gap-2">
              <span>📖</span> 劇情分支模式（Classic）
            </h2>
            <p className="text-gray-500 text-sm mb-4">
              分支敘事 — 教師選擇劇情走向，探索不同臨床路徑。適合小組教學。
            </p>
            <div className="grid gap-4">
              {scenarioList.map((s) => (
                <Link
                  key={s.id}
                  href={`/teaching/simulator/${s.id}`}
                  className="group block bg-purple-500/[0.03] hover:bg-purple-500/[0.08] border border-purple-500/10 hover:border-purple-500/30 rounded-xl p-6 transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 font-medium">
                          CLASSIC
                        </span>
                        <h3 className="text-xl font-bold text-white group-hover:text-purple-300 transition">
                          {s.title}
                        </h3>
                      </div>
                      <p className="text-gray-400 mt-1">{s.subtitle}</p>
                      <div className="flex flex-wrap gap-2 mt-3">
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full border ${difficultyColors[s.difficulty]}`}
                        >
                          {difficultyLabels[s.difficulty]}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-gray-400">
                          ⏱ {s.duration}
                        </span>
                        {s.tags.map((t: string) => (
                          <span
                            key={t}
                            className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-gray-500"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                    <span className="text-gray-600 group-hover:text-cyan-400 text-xl transition">
                      →
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className="text-center mt-12">
          <Link
            href="/teaching"
            className="text-gray-500 hover:text-white transition"
          >
            ← 回到教學首頁
          </Link>
        </div>
      </div>
    </div>
  );
}
