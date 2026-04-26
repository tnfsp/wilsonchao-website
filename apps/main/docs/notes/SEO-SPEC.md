# SEO Phase 1 Technical Spec

> 目標：修復技術基礎，讓 Google 能正確爬取和索引 wilsonchao.com
> 參考：`~/.openclaw/workspace/data/seo-strategy-2026-q1.md`

---

## 背景

GSC 現況：62 URLs submitted，僅首頁被索引。主因是 sitemap/canonical 用 `wilsonchao.com` 但實際 redirect 到 `www.wilsonchao.com`，造成信號不一致。

---

## Task 1：統一 BASE_URL 為 www

**問題**：網站實際 serve 在 `www.wilsonchao.com`（有 301 redirect），但程式碼全部 hardcode `https://wilsonchao.com`。

**改動**：

### 1a. `app/sitemap.ts`
```
- const BASE_URL = "https://wilsonchao.com";
+ const BASE_URL = "https://www.wilsonchao.com";
```

### 1b. `app/robots.ts`
```
- sitemap: "https://wilsonchao.com/sitemap.xml",
+ sitemap: "https://www.wilsonchao.com/sitemap.xml",
```

### 1c. `app/blog/[slug]/page.tsx`
```
- const BASE_URL = "https://wilsonchao.com";
+ const BASE_URL = "https://www.wilsonchao.com";
```

### 1d. `app/page.tsx`
```
- const BASE_URL = "https://wilsonchao.com";
+ const BASE_URL = "https://www.wilsonchao.com";
```

### 1e. 全域搜尋
搜尋所有 `.ts` / `.tsx` 檔案中的 `https://wilsonchao.com`，統一改為 `https://www.wilsonchao.com`。

**最佳做法**：把 BASE_URL 抽成單一常數（例如 `lib/constants.ts` 或用 `NEXT_PUBLIC_SITE_URL` 環境變數），所有地方 import，避免日後不一致。

---

## Task 2：加 metadataBase + canonical

**問題**：Next.js 沒有設定 `metadataBase`，也沒有自動 canonical tag。

**改動**：

### 2a. `app/layout.tsx` metadata 加 metadataBase
```typescript
export const metadata: Metadata = {
  metadataBase: new URL("https://www.wilsonchao.com"),
  title: "趙玴祥 Wilson Chao — 心臟外科醫師・對世界好奇的人",
  description: "高醫心臟外科醫師的個人網站。寫手術室裡外的觀察、醫師生活反思、AI 工具如何改變日常。",
  alternates: {
    canonical: "/",
    types: {
      "application/rss+xml": [
        { url: "/feed.xml", title: "wilsonchao.com — All" },
        { url: "/blog/feed.xml", title: "wilsonchao.com — Blog" },
        { url: "/journal/feed.xml", title: "wilsonchao.com — Journal" },
        { url: "/stream/feed.xml", title: "wilsonchao.com — Stream" },
      ],
    },
  },
  // ... rest
};
```

設定 `metadataBase` 後，Next.js 會自動對所有頁面生成 `<link rel="canonical">` tag。

### 2b. 各頁面 generateMetadata 加 alternates.canonical

`app/blog/[slug]/page.tsx`:
```typescript
return {
  // ... existing fields
  alternates: {
    canonical: `/blog/${slug}`,
  },
};
```

`app/journal/[slug]/page.tsx`:
```typescript
return {
  // ... existing fields
  alternates: {
    canonical: `/journal/${slug}`,
  },
};
```

其他靜態頁（about、clinic、now、blog 列表、journal 列表）如果有 `generateMetadata` 或 `export const metadata`，也加 canonical。

---

## Task 3：優化首頁 title + description

**問題**：首頁 title 是 `wilsonchao.com`（毫無 SEO 價值），description 是英文。

**改動**：`app/layout.tsx`

```typescript
title: "趙玴祥 Wilson Chao — 心臟外科醫師・對世界好奇的人",
description: "高醫心臟外科醫師的個人網站。寫手術室裡外的觀察、醫師生活反思、AI 工具如何改變日常。",
```

同時更新 OG metadata：
```typescript
openGraph: {
  title: "趙玴祥 Wilson Chao",
  description: "心臟外科醫師・對世界好奇的人",
  url: "https://www.wilsonchao.com",
  siteName: "wilsonchao.com",
  type: "website",
},
```

---

## Task 4：Sitemap 排除 UUID slug

**問題**：~20 篇 journal 用 Notion UUID 當 slug（如 `2c0bd17b-5bf9-8069-...`），SEO 價值為零且污染 sitemap。

**改動**：`app/sitemap.ts`，在 dailyPages 的 filter 加入 UUID 排除：

```typescript
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const dailyPages: MetadataRoute.Sitemap = projects
  .filter((project) => project.slug && !UUID_PATTERN.test(project.slug))
  .map((project) => ({
    url: `${BASE_URL}/journal/${project.slug}`,
    lastModified: project.date ? new Date(project.date) : new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));
```

**注意**：這不影響頁面本身的訪問，只是從 sitemap 移除，不浪費 crawl budget。

---

## Task 5：Journal 頁面加 Article schema

**問題**：Blog 頁面已有 JSON-LD Article schema ✅，但 Journal 頁面沒有。

**改動**：`app/journal/[slug]/page.tsx`，在 return 的 JSX 前加：

```typescript
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: entry.title,
  description: entry.excerpt || entry.description || "",
  image: entry.image || "https://www.wilsonchao.com/avatar.png",
  datePublished: entry.date,
  author: {
    "@type": "Person",
    name: "趙玴祥",
    alternateName: "Yi-Hsiang Chao",
    url: "https://www.wilsonchao.com/about",
  },
  mainEntityOfPage: {
    "@type": "WebPage",
    "@id": `https://www.wilsonchao.com/journal/${slug}`,
  },
};
```

並在 JSX 最外層加 `<script type="application/ld+json">`。

---

## Task 6（建議）：BASE_URL 抽成常數

避免 hardcode 散落各處，建立 `lib/constants.ts`：

```typescript
export const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.wilsonchao.com";
```

所有檔案改用 `import { BASE_URL } from "@/lib/constants"` 。

---

## 驗證清單

完成後逐項確認：

- [ ] `npm run build` 成功，無 error
- [ ] 本地跑 `curl localhost:3000/sitemap.xml` — 所有 URL 以 `https://www.wilsonchao.com` 開頭
- [ ] 本地跑 `curl localhost:3000/robots.txt` — sitemap 指向 `https://www.wilsonchao.com/sitemap.xml`
- [ ] 首頁 HTML 原始碼有 `<link rel="canonical" href="https://www.wilsonchao.com/">`
- [ ] 首頁 `<title>` 包含「趙玴祥」
- [ ] Blog 文章頁有 canonical tag
- [ ] Sitemap 中無 UUID slug 的 journal 頁面
- [ ] Journal 文章頁有 JSON-LD Article schema
- [ ] 全域搜尋無殘留的 `"https://wilsonchao.com"` （不含 www）

---

## 不做的事

- ❌ 不改 Notion 的 slug（那是 CMS 端，這個 spec 只改前端）
- ❌ 不改內容（title tag 優化是 Notion CMS 那邊的事，Phase 2 做）
- ❌ 不改 CSS / 設計 / 功能
- ❌ 不動 murmur 子站

## Commit

改完後一個 commit：`[SEO] Phase 1: canonical, sitemap, meta, schema fixes`
