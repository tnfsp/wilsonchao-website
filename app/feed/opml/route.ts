import { NextResponse } from "next/server";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://wilsonchao.com";

const feeds = [
  { title: "wilsonchao.com — All", xmlUrl: `${SITE_URL}/feed.xml`, htmlUrl: SITE_URL },
  { title: "wilsonchao.com — Blog", xmlUrl: `${SITE_URL}/blog/feed.xml`, htmlUrl: `${SITE_URL}/blog` },
  { title: "wilsonchao.com — Journal", xmlUrl: `${SITE_URL}/journal/feed.xml`, htmlUrl: `${SITE_URL}/journal` },
  { title: "wilsonchao.com — Stream", xmlUrl: `${SITE_URL}/stream/feed.xml`, htmlUrl: `${SITE_URL}/stream` },
];

const escapeXml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export async function GET() {
  const outlines = feeds
    .map(
      (f) =>
        `      <outline type="rss" text="${escapeXml(f.title)}" title="${escapeXml(f.title)}" xmlUrl="${escapeXml(f.xmlUrl)}" htmlUrl="${escapeXml(f.htmlUrl)}"/>`,
    )
    .join("\n");

  const opml = `<?xml version="1.0" encoding="UTF-8"?>
<opml version="2.0">
  <head>
    <title>wilsonchao.com RSS Feeds</title>
    <dateCreated>${new Date().toUTCString()}</dateCreated>
    <ownerName>Yi-Hsiang Chao</ownerName>
  </head>
  <body>
    <outline text="wilsonchao.com" title="wilsonchao.com">
${outlines}
    </outline>
  </body>
</opml>`;

  return new NextResponse(opml, {
    status: 200,
    headers: {
      "Content-Type": "text/x-opml; charset=utf-8",
      "Content-Disposition": 'attachment; filename="wilsonchao-feeds.opml"',
    },
  });
}
