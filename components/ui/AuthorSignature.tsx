import Image from "next/image";
import { WritingHeatmap } from "./WritingHeatmap";

export function AuthorSignature() {
  return (
    <div className="pt-6 border-t border-[var(--border)]">
      <div className="flex items-start gap-4">
        <Image
          src="/hero.jpg"
          alt="趙玴祥 Doctor MOMO"
          width={64}
          height={64}
          className="rounded-full object-cover shrink-0"
          style={{ width: 64, height: 64 }}
        />
        <div className="space-y-1">
          <p className="text-base font-semibold text-[var(--foreground)]">
            趙玴祥 Doctor MOMO
          </p>
          <p className="text-sm text-[var(--muted)]">
            一個自由而好奇的人，剛好在開心臟。
          </p>
          <div className="flex gap-3 pt-1 text-xs text-[var(--muted)]">
            <a
              href="https://instagram.com/momobear_doctor"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[var(--accent)] transition-colors"
            >
              Instagram
            </a>
            <a
              href="https://threads.net/@momobear_doctor"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[var(--accent)] transition-colors"
            >
              Threads
            </a>
            <a
              href="https://t.me/doctormomo"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[var(--accent)] transition-colors"
            >
              Telegram
            </a>
          </div>
        </div>
      </div>
      <WritingHeatmap weeks={52} />
    </div>
  );
}
