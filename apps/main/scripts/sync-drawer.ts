/**
 * sync-drawer.ts
 *
 * Reads OWL's already-reviewed, de-sensitized public preference file
 * (~/.openclaw/workspace/data/wilson-preferences.public.jsonl) and produces
 * apps/main/content/drawer.json for the "抽屜" (drawer) feature.
 *
 * 分工（見 HANDOFF-drawer-from-owl.md）:
 *  - OWL 守隱私閘門、產出 *.public.jsonl（已去敏）。
 *  - 本腳本只讀 public 檔，絕不碰 raw wilson-preferences.jsonl。
 *
 * Graceful by design: if the source file is missing (e.g. running on a machine
 * without the openclaw workspace) it warns and keeps the existing drawer.json,
 * exiting 0 so it can be chained after sync:vault without breaking the pipeline.
 */

import { existsSync } from "fs";
import { readFile, writeFile, mkdir } from "fs/promises";
import path from "path";
import os from "os";

// ─── paths ───────────────────────────────────────────────────────────
// SOURCE: env override wins; otherwise the default openclaw public file.
const DEFAULT_SOURCE = path.join(
  os.homedir(),
  ".openclaw/workspace/data/wilson-preferences.public.jsonl"
);
const SOURCE = process.env.WILSON_PREFS_PUBLIC?.trim() || DEFAULT_SOURCE;

const ROOT = process.cwd(); // apps/main when run via the workspace script
const OUT_PATH = path.join(ROOT, "content", "drawer.json");

// ─── types ───────────────────────────────────────────────────────────
// Mirrors the public file's fields (NOT the raw file — no answer/answeredAt).
type DrawerCard = {
  date: string;
  questionId: string;
  question: string;
  optionA: string;
  optionB: string;
  choice: string; // A | 偏A | 混合 | 偏B | B
  reason?: string;
  tags?: string[];
  category?: string;
  dimension?: string;
};

const VALID_CHOICES = new Set(["A", "偏A", "混合", "偏B", "B"]);

// ─── main ────────────────────────────────────────────────────────────
async function main() {
  console.log("[sync-drawer] Starting...");
  console.log(`[sync-drawer] Source: ${SOURCE}`);

  if (!existsSync(SOURCE)) {
    console.warn(
      [
        `[sync-drawer] Public file not found: ${SOURCE}`,
        "[sync-drawer] Keeping existing content/drawer.json (if any). Set WILSON_PREFS_PUBLIC to override the source path.",
      ].join("\n")
    );
    return; // graceful: don't break a chained pipeline
  }

  const raw = await readFile(SOURCE, "utf-8");
  const lines = raw.split("\n").map((l) => l.trim()).filter(Boolean);

  const cards: DrawerCard[] = [];
  let skipped = 0;

  for (const [i, line] of lines.entries()) {
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(line);
    } catch {
      console.warn(`[sync-drawer] ⚠️  Line ${i + 1} is not valid JSON, skipping.`);
      skipped++;
      continue;
    }

    const question = String(parsed.question ?? "").trim();
    const optionA = String(parsed.optionA ?? "").trim();
    const optionB = String(parsed.optionB ?? "").trim();
    const choice = String(parsed.choice ?? "").trim();

    // A card without its core question/options/choice is unusable in the UI.
    if (!question || !optionA || !optionB || !choice) {
      console.warn(
        `[sync-drawer] ⚠️  Line ${i + 1} missing question/optionA/optionB/choice, skipping.`
      );
      skipped++;
      continue;
    }
    if (!VALID_CHOICES.has(choice)) {
      console.warn(
        `[sync-drawer] ⚠️  Line ${i + 1} has unexpected choice "${choice}" (expected one of A/偏A/混合/偏B/B). Keeping it anyway.`
      );
    }

    const reason = typeof parsed.reason === "string" ? parsed.reason.trim() : "";

    cards.push({
      date: String(parsed.date ?? "").trim(),
      questionId: String(parsed.questionId ?? "").trim(),
      question,
      optionA,
      optionB,
      choice,
      // Empty reason → omit (OWL deliberately blanked it; don't fabricate one).
      ...(reason ? { reason } : {}),
      ...(Array.isArray(parsed.tags) ? { tags: parsed.tags as string[] } : {}),
      ...(parsed.category ? { category: String(parsed.category) } : {}),
      ...(parsed.dimension ? { dimension: String(parsed.dimension) } : {}),
    });
  }

  // Chronological order — reads as "看著他一點點長出來".
  cards.sort((a, b) => (a.date || "").localeCompare(b.date || ""));

  await mkdir(path.dirname(OUT_PATH), { recursive: true });
  await writeFile(OUT_PATH, JSON.stringify(cards, null, 2) + "\n", "utf-8");

  console.log(
    `[sync-drawer] Done. Wrote ${cards.length} card(s)${
      skipped ? `, skipped ${skipped}` : ""
    } → ${path.relative(ROOT, OUT_PATH)}`
  );
}

main().catch((error) => {
  console.error("[sync-drawer] Failed:", error);
  process.exit(1);
});
