import Image from "next/image";
import Link from "next/link";
import { marked } from "marked";
import { loadSiteCopy, linkItems } from "@/lib/content";
import { sanitizeHtml } from "@/lib/sanitize";

const BASE_URL = "https://wilsonchao.com";

export const metadata = {
  alternates: { canonical: `${BASE_URL}/about` },
};

export default async function AboutPage() {
  const copy = await loadSiteCopy();
  const bodyHtml = copy.aboutBody ? await marked.parse(copy.aboutBody, { breaks: true }) : "";

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
        {/* Hero: Avatar + Name + Intro */}
        <header className="pb-8">
          <span className="section-title">About</span>
          <div className="mt-4 flex items-center gap-5 sm:gap-6">
            {copy.aboutImage ? (
              <Image
                src={copy.aboutImage}
                alt="Portrait"
                width={96}
                height={96}
                className="h-20 w-20 sm:h-24 sm:w-24 shrink-0 rounded-full border border-[var(--border)] object-cover"
                unoptimized
                priority={false}
              />
            ) : null}
            <div className="space-y-1.5">
              <h1 className="text-2xl sm:text-3xl font-semibold text-[var(--foreground)] leading-tight">
                {copy.aboutName}
              </h1>
              {copy.aboutIntro ? (
                <p className="text-[0.95rem] leading-relaxed text-[var(--muted)]">
                  {copy.aboutIntro}
                </p>
              ) : null}
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

        {/* 找到我 + Now */}
        <section className="mt-12 pt-8 border-t border-[var(--border)]">
          <h2 className="text-xl font-semibold inline-block bg-[var(--highlight)] px-2 py-0.5 rounded text-[var(--foreground)] mb-4">
            找到我
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg">
            {linkItems
              .filter((item) => item.href !== "/about")
              .map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-center text-sm text-[var(--foreground)] shadow-[0_8px_24px_rgba(0,18,25,0.04)] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
                  target={item.external ? "_blank" : undefined}
                  rel={item.external ? "noreferrer" : undefined}
                >
                  {item.label}
                </Link>
              ))}
          </div>
          <p className="mt-8 text-sm text-[var(--muted)]">
            感謝你逛到這裡，交個朋友吧！
          </p>
        </section>
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
