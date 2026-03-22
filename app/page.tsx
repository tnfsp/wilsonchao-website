import Link from "next/link";
import Image from "next/image";
import { loadBlogEntries, loadSiteCopy, loadProjects, loadStreamEntries } from "@/lib/content";
import { ViewStats } from "@/components/ui/ViewCounter";

import { BASE_URL } from "@/lib/constants";

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

export default async function Home() {
  const [siteCopy, blogEntries, projects, murmur] = await Promise.all([
    loadSiteCopy(),
    loadBlogEntries(),
    loadProjects(),
    loadStreamEntries(3),
  ]);
  const weeklyEntries = projects.filter((p) => p.type === "週報");

  // Merge blog + weekly into one "最近寫的" list, sorted by date desc
  type RecentItem = { title: string; href: string; date: string; tag?: string };
  const recentItems: RecentItem[] = [
    ...blogEntries.map((post) => ({
      title: post.title,
      href: `/blog/${post.slug}`,
      date: post.publishedAt || "",
      tag: "Blog" as const,
    })),
    ...weeklyEntries.map((entry) => ({
      title: entry.title,
      href: `/journal/${entry.slug}`,
      date: entry.date || "",
      tag: "週報" as const,
    })),
  ]
    .filter((item) => item.date)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 7);
  const heroIntroParagraphs = siteCopy.heroIntro
    .split(/\n\s*\n/)
    .map((p: string) => p.trim())
    .filter(Boolean);
  const formatMurmurDate = (value?: string) => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleString("zh-TW", {
      timeZone: "Asia/Taipei",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
      />
      <main className="page-shell space-y-16">
        {/* Hero — text-first, inline navigation */}
        <header className="space-y-5">
          <div className="flex items-center gap-4">
            <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-full sm:h-20 sm:w-20">
              <Image
                src="/hero.jpg"
                alt="趙玴祥 Wilson Chao"
                fill
                className="object-cover"
                priority
              />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[var(--foreground)] sm:text-3xl">
                嗨，我是玴祥
              </h1>
              <p className="text-sm text-[var(--muted)]">心臟外科醫師 · 寫字的人</p>
            </div>
          </div>

          <div className="max-w-2xl space-y-4 text-base leading-relaxed text-[var(--muted)]">
            <p className="text-lg font-medium text-[var(--foreground)]">
              白天在高醫把心臟打開，晚上把心裡的事寫下來。
            </p>
            {heroIntroParagraphs.map((paragraph: string, index: number) => (
              <p key={index}>{paragraph}</p>
            ))}
            <p className="italic text-[var(--muted)]">
              「手術室裡放著 Lo-Fi，沒人覺得奇怪。」
            </p>
          </div>

          {/* Navigation pills */}
          <div className="flex flex-wrap gap-2">
            {[
              { label: "Blog", href: "/blog" },
              { label: "Now", href: "/now" },
              { label: "Stream", href: "/stream" },
              { label: "Blogroll", href: "/blogroll" },
              { label: "About", href: "/about" },
            ].map((nav) => (
              <Link
                key={nav.href}
                href={nav.href}
                className="rounded-full border border-[var(--border)] px-4 py-1.5 text-sm font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--highlight)] hover:text-[var(--accent)]"
              >
                {nav.label}
              </Link>
            ))}
          </div>
        </header>

        {/* 最近寫的: blog + 週報 merged */}
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
          <ul className="space-y-3">
            {recentItems.map((item) => (
              <li key={item.href} className="flex items-baseline justify-between gap-4">
                <div className="flex items-baseline gap-2 min-w-0">
                  <span className={`flex-shrink-0 rounded px-1.5 py-0.5 text-xs font-medium ${
                    item.tag === "週報"
                      ? "bg-[var(--highlight)] text-[var(--accent)]"
                      : "bg-[var(--highlight)] text-[var(--muted)]"
                  }`}>
                    {item.tag}
                  </span>
                  <Link
                    href={item.href}
                    className="text-base text-[var(--foreground)] hover:text-[var(--accent)] transition-colors truncate"
                  >
                    {item.title}
                  </Link>
                </div>
                <span className="flex-shrink-0 text-sm text-[var(--muted)] tabular-nums">
                  {item.date}
                </span>
              </li>
            ))}
          </ul>
        </section>

        {/* Stream: lightweight fragments */}
        <section className="space-y-4">
          <div className="flex items-baseline justify-between gap-3">
            <span className="section-title">腦內碎片</span>
            <Link
              href="/stream"
              className="text-sm text-[var(--muted)] transition-colors hover:text-[var(--accent-strong)]"
            >
              更多 →
            </Link>
          </div>
          {murmur.length > 0 ? (
            <div className="space-y-4">
              {murmur.map((item) => (
                <div
                  key={item.link || item.title}
                  className="border-l-2 border-[var(--border)] pl-4"
                >
                  <a
                    href={item.link}
                    className="block text-sm leading-relaxed text-[var(--foreground)] hover:text-[var(--accent)] break-words"
                    target="_blank"
                    rel="noreferrer"
                  >
                    {item.description || item.title}
                  </a>
                  {item.pubDate ? (
                    <p className="mt-1 text-xs text-[var(--muted)]">
                      {formatMurmurDate(item.pubDate)}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[var(--muted)]">
              <Link href="/stream" className="underline decoration-[var(--border)] underline-offset-4 hover:text-[var(--accent)]">
                {siteCopy.murmurCTA}
              </Link>
            </p>
          )}
        </section>

        {/* Footer */}
        <footer className="border-t border-[var(--border)] pt-6 text-sm text-[var(--muted)]">
          {siteCopy.footerText}
          <div className="pt-3">
            <ViewStats slug="home" />
          </div>
        </footer>
      </main>
    </>
  );
}
