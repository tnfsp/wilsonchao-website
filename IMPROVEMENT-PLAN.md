# wilsonchao.com 改善計畫

> 建立：2026-06-12（Claude Code 健康檢查 session 產出）
> v1.1：2026-06-12 整合 OWL 回饋（D1/D3 收斂、歡迎信連動精選、Phase 3 素材、分工）
> 對象：OWL + CC 分頭執行。每個 Phase 自包含，附檔案路徑與驗證標準。
> 前情：本日已完成 — 安全更新（next 16.2.9）、SEO（OG 圖、metadata、sitemap）、
> 設計（dark mode、Noto Sans TC、排版）、清債（store 拆分、KV rate limiter、
> sync 鎖、lint 歸零）。以下是「下一步」。

## 分工（v1.1 確認）

| Phase | 負責 | 狀態 |
|-------|------|------|
| 1 訂閱修復 | CC | 等 Wilson 點頭 D1=A、D3=週報 後開工 |
| 2 Start Here | CC | 等 D2 名單（OWL 候選 → Wilson 圈選） |
| 3 週報索引 | OWL | OWL 優先接（有現成素材，見 Phase 3 註記） |
| 4 全文 RSS | OWL | 進行中（無依賴；push 前向 Wilson 一句話確認） |
| 5–6 | 待分 | 穿插/殿後 |

## 核心觀察（為什麼做這些）

網站基建已經健康（RSS×3、blogroll、webring、llms.txt、搜尋、66 篇文章），
缺的不是功能，是**把已寫出來的好內容遞到新讀者手上的路**，以及**一個對讀者
失信的半成品（訂閱）**。本計畫按「對讀者的誠意」排序，工程債殿後。

## ⚠️ 決策狀態（v1.1）

| # | 決策 | 收斂結果 | 狀態 |
|---|------|---------|------|
| D1 | 訂閱路線 | **A：修好**（CC + OWL 一致建議） | 待 Wilson 點頭 |
| D2 | 精選文章名單 | OWL 正在讀全部 66 篇，產 10–12 篇候選 + 每篇一句理由 → Wilson 圈 5–8 篇。先用內容判斷，瀏覽數/Likes 之後驗證用 | OWL 候選產出中 |
| D3 | 寄送節奏 | **只寄週報**（OWL 提案，CC 同意）——D1 與 D3 是同一題：路線 A 的真正風險是「承諾節奏」，週報是唯一穩定 cadence，「最多每週一封」是唯一守得住的承諾。且週報剛改為命題式標題（「我想哭一場」），本身就是好的 email subject | 待 Wilson 點頭 |

**連動註記（OWL 提出，重要）**：D2 名單是 Phase 1 文案（1.2 歡迎信）的前置——
新讀者訂閱後的第一封信，與其說「之後會收到更新」，不如直接遞 3 篇代表作。
所以 D2 比表面上更優先：它同時解鎖 Phase 1 和 Phase 2。

---

## Phase 1：訂閱功能修復（最優先 — 它正在對讀者失信）

**現況問題**（檔案：`apps/main/app/api/subscribe/route.ts`）：
1. 寄件者 `onboarding@resend.dev` 是 Resend 測試寄件者，只能寄到帳號主信箱
   → 真實訂閱者收不到歡迎信
2. 歡迎信是英文，網站是中文，調性斷裂
3. 信中承諾 "You'll receive occasional updates" 但 codebase 中**不存在任何
   發新文章寄信的機制**——email 進了 KV `subscribers:emails` set 就沉睡

**任務（D1=A、D3=只寄週報，已收斂）**：
- [ ] 1.1（⏳ 唯一剩餘，需 Wilson：Resend 帳號/網域/segment + Cloudflare DNS + Vercel env）Resend 驗證 `wilsonchao.com` 網域（DNS 加 SPF/DKIM records，
      Vercel DNS 或現有 DNS 商操作），寄件者改為如 `hi@wilsonchao.com`
      ⚠️ 需要 Wilson 操作 Resend dashboard + DNS（或給 CC 權限）
- [x] 1.2（CC 完成）歡迎信改寫為中文，調性對齊網站（參考 voice reference；
      不亮醫師身份、不放 emoji、基於共鳴）。
      **內容直接遞 3 篇精選代表作（取自 D2 名單）**——第一封信就給價值，
      而不是承諾未來。⛓️ 依賴 D2 圈選完成
- [x] 1.3（CC 完成，含 --preview 模式）週報寄送 script（`apps/main/scripts/send-newsletter.ts`）：
      輸入週報 slug → 從 content/blog/*.json 取文章 → email 模板
      （subject 直接用命題式標題）→ Resend batch 寄給 KV set 全員。
      **由 OWL cron 或發文流程手動觸發**，不做全自動（誤寄無法收回）。
      範圍：只寄 type=weekly，一般 blog 文不寄
- [x] 1.4（CC 完成——改用 Resend Segments+Broadcasts 內建退訂 merge tag，不需自建 route）退訂機制：每封信 footer 帶退訂連結（`/api/unsubscribe?token=...`，
      token 用 email 的 HMAC，避免裸 email 進 URL），route 做 `kv.srem`
- [x] 1.5（CC 完成）SubscribeForm 文案更新：明確承諾「最多每週一封，只寄週報」

**驗證**：自己的測試信箱訂閱 → 收到中文歡迎信（非垃圾桶）→ 跑一次
send-newsletter 收到文章信 → 點退訂 → KV 確認移除。

**工時估計**：半天～一天（DNS 等待時間另計）

---

## Phase 2：Start Here 精選（新讀者動線）

**為什麼**：66 篇只有時間流 + type 篩選。從 OG 卡片/搜尋進來的新讀者
看不到代表作。這是個人網站「路過 → 讀者」轉化最有效的一步。

**任務**：
- [ ] 2.1 等 D2 名單（5–8 篇）
- [ ] 2.2 資料層：`apps/main/content/site/featured.json`（slug 陣列 + 每篇一句
      Wilson 口吻的推薦語），讀取邏輯加進 `apps/main/lib/content.ts`
- [ ] 2.3 首頁新增「從這裡開始」區塊（位置建議：hero 與「最近寫的」之間），
      樣式沿用既有 `.surface-card` / `.section-title` 體系
- [ ] 2.4 （可選）獨立 `/start` 頁 + 加入 sitemap 與導覽
- [ ] 2.5 About 頁底部導流：「想多認識我 → 從這幾篇開始」連到精選

**驗證**：preview 截圖（亮/暗模式都要）、新區塊有 og 連結可分享、
tsc + lint 過。

**工時估計**：半天

---

## Phase 3：週報系列索引（負責：OWL，優先接）

**為什麼**：週報已 16 期，是有累積感的系列，但目前只是 `?type=weekly` 篩選。

**現成素材（OWL 補充）**：
- `content/blog` 裡已有一篇 `週報索引.json`（type: moc，未發布）——vault 早有
  週報索引筆記，`/weekly` 頁的開場文案從它長出來，不用從零寫
- 16 篇標題剛去編號（改命題式），期數導航正好把「第 N 期」從標題退到導航層
  ——兩件事拼起來才完整

**任務**：
- [ ] 3.1 建獨立 `/weekly` 頁（URL 可分享），開場文案改寫自週報索引 moc
- [ ] 3.2 期數導航：每篇週報頁尾「← 上一期 / 下一期 →」（依日期排序，
      `apps/main/app/blog/[slug]/page.tsx` 已有 prev/next 邏輯，限定同 type 即可），
      導航層顯示期數（第 N 期），標題保持命題式
- [ ] 3.3 sitemap 加 `/weekly`

**驗證**：第 1 期能一路「下一期」點到第 16 期。

**工時估計**：半天

---

## Phase 4：全文 RSS（負責：OWL，進行中）

**為什麼**：現在 RSS 只有 description 摘要。Blogroll/webring 的受眾恰好是
RSS 重度使用者，全文輸出是對這群人的誠意。
無依賴、不等決策；OWL 本地驗證後、push 前向 Wilson 一句話確認。

**任務**：
- [ ] 4.1 三個 feed route（`/feed.xml`、`/blog/feed.xml`、`/stream/feed.xml`）
      加 `<content:encoded><![CDATA[...]]>`（文章 HTML 已存在 content JSON 中）
- [ ] 4.2 注意：相對路徑圖片要轉絕對 URL（`https://wilsonchao.com` prefix）
- [ ] 4.3 XML namespace 加 `xmlns:content`

**驗證**：feed 過 W3C validator；用一個 RSS reader（如 NetNewsWire）實際
訂閱看全文與圖片。

**工時估計**：2–3 小時

---

## Phase 5：體驗細節（各自獨立，可穿插做）

- [ ] 5.1 **Dark mode 手動切換**：現在只跟隨系統。需把 `globals.css` 的
      `@media (prefers-color-scheme: dark)` 改為 class-based（`html.dark`）+
      `localStorage` 記憶 + 防 FOUC 的 inline script + header 加 toggle 鈕。
      工時：半天。
- [ ] 5.2 **404 頁加搜尋框**：Pagefind 已存在（`apps/main/app/not-found.tsx`），
      讓迷路的人直接搜。工時：1 小時。
- [ ] 5.3 **效能實測**：跑 PageSpeed Insights（首頁 + 一篇長文），重點看
      3 處 `unoptimized` 圖片（`blog/[slug]/page.tsx:150`、`blog/page.tsx:105`、
      `about/page.tsx:176`）與 298KB CSS chunk。先量再修，不要盲目優化。
- [ ] 5.4 **平板版面**：blog 列表在 768–1024px 仍是單欄，可考慮
      `sm:grid-cols-2`。先看 Umami 的平板流量佔比再決定值不值得。

---

## Phase 6：工程債（讀者無感，閒時再做）

- [ ] 6.1 Button 元件統一（`components/ui/Button.tsx`，outline/solid/ghost 三變體，
      逐步替換散落的四五種按鈕寫法）
- [ ] 6.2 `packages/` 共用層（workspaces 已宣告但目錄不存在；Radix UI 與
      markdown 工具在兩個 app 重複）
- [ ] 6.3 simulator 6 個可疑邏輯查證（已有獨立 task，見 session task chip）
- [ ] 6.4 teaching middleware cookie 簽名（iron-session），密碼暴力嘗試加 delay

---

## 執行順序與依賴（v1.1）

```
D2 名單（OWL 候選 → Wilson 圈）──→ 解鎖 Phase 1.2 + Phase 2 全部
Phase 4（OWL，進行中）─────────── 無依賴
Phase 3（OWL，優先接）─────────── 有現成素材
Phase 1（CC，等 Wilson 點頭）──── 1.1/1.3/1.4 不依賴 D2，可先做；1.2 等名單
Phase 2（CC）──────────────────── 等 D2 圈選
Phase 5 → 穿插；Phase 6 → 殿後
```

**協作備忘**：OWL 與 CC 同 repo 分頭改——OWL 動 feed routes 與 /weekly，
CC 動 subscribe/unsubscribe/SubscribeForm 與首頁精選區，檔案不重疊。
雙方 push 前先 pull。

## 不做的事（明確排除）

- SEO 衝流量類操作（關鍵字堆砌、內容農場式擴寫）— 與品牌調性相悖
- 全自動電子報（無人工確認就寄出）— 誤寄無法收回
- 留言系統大改 — 現有 KV 方案夠用
- 主站導入登入/會員 — 沒有需求

## 環境備忘（給 OWL）

- Repo: `~/Project/_brand/new_website`（monorepo，主站 `apps/main`）
- 部署：push to `main` → Vercel 自動部署（專案名 `new-website`）
- 改前必跑：`npx tsc --noEmit` + `npx eslint .`（兩者目前都是 0 errors，請保持）
- Build 驗證：repo root `npm run build`
- 注意：`TEACHING_PASSWORD` 須存在於 teaching-website 的 Vercel env（fail-closed）
- 對外文案（email、精選推薦語）寫前讀 voice reference，不亮醫師身份、不放 emoji
