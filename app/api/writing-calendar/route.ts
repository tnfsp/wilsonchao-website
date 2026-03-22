import { NextResponse } from "next/server";
import { readdir } from "fs/promises";
import { join } from "path";

const JOURNAL_DIR = join(
  process.env.HOME || "/Users/zhaoyixiang",
  "Obsidian/Wilson/1-Journal"
);

// Date pattern: YYYY-MM-DD.md
const DATE_RE = /^(\d{4}-\d{2}-\d{2})\.md$/;

export async function GET() {
  try {
    const files = await readdir(JOURNAL_DIR);
    const dates: string[] = [];

    for (const f of files) {
      const m = DATE_RE.exec(f);
      if (m) dates.push(m[1]);
    }

    // Return sorted dates
    dates.sort();

    return NextResponse.json({ dates, total: dates.length }, {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    });
  } catch {
    return NextResponse.json({ dates: [], total: 0 });
  }
}
