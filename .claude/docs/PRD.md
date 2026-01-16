# wilsonchao.com - 產品需求文件 (PRD)

## 專案概述

### 專案目標
為 wilsonchao.com 個人部落格新增四大功能模組，提升讀者互動體驗與網站可見度。

### 核心價值
- **互動性**：讓讀者能留言回應、訂閱內容
- **可搜尋性**：讓讀者能快速找到感興趣的內容
- **可追蹤性**：了解網站流量與讀者行為，優化 SEO

---

## 目標用戶

### 用戶畫像
- 對醫學、寫作、慢思考感興趣的讀者
- 習慣使用 RSS 閱讀器的 IndieWeb 愛好者
- 希望與作者互動的訪客

### 使用場景
1. 讀者閱讀文章後想留下回饋
2. 讀者想訂閱以獲得新文章通知
3. 讀者想搜尋特定主題的文章
4. 作者想了解哪些文章最受歡迎

---

## 功能需求

### Feature 1: 回覆系統（Comments）

**目標**：讓讀者能在文章下方留言

**功能規格**：
- 訪客輸入暱稱（必填）+ Email（選填，不公開）+ 留言內容（必填）
- 留言儲存於 Vercel KV
- 顯示留言者暱稱、時間、內容
- 最新留言顯示在最上方
- 簡易 spam 防護（honeypot 欄位）

**頁面位置**：
- `/blog/[slug]` 文章頁底部
- `/daily/[slug]` Daily 頁面底部（可選）

**UI 風格**：
- 與現有 LikeButton 風格一致
- 使用 CSS variables 保持主題一致性

**資料結構**：
```typescript
type Comment = {
  id: string;          // nanoid
  slug: string;        // 文章 slug
  name: string;        // 暱稱
  email?: string;      // Email (不公開)
  content: string;     // 留言內容
  createdAt: string;   // ISO timestamp
};
```

**API 端點**：
- `GET /api/comments?slug=xxx` - 取得留言列表
- `POST /api/comments` - 新增留言

---

### Feature 2: 訂閱系統（Subscribe）

**目標**：提供 RSS 與 Email 兩種訂閱方式

#### 2.1 RSS 訂閱強化

**功能規格**：
- 在 Header 或 Footer 加入明顯的 RSS 圖示連結
- 在文章列表頁加入「訂閱 RSS」提示
- 確保 RSS feed 包含完整內容

**位置**：
- SiteHeader 右側
- Blog 頁面頂部
- 文章頁底部

#### 2.2 Email 訂閱

**功能規格**：
- 簡易訂閱表單（只需輸入 Email）
- Email 儲存於 Vercel KV
- 顯示訂閱成功訊息
- 防止重複訂閱
- 未來可接 Resend API 發送通知信

**頁面位置**：
- 首頁 Hero 區塊下方（可選）
- 文章頁底部（LikeButton 旁）
- 獨立 `/subscribe` 頁面（可選）

**資料結構**：
```typescript
type Subscriber = {
  email: string;       // Email
  subscribedAt: string; // ISO timestamp
  source?: string;     // 來源頁面
};
```

**API 端點**：
- `POST /api/subscribe` - 新增訂閱

---

### Feature 3: 搜尋系統（Search）

**目標**：全站內容搜尋

**技術方案**：Pagefind

**功能規格**：
- 搜尋範圍：Blog、Daily 所有已發布內容
- 支援中文搜尋
- 即時搜尋結果預覽
- 點擊結果跳轉至對應頁面

**UI 設計**：
- Header 加入搜尋圖示
- 點擊後展開搜尋框（或 modal）
- 使用 Pagefind 內建 UI 並自定義樣式

**實作要點**：
- Build 時執行 `npx pagefind --site .next` 生成索引
- 在 layout 中載入 Pagefind CSS/JS
- 自定義樣式符合網站主題

---

### Feature 4: Analytics & SEO

**目標**：追蹤網站流量、優化搜尋引擎排名

#### 4.1 Vercel Analytics

**功能規格**：
- 啟用 Vercel Analytics（免費版）
- 追蹤頁面瀏覽、訪客來源
- 在 Vercel Dashboard 查看報告

**實作**：
- 安裝 `@vercel/analytics`
- 在 `layout.tsx` 加入 `<Analytics />`

#### 4.2 SEO 優化

**Sitemap**：
- 自動生成 `/sitemap.xml`
- 包含所有 Blog、Daily 頁面
- 每次 build 更新

**Robots.txt**：
- 允許所有搜尋引擎爬取
- 指向 sitemap 位置

**Meta Tags**：
- 每頁動態生成 title、description
- Open Graph tags（og:title, og:description, og:image）
- Twitter Card tags

**結構化資料**：
- Article schema (JSON-LD) 用於部落格文章
- WebSite schema 用於首頁
- Person schema 用於 About 頁

**Google Search Console**：
- 加入驗證 meta tag
- 提交 sitemap

---

## 非功能需求

### 效能要求
- 搜尋索引檔案 < 500KB
- 留言載入 < 500ms
- 不影響現有頁面載入速度

### 安全要求
- 留言內容需 XSS 過濾
- Email 不對外公開
- Rate limiting 防止濫用（可選）

### 相容性
- 支援現代瀏覽器（Chrome, Firefox, Safari, Edge）
- 行動裝置響應式設計

---

## Subagent 設計

本次功能開發建議使用以下分工：

| Subagent | 職責 |
|----------|------|
| **PM** | 拆解任務、排定優先順序、追蹤進度 |
| **Backend** | 實作 API routes (`/api/comments`, `/api/subscribe`) |
| **Frontend** | 實作 UI 元件（CommentSection, SubscribeForm, SearchBox） |
| **SEO** | 實作 sitemap、robots.txt、meta tags、JSON-LD |

---

## 優先順序建議

1. **P0 - Analytics & SEO**：最快見效，無需複雜開發
2. **P1 - 搜尋系統**：提升 UX，Pagefind 整合相對簡單
3. **P2 - 訂閱系統**：RSS 強化簡單，Email 收集次之
4. **P3 - 回覆系統**：功能完整但開發量較大

---

## 驗收標準

### Feature 1: 回覆系統
- [ ] 可在文章頁提交留言
- [ ] 留言即時顯示
- [ ] Honeypot 可阻擋簡單 spam

### Feature 2: 訂閱系統
- [ ] RSS 圖示可見且連結正確
- [ ] Email 訂閱表單可提交
- [ ] 重複訂閱顯示提示

### Feature 3: 搜尋系統
- [ ] 搜尋框可輸入關鍵字
- [ ] 搜尋結果正確顯示
- [ ] 中文搜尋正常運作

### Feature 4: Analytics & SEO
- [ ] Vercel Analytics 顯示數據
- [ ] sitemap.xml 可訪問
- [ ] 文章頁有正確的 OG tags
- [ ] Google Search Console 驗證通過
