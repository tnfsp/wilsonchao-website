import type { Metadata } from "next";
import Link from "next/link";
import { loadBlogEntries } from "@/lib/content";
import { SubscribeForm } from "@/components/ui/SubscribeForm";
import { BASE_URL } from "@/lib/constants";

export const metadata: Metadata = {
  alternates: { canonical: BASE_URL },
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "wilsonchao.com",
  url: BASE_URL,
  description: "趙玴祥（Yi-Hsiang Chao, MD）— 心臟血管外科醫師、寫作者、思考者的個人網站。",
  author: {
    "@type": ["Person", "Physician"],
    "@id": `${BASE_URL}/#person`,
    name: "趙玴祥",
    alternateName: ["Yi-Hsiang Chao", "Wilson Chao"],
    url: `${BASE_URL}/about`,
    jobTitle: "心臟血管外科醫師",
    affiliation: {
      "@type": "Hospital",
      name: "高雄醫學大學附設中和紀念醫院",
    },
  },
};

/** Navigation cards for the "如何逛這個地方" section */
const NAV_CARDS = [
  {
    label: "Blog",
    href: "/blog",
    cta: "想看故事",
    desc: "手術室裡的事、凌晨的事，還有那些我還想不通的事。",
  },
  {
    label: "About",
    href: "/about",
    cta: "想認識我這個人",
    desc: "我的名字、我的弱點、我還沒想通的問題，都攤在這。",
  },
  {
    label: "Now",
    href: "/now",
    cta: "想知道我「現在」在忙什麼",
    desc: "當下最佔據我的事。",
  },
  {
    label: "每週一封信",
    href: "#subscribe",
    cta: "想固定收到、不被演算法決定",
    desc: "直接寄到你信箱。",
    isSubscribe: true,
  },
  {
    label: "Owl",
    href: "/owl",
    cta: "想看 Owl",
    desc: "我的數位夥伴，他有自己的版面。",
  },
];

export default async function Home() {
  const blogEntries = await loadBlogEntries();

  // Tag label mapping
  const tagLabelMap: Record<string, string> = {
    essay: "Essay",
    weekly: "Weekly",
    diary: "Diary",
  };

  // Build recentItems from all blog entries
  type RecentItem = { title: string; href: string; date: string; tag?: string };
  const recentItems: RecentItem[] = blogEntries
    .map((post) => ({
      title: post.title,
      href: `/blog/${post.slug}`,
      date: post.publishedAt || "",
      tag: tagLabelMap[post.type || ""] || post.type || "",
    }))
    .filter((item) => item.date)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 3);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
      />
      <main className="page-shell space-y-16">

        {/* A. Hero 大字 */}
        <header>
          <h1 className="text-4xl font-bold leading-tight tracking-tight text-[var(--foreground)] sm:text-5xl">
            白天把心臟打開，晚上把心裡的事寫下來。
          </h1>
        </header>

        {/* B. 長合約 */}
        <section className="prose max-w-none">
          <p>
            這裡沒有知識焦慮，也沒有什麼非看不可的東西，其實只是一個個人碎唸的小天地，偶爾寫手術室裡的故事，也寫凌晨睡不著時心裡的事。
          </p>
          <p>
            曾經汲汲營營於變得更強，凡事都希望能更有生產力，現在則開始新生活運動，在這裡寫些我探索自我的過程，偶爾也把脆弱的一面寫下來。
          </p>
          <p>
            但是寫下來，其實真的是一件難為情又害羞的事情，有時也會納悶，自己為何要做這件事情？被熟識的人看到，不是把自己置於被評價的危險之中？
          </p>
          <p>
            於是寫了又刪，刪了又寫，在這個糾結中，我發現我是如此的孤單，在這麼大的世界中，我感受到強烈的孤獨感：「難道，竟然沒有人像我一樣嗎？」
          </p>
          <p>
            所以答案竟藏在問題中，至少我目前是這麼認為的，在這個角落持續敲打拍出聲響，也許總會遇到一些奇怪的同類吧！
          </p>
          <p>
            PS：如果你也有所共鳴，請寄信給我！
          </p>
        </section>

        {/* C. 如何逛這個地方 */}
        <section className="space-y-5">
          <h2 className="text-xl font-semibold text-[var(--foreground)]">如何逛這個地方？</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {NAV_CARDS.map((card) => (
              <Link
                key={card.label}
                href={card.href}
                className="surface-card block px-5 py-4 transition-transform hover:-translate-y-0.5 hover:shadow-[0_28px_70px_rgba(0,18,25,0.12)]"
                scroll={card.isSubscribe ? false : undefined}
              >
                <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)] mb-1">
                  {card.cta}
                </p>
                <p className="font-semibold text-[var(--foreground)] text-base mb-1">
                  {card.label}
                </p>
                <p className="text-sm text-[var(--muted)] leading-relaxed">
                  {card.desc}
                </p>
              </Link>
            ))}
          </div>
        </section>

        {/* D. 結尾邀請 */}
        <section id="subscribe" className="surface-strong px-6 py-7 space-y-5">
          <p className="text-lg font-medium text-[var(--foreground)] leading-relaxed">
            如果你也在繞類似的圈，留個訊息，我們聊聊。
          </p>
          <div className="space-y-2">
            <p className="text-sm text-[var(--muted)]">訂閱每週一封信，直接寄到你信箱：</p>
            <SubscribeForm source="home" />
          </div>
          <p className="text-sm text-[var(--muted)]">
            或直接寫信：{" "}
            <a href="mailto:hi@wilsonchao.com" className="inline-link">
              hi@wilsonchao.com
            </a>
          </p>
        </section>

        {/* 最近寫的 — low-key strip at the bottom */}
        {recentItems.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-baseline justify-between gap-3">
              <span className="section-title">最近寫的</span>
              <Link
                href="/blog"
                className="text-sm text-[var(--muted)] transition-colors hover:text-[var(--accent-strong)]"
              >
                全部文章 →
              </Link>
            </div>
            <ul className="space-y-1">
              {recentItems.map((item) => (
                <li
                  key={item.href}
                  className="group -mx-3 rounded-md px-3 py-2.5 transition-colors hover:bg-[var(--highlight)]/30"
                >
                  <Link href={item.href} className="block">
                    <div className="flex items-baseline justify-between gap-6">
                      <span className="min-w-0 truncate text-base text-[var(--foreground)] transition-colors group-hover:text-[var(--accent)]">
                        {item.title}
                      </span>
                      <span className="flex-shrink-0 text-sm tabular-nums text-[var(--muted)] opacity-60">
                        {item.date}
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Footer */}
        <footer className="border-t border-[var(--border)] pt-6 text-sm text-[var(--muted)]">
          只代表個人意見，半手工打造
        </footer>
      </main>
    </>
  );
}
