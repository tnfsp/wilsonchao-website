# 導航重構 Spec

> Owner: Wilson | Date: 2026-03-09 | Status: In Progress

## 目標

將 wilsonchao.com 導航從 7 項精簡為 5 項，統一英文命名，新建 Stream 頁面。

### Before
```
Home | Blog | Murmur | Daily | 門診 | About | Links
```

### After
```
Blog | Journal | Stream | Clinic | About
```

---

## Task A: 導航 + 路由重構（不含 Stream 頁面建設）

### A1. SiteHeader.tsx — 更新 links 陣列

```tsx
const links = [
  { href: "/blog", label: "Blog" },
  { href: "/journal", label: "Journal" },
  { href: "/stream", label: "Stream" },
  { href: "/clinic", label: "Clinic" },
  { href: "/about", label: "About" },
];
```

### A2. Daily → Journal 路由遷移

1. **建 `app/journal/page.tsx`** — 從 `app/daily/page.tsx` 複製，修改：
   - 所有 `/daily` 連結 → `/journal`
   - section-title: "Daily" → "Journal"
   - 「上一頁」→ "Older"、「下一頁」→ "Newer"
   - `第 X / Y 頁` → `Page X of Y`

2. **建 `app/journal/[slug]/page.tsx`** — 從 `app/daily/[slug]/page.tsx` 複製，修改：
   - "Back to daily" → "Back to journal"
   - `/daily/${slug}` → `/journal/${slug}`
   - fallback type "Daily" → "Journal"

3. **建 `app/journal/feed.xml/route.ts`** 和 `app/journal/feed/route.ts` — 從 daily 對應檔案複製

4. **`app/daily/page.tsx`** — 改為 `redirect("/journal")`
5. **`app/daily/[slug]/page.tsx`** — 改為動態 redirect：`redirect(\`/journal/${slug}\`)`
6. **`app/daily/feed.xml/route.ts`** + `app/daily/feed/route.ts` — 改為 redirect 到 journal 對應路由

### A3. 刪除 `app/projects/[slug]/page.tsx`

殘留品，功能完全被 daily/[slug]（現 journal/[slug]）覆蓋。
保留 `app/projects/page.tsx` 的 redirect（改指向 `/journal`）。

### A4. Links 頁面處理

1. **`app/about/page.tsx`** — 在 aboutBody 渲染後面加一個 Links section：
   - 標題用 `<h2>` "Links"
   - 渲染 `linkItems`（從 `lib/content.ts` import）
   - 樣式：跟現有 Links 頁一樣的 rounded-full 按鈕列表
2. **`app/links/page.tsx`** — 改為 `redirect("/about")`（保留 SEO / IG bio 舊連結）
3. **`lib/placeholders.ts`** 中的 `linkItems`：
   - `"📓 murmur｜碎片日記"` → `"📓 Stream｜腦內記事"`, href → "/stream"

### A5. Murmur redirect

**`app/murmur/route.ts`** — 改為 redirect 到 `/stream`（302）

### A6. config.json 更新

```json
{
  "ProjectsPageTitle": "Journal",
  "ProjectsPageIntro": "週報、日記、遊記，生活的痕跡。",
  "HomepageMurmurIntro": "日常的腦內碎片——想法、電影、音樂，都在這裡流過。",
  "HomepageMurmurCTA": "更多 stream →"
}
```

### A7. 首頁 page.tsx 更新

1. murmur section:
   - section-title: `"murmur"` → `"Stream"`
   - 連結 `/murmur` → `/stream`
   - CTA: 「更多 murmur →」→「更多 stream →」
2. Latest Daily section:
   - section-title: `"Latest Daily"` → `"Journal"`
   - 「查看更多 →」→ `"Read more →"`
   - 連結 `/daily` → `/journal`
   - `/daily/${slug}` → `/journal/${slug}`
3. Latest Blog section:
   - 「查看更多 →」→ `"Read more →"`

### A8. sitemap.ts 更新

- `/daily` → `/journal`
- 加 `/stream`（priority 0.8, changeFrequency "daily"）
- 移除 `/links`（或保留指向 about）
- daily slug URLs → journal slug URLs

### A9. placeholders.ts 更新

- `defaultSiteCopy`: 加 `streamIntro`, `streamCTA` 欄位
- `murmurIntro` / `murmurCTA` 保留但標記 deprecated
- `projectsTitle` → "Journal"
- `linkItems` 中 murmur → stream

### A10. lib/content.ts 更新

- 加 `loadStreamEntries()` 作為 `loadMurmurEntries()` 的 alias（同一函數 re-export）
- `loadSiteCopy()` 加 `streamIntro` / `streamCTA` 欄位讀取（fallback 到 murmur 欄位）

### A11. next.config.ts — 加 redirects

```ts
async redirects() {
  return [
    { source: '/daily/:slug*', destination: '/journal/:slug*', permanent: false },
    { source: '/murmur', destination: '/stream', permanent: false },
    { source: '/links', destination: '/about', permanent: false },
    { source: '/projects/:slug*', destination: '/journal/:slug*', permanent: false },
  ];
},
```

> 注意：如果用 next.config.ts redirects，就不需要在各個 page.tsx 裡寫 redirect 了。選一種方式。
> **建議用 next.config.ts 統一管理 redirects**，然後把 app/daily/、app/murmur/、app/links/、app/projects/ 的舊頁面全部刪除。

---

## Task B: Stream 頁面建設

### B1. 建 `app/stream/page.tsx`

- 完整列表頁，呼叫 `loadStreamEntries(limit)` — limit 設 20
- 設計風格：與首頁 murmur section 一致
- 每則 entry 一個卡片：內容文字 + 時間戳（右下角）
- 底部 CTA：「完整版 →」連結到 murmur.wilsonchao.com（外站有完整歷史）
- 頁面標題：Stream
- 頁面副標題：從 config.json 讀（`HomepageStreamIntro`）

### B2. lib/content.ts — `loadStreamEntries()`

```ts
export async function loadStreamEntries(limit = 20): Promise<MurmurEntry[]> {
  // 與 loadMurmurEntries 相同邏輯，只是 limit 不同
  // revalidate: 60（ISR）
}
```

也可以直接讓 `loadMurmurEntries` 接受更大的 limit，然後 `loadStreamEntries = (limit = 20) => loadMurmurEntries(limit)`

### B3. metadata

```ts
export const metadata = {
  title: "Stream — Wilson Chao",
  description: "日常的腦內碎片——想法、電影、音樂，都在這裡流過。",
};
```

---

## UI 語言統一規則

| 元素類型 | 語言 | 範例 |
|----------|------|------|
| 導航 | 英文 | Blog, Journal, Stream, Clinic, About |
| 按鈕 / 分頁 | 英文 | Read more, Older, Newer, Page X of Y, Back |
| section-title | 英文 | Blog, Journal, Stream, About |
| 頁面標題（h1） | 中文 | 文章, Journal, 腦內記事 |
| 內容文案 | 中文 | 「醫學、故事與自由生活練習」 |
| Footer | 中文 | 「只代表個人意見，純手工打造」 |

---

## 驗證 Checklist

- [ ] 所有導航連結可點擊且到正確頁面
- [ ] `/murmur` redirect 到 `/stream`
- [ ] `/daily` redirect 到 `/journal`
- [ ] `/daily/weekly-007` redirect 到 `/journal/weekly-007`
- [ ] `/links` redirect 到 `/about`
- [ ] `/projects` redirect 到 `/journal`
- [ ] `/projects/some-slug` redirect 到 `/journal/some-slug`
- [ ] Stream 頁面顯示 20 則 entries
- [ ] 首頁三個 section（Blog / Stream / Journal）正常渲染
- [ ] About 頁底部有 Links section
- [ ] RSS feed（`/journal/feed.xml`）正常
- [ ] sitemap 反映新路由
- [ ] `npm run build` 無錯誤
- [ ] UI 文字統一（無中文按鈕殘留）
