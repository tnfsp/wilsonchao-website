import { loadBlogEntries } from "@/lib/content";
import { buildRssResponse } from "@/lib/rss";
import { makeAbsoluteImageUrls } from "@/lib/rss-utils";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://wilsonchao.com";

export async function GET() {
  const entries = await loadBlogEntries();

  // Exclude index/map-of-content entries (type=moc) from the feed
  const publishable = entries.filter((e) => e.type !== "moc");

  const items = publishable.map((entry) => ({
    title: entry.title,
    link: `${SITE_URL}/blog/${entry.slug}`,
    guid: `${SITE_URL}/blog/${entry.slug}`,
    pubDate: entry.publishedAt ? new Date(entry.publishedAt).toUTCString() : undefined,
    description: entry.excerpt,
    contentEncoded: entry.contentHtml
      ? makeAbsoluteImageUrls(entry.contentHtml, SITE_URL)
      : undefined,
  }));

  return buildRssResponse({
    title: "wilsonchao.com",
    siteUrl: SITE_URL,
    description: "Articles, journal entries, and updates from Yi-Hsiang Chao, MD",
    feedPath: "/feed.xml",
    items,
  });
}
