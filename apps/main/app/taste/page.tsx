import Link from "next/link";
import { loadTasteEntries } from "@/lib/content";
import { TasteShelf } from "@/components/taste/TasteShelf";
import { BASE_URL } from "@/lib/constants";

export const revalidate = 60;

export const metadata = {
  title: "Taste — Wilson Chao",
  description: "我喜歡的東西——音樂、書、電影。形塑我的那些。",
  alternates: { canonical: `${BASE_URL}/taste` },
  openGraph: {
    title: "Taste — Wilson Chao",
    description: "我喜歡的東西——音樂、書、電影。形塑我的那些。",
    url: `${BASE_URL}/taste`,
    type: "website",
    images: [{ url: "/opengraph-image", width: 1200, height: 630 }],
  },
};

export default async function TastePage() {
  const entities = await loadTasteEntries();

  return (
    <main className="page-shell space-y-8">
      <header className="space-y-3">
        <span className="section-title">Taste</span>
        <h1 className="text-3xl font-bold leading-tight tracking-tight text-[var(--foreground)] sm:text-4xl">
          我喜歡的東西
        </h1>
        <p className="max-w-2xl text-base leading-relaxed text-[var(--muted)]">
          形塑我的那些音樂、書與電影。不是清單，是一個一個我願意為它寫下一句「為什麼」的東西。
          想看「最近」在聽什麼看什麼，那是流動的，去{" "}
          <Link href="/now" className="inline-link">
            /now
          </Link>{" "}
          。
        </p>
      </header>

      {entities.length > 0 ? (
        <TasteShelf entities={entities} />
      ) : (
        <p className="text-sm text-[var(--muted)]">櫃子還是空的。</p>
      )}
    </main>
  );
}
