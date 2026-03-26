import Image from "next/image";
import Link from "next/link";
import { marked } from "marked";
import { loadSiteCopy, linkItems } from "@/lib/content";
import { sanitizeHtml } from "@/lib/sanitize";
import { ViewStats } from "@/components/ui/ViewCounter";

const BASE_URL = "https://wilsonchao.com";

export const metadata = {
  alternates: { canonical: `${BASE_URL}/about` },
};

/* ── Core social links (hero icons) ── */
const SOCIAL_ICONS = [
  {
    label: "Instagram",
    href: "https://www.instagram.com/momobear_doctor",
    external: true,
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="2" width="20" height="20" rx="5" />
        <circle cx="12" cy="12" r="5" />
        <circle cx="17.5" cy="6.5" r="1.25" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    label: "Telegram",
    href: "https://t.me/doctormomo",
    external: true,
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 2L11 13" />
        <path d="M22 2L15 22L11 13L2 9L22 2Z" />
      </svg>
    ),
  },
  {
    label: "RSS",
    href: "/feed",
    external: false,
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 11a9 9 0 0 1 9 9" />
        <path d="M4 4a16 16 0 0 1 16 16" />
        <circle cx="5" cy="19" r="1.5" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    label: "Email",
    href: "mailto:aa2670095@gmail.com",
    external: true,
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="4" width="20" height="16" rx="2" />
        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
      </svg>
    ),
  },
];

/* ── Footer links (kept minimal) ── */
const FOOTER_LINKS = [
  {
    label: "Blogroll",
    href: "/blogroll",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <line x1="8" y1="6" x2="21" y2="6" />
        <line x1="8" y1="12" x2="21" y2="12" />
        <line x1="8" y1="18" x2="21" y2="18" />
        <line x1="3" y1="6" x2="3.01" y2="6" />
        <line x1="3" y1="12" x2="3.01" y2="12" />
        <line x1="3" y1="18" x2="3.01" y2="18" />
      </svg>
    ),
  },
  {
    label: "Website",
    href: "/",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
];

/* ── Core labels for filtering (kept for data compat) ── */
const CORE_LABELS = [
  "📸 Instagram｜追蹤生活更新",
  "📨 Telegram｜即時通知",
  "📰 RSS｜訂閱文章",
];

export default async function AboutPage() {
  const copy = await loadSiteCopy();
  const bodyHtml = copy.aboutBody ? await marked.parse(copy.aboutBody, { breaks: true }) : "";

  const allLinks = linkItems.filter((item) => item.href !== "/about");
  const coreLinks = allLinks.filter((item) => CORE_LABELS.includes(item.label));
  const secondaryLinks = allLinks.filter((item) => !CORE_LABELS.includes(item.label));

  const personJsonLd = {
    "@context": "https://schema.org",
    "@type": ["Person", "Physician"],
    "@id": `${BASE_URL}/#person`,
    name: "趙玴祥",
    alternateName: ["Yi-Hsiang Chao", "Wilson Chao"],
    url: `${BASE_URL}/about`,
    image: copy.aboutImage || `${BASE_URL}/avatar.png`,
    jobTitle: "心臟血管外科醫師",
    description: "高雄醫學大學附設中和紀念醫院心臟血管外科醫師。專長冠狀動脈繞道手術、心臟瓣膜手術、主動脈手術。同時是寫作者與內容創作者。",
    medicalSpecialty: {
      "@type": "MedicalSpecialty",
      name: "Cardiovascular Surgery",
    },
    affiliation: {
      "@type": "Hospital",
      name: "高雄醫學大學附設中和紀念醫院",
      alternateName: "Kaohsiung Medical University Chung-Ho Memorial Hospital",
      url: "https://www.kmuh.org.tw",
      address: {
        "@type": "PostalAddress",
        streetAddress: "自由一路100號",
        addressLocality: "高雄市",
        addressRegion: "三民區",
        postalCode: "807",
        addressCountry: "TW",
      },
    },
    alumniOf: {
      "@type": "CollegeOrUniversity",
      name: "高雄醫學大學",
      alternateName: "Kaohsiung Medical University",
    },
    knowsAbout: [
      "Cardiovascular Surgery",
      "Coronary Artery Bypass Grafting",
      "Heart Valve Surgery",
      "Aortic Surgery",
    ],
    knowsLanguage: ["zh-TW", "en"],
    sameAs: [
      "https://www.instagram.com/momobear_doctor",
      "https://murmur.wilsonchao.com",
      "https://t.me/doctormomo",
    ],
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${BASE_URL}/about`,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }}
      />
      <main className="page-shell">
        {/* Hero: Avatar left, Name + Intro + Icons stacked right */}
        <header className="pb-8">
          <span className="section-title">About</span>
          <div className="mt-4 flex items-stretch gap-5 sm:gap-6">
            {copy.aboutImage ? (
              <Image
                src={copy.aboutImage}
                alt="Portrait"
                width={128}
                height={128}
                className="w-20 sm:w-[7rem] shrink-0 self-stretch rounded-full border border-[var(--border)] object-cover aspect-square"
                unoptimized
                priority={false}
              />
            ) : null}
            <div className="min-w-0 flex-1 space-y-2">
              <h1 className="text-2xl sm:text-3xl font-semibold text-[var(--foreground)] leading-tight">
                {copy.aboutName}
              </h1>
              {copy.aboutIntro ? (
                <p className="text-[0.95rem] leading-relaxed text-[var(--muted)]">
                  {copy.aboutIntro}
                </p>
              ) : null}
              {/* Social Icons — under intro text */}
              <div className="flex items-center gap-2 pt-1">
                {SOCIAL_ICONS.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    title={item.label}
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border)] text-[var(--muted)] transition-all duration-200 hover:border-[var(--accent)] hover:text-[var(--accent)] hover:bg-[var(--surface)]"
                    target={item.external ? "_blank" : undefined}
                    rel={item.external ? "noreferrer" : undefined}
                  >
                    {item.icon}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </header>

        {/* Professional Card — AEO: 給 AI 引擎抽取事實用 */}
        <aside className="mb-8 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-5 py-3.5 space-y-0.5 text-sm text-[var(--muted)] max-w-sm">
          <p className="font-medium text-[var(--foreground)]">心臟血管外科醫師</p>
          <p>高雄醫學大學附設中和紀念醫院</p>
          <p className="text-xs pt-1 opacity-60">冠狀動脈繞道手術・心臟瓣膜手術・主動脈手術</p>
        </aside>

        {/* Markdown Body */}
        <article
          className="about-prose text-[var(--foreground)]"
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(bodyHtml) }}
        />

        {/* Footer — matching homepage style */}
        <footer className="border-t border-[var(--border)] pt-6 text-sm text-[var(--muted)]">
          <div className="flex items-center justify-between">
            <span>{copy.footerText || "只代表個人意見，半手工打造"}</span>
            <div className="flex items-center gap-1">
              {SOCIAL_ICONS.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  title={item.label}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--muted)] transition-all duration-200 hover:text-[var(--accent)]"
                  target={item.external ? "_blank" : undefined}
                  rel={item.external ? "noreferrer" : undefined}
                >
                  {item.icon}
                </Link>
              ))}
            </div>
          </div>

        </footer>
      </main>

      {/* Scoped prose styles for about body */}
      <style>{`
        .about-prose {
          font-size: 1rem;
          line-height: 1.8;
        }
        .about-prose h2 {
          font-size: 1.2rem;
          font-weight: 600;
          color: var(--foreground);
          display: inline-block;
          background: var(--highlight);
          padding: 0.15rem 0.5rem;
          border-radius: 0.25rem;
          margin-top: 2.5rem;
          margin-bottom: 0.75rem;
        }
        .about-prose h3 {
          font-size: 1.1rem;
          font-weight: 600;
          color: var(--foreground);
          margin-top: 2rem;
          margin-bottom: 0.5rem;
        }
        .about-prose p {
          margin: 0.75rem 0;
          color: var(--foreground);
          opacity: 0.85;
        }
        .about-prose ul,
        .about-prose ol {
          margin: 0.75rem 0;
          padding-left: 1.25rem;
          color: var(--foreground);
          opacity: 0.85;
        }
        .about-prose ul { list-style: disc; }
        .about-prose ol { list-style: decimal; }
        .about-prose li {
          margin: 0.35rem 0;
          line-height: 1.7;
        }
        .about-prose a {
          color: var(--accent);
          text-decoration: underline;
          text-underline-offset: 3px;
          text-decoration-color: var(--border);
          transition: color 0.15s;
        }
        .about-prose a:hover {
          color: var(--accent-strong);
        }
        .about-prose blockquote {
          border-left: 2px solid var(--border);
          padding-left: 0.75rem;
          font-style: italic;
          color: var(--muted);
        }
        .about-prose hr {
          border: none;
          border-top: 1px solid var(--border);
          margin: 2rem 0;
        }
        /* First h2 needs less top margin */
        .about-prose > h2:first-child {
          margin-top: 0;
        }
      `}</style>
    </>
  );
}
