import { kv } from "@vercel/kv";
import { nanoid } from "nanoid";
import { NextRequest, NextResponse } from "next/server";

type Comment = {
  id: string;
  slug: string;
  name: string;
  email?: string;
  content: string;
  createdAt: string;
};

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function getCommentsKey(slug: string): string {
  return `comments:${slug}:list`;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug");

  if (!slug) {
    return NextResponse.json({ error: "slug is required" }, { status: 400 });
  }

  try {
    const key = getCommentsKey(slug);
    const comments = await kv.get<Comment[]>(key);
    return NextResponse.json({ comments: comments || [] });
  } catch (error) {
    console.error("Get comments error:", error);
    return NextResponse.json({ error: "Failed to fetch comments" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { slug, name, email, content, honeypot } = body;

    // Honeypot check - if filled, it's likely spam
    if (honeypot) {
      // Silently accept but don't save
      return NextResponse.json({ success: true });
    }

    if (!slug || typeof slug !== "string") {
      return NextResponse.json({ error: "slug is required" }, { status: 400 });
    }

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json({ error: "name is required" }, { status: 400 });
    }

    if (!content || typeof content !== "string" || content.trim().length === 0) {
      return NextResponse.json({ error: "content is required" }, { status: 400 });
    }

    if (content.length > 2000) {
      return NextResponse.json({ error: "content too long (max 2000 chars)" }, { status: 400 });
    }

    const comment: Comment = {
      id: nanoid(),
      slug,
      name: escapeHtml(name.trim().slice(0, 50)),
      email: email ? email.trim().slice(0, 100) : undefined,
      content: escapeHtml(content.trim()),
      createdAt: new Date().toISOString(),
    };

    const key = getCommentsKey(slug);
    const existingComments = await kv.get<Comment[]>(key) || [];

    // Add new comment at the beginning (newest first)
    const updatedComments = [comment, ...existingComments];

    await kv.set(key, updatedComments);

    // Return comment without email
    const safeComment = { ...comment, email: undefined };
    return NextResponse.json({ comment: safeComment, success: true }, { status: 201 });
  } catch (error) {
    console.error("Post comment error:", error);
    return NextResponse.json({ error: "Failed to post comment" }, { status: 500 });
  }
}
