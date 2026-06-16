/**
 * sync-drawer.ts
 *
 * Reads two sources and produces apps/main/content/drawer.json for the "抽屜"
 * (drawer) feature:
 *
 *  1. OWL's de-sensitized public preference file
 *     (~/.openclaw/workspace/data/wilson-preferences.public.jsonl)
 *     → produces "preference" cards (two-choice Q&A with Wilson's pick).
 *
 *  2. OWL's answered anonymous visitor questions
 *     (~/.openclaw/workspace/data/drawer-answers.jsonl)
 *     → produces "qa" cards (visitor question + Wilson's answer).
 *     Only items with a non-empty `answer` field are included.
 *     Internal fields (id, askedAt, answeredAt, from) are stripped.
 *
 * 分工（見 HANDOFF-drawer-from-owl.md）:
 *  - OWL 守隱私閘門、產出 *.public.jsonl（已去敏）。
 *  - 本腳本只讀 public 檔，絕不碰 raw wilson-preferences.jsonl。
 *
 * Graceful by design: if either source file is missing the script warns and
 * continues with the remaining source, exiting 0.
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

// QA answers source (anonymous visitor Q&A, answered items only).
const DEFAULT_QA_SOURCE = path.join(
  os.homedir(),
  ".openclaw/workspace/data/drawer-answers.jsonl"
);
const QA_SOURCE = process.env.DRAWER_ANSWERS?.trim() || DEFAULT_QA_SOURCE;

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

/** Visitor Q&A card — only question + answer text published; no internal fields. */
type DrawerQACard = {
  type: "qa";
  question: string;
  answer: string;
};

type AnyDrawerCard = DrawerCard | DrawerQACard;

const VALID_CHOICES = new Set(["A", "偏A", "混合", "偏B", "B"]);

// ─── helpers ─────────────────────────────────────────────────────────
/** Parse a JSONL file; returns an array of successfully-parsed objects. */
async function parseJSONL(filePath: string): Promise<Record<string, unknown>[]> {
  const raw = await readFile(filePath, "utf-8");
  const results: Record<string, unknown>[] = [];
  for (const [i, rawLine] of raw.split("\n").entries()) {
    const line = rawLine.trim();
    if (!line) continue;
    try {
      results.push(JSON.parse(line) as Record<string, unknown>);
    } catch {
      console.warn(`[sync-drawer] Line ${i + 1} in ${path.basename(filePath)} is not valid JSON, skipping.`);
    }
  }
  return results;
}

// ─── main ────────────────────────────────────────────────────────────
async function main() {
  console.log("[sync-drawer] Starting...");
  console.log(`[sync-drawer] Preference source: ${SOURCE}`);
  console.log(`[sync-drawer] QA source:          ${QA_SOURCE}`);

  const cards: AnyDrawerCard[] = [];
  let skipped = 0;

  // ── 1. Preference cards ──────────────────────────────────────────
  if (!existsSync(SOURCE)) {
    console.warn(
      [
        `[sync-drawer] Public preference file not found: ${SOURCE}`,
        "[sync-drawer] Skipping preference cards. Set WILSON_PREFS_PUBLIC to override the source path.",
      ].join("\n")
    );
  } else {
    const prefLines = await parseJSONL(SOURCE);

    for (const [i, parsed] of prefLines.entries()) {
      const question = String(parsed.question ?? "").trim();
      const optionA = String(parsed.optionA ?? "").trim();
      const optionB = String(parsed.optionB ?? "").trim();
      const choice = String(parsed.choice ?? "").trim();

      // A card without its core question/options/choice is unusable in the UI.
      if (!question || !optionA || !optionB || !choice) {
        console.warn(
          `[sync-drawer] Preference line ${i + 1} missing question/optionA/optionB/choice, skipping.`
        );
        skipped++;
        continue;
      }
      if (!VALID_CHOICES.has(choice)) {
        console.warn(
          `[sync-drawer] Preference line ${i + 1} has unexpected choice "${choice}" (expected one of A/偏A/混合/偏B/B). Keeping it anyway.`
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
  }

  // Preference cards: chronological order.
  const prefCards = cards as DrawerCard[];
  prefCards.sort((a, b) => (a.date || "").localeCompare(b.date || ""));

  // ── 2. QA cards ──────────────────────────────────────────────────
  const qaCards: DrawerQACard[] = [];

  if (!existsSync(QA_SOURCE)) {
    console.warn(
      [
        `[sync-drawer] QA answers file not found: ${QA_SOURCE}`,
        "[sync-drawer] Skipping QA cards. Set DRAWER_ANSWERS to override the source path.",
      ].join("\n")
    );
  } else {
    const qaLines = await parseJSONL(QA_SOURCE);

    for (const [i, parsed] of qaLines.entries()) {
      const question = String(parsed.question ?? "").trim();
      const answer = String(parsed.answer ?? "").trim();

      // Only include answered items (non-empty answer field).
      if (!question || !answer) {
        // Silently skip unanswered items — they are expected.
        continue;
      }

      // Strip all internal fields: only publish question + answer text.
      qaCards.push({ type: "qa", question, answer });
      console.log(`[sync-drawer] QA line ${i + 1}: included (answered).`);
    }
  }

  // ── 3. Merge and write ───────────────────────────────────────────
  // Preference cards first (chronological), then QA cards at the end.
  const allCards: AnyDrawerCard[] = [...prefCards, ...qaCards];

  await mkdir(path.dirname(OUT_PATH), { recursive: true });
  await writeFile(OUT_PATH, JSON.stringify(allCards, null, 2) + "\n", "utf-8");

  console.log(
    `[sync-drawer] Done. Wrote ${allCards.length} card(s) ` +
    `(${prefCards.length} preference, ${qaCards.length} QA` +
    `${skipped ? `, ${skipped} skipped` : ""}) → ${path.relative(ROOT, OUT_PATH)}`
  );
}

main().catch((error) => {
  console.error("[sync-drawer] Failed:", error);
  process.exit(1);
});
