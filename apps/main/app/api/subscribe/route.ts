import { kv } from "@vercel/kv";
import { Resend } from "resend";
import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

const SUBSCRIBERS_KEY = "subscribers:emails";
const SITE_URL = "https://wilsonchao.com";

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

type FeaturedEntry = {
  slug: string;
  title: string;
  note?: string;
};

// 精選清單由 Phase 2 的 content/site/featured.json 提供；
// 檔案還不存在時，歡迎信會自動省略這個區塊。
async function loadFeatured(): Promise<FeaturedEntry[]> {
  try {
    const raw = await fs.readFile(
      path.join(process.cwd(), "content", "site", "featured.json"),
      "utf8"
    );
    const data = JSON.parse(raw);
    if (!Array.isArray(data)) return [];
    return data
      .filter((e) => e && typeof e.slug === "string" && typeof e.title === "string")
      .slice(0, 3);
  } catch {
    return [];
  }
}

// 文案是 Wilson 親筆（2026-06-12 定稿），改動前先給他過目
function welcomeEmailHtml(featured: FeaturedEntry[]): string {
  const featuredBlock =
    featured.length > 0
      ? `
      <p style="color:#001219;line-height:1.9;">
        如果想先逛逛，這${featured.length === 3 ? "三" : "幾"}篇是我自己會想拿給朋友看的：<br/>
        ${featured
          .map(
            (e) =>
              `・<a href="${SITE_URL}/blog/${e.slug}" style="color:#ca6702;">${e.title}</a>`
          )
          .join("<br/>\n        ")}
      </p>`
      : "";

  return `
    <div style="font-family:'Noto Sans TC',-apple-system,sans-serif;max-width:560px;margin:0 auto;padding:24px 16px;background-color:#f8f4ea;">
      <p style="color:#001219;line-height:1.9;">嗨，我是玴祥。</p>
      <p style="color:#001219;line-height:1.9;">
        謝謝你留下 email！<br/>
        知道有人在讀我寫的文字，真是一種奇妙的感覺！
      </p>
      <p style="color:#001219;line-height:1.9;">
        之後每個禮拜，我會把當週的週報寄到這裡，或者不定時發一些給老朋友的信。<br/>
        但有時過多的承諾，反而會讓我壓力很大，進而導致拖延 XD
      </p>
      <p style="color:#001219;line-height:1.9;">總之我會試著寫寫看的～</p>
      ${featuredBlock}
      <p style="color:#001219;line-height:1.9;">
        其實我一直很好奇：你是讀到哪一篇，才決定留下 email 的？<br/>
        如果有空，可以回信跟我聊聊～
      </p>
      <p style="color:#001219;line-height:1.9;">玴祥</p>
      <hr style="border:none;border-top:1px solid rgba(0,18,25,0.14);margin:32px 0 16px;" />
      <p style="color:#00505f;font-size:12px;line-height:1.8;">
        你會收到這封信，是因為你在 <a href="${SITE_URL}" style="color:#00505f;">wilsonchao.com</a> 訂閱了週報。
      </p>
    </div>
  `;
}

async function addToResend(email: string) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("RESEND_API_KEY not set — subscriber stored in KV only.");
    return;
  }

  const resend = new Resend(apiKey);
  const segmentId = process.env.RESEND_SEGMENT_ID;

  // Resend 為寄送名單的 source of truth；KV 僅作歷史紀錄
  // 注意：Resend SDK 不 throw，錯誤在回傳值裡，必須逐一檢查
  const contact = await resend.contacts.create({
    email,
    unsubscribed: false,
    ...(segmentId ? { segments: [{ id: segmentId }] } : {}),
  });
  if (contact.error) {
    console.error("Resend contacts.create failed:", contact.error);
  }

  const featured = await loadFeatured();
  const sent = await resend.emails.send({
    from: process.env.RESEND_FROM || "Wilson Chao <hi@wilsonchao.com>",
    ...(process.env.RESEND_REPLY_TO ? { replyTo: process.env.RESEND_REPLY_TO } : {}),
    to: email,
    subject: "訂閱成功",
    html: welcomeEmailHtml(featured),
  });
  if (sent.error) {
    console.error("Resend welcome email failed:", sent.error);
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

    // Add to subscribers set (歷史紀錄；寄送名單在 Resend)
    await kv.sadd(SUBSCRIBERS_KEY, normalizedEmail);

    // Store metadata
    const metaKey = `subscribers:${normalizedEmail}:meta`;
    await kv.set(metaKey, {
      subscribedAt: new Date().toISOString(),
      source: source || "unknown",
    });

    // Resend contact + welcome email。
    // 必須 await：serverless 在回應後會凍結 function，
    // fire-and-forget 的寄信會被砍在半路（實測過）。
    try {
      await addToResend(normalizedEmail);
    } catch (err) {
      // 寄信失敗不影響訂閱本身——email 已進名單，之後可補寄
      console.error("Resend subscribe flow failed for", normalizedEmail, err);
    }

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
