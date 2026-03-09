import type { Metadata } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://wilsonchao.com";

export const metadata: Metadata = {
  title: "Now — Wilson Chao",
  description: "趙玴祥現在在忙什麼——臨床、研究、寫作、造東西。",
  alternates: { canonical: `${BASE_URL}/now` },
};

const sections = [
  {
    emoji: "🏥",
    title: "臨床",
    body: "在高醫心臟血管外科當總醫師，八月升主治。冠狀動脈繞道、瓣膜、主動脈手術。同時準備專科考試。",
  },
  {
    emoji: "📚",
    title: "研究",
    body: "剛開了一個 Network Meta-Analysis 專案：比較透析通路 steal syndrome 的不同術式（DRIL vs RUDI vs PAI），目標投 JVS。另外有一篇 Bentall pseudoaneurysm case report 在修。",
  },
  {
    emoji: "✍️",
    title: "寫作",
    body: "試著寫更短、更頻繁的東西。Stream 是每天的碎片，Blog 放長文。想把「寫」變成跟「開刀」一樣的日常練習。",
  },
  {
    emoji: "🤖",
    title: "在蓋的東西",
    body: "一個 AI-assisted 的個人系統 — 用 Claude 串起日記、知識庫、研究流程、記帳、甚至這個網站的維護。裡面有個叫 Owl 的 agent 幫我處理日常瑣事和推進專案。不是為了效率，是因為好玩。",
  },
  {
    emoji: "🎵",
    title: "其他",
    body: "在學 DJ。偶爾健身。試著每天走久一點。",
  },
];

export default function NowPage() {
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: BASE_URL },
      { "@type": "ListItem", position: 2, name: "Now", item: `${BASE_URL}/now` },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd).replace(/<\/script/gi, "<\\/script") }}
      />
      <main className="page-shell space-y-6">
        <header className="space-y-2">
          <span className="section-title">Now</span>
          <h1 className="text-3xl font-semibold text-[var(--foreground)]">
            What I&apos;m focusing on
          </h1>
          <p className="text-sm text-[var(--muted)]">
            最後更新：<time dateTime="2026-03">2026 年 3 月</time>
          </p>
        </header>

        <div className="space-y-5">
          {sections.map((s) => (
            <section key={s.title} className="space-y-1.5">
              <h2 className="text-lg font-semibold text-[var(--foreground)]">
                {s.emoji} {s.title}
              </h2>
              <p className="leading-relaxed text-[var(--muted)]">{s.body}</p>
            </section>
          ))}
        </div>

        <footer className="space-y-3 border-t border-[var(--border)] pt-6">
          <p className="text-[var(--muted)]">
            想聊這些？{" "}
            <a
              href="mailto:momobear.doctor@gmail.com"
              className="underline decoration-[var(--border)] underline-offset-4 transition-colors hover:text-[var(--accent)]"
            >
              寫信給我
            </a>{" "}
            或{" "}
            <a
              href="https://instagram.com/momobear_doctor"
              target="_blank"
              rel="noopener noreferrer"
              className="underline decoration-[var(--border)] underline-offset-4 transition-colors hover:text-[var(--accent)]"
            >
              IG @momobear_doctor
            </a>
          </p>
          <p className="text-xs text-[var(--muted)]/60">
            Inspired by{" "}
            <a
              href="https://nownownow.com"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-4 hover:text-[var(--accent)]"
            >
              nownownow.com
            </a>
          </p>
        </footer>
      </main>
    </>
  );
}
