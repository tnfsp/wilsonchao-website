import { NextResponse } from "next/server";

type RssItem = {
  title: string;
  link: string;
  guid?: string;
  pubDate?: string;
  description?: string;
};

const escapeXml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

const renderItem = (item: RssItem) => `
<item>
  <title>${escapeXml(item.title)}</title>
  <link>${escapeXml(item.link)}</link>
  <guid>${escapeXml(item.guid || item.link)}</guid>
  ${item.pubDate ? `<pubDate>${item.pubDate}</pubDate>` : ""}
  ${item.description ? `<description>${escapeXml(item.description)}</description>` : ""}
</item>`;

export function buildRssResponse({
  title,
  siteUrl,
  description,
  feedPath,
  items,
  cacheSeconds = 900,
}: {
  title: string;
  siteUrl: string;
  description?: string;
  feedPath?: string;
  items: RssItem[];
  cacheSeconds?: number;
}) {
  const selfLink = feedPath ? `${siteUrl}${feedPath}` : siteUrl;
  const renderedItems = items.map(renderItem).join("");
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(title)}</title>
    <link>${escapeXml(siteUrl)}</link>
    <atom:link href="${escapeXml(selfLink)}" rel="self" type="application/rss+xml"/>
    <language>zh-Hant</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    ${description ? `<description>${escapeXml(description)}</description>` : ""}
    ${renderedItems}
  </channel>
</rss>`;

  return new NextResponse(xml, {
    status: 200,
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": `public, max-age=${cacheSeconds}, stale-while-revalidate=${cacheSeconds * 4}`,
    },
  });
}

export type { RssItem };
