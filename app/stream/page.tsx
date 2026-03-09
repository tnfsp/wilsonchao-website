import Link from "next/link";
import { loadStreamEntries, loadSiteCopy } from "@/lib/content";

export const metadata = {
  title: "Stream — Wilson Chao",
  description: "日常的腦內碎片——想法、電影、音樂，都在這裡流過。",
};

export default async function StreamPage() {
  const [entries, copy] = await Promise.all([
    loadStreamEntries(20),
    loadSiteCopy(),
  ]);

  const formatDate = (value?: string) => {
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
    <main className="page-shell space-y-6">
      <header className="space-y-2">
        <span className="section-title">Stream</span>
        <h1 className="text-3xl font-semibold text-[var(--foreground)]">腦內記事</h1>
        <p className="max-w-2xl text-base text-[var(--muted)]">{copy.murmurIntro}</p>
      </header>

      <div className="space-y-3">
        {entries.length > 0 ? (
          entries.map((item) => (
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
                <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--muted)] text-right">
                  {formatDate(item.pubDate)}
                </p>
              ) : null}
            </div>
          ))
        ) : (
          <p className="text-sm text-[var(--muted)]">No entries yet.</p>
        )}
      </div>

      <div className="pt-2">
        <a
          href="https://murmur.wilsonchao.com"
          className="inline-flex items-center text-sm font-medium text-[var(--foreground)] underline decoration-[var(--border)] underline-offset-8 transition-colors hover:text-[var(--accent-strong)]"
          target="_blank"
          rel="noreferrer"
        >
          Read full archive →
        </a>
      </div>
    </main>
  );
}
