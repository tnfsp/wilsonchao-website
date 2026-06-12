/**
 * 一次性遷移：把 KV set（subscribers:emails）裡的歷史訂閱者
 * 倒進 Resend contacts（並掛上 segment）。
 *
 * 用法：npm run migrate:subscribers
 *
 * 冪等：email 已存在於 Resend 時跳過，不會重複建立。
 * KV 不會被清空——它保留為歷史紀錄，寄送名單以 Resend 為準。
 *
 * 需要環境變數：KV_REST_API_URL、KV_REST_API_TOKEN、
 *               RESEND_API_KEY、RESEND_SEGMENT_ID
 */
import { config as loadEnv } from "dotenv";
import { createClient } from "@vercel/kv";
import { Resend } from "resend";

loadEnv({ path: ".env.local" });

async function main() {
  const missing = [
    !process.env.KV_REST_API_URL && "KV_REST_API_URL",
    !process.env.KV_REST_API_TOKEN && "KV_REST_API_TOKEN",
    !process.env.RESEND_API_KEY && "RESEND_API_KEY",
    !process.env.RESEND_SEGMENT_ID && "RESEND_SEGMENT_ID",
  ].filter(Boolean);
  if (missing.length) {
    console.error("缺少環境變數：" + missing.join("、"));
    process.exit(1);
  }

  const kv = createClient({
    url: process.env.KV_REST_API_URL!,
    token: process.env.KV_REST_API_TOKEN!,
  });
  const resend = new Resend(process.env.RESEND_API_KEY!);
  const segmentId = process.env.RESEND_SEGMENT_ID!;

  const emails = await kv.smembers("subscribers:emails");
  console.log(`KV 內共 ${emails.length} 位歷史訂閱者`);

  let ok = 0;
  let skipped = 0;
  for (const email of emails) {
    const res = await resend.contacts.create({
      email: String(email),
      unsubscribed: false,
      segments: [{ id: segmentId }],
    });
    if (res.error) {
      // 已存在或格式問題——記錄後continue，不中斷整批
      console.warn(`  跳過 ${email}：${res.error.message}`);
      skipped++;
    } else {
      console.log(`  ✓ ${email}`);
      ok++;
    }
  }

  console.log(`完成：新增 ${ok}、跳過 ${skipped}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
