import { notFound } from "next/navigation";
import Link from "next/link";
import { slides } from "@/lib/teaching-slides";
import { handouts } from "@/lib/teaching-handouts";

export function generateStaticParams() {
  return Object.keys(slides).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const slide = slides[slug];
  if (!slide) return {};
  return {
    title: `${slide.title} — Teaching | Wilson Chao`,
    description: slide.subtitle,
  };
}

function Section({ title, emoji, children }: { title: string; emoji?: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-gray-900 dark:text-white">
        {emoji && <span className="text-2xl">{emoji}</span>}
        {title}
      </h2>
      {children}
    </section>
  );
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 p-5 ${className}`}>
      {children}
    </div>
  );
}

export default async function TeachingHandout({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const slide = slides[slug];
  const handout = handouts[slug];
  if (!slide) notFound();

  // If no handout data, redirect-style: show presentation link only
  if (!handout || handout.sections.length === 0) {
    // For clerk-orientation, redirect to /clerk page
    if (slug === "clerk-orientation") {
      return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
          <header className="bg-gradient-to-br from-[#001219] via-[#005f73] to-[#0a9396] text-white">
            <div className="max-w-3xl mx-auto px-6 py-16">
              <p className="text-cyan-300 text-sm font-medium mb-2 tracking-wider uppercase">KMUH Cardiovascular Surgery</p>
              <h1 className="text-4xl font-bold mb-3">{slide.title}</h1>
              <p className="text-lg text-cyan-100 mb-1">{slide.subtitle}</p>
              <div className="mt-6 flex gap-3">
                <Link
                  href={`/teaching/${slug}/present`}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-medium text-sm transition-colors border border-white/20"
                >
                  <span>▶</span> 開始 Presentation
                </Link>
                <Link
                  href="/clerk"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-white font-medium text-sm transition-colors border border-cyan-400/30"
                >
                  📋 完整講義
                </Link>
              </div>
            </div>
          </header>
        </div>
      );
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Hero */}
      <header className="bg-gradient-to-br from-[#001219] via-[#005f73] to-[#0a9396] text-white">
        <div className="max-w-3xl mx-auto px-6 py-16">
          <div className="flex items-center gap-2 mb-4">
            <Link href="/teaching" className="text-cyan-300 hover:text-white text-sm transition-colors">
              ← 教學首頁
            </Link>
          </div>
          <div className="text-5xl mb-4">{handout?.emoji || "📖"}</div>
          <h1 className="text-3xl font-bold mb-2">{slide.title}</h1>
          <p className="text-lg text-cyan-100">{slide.subtitle}</p>
          {handout && (
            <p className="text-cyan-200/70 text-sm mt-2">⏱ {handout.duration}</p>
          )}
          <div className="mt-6">
            <Link
              href={`/teaching/${slug}/present`}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-medium text-sm transition-colors border border-white/20"
            >
              <span>▶</span> 開始 Presentation
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12">
        {/* Learning Objectives */}
        {handout && handout.objectives.length > 0 && (
          <Section title="學習目標" emoji="🎯">
            <Card>
              <ul className="space-y-2">
                {handout.objectives.map((obj, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="mt-1.5 w-5 h-5 rounded-full bg-cyan-100 dark:bg-cyan-900/40 text-cyan-700 dark:text-cyan-300 flex items-center justify-center text-xs font-bold shrink-0">
                      {i + 1}
                    </span>
                    <span className="text-gray-700 dark:text-gray-300">{obj}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </Section>
        )}

        {/* Content Sections */}
        {handout && handout.sections.map((section, i) => (
          <Section key={i} title={section.title} emoji={section.emoji}>
            <Card>
              <div
                className="prose prose-sm dark:prose-invert max-w-none
                  prose-table:w-full prose-table:text-sm
                  prose-th:bg-gray-100 dark:prose-th:bg-gray-700 prose-th:px-3 prose-th:py-2 prose-th:text-left
                  prose-td:px-3 prose-td:py-2 prose-td:border-t prose-td:border-gray-200 dark:prose-td:border-gray-700
                  prose-strong:text-gray-900 dark:prose-strong:text-white
                  prose-li:text-gray-700 dark:prose-li:text-gray-300"
                dangerouslySetInnerHTML={{ __html: section.content }}
              />
            </Card>
          </Section>
        ))}

        {/* Key Takeaways */}
        {handout && handout.keyTakeaways.length > 0 && (
          <Section title="Key Takeaways" emoji="💡">
            <div className="rounded-xl bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-cyan-900/20 dark:to-blue-900/20 border border-cyan-200 dark:border-cyan-800 p-6">
              <ul className="space-y-3">
                {handout.keyTakeaways.map((t, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="text-cyan-600 dark:text-cyan-400 mt-0.5">✦</span>
                    <span className="text-gray-800 dark:text-gray-200 font-medium">{t}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Section>
        )}

        {/* Presentation CTA */}
        <div className="mt-12 text-center">
          <Link
            href={`/teaching/${slug}/present`}
            className="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-[#001219] hover:bg-[#002a3a] text-white font-semibold transition-colors"
          >
            ▶ 開始 Presentation
          </Link>
          <p className="text-sm text-gray-400 mt-2">← → 翻頁 · F 全螢幕 · ESC 總覽</p>
        </div>

        {/* Footer */}
        <footer className="text-center text-gray-400 dark:text-gray-600 text-sm pt-8 pb-12 border-t border-gray-200 dark:border-gray-800 mt-12">
          <p>Wilson Chao — 高醫心臟外科</p>
          <p className="mt-1">
            <Link href="/teaching" className="text-cyan-600 dark:text-cyan-400 hover:underline">
              ← 回教學首頁
            </Link>
          </p>
        </footer>
      </main>
    </div>
  );
}
