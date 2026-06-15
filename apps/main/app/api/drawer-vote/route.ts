import { kv } from "@vercel/kv";
import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";

/**
 * 抽屜 A/B 投票統計。
 *
 * 訪客選 A/B → 累積到 KV（每題一個 hash，欄位 A / B）。
 * 公開的只是「聚合票數」，不存個人身分（呼應抽屜的私密調性——
 * 看的是「多少人跟你一樣」，不是「誰選了什麼」）。
 *
 * 防灌票：
 *  - rateLimit（每 IP 每分鐘上限）。
 *  - 每 IP 每題只計一次（KV set NX）；重投只回現況、不再加。
 *  - questionId 限定 pq-YYYYMMDD 格式，避免被塞垃圾 key。
 */

const QID_RE = /^pq-\d{8}$/;

function votesKey(qid: string): string {
  return `drawer:votes:${qid}`;
}
function votedKey(qid: string, ip: string): string {
  return `drawer:voted:${qid}:${ip}`;
}

type Tally = { A: number; B: number };

async function readTally(qid: string): Promise<Tally> {
  const raw = await kv.hgetall<Record<string, number | string>>(votesKey(qid));
  return {
    A: Number(raw?.A ?? 0) || 0,
    B: Number(raw?.B ?? 0) || 0,
  };
}

export async function GET(request: NextRequest) {
  const qid = new URL(request.url).searchParams.get("questionId") || "";
  if (!QID_RE.test(qid)) {
    return NextResponse.json({ error: "Invalid questionId" }, { status: 400 });
  }
  try {
    return NextResponse.json({ tally: await readTally(qid) });
  } catch (error) {
    console.error("[drawer-vote] GET 失敗:", error);
    return NextResponse.json({ error: "Failed to read tally" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const { allowed } = await rateLimit(`drawer-vote:${ip}`, {
      limit: 20,
      windowSeconds: 60,
    });
    if (!allowed) {
      return NextResponse.json({ error: "太快了，稍等一下。" }, { status: 429 });
    }

    const body = await request.json();
    const qid = String(body?.questionId ?? "");
    const side = String(body?.side ?? "");

    if (!QID_RE.test(qid)) {
      return NextResponse.json({ error: "Invalid questionId" }, { status: 400 });
    }
    if (side !== "A" && side !== "B") {
      return NextResponse.json({ error: "Invalid side" }, { status: 400 });
    }

    // 每 IP 每題只計一次（180 天）。已投過就只回現況。
    const first = await kv.set(votedKey(qid, ip), side, {
      nx: true,
      ex: 60 * 60 * 24 * 180,
    });
    if (first !== null) {
      await kv.hincrby(votesKey(qid), side, 1);
    }

    return NextResponse.json({ tally: await readTally(qid), counted: first !== null });
  } catch (error) {
    console.error("[drawer-vote] POST 失敗:", error);
    // KV 沒配置（如本機）就回 503，前端據此優雅降級（只顯示「你 vs 他」對照）。
    return NextResponse.json({ error: "Vote store unavailable" }, { status: 503 });
  }
}
