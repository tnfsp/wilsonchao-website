/**
 * 把要插進 HTML 的字串做 escape，含引號，
 * 所以放在屬性值（如 alt="..."）裡也安全。
 *
 * 共用於 subscribe API 的歡迎信與 send-newsletter script。
 */
export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
