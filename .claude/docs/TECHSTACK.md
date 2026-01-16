# 技術棧 (TECHSTACK)

## 現有技術棧

### 前端
- **Framework**: Next.js 16 (App Router)
- **UI Library**: React 19
- **Styling**: Tailwind CSS 4
- **Font**: Geist Sans / Geist Mono

### 後端
- **Runtime**: Edge Runtime (Vercel)
- **API**: Next.js Route Handlers

### 資料庫
- **KV Store**: Vercel KV (Redis)
- **內容來源**: Notion → JSON (via sync script)

### 部署
- **Platform**: Vercel
- **Domain**: wilsonchao.com

---

## 新增技術棧

### Feature 1: 回覆系統

| 項目 | 選擇 | 說明 |
|------|------|------|
| 資料儲存 | Vercel KV | 使用現有 KV，無需額外服務 |
| ID 生成 | nanoid | 輕量、URL-safe |
| XSS 防護 | DOMPurify 或手動 escape | 過濾使用者輸入 |

**新增依賴**：
```bash
npm install nanoid
# DOMPurify 可選，或使用簡單的 HTML escape
```

**資料結構 (Vercel KV)**：
```
comments:{slug}:list → JSON array of Comment objects
```

---

### Feature 2: 訂閱系統

| 項目 | 選擇 | 說明 |
|------|------|------|
| Email 儲存 | Vercel KV | Set 結構防重複 |
| 未來發信 | Resend (可選) | 免費 3000 封/月 |

**資料結構 (Vercel KV)**：
```
subscribers:emails → Set of email strings
subscribers:{email}:meta → JSON { subscribedAt, source }
```

**RSS 強化**：
- 無需新增依賴，調整現有 UI

---

### Feature 3: 搜尋系統

| 項目 | 選擇 | 說明 |
|------|------|------|
| 搜尋引擎 | Pagefind | 靜態索引，~10KB runtime |
| 中文支援 | 內建 | Pagefind 支援 CJK |

**新增依賴**：
```bash
npm install -D pagefind
```

**Build 整合**：
```json
// package.json
{
  "scripts": {
    "build": "next build && npx pagefind --site .next/server/app --output-path public/pagefind"
  }
}
```

**注意**：Next.js App Router 的靜態輸出位置需要測試確認

---

### Feature 4: Analytics & SEO

| 項目 | 選擇 | 說明 |
|------|------|------|
| Analytics | @vercel/analytics | 官方套件，零配置 |
| Sitemap | next-sitemap 或手寫 | 自動生成 sitemap.xml |
| SEO | Next.js Metadata API | 內建支援 |

**新增依賴**：
```bash
npm install @vercel/analytics
npm install -D next-sitemap  # 可選
```

**Metadata 實作**：
使用 Next.js 內建的 `generateMetadata` 函數

---

## 依賴總覽

### 生產依賴 (dependencies)
```json
{
  "@vercel/analytics": "^1.x",
  "nanoid": "^5.x"
}
```

### 開發依賴 (devDependencies)
```json
{
  "pagefind": "^1.x",
  "next-sitemap": "^4.x"  // 可選
}
```

---

## 環境變數

### 現有
```env
KV_REST_API_URL=xxx
KV_REST_API_TOKEN=xxx
MURMUR_FEED_URL=xxx
NEXT_PUBLIC_BUTTONDOWN_URL=xxx  # 可移除
NEXT_PUBLIC_GISCUS_*=xxx        # 可移除
```

### 新增
```env
# Google Search Console 驗證（可選）
NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION=xxx

# Resend API（未來 Email 發送用，可選）
RESEND_API_KEY=xxx
```

---

## 檔案結構變更

```
wilsonchao.com/
├── app/
│   ├── api/
│   │   ├── comments/
│   │   │   └── route.ts        # 新增：留言 API
│   │   └── subscribe/
│   │       └── route.ts        # 新增：訂閱 API
│   ├── sitemap.ts              # 新增：動態 sitemap
│   ├── robots.ts               # 新增：robots.txt
│   └── layout.tsx              # 修改：加入 Analytics
├── components/
│   └── ui/
│       ├── CommentSection.tsx  # 新增：留言區元件
│       ├── SubscribeForm.tsx   # 新增：訂閱表單
│       └── SearchBox.tsx       # 新增：搜尋框
├── public/
│   └── pagefind/               # Build 時生成
└── lib/
    └── seo.ts                  # 新增：SEO 工具函數（可選）
```

---

## 選擇原因

### 為何自建留言而非用 Giscus？
- 完全控制 UI 風格
- 無需 GitHub 帳號
- 已有 Vercel KV 基礎建設

### 為何用 Pagefind 而非 Algolia？
- 零成本
- 無需外部服務
- 足夠應付個人部落格規模
- 隱私友好（無數據外傳）

### 為何用 Vercel Analytics 而非 GA4？
- 一鍵整合
- 隱私友好
- 已在 Vercel 部署
- 免費版足夠個人使用

### 為何用 Vercel KV 存 Email 而非專用服務？
- 已有基礎建設
- 簡單需求不需要完整 ESP
- 未來可輕鬆遷移到 Resend/Mailchimp
