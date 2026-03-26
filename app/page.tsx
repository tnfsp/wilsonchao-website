import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { loadBlogEntries, loadSiteCopy, loadStreamEntries } from "@/lib/content";
import { ViewStats } from "@/components/ui/ViewCounter";
import { RandomTagline } from "@/components/ui/RandomTagline";
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

export default async function Home() {
  const [siteCopy, blogEntries, murmur] = await Promise.all([
    loadSiteCopy(),
    loadBlogEntries(),
    loadStreamEntries(6),
  ]);

  // Filter stream: remove blog promos, strip raw URLs, limit to 3
  const filteredMurmur = murmur
    .filter((item) => {
      const text = (item.description || item.title || "").toLowerCase();
      return !text.includes("#blog") && !text.startsWith("📰");
    })
    .map((item) => ({
      ...item,
      description: (item.description || item.title || "")
        .replace(/https?:\/\/[^\s]+/g, "")
        .trim(),
    }))
    .slice(0, 3);

  // Tag label mapping
  const tagLabelMap: Record<string, string> = {
    essay: "Essay",
    weekly: "Weekly",
    diary: "Diary",
  };

  // Build recentItems from all blog entries (blog + daily + weekly)
  type RecentItem = { title: string; href: string; date: string; tag?: string; excerpt?: string };
  const recentItems: RecentItem[] = blogEntries
    .map((post) => ({
      title: post.title,
      href: `/blog/${post.slug}`,
      date: post.publishedAt || "",
      tag: tagLabelMap[post.type || ""] || post.type || "",
      excerpt: post.excerpt || "",
    }))
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
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl font-bold text-[var(--foreground)] sm:text-3xl">
                嗨，我是玴祥
              </h1>
              <p className="text-sm text-[var(--muted)]">心臟外科醫師 · 對世界好奇的人</p>
            </div>
            {/* Social Icons */}
            <div className="shrink-0 flex items-center gap-2">
              {[
                { label: "Instagram", href: "https://www.instagram.com/momobear_doctor", ext: true, d: <><rect x="2" y="2" width="20" height="20" rx="5" /><circle cx="12" cy="12" r="5" /><circle cx="17.5" cy="6.5" r="1.25" fill="currentColor" stroke="none" /></> },
                { label: "Telegram", href: "https://t.me/doctormomo", ext: true, d: <><path d="M22 2L11 13" /><path d="M22 2L15 22L11 13L2 9L22 2Z" /></> },
                { label: "RSS", href: "/feed", ext: false, d: <><path d="M4 11a9 9 0 0 1 9 9" /><path d="M4 4a16 16 0 0 1 16 16" /><circle cx="5" cy="19" r="1.5" fill="currentColor" stroke="none" /></> },
                { label: "Email", href: "mailto:aa2670095@gmail.com", ext: true, d: <><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></> },
              ].map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  title={s.label}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border)] text-[var(--muted)] transition-all duration-200 hover:border-[var(--accent)] hover:text-[var(--accent)] hover:bg-[var(--surface)]"
                  target={s.ext ? "_blank" : undefined}
                  rel={s.ext ? "noreferrer" : undefined}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">{s.d}</svg>
                </a>
              ))}
            </div>
          </div>

          <div className="max-w-2xl space-y-4 text-base leading-relaxed text-[var(--muted)]">
            <p>白天在高醫把心臟打開，晚上把心裡的事寫下來。</p>
            {heroIntroParagraphs.map((paragraph: string, index: number) => (
              <p key={index}>{paragraph}</p>
            ))}
            <RandomTagline />
          </div>

          {/* Navigation pills */}
          <div className="flex flex-wrap gap-2">
            {[
              { label: "Blog", href: "/blog" },
              { label: "Now", href: "/now" },
              { label: "Stream", href: "/stream" },
              { label: "Blogroll", href: "/blogroll" },
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

          <nav className="max-w-md space-y-1 text-sm text-[var(--muted)]">
            <div><Link href="/blog" className="subtle-link">Blog</Link> — 想好了才寫的長文</div>
            <div><Link href="/stream" className="subtle-link">Stream</Link> — 每天的腦內碎片</div>
            <div><Link href="/now" className="subtle-link">Now</Link> — 我最近在幹嘛</div>
            <div><Link href="/blogroll" className="subtle-link">Blogroll</Link> — 我在讀什麼</div>
          </nav>
        </header>

        {/* 最近寫的: blog + 週報 merged */}
        <section className="space-y-5">
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
              <li key={item.href} className="group -mx-3 rounded-md px-3 py-2.5 transition-colors hover:bg-[var(--highlight)]/30">
                <Link href={item.href} className="block">
                  <div className="flex items-baseline justify-between gap-6">
                    <span className="text-base text-[var(--foreground)] group-hover:text-[var(--accent)] transition-colors min-w-0 truncate">
                      {item.title}
                    </span>
                    <span className="flex-shrink-0 text-sm text-[var(--muted)] tabular-nums opacity-60">
                      {item.date}
                    </span>
                  </div>
                  {item.excerpt ? (
                    <p className="mt-1 text-sm text-[var(--muted)] opacity-50 line-clamp-1">
                      {item.excerpt}
                    </p>
                  ) : null}
                </Link>
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
          {filteredMurmur.length > 0 ? (
            <div className="space-y-4">
              {filteredMurmur.map((item) => (
                <div
                  key={item.link || item.title}
                  className="border-l-2 border-[var(--border)] pl-4"
                >
                  <Link
                    href="/stream"
                    className="block text-sm leading-relaxed text-[var(--foreground)] hover:text-[var(--accent)] break-words"
                  >
                    {item.description || item.title}
                  </Link>
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
              <Link href="/stream" className="inline-link">
                {siteCopy.murmurCTA}
              </Link>
            </p>
          )}
        </section>

        {/* Footer */}
        <footer className="border-t border-[var(--border)] pt-6 text-sm text-[var(--muted)]">
          <div className="flex items-center justify-between">
            <span>{siteCopy.footerText}</span>
            <div className="flex items-center gap-1">
              {[
                { label: "Instagram", href: "https://www.instagram.com/momobear_doctor", ext: true, d: <><rect x="2" y="2" width="20" height="20" rx="5" /><circle cx="12" cy="12" r="5" /><circle cx="17.5" cy="6.5" r="1.25" fill="currentColor" stroke="none" /></> },
                { label: "Telegram", href: "https://t.me/doctormomo", ext: true, d: <><path d="M22 2L11 13" /><path d="M22 2L15 22L11 13L2 9L22 2Z" /></> },
                { label: "RSS", href: "/feed", ext: false, d: <><path d="M4 11a9 9 0 0 1 9 9" /><path d="M4 4a16 16 0 0 1 16 16" /><circle cx="5" cy="19" r="1.5" fill="currentColor" stroke="none" /></> },
                { label: "Email", href: "mailto:aa2670095@gmail.com", ext: true, d: <><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></> },
              ].map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  title={s.label}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--muted)] transition-all duration-200 hover:text-[var(--accent)]"
                  target={s.ext ? "_blank" : undefined}
                  rel={s.ext ? "noreferrer" : undefined}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">{s.d}</svg>
                </a>
              ))}
            </div>
          </div>
          <div className="pt-2">
            <ViewStats slug="home" />
          </div>
        </footer>
      </main>
    </>
  );
}
