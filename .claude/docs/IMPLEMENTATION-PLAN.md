# 實作計畫

## 專案資訊
- **專案名稱**：wilsonchao.com 功能擴充
- **範圍**：四大功能模組（Analytics & SEO、搜尋、訂閱、回覆）
- **技術棧**：Next.js 16 + Vercel KV + Pagefind

---

## Phase 1: Analytics & SEO (P0) ✅ 完成

最快見效，無需複雜開發。

### 1.1 Vercel Analytics
- [x] 安裝 `@vercel/analytics`
- [x] 在 `layout.tsx` 加入 `<Analytics />`

### 1.2 Sitemap
- [x] 建立 `app/sitemap.ts`
- [x] 動態生成所有 Blog、Daily 頁面

### 1.3 Robots.txt
- [x] 建立 `app/robots.ts`
- [x] 設定允許爬取並指向 sitemap

### 1.4 Meta Tags 強化
- [x] 檢查現有 metadata 設定
- [x] 確保各頁面有正確的 OG tags
- [x] 加入 Twitter Card tags

### 1.5 JSON-LD 結構化資料
- [x] 首頁加入 WebSite schema
- [x] 文章頁加入 Article schema
- [x] About 頁加入 Person schema

---

## Phase 2: 搜尋系統 (P1) ✅ 完成

Pagefind 整合相對簡單。

### 2.1 Pagefind 設定
- [x] 安裝 `pagefind` (devDependency)
- [x] 修改 build script 加入 pagefind 索引生成
- [x] 測試中文搜尋功能

### 2.2 搜尋 UI
- [x] 建立 `SearchBox.tsx` 元件
- [x] 在 SiteHeader 加入搜尋圖示
- [x] 支援 Ctrl+K 快捷鍵

---

## Phase 3: 訂閱系統 (P2) ✅ 完成

### 3.1 RSS 強化
- [x] 在 SiteHeader 加入 RSS 圖示
- [x] RSS feed 已存在且內容完整

### 3.2 Email 訂閱
- [x] 建立 `POST /api/subscribe` API
- [x] 建立 `SubscribeForm.tsx` 元件
- [x] Email 存入 Vercel KV（Set 結構防重複）
- [x] 在文章頁底部加入訂閱表單

---

## Phase 4: 回覆系統 (P3) ✅ 完成

功能完整但開發量較大。

### 4.1 API 開發
- [x] 安裝 `nanoid`
- [x] 建立 `GET /api/comments?slug=xxx`
- [x] 建立 `POST /api/comments`
- [x] 實作 XSS 防護

### 4.2 留言 UI
- [x] 建立新的 `CommentSection.tsx`（取代 Giscus）
- [x] 留言表單（暱稱、Email、內容）
- [x] 留言列表顯示
- [x] Honeypot 防 spam

### 4.3 整合
- [x] 在 Blog 文章頁整合

---

## 進度追蹤

| Phase | 狀態 | 完成度 |
|-------|------|--------|
| Phase 1: Analytics & SEO | ✅ 完成 | 100% |
| Phase 2: 搜尋系統 | ✅ 完成 | 100% |
| Phase 3: 訂閱系統 | ✅ 完成 | 100% |
| Phase 4: 回覆系統 | ✅ 完成 | 100% |

---

## 已安裝依賴

```bash
# 生產依賴
@vercel/analytics
nanoid

# 開發依賴
pagefind
```

---

## 檔案變更清單

```
app/
├── layout.tsx              # 修改：加入 Analytics
├── sitemap.ts              # 新增
├── robots.ts               # 新增
├── page.tsx                # 修改：加入 WebSite JSON-LD
├── about/page.tsx          # 修改：加入 Person JSON-LD
├── api/
│   ├── comments/route.ts   # 新增
│   └── subscribe/route.ts  # 新增
└── blog/[slug]/page.tsx    # 修改：加入 Article JSON-LD、OG tags、Comments、Subscribe

components/
├── layout/SiteHeader.tsx   # 修改：加入搜尋、RSS 圖示
└── ui/
    ├── CommentSection.tsx  # 新增
    ├── SubscribeForm.tsx   # 新增
    └── SearchBox.tsx       # 新增

public/
└── pagefind/               # Build 時生成
```
