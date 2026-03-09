import type { Metadata } from "next";
import Link from "next/link";
import { CopyButton } from "@/components/ui/CopyButton";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://wilsonchao.com";

export const metadata: Metadata = {
  title: "RSS Feeds — Wilson Chao",
  description: "訂閱 wilsonchao.com 的 RSS feeds — Blog、Journal、Stream。",
  alternates: { canonical: `${BASE_URL}/feed` },
};

const feeds = [
  {
    name: "All",
    path: "/feed.xml",
    description: "所有內容：Blog 長文 + Journal 週報，一個 feed 搞定。",
    emoji: "📡",
  },
  {
    name: "Blog",
    path: "/blog/feed.xml",
    description: "長文：醫學、故事、思考。不定期更新。",
    emoji: "📝",
  },
  {
    name: "Journal",
    path: "/journal/feed.xml",
    description: "週報、生活筆記、人生紀錄。大約每週一篇。",
    emoji: "📓",
  },
  {
    name: "Stream",
    path: "/stream/feed.xml",
    description: "日常的腦內碎片——想法、電影、音樂。幾乎每天。",
    emoji: "🌊",
  },
];

export default function FeedPage() {
  return (
    <main className="page-shell space-y-6">
      <header className="space-y-2">
        <span className="section-title">RSS</span>
        <h1 className="text-3xl font-semibold text-[var(--foreground)]">Subscribe</h1>
        <p className="max-w-2xl text-base text-[var(--muted)]">
          用你喜歡的 RSS reader 訂閱。不用帳號、不用演算法。
        </p>
      </header>

      <div className="surface-card flex flex-col items-center gap-3 rounded-xl border border-[var(--border)] px-5 py-5 text-center sm:flex-row sm:text-left">
        <div className="flex-1 space-y-1">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">📦 一鍵全部訂閱</h2>
          <p className="text-sm text-[var(--muted)]">
            下載 OPML 檔案，匯入你的 RSS reader 即可訂閱全部 feed。
          </p>
        </div>
        <Link
          href="/feed/opml"
          className="inline-flex items-center gap-2 rounded-full bg-[var(--foreground)] px-5 py-2.5 text-sm font-medium text-[var(--background)] transition-opacity hover:opacity-80"
          download="wilsonchao-feeds.opml"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          下載 OPML
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {feeds.map((feed) => (
          <div
            key={feed.name}
            className="surface-card space-y-3 rounded-xl border border-[var(--border)] px-5 py-4"
          >
            <div className="flex items-center gap-2">
              <span className="text-xl">{feed.emoji}</span>
              <h2 className="text-lg font-semibold text-[var(--foreground)]">{feed.name}</h2>
            </div>
            <p className="text-sm leading-relaxed text-[var(--muted)]">{feed.description}</p>
            <div className="flex flex-wrap items-center gap-2">
              <CopyButton url={`${BASE_URL}${feed.path}`} />
              <code className="text-[10px] text-[var(--muted)]/60 break-all">
                {BASE_URL}{feed.path}
              </code>
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-2 border-t border-[var(--border)] pt-6 text-sm text-[var(--muted)]">
        <p>
          <strong className="text-[var(--foreground)]">什麼是 RSS？</strong>{" "}
          一種讓你在自己的 reader 裡追蹤網站更新的格式。推薦用{" "}
          <a
            href="https://readwise.io/read"
            target="_blank"
            rel="noopener noreferrer"
            className="underline decoration-[var(--border)] underline-offset-4 hover:text-[var(--accent)]"
          >
            Readwise Reader
          </a>
          、
          <a
            href="https://netnewswire.com"
            target="_blank"
            rel="noopener noreferrer"
            className="underline decoration-[var(--border)] underline-offset-4 hover:text-[var(--accent)]"
          >
            NetNewsWire
          </a>{" "}
          或{" "}
          <a
            href="https://feedly.com"
            target="_blank"
            rel="noopener noreferrer"
            className="underline decoration-[var(--border)] underline-offset-4 hover:text-[var(--accent)]"
          >
            Feedly
          </a>
          。
        </p>
      </div>
    </main>
  );
}
