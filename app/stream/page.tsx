import { loadStreamEntries, loadSiteCopy } from "@/lib/content";
import { StreamList } from "@/components/stream/StreamList";

export const revalidate = 60;

export const metadata = {
  title: "Stream — Wilson Chao",
  description: "日常的腦內碎片——想法、電影、音樂，都在這裡流過。",
};

export default async function StreamPage() {
  const [entries, copy] = await Promise.all([
    loadStreamEntries(999),
    loadSiteCopy(),
  ]);

  return (
    <main className="page-shell space-y-6">
      <header className="space-y-2">
        <span className="section-title">Stream</span>
        <h1 className="text-3xl font-semibold text-[var(--foreground)]">腦內記事</h1>
        <p className="max-w-2xl text-base text-[var(--muted)]">{copy.murmurIntro}</p>
      </header>

      <StreamList entries={entries} />

      <div className="surface-card px-5 py-4 text-center space-y-2">
        <p className="text-sm text-[var(--muted)]">
          💬 即時版在 Telegram — 想第一時間看到？
        </p>
        <a
          href="https://t.me/doctormomo"
          className="inline-flex items-center text-sm font-medium text-[var(--foreground)] underline decoration-[var(--border)] underline-offset-8 transition-colors hover:text-[var(--accent-strong)]"
          target="_blank"
          rel="noopener noreferrer"
        >
          訂閱頻道 →
        </a>
      </div>
    </main>
  );
}
