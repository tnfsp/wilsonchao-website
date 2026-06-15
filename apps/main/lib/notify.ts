import { Resend } from "resend";

/**
 * notify.ts — 寄通知給站長本人（Wilson）。
 *
 * 用 Email（Resend），而不是 Telegram——因為 Resend 已經配在 Vercel 上
 * （週報/訂閱在用），所以「不用再往 Vercel 加任何新密鑰」就能動。
 *
 * 收件人：DRAWER_NOTIFY_EMAIL，沒設就寄到 hi@wilsonchao.com（About 頁的聯絡信箱）。
 * 寄件人沿用站上既有的 RESEND_FROM。
 *
 * best-effort：通知失敗絕不該讓使用者的請求掛掉（留言已存進 KV 當備份）。
 * 回傳是否真的寄出，讓 caller 判斷「KV + Email 是否兩條路都失敗」。
 */

export async function notifyOwnerEmail(
  subject: string,
  html: string
): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("[notify] RESEND_API_KEY 未設定 — 略過 Email 通知。");
    return false;
  }

  const to = process.env.DRAWER_NOTIFY_EMAIL || "hi@wilsonchao.com";

  try {
    const resend = new Resend(apiKey);
    // 必須 await：serverless 在回應後會凍結 function，fire-and-forget 的寄信會被砍掉。
    const sent = await resend.emails.send({
      from: process.env.RESEND_FROM || "Wilson Chao <hi@wilsonchao.com>",
      to,
      subject,
      html,
    });
    if (sent.error) {
      // Resend SDK 不 throw，錯誤在回傳值裡。
      console.error("[notify] Resend send 失敗:", sent.error);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[notify] Email 通知失敗:", err);
    return false;
  }
}
