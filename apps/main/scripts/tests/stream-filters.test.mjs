import assert from "node:assert/strict";
import test from "node:test";
import { isBlogAnnouncement } from "../../lib/stream-filters.ts";

// Fixtures mirror real stream.json entries (443 weekly-027, 440 weekly-026, 31 untagged-emoji blog).
test("blog announcements are hidden from the stream", () => {
  assert.equal(isBlogAnnouncement({ id: "443", tags: ["blog"], title: "📰 新文章 #blog近況https://wilsonchao.com/blog/weekly-027" }), true);
  assert.equal(isBlogAnnouncement({ id: "440", tags: ["blog"] }), true);
  assert.equal(isBlogAnnouncement({ id: "31", tags: ["blog"], title: "2025 純VIBE CODING出新網站" }), true);
});

test("everything else stays, including near-miss tags and blog links in murmurs", () => {
  assert.equal(isBlogAnnouncement({ tags: ["murmur"], text: "看這篇 https://wilsonchao.com/blog/weekly-027" }), false);
  assert.equal(isBlogAnnouncement({ tags: ["music"] }), false);
  assert.equal(isBlogAnnouncement({ tags: ["blogger", "Blog", "blog2"] }), false);
  assert.equal(isBlogAnnouncement({ tags: [] }), false);
  assert.equal(isBlogAnnouncement({}), false);
  assert.equal(isBlogAnnouncement({ tags: "blog" }), false);
});
