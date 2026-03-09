import { NextResponse } from "next/server";

type RssItem = {
  title: string;
  link: string;
  guid?: string;
  pubDate?: string;
  description?: string;
  isPermaLink?: boolean;
};

const escapeXml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

const renderItem = (item: RssItem) => {
  const permaLink = item.isPermaLink === false ? ' isPermaLink="false"' : "";
  return `
<item>
  <title>${escapeXml(item.title)}</title>
  <link>${escapeXml(item.link)}</link>
  <guid${permaLink}>${escapeXml(item.guid || item.link)}</guid>
  ${item.pubDate ? `<pubDate>${item.pubDate}</pubDate>` : ""}
  ${item.description ? `<description>${escapeXml(item.description)}</description>` : ""}
</item>`;
};

const ROOT_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://wilsonchao.com";

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
  const selfLink = feedPath ? `${ROOT_URL}${feedPath}` : siteUrl;
  const lastBuildDate =
    items.find((i) => i.pubDate)?.pubDate || new Date().toUTCString();
  const renderedItems = items.map(renderItem).join("");
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(title)}</title>
    <link>${escapeXml(siteUrl)}</link>
    <atom:link href="${escapeXml(selfLink)}" rel="self" type="application/rss+xml"/>
    <language>zh-Hant</language>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
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
