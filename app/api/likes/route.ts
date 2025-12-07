import { NextResponse } from "next/server";
import { kv } from "@vercel/kv";

export const runtime = "edge";

const hasKV = Boolean(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);

type Counts = { total: number };

const memoryStore: Map<string, Counts> =
  // @ts-expect-error keep in-memory counts across edge invocations
  globalThis.__LIKE_MEMORY__ ?? new Map<string, Counts>();
// @ts-expect-error attach back to global
globalThis.__LIKE_MEMORY__ = memoryStore;

async function getWithKV(slug: string): Promise<Counts> {
  const totalKey = `likes:${slug}:total`;
  const total = (await kv.get<number>(totalKey)) || 0;
  return { total };
}

async function incrementWithKV(slug: string): Promise<Counts> {
  const totalKey = `likes:${slug}:total`;
  const total = await kv.incr(totalKey);
  return { total };
}

function getInMemory(slug: string): Counts {
  const prev = memoryStore.get(slug) || { total: 0 };
  return prev;
}

function incrementInMemory(slug: string): Counts {
  const prev = memoryStore.get(slug) || { total: 0 };
  const next = { total: prev.total + 1 };
  memoryStore.set(slug, next);
  return next;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug") || "home";

  try {
    const counts = hasKV ? await getWithKV(slug) : getInMemory(slug);
    return NextResponse.json(counts, { status: 200 });
  } catch (error) {
    console.error("[api/likes] Failed to read likes:", (error as Error).message);
    return NextResponse.json({ total: 0 }, { status: 200 });
  }
}

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug") || "home";

  try {
    const counts = hasKV ? await incrementWithKV(slug) : incrementInMemory(slug);
    return NextResponse.json(counts, { status: 200 });
  } catch (error) {
    console.error("[api/likes] Failed to record like:", (error as Error).message);
    return NextResponse.json({ total: 0 }, { status: 200 });
  }
}
