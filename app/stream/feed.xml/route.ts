import { loadStreamEntries } from "@/lib/content";
import { buildRssResponse } from "@/lib/rss";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://wilsonchao.com";

export async function GET() {
  const entries = await loadStreamEntries(200);
  const items = entries.map((entry, i) => {
    const plainText = (entry.description || entry.title || "").replace(/<[^>]*>/g, "");
    const title = plainText.length > 60 ? plainText.slice(0, 57) + "..." : plainText || `Stream #${i + 1}`;
    return {
      title,
      link: entry.link || `${SITE_URL}/stream`,
      guid: entry.link || `${SITE_URL}/stream#${i}`,
      pubDate: entry.pubDate ? new Date(entry.pubDate).toUTCString() : undefined,
      description: plainText.slice(0, 280),
    };
  });

  return buildRssResponse({
    title: "wilsonchao.com — Stream",
    siteUrl: `${SITE_URL}/stream`,
    description: "日常的腦內碎片——想法、電影、音樂，都在這裡流過。",
    feedPath: "/stream/feed.xml",
    items,
  });
}
