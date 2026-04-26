import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");

    // In production (Vercel), use /tmp for storage + log to stdout
    // In dev, write to local file
    const dir = process.env.VERCEL ? "/tmp/teaching-feedback" : join(process.cwd(), "data", "teaching-feedback");

    try {
      await mkdir(dir, { recursive: true });
      await writeFile(
        join(dir, `${timestamp}.json`),
        JSON.stringify(data, null, 2)
      );
    } catch {
      // If file write fails, at least log it
    }

    // Always log to stdout (captured by Vercel logs)
    console.log(`[teaching-feedback] ${JSON.stringify(data)}`);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
