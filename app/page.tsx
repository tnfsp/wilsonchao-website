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
        {/* Hero: photo + text side by side */}
        <header className="space-y-6 pt-4">
          <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start sm:gap-8">
            <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-full sm:h-28 sm:w-28">
              <Image
                src="/hero.jpg"
                alt="趙玴祥 Wilson Chao"
                fill
                className="object-cover"
                priority
              />
            </div>
            <div className="space-y-3 text-center sm:text-left">
              <h1 className="text-2xl font-semibold leading-tight text-[var(--foreground)] sm:text-3xl">
                {siteCopy.heroSubtitle}
              </h1>
              <div className="max-w-xl space-y-2 text-base leading-relaxed text-[var(--muted)]">
                {heroIntroParagraphs.map((paragraph: string, index: number) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </div>
            </div>
          </div>

          {/* Inline nav links */}
          <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-base sm:justify-start">
            <Link href="/blog" className="text-[var(--foreground)] underline decoration-[var(--border)] underline-offset-4 transition-colors hover:text-[var(--accent)] hover:decoration-[var(--accent)]">Blog</Link>
            <Link href="/now" className="text-[var(--foreground)] underline decoration-[var(--border)] underline-offset-4 transition-colors hover:text-[var(--accent)] hover:decoration-[var(--accent)]">Now</Link>
            <Link href="/stream" className="text-[var(--foreground)] underline decoration-[var(--border)] underline-offset-4 transition-colors hover:text-[var(--accent)] hover:decoration-[var(--accent)]">Stream</Link>
            <Link href="/blogroll" className="text-[var(--foreground)] underline decoration-[var(--border)] underline-offset-4 transition-colors hover:text-[var(--accent)] hover:decoration-[var(--accent)]">Blogroll</Link>
            <Link href="/about" className="text-[var(--foreground)] underline decoration-[var(--border)] underline-offset-4 transition-colors hover:text-[var(--accent)] hover:decoration-[var(--accent)]">About</Link>
          </nav>
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
