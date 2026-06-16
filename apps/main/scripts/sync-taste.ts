/**
 * sync-taste.ts
 *
 * Reads OWL's already-reviewed, de-sensitized public taste file
 * (~/.openclaw/workspace/data/wilson-taste.public.json) and produces
 * apps/main/content/taste.json for the "品味" (taste) feature.
 *
 * 分工：
 *  - OWL 守隱私閘門、產出 wilson-taste.public.json（已去敏）。
 *  - 本腳本只讀 public 檔，絕不碰任何 raw/vault 原始喜好檔。
 *
 * Graceful by design: if the source file is missing (e.g. running on a machine
 * without the openclaw workspace) it warns and keeps the existing taste.json,
 * exiting 0 so it can be chained after other sync steps without breaking the pipeline.
 */

import { existsSync } from "fs";
import { readFile, writeFile, mkdir } from "fs/promises";
import path from "path";
import os from "os";

// ─── paths ───────────────────────────────────────────────────────────
// SOURCE: env override wins; otherwise the default openclaw public file.
const DEFAULT_SOURCE = path.join(
  os.homedir(),
  ".openclaw/workspace/data/wilson-taste.public.json"
);
const SOURCE = process.env.WILSON_TASTE_PUBLIC?.trim() || DEFAULT_SOURCE;

const ROOT = process.cwd(); // apps/main when run via the workspace script
const OUT_PATH = path.join(ROOT, "content", "taste.json");

// ─── types ───────────────────────────────────────────────────────────
// Mirrors the public file's fields (subset used in the UI).
// music/book entries have subtitle; movie entries have year (no subtitle).
type TasteItem = {
  id: string;
  type: "music" | "book" | "movie" | string;
  title: string;
  subtitle?: string; // music, book
  year?: number;     // movie
  tags: string[];
  why: string;
};

// ─── serializer ──────────────────────────────────────────────────────
/**
 * Serialize the output to match the exact format of the hand-maintained taste.json:
 * - 2-space indentation for the outer array and object fields
 * - tags arrays are kept on a single inline line (e.g. ["lofi", "hiphop"])
 *   rather than expanded across multiple lines
 *
 * JSON.stringify(obj, null, 2) alone would expand every array to multi-line;
 * this post-processes the output to collapse tags arrays back to one line.
 */
function serialize(items: TasteItem[]): string {
  const json = JSON.stringify(items, null, 2);
  // Collapse any inline array that was expanded across lines by JSON.stringify.
  // Matches patterns like:
  //   "tags": [
  //     "lofi",
  //     "hiphop"
  //   ]
  // and collapses them to:
  //   "tags": ["lofi", "hiphop"]
  const collapsed = json.replace(
    /("tags":\s*)\[\n(\s+(?:"[^"]*"(?:,\n\s+)?)+)\s*\]/g,
    (_match, prefix, inner) => {
      const items = inner
        .trim()
        .split(/,\s*\n\s*/)
        .map((s: string) => s.trim());
      return `${prefix}[${items.join(", ")}]`;
    }
  );
  return collapsed + "\n";
}

// ─── field ordering ──────────────────────────────────────────────────
/**
 * Return a new object with fields in the canonical order matching taste.json:
 *   id, type, title, subtitle (if present), year (if present), tags, why
 */
function orderFields(raw: Record<string, unknown>): TasteItem {
  const ordered: Record<string, unknown> = {};
  ordered.id = String(raw.id ?? "").trim();
  ordered.type = String(raw.type ?? "").trim();
  ordered.title = String(raw.title ?? "").trim();
  if (raw.subtitle !== undefined && raw.subtitle !== null && raw.subtitle !== "") {
    ordered.subtitle = String(raw.subtitle).trim();
  }
  if (raw.year !== undefined && raw.year !== null) {
    ordered.year = Number(raw.year);
  }
  ordered.tags = Array.isArray(raw.tags) ? (raw.tags as string[]) : [];
  ordered.why = String(raw.why ?? "").trim();
  return ordered as unknown as TasteItem;
}

// ─── main ────────────────────────────────────────────────────────────
async function main() {
  console.log("[sync-taste] Starting...");
  console.log(`[sync-taste] Source: ${SOURCE}`);

  if (!existsSync(SOURCE)) {
    console.warn(
      [
        `[sync-taste] Public file not found: ${SOURCE}`,
        "[sync-taste] Keeping existing content/taste.json (if any). Set WILSON_TASTE_PUBLIC to override the source path.",
      ].join("\n")
    );
    return; // graceful: don't break a chained pipeline
  }

  const raw = await readFile(SOURCE, "utf-8");

  let parsed: Record<string, unknown>[];
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    console.error("[sync-taste] Source file is not valid JSON:", e);
    process.exit(1);
  }

  if (!Array.isArray(parsed)) {
    console.error("[sync-taste] Source file must be a JSON array.");
    process.exit(1);
  }

  let skipped = 0;
  const items: TasteItem[] = [];

  for (const [i, entry] of parsed.entries()) {
    if (typeof entry !== "object" || entry === null) {
      console.warn(`[sync-taste] Entry ${i + 1} is not an object, skipping.`);
      skipped++;
      continue;
    }

    const rec = entry as Record<string, unknown>;
    const id = String(rec.id ?? "").trim();
    const type = String(rec.type ?? "").trim();
    const title = String(rec.title ?? "").trim();
    const why = String(rec.why ?? "").trim();

    if (!id || !type || !title || !why) {
      console.warn(
        `[sync-taste] Entry ${i + 1} missing required fields (id/type/title/why), skipping.`
      );
      skipped++;
      continue;
    }

    items.push(orderFields(rec));
  }

  // Preserve source order — OWL controls curation order in the public file.
  // (No re-sort: the public file is already in the intended display order.)

  await mkdir(path.dirname(OUT_PATH), { recursive: true });
  await writeFile(OUT_PATH, serialize(items), "utf-8");

  console.log(
    `[sync-taste] Done. Wrote ${items.length} item(s)${
      skipped ? `, skipped ${skipped}` : ""
    } → ${path.relative(ROOT, OUT_PATH)}`
  );
}

main().catch((error) => {
  console.error("[sync-taste] Failed:", error);
  process.exit(1);
});
