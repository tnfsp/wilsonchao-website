import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "找不到頁面 — Wilson Chao",
  description: "這個頁面不存在，可能是舊連結或打錯網址。",
};

export default function NotFound() {
  return (
    <main className="page-shell flex min-h-[60vh] flex-col items-center justify-center text-center">
      <p className="text-6xl font-bold text-[var(--muted)] opacity-30">404</p>
      <h1 className="mt-4 text-xl font-semibold text-[var(--foreground)]">
        這個頁面不存在
      </h1>
      <p className="mt-2 text-sm text-[var(--muted)]">
        可能是舊連結，也可能是打錯網址。
      </p>
      <div className="mt-8 flex gap-3">
        <Link
          href="/"
          className="rounded-full border border-[var(--border)] px-5 py-2 text-sm font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--highlight)] hover:text-[var(--accent)]"
        >
          回首頁
        </Link>
        <Link
          href="/blog"
          className="rounded-full border border-[var(--border)] px-5 py-2 text-sm font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--highlight)] hover:text-[var(--accent)]"
        >
          看文章
        </Link>
      </div>
    </main>
  );
}
