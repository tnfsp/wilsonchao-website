/**
 * 週報電子報寄送 script
 *
 * 用法：
 *   npm run newsletter -- <slug>            # 建立 Resend Broadcast 草稿（不寄出）
 *   npm run newsletter -- <slug> --send     # 建立並直接寄出
 *   npm run newsletter -- <slug> --preview  # 只輸出信件 HTML 到暫存檔（不需要 env）
 *   npm run newsletter -- <slug> --force    # 允許非週報類型（預設只接受週報）
 *
 * 預設行為是「只建草稿」：到 Resend dashboard 預覽確認後再按送出，
 * 或確認無誤後加 --send 重跑。誤寄無法收回，所以不做全自動。
 *
 * 需要環境變數（.env.local 或 shell）：
 *   RESEND_API_KEY     — Resend API key
 *   RESEND_SEGMENT_ID  — 訂閱者 segment
 *   RESEND_FROM        — 寄件者（選填，預設 "Wilson Chao <hi@wilsonchao.com>"）
 *   RESEND_REPLY_TO    — 回信地址（選填）
 */
import { config as loadEnv } from "dotenv";
import { Resend } from "resend";
import fs from "fs/promises";
import path from "path";

loadEnv({ path: ".env.local" });

const SITE_URL = "https://wilsonchao.com";
const WEEKLY_TYPES = new Set(["週報", "weekly"]);

type BlogEntry = {
  slug: string;
  title: string;
  type?: string;
  status?: string;
  publishedAt?: string;
  contentHtml?: string;
  excerpt?: string;
  description?: string;
  image?: string;
};

/** 把 contentHtml 裡的相對路徑（圖片、站內連結）轉成絕對網址，email 裡才看得到 */
function absolutifyUrls(html: string): string {
  return html
    .replace(/(src|href)="\/(?!\/)/g, `$1="${SITE_URL}/`);
}

function newsletterHtml(entry: BlogEntry): string {
  const cover = entry.image
    ? `<img src="${entry.image.startsWith("http") ? entry.image : SITE_URL + entry.image}" alt="${entry.title}" style="width:100%;border-radius:12px;margin-bottom:24px;" />`
    : "";

  const body = absolutifyUrls(entry.contentHtml ?? "");

  return `
    <div style="font-family:'Noto Sans TC',-apple-system,sans-serif;max-width:560px;margin:0 auto;padding:24px 16px;background-color:#f8f4ea;color:#001219;">
      ${cover}
      <h1 style="font-size:1.5em;line-height:1.4;margin:0 0 24px;">${entry.title}</h1>
      <div style="line-height:1.9;">
        ${body}
      </div>
      <hr style="border:none;border-top:1px solid rgba(0,18,25,0.14);margin:32px 0 16px;" />
      <p style="color:#00505f;font-size:13px;line-height:1.8;">
        在網頁上讀這篇：<a href="${SITE_URL}/blog/${entry.slug}" style="color:#ca6702;">${SITE_URL}/blog/${entry.slug}</a><br/>
        有想說的話，直接回信就好。<br/>
        不想再收到週報：<a href="{{{RESEND_UNSUBSCRIBE_URL}}}" style="color:#00505f;">取消訂閱</a>
      </p>
    </div>
  `;
}

async function main() {
  const args = process.argv.slice(2);
  const slug = args.find((a) => !a.startsWith("--"));
  const doSend = args.includes("--send");
  const force = args.includes("--force");
  const previewOnly = args.includes("--preview");

  if (!slug) {
    console.error("用法：npm run newsletter -- <slug> [--send|--preview] [--force]");
    process.exit(1);
  }

  const apiKey = process.env.RESEND_API_KEY;
  const segmentId = process.env.RESEND_SEGMENT_ID;
  if (!previewOnly && (!apiKey || !segmentId)) {
    console.error(
      "缺少環境變數：" +
        [!apiKey && "RESEND_API_KEY", !segmentId && "RESEND_SEGMENT_ID"]
          .filter(Boolean)
          .join("、")
    );
    process.exit(1);
  }

  const filePath = path.join(process.cwd(), "content", "blog", `${slug}.json`);
  let entry: BlogEntry;
  try {
    entry = JSON.parse(await fs.readFile(filePath, "utf8"));
  } catch {
    console.error(`找不到或無法解析 ${filePath}`);
    process.exit(1);
  }

  if (!WEEKLY_TYPES.has(entry.type ?? "") && !force) {
    console.error(
      `「${entry.title}」的 type 是 ${entry.type ?? "(未設定)"}，不是週報。` +
        `確定要寄的話加 --force。`
    );
    process.exit(1);
  }

  if (!entry.contentHtml) {
    console.error(`${slug} 沒有 contentHtml，無法組信。`);
    process.exit(1);
  }

  if (previewOnly) {
    const os = await import("os");
    const outPath = path.join(os.tmpdir(), `newsletter-${slug}.html`);
    await fs.writeFile(outPath, newsletterHtml(entry), "utf8");
    console.log(`👀 預覽已輸出：${outPath}`);
    console.log(`   subject: ${entry.title}`);
    console.log(`   preview: ${entry.excerpt || entry.description || "(無)"}`);
    return;
  }

  // 走到這裡必然非 preview 模式；前面已驗證過 env，這裡是型別收窄
  if (!apiKey || !segmentId) process.exit(1);

  const resend = new Resend(apiKey);
  const created = await resend.broadcasts.create({
    segmentId,
    from: process.env.RESEND_FROM || "Wilson Chao <hi@wilsonchao.com>",
    ...(process.env.RESEND_REPLY_TO ? { replyTo: process.env.RESEND_REPLY_TO } : {}),
    subject: entry.title,
    previewText: entry.excerpt || entry.description || "",
    name: `週報：${entry.title}（${slug}）`,
    html: newsletterHtml(entry),
  });

  if (created.error || !created.data) {
    console.error("建立 Broadcast 失敗：", created.error);
    process.exit(1);
  }

  console.log(`✅ Broadcast 草稿已建立：${created.data.id}`);
  console.log(`   預覽：https://resend.com/broadcasts/${created.data.id}`);

  if (doSend) {
    const sent = await resend.broadcasts.send(created.data.id);
    if (sent.error) {
      console.error("寄出失敗：", sent.error);
      process.exit(1);
    }
    console.log(`📨 已寄出「${entry.title}」`);
  } else {
    console.log("   （未寄出——到 dashboard 確認後按送出，或加 --send 重跑）");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
