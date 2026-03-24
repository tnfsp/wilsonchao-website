"use client";

import { useState } from "react";
import { Scenario } from "@/lib/simulator/types-legacy";
import CasePlayer from "@/components/simulator/CasePlayer";
import SelfStudyPlayer from "@/components/simulator/SelfStudyPlayer";

export default function ModeSelector({
  scenario,
}: {
  scenario: Scenario;
}) {
  const [mode, setMode] = useState<"select" | "teacher" | "self-study">(
    "select"
  );

  if (mode === "teacher") return <CasePlayer scenario={scenario} />;
  if (mode === "self-study")
    return <SelfStudyPlayer scenario={scenario} />;

  return (
    <div className="min-h-screen bg-[#001219] text-white flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">🫀</div>
          <h1 className="text-2xl font-bold">{scenario.title}</h1>
          <p className="text-gray-400 mt-1">{scenario.subtitle}</p>
        </div>

        <div className="space-y-4">
          <button
            onClick={() => setMode("teacher")}
            className="w-full text-left bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 hover:border-amber-500/30 rounded-xl p-5 transition-all group"
          >
            <div className="flex items-center gap-4">
              <span className="text-3xl">👨‍🏫</span>
              <div>
                <div className="text-white font-bold group-hover:text-amber-300 transition">
                  教師模式
                </div>
                <div className="text-gray-400 text-sm mt-1">
                  投影出來，帶 clerk 一起跑。你控制節奏，按按鈕走分支。
                </div>
              </div>
            </div>
          </button>

          <button
            onClick={() => setMode("self-study")}
            className="w-full text-left bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 hover:border-green-500/30 rounded-xl p-5 transition-all group"
          >
            <div className="flex items-center gap-4">
              <span className="text-3xl">🎒</span>
              <div>
                <div className="text-white font-bold group-hover:text-green-300 transition">
                  自學模式
                </div>
                <div className="text-gray-400 text-sm mt-1">
                  自己練習。AI 學長帶你跑情境，用打字對話。
                </div>
              </div>
            </div>
          </button>
        </div>

        {/* Classic mode note */}
        <div className="mt-8 bg-purple-500/5 border border-purple-500/20 rounded-xl p-4">
          <p className="text-purple-300 text-sm">
            💡 這是分支敘事模式 — 你可以選擇不同的劇情路徑。
          </p>
          <p className="text-gray-400 text-sm mt-2">
            如果想要自由開 order 的模擬體驗，請試試{" "}
            <a
              href="/teaching/simulator"
              className="text-cyan-400 hover:text-cyan-300 underline transition"
            >
              Pro 模式
            </a>
            。
          </p>
        </div>

        <div className="text-center mt-6">
          <a
            href="/teaching/simulator"
            className="text-gray-500 hover:text-white transition text-sm"
          >
            ← 返回情境列表
          </a>
        </div>
      </div>
    </div>
  );
}
