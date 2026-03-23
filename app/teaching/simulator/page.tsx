import Link from "next/link";

const scenarios = [
  {
    id: "cardiogenic-shock-01",
    title: "Cardiogenic Shock Mimicking Sepsis",
    subtitle: "68M STEMI s/p PCI，術後 ICU Day 1 — 真的是 sepsis 嗎？",
    difficulty: "中等",
    emoji: "💔",
  },
];

export default function SimulatorIndex() {
  return (
    <div className="min-h-screen bg-[#001219] text-white">
      <div className="max-w-4xl mx-auto px-6 py-16">
        <header className="mb-12 text-center">
          <h1 className="text-4xl font-bold mb-2">🎮 ICU Simulator</h1>
          <p className="text-gray-400 text-lg">
            模擬情境練習 — 在安全環境中練習臨床決策
          </p>
          <p className="text-gray-500 text-sm mt-2">
            AI 學長會根據你的決策給即時回饋
          </p>
        </header>

        <div className="grid gap-4 sm:grid-cols-2">
          {scenarios.map((s) => (
            <Link
              key={s.id}
              href={`/teaching/simulator/${s.id}`}
              className="group block rounded-xl border border-white/10 bg-white/5 p-6 transition-all hover:bg-white/10 hover:border-white/20 hover:scale-[1.02]"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="text-4xl">{s.emoji}</div>
                <span className="text-xs px-2 py-1 rounded bg-yellow-500/20 text-yellow-400">
                  {s.difficulty}
                </span>
              </div>
              <h3 className="text-lg font-semibold text-white group-hover:text-cyan-400 transition-colors">
                {s.title}
              </h3>
              <p className="text-sm text-gray-400 mt-1">{s.subtitle}</p>
            </Link>
          ))}

          {/* Placeholder for future scenarios */}
          <div className="rounded-xl border-2 border-dashed border-white/10 p-6 flex items-center justify-center text-gray-600">
            <div className="text-center">
              <div className="text-3xl mb-2">🔜</div>
              <p className="text-sm">更多情境開發中</p>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <Link
            href="/teaching"
            className="text-cyan-400 hover:text-cyan-300 text-sm"
          >
            ← 回到教學首頁
          </Link>
        </div>
      </div>
    </div>
  );
}
