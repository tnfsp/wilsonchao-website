/**
 * Stream（腦內記事）顯示規則。純函式、無依賴，方便測試。
 *
 * 新文章發佈通知（Telegram 上「📰 新文章 #blog …」）不放腦內記事——
 * 文章本身已在 /blog（Wilson 2026-10-10）。判定只看 tags 陣列裡是否有
 * 完全等於 "blog" 的元素（不做子字串比對，#blogger 之類不會誤中）。
 */
export function isBlogAnnouncement(item: { tags?: unknown }): boolean {
  return Array.isArray(item.tags) && item.tags.some((t) => t === "blog");
}
