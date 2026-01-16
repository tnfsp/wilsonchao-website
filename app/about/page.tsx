import Image from "next/image";
import { marked } from "marked";
import { loadSiteCopy } from "@/lib/content";

const BASE_URL = "https://wilsonchao.com";

export default async function AboutPage() {
  const copy = await loadSiteCopy();
  const bodyHtml = copy.aboutBody ? marked.parse(copy.aboutBody, { breaks: true }) : "";

  const personJsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: copy.aboutName || "Yi-Hsiang Chao",
    url: `${BASE_URL}/about`,
    image: copy.aboutImage || `${BASE_URL}/avatar.png`,
    jobTitle: "Physician",
    description: copy.aboutIntro || "",
    sameAs: [
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
    </main>
    </>
  );
}
