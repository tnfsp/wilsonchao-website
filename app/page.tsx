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
  const latest = blogEntries.slice(0, 3);
  const latestDaily = projects.slice(0, 3);
  const heroIntroParagraphs = siteCopy.heroIntro
    .split(/\n\s*\n/)
    .map((p) => p.trim())
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
    <main className="page-shell space-y-12">
      <header className="surface-strong px-6 py-8">
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start sm:gap-8">
          <div className="relative h-32 w-32 flex-shrink-0 overflow-hidden rounded-2xl sm:h-40 sm:w-40">
            <Image
              src="/hero.jpg"
              alt="趙玴祥 Wilson Chao"
              fill
              className="object-cover"
              priority
            />
          </div>
          <div className="space-y-3 text-center sm:text-left">
            <h1 className="text-3xl font-semibold leading-tight text-[var(--foreground)] sm:text-4xl">
              {siteCopy.heroTitle}
            </h1>
            <p className="text-lg text-[var(--muted)]">{siteCopy.heroSubtitle}</p>
            <div className="max-w-2xl space-y-3 text-base leading-relaxed text-[var(--muted)]">
              {heroIntroParagraphs.map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>
          </div>
        </div>
      </header>

      <nav className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Link
          href="/blog"
          className="surface-card group flex flex-col gap-2 px-5 py-4 transition-transform hover:-translate-y-0.5"
        >
          <span className="text-2xl">📝</span>
          <span className="text-base font-semibold text-[var(--foreground)] group-hover:text-[var(--accent)]">Blog</span>
          <span className="text-sm leading-snug text-[var(--muted)]">長一點的文章。寫醫院裡看到的、AI 怎麼改變我的日常、還有那些想很久才想通的事。</span>
        </Link>
        <Link
          href="/now"
          className="surface-card group flex flex-col gap-2 px-5 py-4 transition-transform hover:-translate-y-0.5"
        >
          <span className="text-2xl">⏳</span>
          <span className="text-base font-semibold text-[var(--foreground)] group-hover:text-[var(--accent)]">Now</span>
          <span className="text-sm leading-snug text-[var(--muted)]">我現在在幹嘛——在哪裡值班、在做什麼研究、最近在聽什麼。會一直更新。</span>
        </Link>
        <Link
          href="/stream"
          className="surface-card group flex flex-col gap-2 px-5 py-4 transition-transform hover:-translate-y-0.5"
        >
          <span className="text-2xl">🌊</span>
          <span className="text-base font-semibold text-[var(--foreground)] group-hover:text-[var(--accent)]">Stream</span>
          <span className="text-sm leading-snug text-[var(--muted)]">每天的腦內碎片。有時候是手術後的感想，有時候是半夜聽到一首歌，有時候就只是廢話。</span>
        </Link>
        <Link
          href="/blogroll"
          className="surface-card group flex flex-col gap-2 px-5 py-4 transition-transform hover:-translate-y-0.5"
        >
          <span className="text-2xl">📜</span>
          <span className="text-base font-semibold text-[var(--foreground)] group-hover:text-[var(--accent)]">Blogroll</span>
          <span className="text-sm leading-snug text-[var(--muted)]">我在讀的部落格。看看別人怎麼過日子、怎麼想事情。</span>
        </Link>
      </nav>

      <section className="section-block">
        <div className="flex items-baseline justify-between gap-3">
          <span className="section-title">Latest Blog</span>
          <Link
            href="/blog"
            className="text-sm text-[var(--muted)] underline decoration-[var(--border)] underline-offset-8 transition-colors hover:text-[var(--accent-strong)]"
          >
            Read more →
          </Link>
        </div>
        <div className="space-y-5">
          {latest.map((post) => (
            <article
              key={post.slug}
              className="surface-card px-5 py-4 transition-transform hover:-translate-y-0.5"
            >
              <div className="flex items-center justify-between text-sm text-[var(--muted)]">
                <span>{post.type}</span>
                <span>{post.publishedAt}</span>
              </div>
              <h3 className="pt-1 text-xl font-semibold text-[var(--foreground)]">
                <Link href={`/blog/${post.slug}`} className="hover:text-[var(--accent)]">
                  {post.title}
                </Link>
              </h3>
              <p className="text-[var(--muted)] leading-relaxed">{post.excerpt}</p>
              <div className="pt-2 text-sm text-[var(--muted)]">
                {post.readingTime ? `${post.readingTime} read` : "Read time TBD"}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="section-block">
        <span className="section-title">Stream</span>
        <div className="surface-card px-5 py-6 space-y-4">
          <p className="text-base text-[var(--muted)]">{siteCopy.murmurIntro}</p>
          {murmur.length > 0 ? (
            <div className="space-y-3">
              {murmur.map((item) => (
                <div
                  key={item.link || item.title}
                  className="space-y-1 rounded-md border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-3"
                >
                  <a
                    href={item.link}
                    className="block text-sm text-[var(--foreground)] hover:text-[var(--accent)] break-words overflow-hidden"
                    target="_blank"
                    rel="noreferrer"
                  >
                    <span className="leading-relaxed">{item.description || item.title}</span>
                  </a>
                  {item.pubDate ? (
                    <p className="text-xs tracking-[0.18em] text-[var(--muted)] text-right">
                      {formatMurmurDate(item.pubDate)}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          ) : null}
          <div className="pt-2">
            <Link
              href="/stream"
              className="inline-flex items-center text-sm font-medium text-[var(--foreground)] underline decoration-[var(--border)] underline-offset-8 transition-colors hover:text-[var(--accent-strong)]"
            >
              {murmur.length > 0 ? "Read more →" : siteCopy.murmurCTA}
            </Link>
          </div>
        </div>
      </section>

      <section className="section-block">
        <div className="flex items-baseline justify-between gap-3">
          <span className="section-title">Journal</span>
          <Link
            href="/journal"
            className="text-sm text-[var(--muted)] underline decoration-[var(--border)] underline-offset-8 transition-colors hover:text-[var(--accent-strong)]"
          >
            Read more →
          </Link>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          {latestDaily.map((project) => (
            <div
              key={project.title}
              className="surface-card px-5 py-4 transition-transform hover:-translate-y-0.5"
            >
              <h3 className="text-lg font-semibold text-[var(--foreground)]">
                {project.slug
                  ? (
                    <Link href={`/journal/${project.slug}`} className="hover:text-[var(--accent)]">
                      {project.title}
                    </Link>
                    )
                  : project.href && (project.href.startsWith("/") || project.href.startsWith("http"))
                    ? (
                      <Link href={project.href} className="hover:text-[var(--accent)]">
                        {project.title}
                      </Link>
                      )
                    : project.title}
              </h3>
              <p className="text-sm text-[var(--muted)]">{project.description}</p>
              {project.date ? (
                <p className="pt-1 text-xs uppercase tracking-[0.14em] text-[var(--muted)]">
                  {project.date}
                </p>
              ) : null}
            </div>
          ))}
        </div>
      </section>

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
