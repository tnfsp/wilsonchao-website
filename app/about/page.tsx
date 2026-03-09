import Image from "next/image";
import Link from "next/link";
import { marked } from "marked";
import { loadSiteCopy, linkItems } from "@/lib/content";

const BASE_URL = "https://wilsonchao.com";

export default async function AboutPage() {
  const copy = await loadSiteCopy();
  const bodyHtml = copy.aboutBody ? marked.parse(copy.aboutBody, { breaks: true }) : "";

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
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }}
      />
    <main className="page-shell space-y-6">
      <header className="space-y-3">
        <span className="section-title">About</span>
        <div className="flex flex-col gap-3">
          <div className="flex items-start gap-4">
            {copy.aboutImage ? (
              <Image
                src={copy.aboutImage}
                alt="Portrait"
                width={80}
                height={80}
                className="h-20 w-20 rounded-full border border-[var(--border)] object-cover"
                unoptimized
                priority={false}
              />
            ) : null}
            <div className="space-y-1">
              <h1 className="text-3xl font-semibold text-[var(--foreground)]">{copy.aboutName}</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="space-y-4 text-[var(--muted)]">
        <div
          className="[&_p]:my-3 [&_p]:leading-relaxed [&_h1]:text-2xl [&_h1]:font-semibold [&_h1]:text-[var(--foreground)] [&_h2]:text-xl [&_h2]:inline-block [&_h2]:bg-[var(--highlight)] [&_h2]:px-2 [&_h2]:py-0.5 [&_h2]:rounded [&_h3]:text-lg [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_blockquote]:border-l-2 [&_blockquote]:border-[var(--border)] [&_blockquote]:pl-3 [&_blockquote]:italic"
          dangerouslySetInnerHTML={{ __html: bodyHtml }}
        />
      </div>

      <section className="space-y-3 pt-6 border-t border-[var(--border)]">
        <h2 className="text-xl font-semibold inline-block bg-[var(--highlight)] px-2 py-0.5 rounded text-[var(--foreground)]">Links</h2>
        <div className="flex flex-col gap-3 max-w-md">
          {linkItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-center text-[var(--foreground)] shadow-[0_12px_34px_rgba(0,18,25,0.06)] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
              target={item.external ? "_blank" : undefined}
              rel={item.external ? "noreferrer" : undefined}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </section>
    </main>
    </>
  );
}
