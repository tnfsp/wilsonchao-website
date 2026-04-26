# SPEC: Blog + Journal 合併

> Status: approved by Wilson 2026-03-22
> Type system: essay / diary / weekly

## 背景

將 Blog 和 Journal 合併為統一的 /blog 頁面。Vault 結構不變，只改 sync-vault 輸出和網站路由。

## Type 系統

| Type | Vault 來源 | 內容 | 篇數 |
|------|-----------|------|------|
| essay | Brand/Blog/ | 有主題有結構的長文 | 11 |
| diary | Brand/Daily/ | 日常書寫（醫院、旅行、隨筆） | 40 |
| weekly | Brand/週報/ | 固定格式週報 | 8 |

Filter pills: `[ All ] [ Essay ] [ Diary ] [ Weekly ]`

### Type mapping（現有 → 新）

| 現有 type | 新 type |
|-----------|---------|
| 觀點 | essay |
| 工作流 | essay |
| workflow | essay |
| 成長反思 | essay |
| blog-material | essay |
| 醫院 | diary |
| 隨筆寫寫 | diary |
| 假期 | diary |
| 週報 | weekly |

## 架構變化

```
Before:
  Brand/Blog/*.md → sync-vault → content/blog/*.json → /blog/{slug}
  Brand/週報/*.md → sync-vault → content/projects.json → /journal/{slug}
  Brand/Daily/*.md → sync-vault → content/projects.json → /journal/{slug}

After:
  Brand/Blog/*.md  ─┐
  Brand/週報/*.md   ─┼→ sync-vault → content/blog/*.json → /blog/{slug}
  Brand/Daily/*.md ─┘
```

## 改動清單

### 1. Vault frontmatter 更新
- 所有 Daily/ 的 type 統一改成 `diary`
- 所有 Blog/ 的 type 統一改成 `essay`
- 週報/ 已經是 `週報`，改成 `weekly`
- UUID slug 改成有意義的英文 slug

### 2. sync-vault.ts
- 週報 + Daily 不再寫 projects.json，改寫成 content/blog/{slug}.json
- 欄位對齊 BlogEntry 格式（publishedAt 而非 date）
- 圖片資產統一到 public/content/blog/
- projects.json 寫空陣列 []（避免 build 報錯）

### 3. lib/content.ts
- 廢棄 loadProjects() 和 getProject()
- loadBlogEntries() 處理所有 type
- filter pills 從 type 欄位自動生成

### 4. 首頁 app/page.tsx
- 不再分開撈 loadProjects() + loadBlogEntries()
- 「最近寫的」直接從 loadBlogEntries() 取

### 5. next.config.ts redirects
- /journal → /blog
- /journal/:slug → /blog/:slug
- /projects → /blog（更新現有 chain）
- /projects/:slug → /blog/:slug
- 所有舊 UUID slug → 新 slug

### 6. 刪除 app/journal/
- page.tsx, [slug]/, feed.xml route

### 7. RSS
- /blog/feed.xml 包含所有內容
- layout.tsx metadata 移除 journal feed
- /journal/feed.xml → redirect 到 /blog/feed.xml

### 8. RSS icon → footer
- SiteHeader.tsx 移除 RSS icon
- Footer 加上 RSS 連結

### 9. 圖片遷移
- public/content/projects/covers/ → public/content/blog/covers/

## Slug 改名（Daily/ UUID → 有意義）

需要一個 migration script：
1. 讀所有 Daily/*.md 的 frontmatter
2. 根據標題生成英文 slug
3. 更新 Vault 檔案的 slug 欄位
4. 記錄 old → new mapping 供 redirect 用

## 執行順序

1. 跑 slug migration script 更新 Vault frontmatter
2. 改 sync-vault.ts
3. 改 content.ts
4. 改首頁 page.tsx
5. 加 redirect（next.config.ts）
6. 刪 app/journal/
7. 合併 RSS
8. RSS icon 移到 footer
9. 圖片遷移
10. 本地 build 驗證
11. git push → Vercel 部署
