import { scenarioList } from "@/lib/simulator/scenarios";
import Link from "next/link";

const difficultyColors = {
  beginner: "bg-green-500/10 text-green-400 border-green-500/20",
  intermediate: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  advanced: "bg-red-500/10 text-red-400 border-red-500/20",
};

const difficultyLabels = {
  beginner: "入門",
  intermediate: "進階",
  advanced: "挑戰",
};

export default function SimulatorPage() {
  return (
    <div className="min-h-screen bg-[#001219] text-white">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <div className="text-5xl mb-4">🎮</div>
          <h1 className="text-3xl font-bold">ICU Case Simulator</h1>
          <p className="text-gray-400 mt-2 max-w-lg mx-auto">
            互動式教案播放器 — 投影出來，帶 clerk 一起跑情境。
            <br />
            你控制節奏，clerk 做決策，病人會反應。
          </p>
        </div>

        <div className="grid gap-4">
          {scenarioList.map((s) => (
            <Link
              key={s.id}
              href={`/teaching/simulator/${s.id}`}
              className="group block bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 hover:border-cyan-500/20 rounded-xl p-6 transition-all"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white group-hover:text-cyan-300 transition">
                    {s.title}
                  </h2>
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
                    {s.tags.map((t) => (
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
