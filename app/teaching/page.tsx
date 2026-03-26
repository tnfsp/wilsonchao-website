import Link from "next/link";

export const metadata = {
  alternates: { canonical: "https://wilsonchao.com/teaching" },
};

const modules = {
  required: [
    { slug: "preop-assessment", title: "Module 1：術前評估", subtitle: "「這個人為什麼要開刀？」", emoji: "🫀" },
    { slug: "hemodynamics", title: "Module 2：Hemodynamic Monitoring", subtitle: "「三秒鐘看一眼 monitor，你看什麼？」", emoji: "📊" },
    { slug: "ventilator", title: "Module 3：呼吸器", subtitle: "「術後 4 小時，病人 fighting vent」", emoji: "🌬️" },
    { slug: "icu-care", title: "Module 4：ICU Care", subtitle: "「CABG 術後 Day 0，然後呢？」", emoji: "🏥" },
    { slug: "varicose-vein", title: "Module 5：Varicose Vein", subtitle: "「靜脈曲張不只是美容問題」", emoji: "🦵" },
    { slug: "avf-avg", title: "Module 6：AVF/AVG 評估", subtitle: "「沒 thrill 了，然後呢？」", emoji: "💉" },
  ],
  elective: [
    { slug: "cabg", title: "選修 A：CABG 全攻略", subtitle: "從 Cath 到 Close — Case-based", emoji: "🔧" },
    { slug: "valve", title: "選修 B：Valve Surgery", subtitle: "Repair or Replace?", emoji: "🔄" },
    { slug: "cpb", title: "選修 C：CPB & Myocardial Protection", subtitle: "「人類怎麼學會停住心臟」", emoji: "❄️" },
    { slug: "mcs", title: "選修 D：Mechanical Circulatory Support", subtitle: "「凌晨三點，cardiogenic shock call in」", emoji: "⚡" },
    { slug: "aortic", title: "選修 E：Aortic Surgery", subtitle: "「最刺激的急診」", emoji: "🚨" },
  ],
};

function ModuleCard({ slug, title, subtitle, emoji }: { slug: string; title: string; subtitle: string; emoji: string }) {
  return (
    <Link
      href={`/teaching/${slug}`}
      className="group block rounded-xl border border-white/10 bg-white/5 p-6 transition-all hover:bg-white/10 hover:border-white/20 hover:scale-[1.02]"
    >
      <div className="text-4xl mb-3">{emoji}</div>
      <h3 className="text-lg font-semibold text-white group-hover:text-cyan-400 transition-colors">{title}</h3>
      <p className="text-sm text-gray-400 mt-1">{subtitle}</p>
    </Link>
  );
}

export default function TeachingIndex() {
  return (
    <div className="min-h-screen bg-[#001219] text-white">
      <div className="max-w-4xl mx-auto px-6 py-16">
        <header className="mb-16 text-center">
          <h1 className="text-4xl font-bold mb-2">心臟外科 Clerk 教學</h1>
          <p className="text-gray-400 text-lg">Wilson Chao — 高醫心臟外科</p>
          <p className="text-gray-500 text-sm mt-2">不教 Google 得到的東西，教只有站在心外 ICU 才學得到的</p>
        </header>

        <section className="mb-12">
          <h2 className="text-xl font-semibold mb-6 text-cyan-400">🔒 必修基礎包</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {modules.required.map((m) => (
              <ModuleCard key={m.slug} {...m} />
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-6 text-cyan-400">🎯 選修菜單</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {modules.elective.map((m) => (
              <ModuleCard key={m.slug} {...m} />
            ))}
          </div>
        </section>

        <section className="mt-12">
          <Link
            href="/teaching/simulator"
            className="group block rounded-xl border border-cyan-700/50 bg-cyan-900/10 p-6 text-center hover:border-cyan-400 hover:bg-cyan-900/20 transition-all mb-4"
          >
            <div className="text-3xl mb-2">🎮</div>
            <div className="font-semibold text-lg text-white group-hover:text-cyan-400 transition-colors">
              ICU Simulator
            </div>
            <p className="text-sm text-gray-400 mt-1">模擬情境練習 — AI 學長即時回饋你的臨床決策</p>
          </Link>
          <Link
            href="/teaching/feedback"
            className="group block rounded-xl border-2 border-dashed border-cyan-700 p-6 text-center hover:border-cyan-400 hover:bg-white/5 transition-all"
          >
            <div className="text-3xl mb-2">📮</div>
            <div className="font-semibold text-lg text-white group-hover:text-cyan-400 transition-colors">
              Clerk Feedback
            </div>
            <p className="text-sm text-gray-400 mt-1">匿名回饋，幫助我們讓見習變更好</p>
          </Link>
        </section>

        <footer className="mt-16 text-center text-gray-600 text-sm">
          <p>← → 翻頁 · F 全螢幕 · ESC 總覽</p>
        </footer>
      </div>
    </div>
  );
}
