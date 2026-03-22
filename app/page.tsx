import Link from "next/link";
import Image from "next/image";
import { loadBlogEntries, loadSiteCopy, loadProjects, loadStreamEntries } from "@/lib/content";
import { ViewStats } from "@/components/ui/ViewCounter";
import { RandomTagline } from "@/components/ui/RandomTagline";
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
        {/* Hero — personality-first */}
        <header className="hero-block relative overflow-hidden rounded-2xl px-6 py-10 sm:px-10 sm:py-14">
          {/* Decorative accent dot */}
          <div className="hero-dot absolute -right-6 -top-6 h-32 w-32 rounded-full opacity-20 sm:h-48 sm:w-48" />

          <div className="relative z-10 flex flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
            {/* Text side */}
            <div className="max-w-lg space-y-4">
              <p className="text-sm font-medium uppercase tracking-widest text-[var(--accent)]">
                心臟外科醫師 · 寫字的人
              </p>
              <h1 className="text-3xl font-bold leading-tight text-[var(--foreground)] sm:text-4xl">
                嗨，我是玴祥
              </h1>
              <div className="space-y-2 text-base leading-relaxed text-[var(--muted)]">
                {heroIntroParagraphs.map((paragraph: string, index: number) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </div>
              <RandomTagline />
              {/* Nav pills */}
              <nav className="flex flex-wrap gap-2 pt-2">
                {[
                  { href: "/blog", label: "Blog" },
                  { href: "/now", label: "Now" },
                  { href: "/stream", label: "Stream" },
                  { href: "/blogroll", label: "Blogroll" },
                  { href: "/about", label: "About" },
                ].map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="hero-pill rounded-full border border-[var(--border)] px-4 py-1.5 text-sm text-[var(--foreground)] transition-all hover:border-[var(--accent)] hover:bg-[var(--accent)] hover:text-white"
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>

            {/* Photo side */}
            <div className="hero-photo-wrap relative mx-auto flex-shrink-0 sm:mx-0">
              <div className="hero-photo relative h-36 w-36 overflow-hidden rounded-2xl shadow-lg sm:h-44 sm:w-44">
                <Image
                  src="/hero.jpg"
                  alt="趙玴祥 Wilson Chao"
                  fill
                  className="object-cover"
                  priority
                />
              </div>
              {/* Playful offset border */}
              <div className="absolute -bottom-2 -right-2 -z-10 h-36 w-36 rounded-2xl border-2 border-dashed border-[var(--accent)] opacity-40 sm:h-44 sm:w-44" />
            </div>
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
