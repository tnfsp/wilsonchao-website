import { kv } from "@vercel/kv";
import { Resend } from "resend";
import { NextRequest, NextResponse } from "next/server";

const SUBSCRIBERS_KEY = "subscribers:emails";

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

async function sendWelcomeEmail(email: string) {
  if (!process.env.RESEND_API_KEY) {
    console.warn("RESEND_API_KEY not set, skipping welcome email");
    return false;
  }

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: "Yi-Hsiang Chao <onboarding@resend.dev>",
      to: email,
      subject: "Welcome to wilsonchao.com!",
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333;">Thanks for subscribing!</h1>
          <p style="color: #666; line-height: 1.6;">
            Hi there,
          </p>
          <p style="color: #666; line-height: 1.6;">
            Thank you for subscribing to my blog. I write about surgery, writing, and slow thinking.
          </p>
          <p style="color: #666; line-height: 1.6;">
            You'll receive occasional updates when I publish new content.
          </p>
          <p style="color: #666; line-height: 1.6;">
            In the meantime, feel free to explore:
          </p>
          <ul style="color: #666; line-height: 1.8;">
            <li><a href="https://wilsonchao.com/blog" style="color: #ca6702;">Blog</a> - Long-form articles</li>
            <li><a href="https://wilsonchao.com/daily" style="color: #ca6702;">Daily</a> - Daily notes and thoughts</li>
            <li><a href="https://wilsonchao.com/about" style="color: #ca6702;">About</a> - Learn more about me</li>
          </ul>
          <p style="color: #666; line-height: 1.6;">
            Best,<br/>
            Yi-Hsiang Chao
          </p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
          <p style="color: #999; font-size: 12px;">
            You received this email because you subscribed at wilsonchao.com
          </p>
        </div>
      `,
    });
    return true;
  } catch (error) {
    console.error("Failed to send welcome email:", error);
    return false;
  }
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

    // Send welcome email (async, don't block response)
    sendWelcomeEmail(normalizedEmail);

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
