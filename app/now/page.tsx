import type { Metadata } from "next";
import Link from "next/link";
import { loadNowData, isStale } from "@/lib/now";
import { NowDynamicGrid } from "@/components/now/NowDynamicGrid";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.wilsonchao.com";

export const revalidate = 3600; // ISR: hourly

export const metadata: Metadata = {
  title: "Now — Wilson Chao",
  description: "趙玴祥現在在忙什麼——臨床、研究、寫作、造東西。",
  alternates: { canonical: `${BASE_URL}/now` },
};

/* Fallback when now.json fails */
const FALLBACK_SECTIONS = [
  { id: "clinical", emoji: "🏥", title: "臨床", body: "在高醫心臟血管外科當總醫師，八月升主治。" },
  { id: "research", emoji: "📚", title: "研究", body: "NMA + Case Report 進行中。" },
  { id: "writing", emoji: "✍️", title: "寫作", body: "短文、碎片、長文。" },
  { id: "building", emoji: "🤖", title: "在蓋的東西", body: "AI-assisted 個人系統。" },
  { id: "other", emoji: "🎵", title: "其他", body: "DJ、健身、走路。" },
];

function formatLastUpdated(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("zh-TW", { year: "numeric", month: "long", day: "numeric" });
  } catch {
    return "";
  }
}

export default async function NowPage() {
  const data = await loadNowData();
  const sections = data?.sections?.length ? data.sections : FALLBACK_SECTIONS;
  const lastUpdated = data?.lastUpdated || "";
  const stale = lastUpdated ? isStale(lastUpdated) : false;
  const hasDynamic = data?.dynamic && Object.values(data.dynamic).some((a) => a.length > 0);

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: BASE_URL },
      { "@type": "ListItem", position: 2, name: "Now", item: `${BASE_URL}/now` },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbJsonLd).replace(/<\/script/gi, "<\\/script"),
        }}
      />
      <main className="page-shell space-y-6">
        {/* Header */}
        <header className="space-y-2">
          <span className="section-title">Now</span>
          <h1 className="text-3xl font-semibold text-[var(--foreground)]">
            What I&apos;m focusing on
          </h1>
          {lastUpdated && (
            <p className="text-sm text-[var(--muted)]">
              最後更新：<time dateTime={lastUpdated}>{formatLastUpdated(lastUpdated)}</time>
              {stale && (
                <span className="ml-2 text-xs text-[var(--muted)]/50">· 可能不是最新的</span>
              )}
            </p>
          )}
        </header>

        {/* Static sections */}
        <div className="space-y-5">
          {sections.map((s) => (
            <section key={s.id} className="space-y-1.5">
              <h2 className="text-lg font-semibold text-[var(--foreground)]">
                {s.emoji} {s.title}
              </h2>
              <p className="leading-relaxed text-[var(--muted)]">{s.body}</p>
            </section>
          ))}
        </div>

        {/* Dynamic sections */}
        {hasDynamic && data?.dynamic && (
          <>
            <hr className="border-[var(--border)]" />
            <NowDynamicGrid dynamic={data.dynamic} />
          </>
        )}

        {/* Stream CTA when no dynamic */}
        {!hasDynamic && (
          <p className="text-sm text-[var(--muted)]">
            更多碎片在{" "}
            <Link href="/stream" className="underline decoration-[var(--border)] underline-offset-4 hover:text-[var(--accent)]">
              Stream →
            </Link>
          </p>
        )}

        {/* Footer */}
        <footer className="space-y-3 border-t border-[var(--border)] pt-6">
          <p className="text-[var(--muted)]">
            想聊這些？{" "}
            <a
              href="mailto:momobear.doctor@gmail.com"
              className="underline decoration-[var(--border)] underline-offset-4 transition-colors hover:text-[var(--accent)]"
            >
              寫信給我
            </a>{" "}
            或{" "}
            <a
              href="https://instagram.com/momobear_doctor"
              target="_blank"
              rel="noopener noreferrer"
              className="underline decoration-[var(--border)] underline-offset-4 transition-colors hover:text-[var(--accent)]"
            >
              IG @momobear_doctor
            </a>
          </p>
          <p className="text-xs text-[var(--muted)]/60">
            Inspired by{" "}
            <a
              href="https://nownownow.com"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-4 hover:text-[var(--accent)]"
            >
              nownownow.com
            </a>
          </p>
        </footer>
      </main>
    </>
  );
}
