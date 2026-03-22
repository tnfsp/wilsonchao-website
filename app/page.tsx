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
  const latest = blogEntries.slice(0, 5);
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

          <div className="max-w-2xl space-y-4 text-base leading-relaxed text-[var(--foreground)]">
            <p className="text-lg font-medium">
              白天在高醫把心臟打開，晚上把心裡的事寫下來。
            </p>
            {heroIntroParagraphs.map((paragraph: string, index: number) => (
              <p key={index} className="text-[var(--muted)]">{paragraph}</p>
            ))}
            <p className="text-[var(--muted)]">
              <Link href="/blog" className="font-medium text-[var(--accent)] underline decoration-[var(--accent)]/30 underline-offset-4 hover:decoration-[var(--accent)]">Blog</Link> 是想好了才寫的長文。
              <Link href="/stream" className="font-medium text-[var(--accent)] underline decoration-[var(--accent)]/30 underline-offset-4 hover:decoration-[var(--accent)]"> Stream</Link> 是每天的腦內碎片——手術後的感想、半夜聽到的歌、或就只是廢話。想知道我最近在幹嘛，看 <Link href="/now" className="font-medium text-[var(--accent)] underline decoration-[var(--accent)]/30 underline-offset-4 hover:decoration-[var(--accent)]">Now</Link>。想知道我在讀什麼，看 <Link href="/blogroll" className="font-medium text-[var(--accent)] underline decoration-[var(--accent)]/30 underline-offset-4 hover:decoration-[var(--accent)]">Blogroll</Link>。
            </p>
          </div>
        </header>

        {/* Blog: title list only */}
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
            {latest.map((post) => (
              <li key={post.slug} className="flex items-baseline justify-between gap-4">
                <Link
                  href={`/blog/${post.slug}`}
                  className="text-base text-[var(--foreground)] hover:text-[var(--accent)] transition-colors"
                >
                  {post.title}
                </Link>
                <span className="flex-shrink-0 text-sm text-[var(--muted)] tabular-nums">
                  {post.publishedAt}
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
