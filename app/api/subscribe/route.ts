import { kv } from "@vercel/kv";
import { NextRequest, NextResponse } from "next/server";

const SUBSCRIBERS_KEY = "subscribers:emails";

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, source } = body;

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    if (!isValidEmail(normalizedEmail)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Check if already subscribed
    const exists = await kv.sismember(SUBSCRIBERS_KEY, normalizedEmail);
    if (exists) {
      return NextResponse.json(
        { message: "Already subscribed", alreadySubscribed: true },
        { status: 200 }
      );
    }

    // Add to subscribers set
    await kv.sadd(SUBSCRIBERS_KEY, normalizedEmail);

    // Store metadata
    const metaKey = `subscribers:${normalizedEmail}:meta`;
    await kv.set(metaKey, {
      subscribedAt: new Date().toISOString(),
      source: source || "unknown",
    });

    return NextResponse.json(
      { message: "Successfully subscribed", success: true },
      { status: 201 }
    );
  } catch (error) {
    console.error("Subscribe error:", error);
    return NextResponse.json(
      { error: "Failed to subscribe" },
      { status: 500 }
    );
  }
}
