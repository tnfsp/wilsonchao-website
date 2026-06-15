# 設計建議：About「品味」要不要 entity 化？

> 類型：探索 + 設計建議（**不含實作**）
> 撰寫：Claude Code（worktree `ecstatic-sammet-ffb440`）
> 日期：2026-06-15
> 範圍：About 頁品味段（音樂/閱讀/電影）+ 抽屜小喜好，是否串接 Obsidian Vault 的 entity 系統
> 對齊對象：部分結論需先與 **OWL**（🦉 OWL topic）對齊資料層與隱私閘門

---

## 0. TL;DR — 建議摘要

**不要把 About 的品味散文改寫成 entity-backed 清單。** 散文本身就是品味——「喜歡威士忌，是真的喜歡還是假裝喜歡可以得到上一階級的快感？」這種反身的文字，正是這頁的靈魂；把它換成「威士忌・評分 7・tags: 烈酒」會殺掉它。這也違反站點目前「閱讀優先 / 散文敘事」的設計收斂方向。

**要做的是另一件事：在散文之外，開一個獨立的 entity-backed 頁面 `/taste`**，價值在**聚合**與**交叉連結**（「我喜歡的東西」櫃子、blog ↔ 作品互連），而不是取代敘事。**About 不塞架子、只引流去 `/taste`**（IA 決定見 §4.1）——否則本就 15 段的 About 會爆。

三個關鍵判斷：

1. **entity 資料幾乎是免費的** —— Vault 的 `6-Entities/` 已經有 170 本書、85 部影視、14 個音樂、457 個人物（含 DJ），Wilson 本來就在維護，OWL 也在自動維護。要建模的東西**早就建好了**。成本不在「建 entity」，而在「安全地把選定的子集投影到網站」。
2. **品味 ≠ 抽屜，是兩種資料形狀，不該硬塞同一個 schema**（會是過度工程，違反 W4）。但它們**應該共用同一個 pipeline pattern**：OWL 產出隱私過濾後的 `.public` 投影 → CC sync 腳本 → `content/` collection → 頁面。抽屜已經把這條路走通了。
3. **這件事的隱私閘門是 OWL 的守備範圍。** CC 不該直接讀 `6-Entities/`（裡面有 rating、relationship tier、私人筆記）。應沿用抽屜已驗證的模式：OWL 投影一個 `wilson-taste.public.json`，CC 只讀這個。

**現在該做的**：先**不碰管線**，保留散文，把抽屜（目前才 4 張卡）養起來、驗證需求；確認真的想要聚合頁時，再走 Phase 1。

---

## 0.5 契約定案（2026-06-15，OWL 已拍板）

第 6 節的 6 點對齊已與 OWL 來回定案（信件 thread `taste-entities-20260615`）。隱私閘門由 OWL 守，**介面收得比初版更窄、更嚴**。落地時以本節為準。

**OWL 抓到的關鍵現實**：`6-Entities/` 的 frontmatter **是異質的**（Music 用 `artist/songs_in_library`、Books 用 `heptabase_id/rating/domain/done`、People 又一套），**沒有**統一 `title/type/tags`，**也沒有**任何穩定 public slug。所以 §4.2 的乾淨 schema 是**輸出目標**，中間靠 OWL 一支 per-type normalizer 橋接髒輸入。

**OWL 的全部交付物 = 三件**（介面就這麼窄，CC 只吃一支 `.public.json`）：

1. **三個 frontmatter 約定**（opt-IN，不是抽屜的 opt-out）：
   - `public: true` — opt-in 旗標，沒標就不進候選（預設不出站）
   - `public_id` — OWL 鑄的短英文公開 slug（如 `nujabes`），改名不動它，是站內交叉連結的 key。**不複用** `heptabase_id`（內部主鍵、會洩 vault 結構）、**也不用檔名**（會改、會撞中文）。沒 `public_id` = 還沒準備好公開 = 不進投影。
   - `public_why` — OWL 策展的一句公開向的話，寫在筆記 frontmatter 裡（Wilson/OWL 可在 entity 本身 review）。投影直接取它，**正文碰都不碰**。沒寫 = `why` 留空，不自動編。
2. **`build-taste-public.py`**（與 `build-preferences-public.py` 同位置同角色）：per-type normalizer + **雙層過濾**（`public:true` 旗標 + 黑名單 scrubber，與抽屜共用那組身份/主題 regex）+ **雙輸出**（`wilson-taste.public.json` ＋ `wilson-taste.held.json` 帶 `_heldReason` 留審計）。全覆寫 + git commit 做版本化。
3. **weekly 漂移 watchdog**：品味變很慢，**重點不是 staleness 是漂移偵測**——掃所有 `public:true` entity，若某篇發布後被編輯、正文新命中黑名單，**自動降級**（踢出 public → held）+ 告警 OWL。比抽屜多一層「已發布內容反向汙染」守護。

**隱私白名單（收更緊）**：
- ✅ 可公開：`title / type / subtitle / year / tags / why / links / relatedPosts`
- ❌ 硬擋：`rating / relationship / tier / last_contact / 筆記正文 / heptabase_id / created 等所有時間戳`

**投影檔格式**：用 **JSON array**（品味是策展集合，不是 append log，比 jsonl 合適）。

**唯一未決（留給 Wilson，不急）**：`rating` 預設擋死——OWL 標紅的理由不只是隱私，是**承諾層級不同**：「我喜歡 Nujabes」≠「我給它 9.7 分」，後者把 Wilson 架到公開評分的位子。要不要個案破例放分數出站，是 Wilson 的 call（預設不放）。

---

## 1. 現況盤點

### 1.1 Vault 的 entity 系統（已成熟，但在 `Brand/` 之外）

Vault root（`OBSIDIAN_VAULT_PATH`，預設 iCloud `.../Documents/Wilson`）有一個成熟的 `6-Entities/`：

| 子資料夾 | 數量 | 對應 About 品味 |
|---|---|---|
| `Books/` | 170 | 紙牌的秘密、蘇菲的世界、卡繆、區判、格調… |
| `Movies and Series/` | 85 | 如果這世界貓消失了、橫道世之介、海潮之聲、倒帶人生、我的完美日常 |
| `Music/` | 14 | Nujabes、（DJ Shota / 蛋堡 / 伍佰 / 縱貫線可入） |
| `People/`（含 DJ） | 457 | `DJ Hunter 老師`、`DJ小馬老師`… |

**已有的結構治理：**
- 標準化 frontmatter（templater 模板）：`rating`(1-10)、`genre`、`year`、`domain`、`relationship`、`tier`(S/A/B/C)、`circle`、`created`、`done`…
- 集中 schema 文件 `_templates/SCHEMA.md`（從 7,385 筆 frontmatter 自動生成）
- MOC 系統（`0-Meta/MOC-閱讀.md`、`9-Topics/dj.md` 等），OWL 自動維護
- 部分 entity 已標 `generated_by: owl`

**關鍵限制（這是整個評估的樞紐）：**
- `6-Entities/` **不在** `Brand/` 底下。網站的 `sync-vault.ts` **只讀 `Brand/`**（Blog / Daily / 週報 / Config）。
- entity 筆記含**私人欄位**（rating、relationship tier、last_contact、私人筆記正文）——這正是 OWL 守的隱私線。
- 所以「entity 化網站」的真正工作量 **不是建模**，而是 **「安全地把選定子集 + 公開版欄位投影出來」**。

### 1.2 抽屜（已大致建好，是 A/B 偏好題模型）

抽屜實作目前在 sibling worktree `gifted-antonelli-e0a99b`，資料模型與品味**不同**：

```
資料流：~/.openclaw/.../wilson-preferences.jsonl（私）
        → OWL build-preferences-public.py（隱私過濾，砍掉 answer/answeredAt）
        → wilson-preferences.public.jsonl（公開）
        → CC sync-drawer.ts → content/drawer.json
        → DrawerDeck / DrawerNote（嵌在 /about 底部）
```

`DrawerCard` schema（每張卡是一道**選擇題**）：
```ts
{ date, questionId, question, optionA, optionB,
  choice /* A|偏A|混合|偏B|B */, reason?, tags?, category?, dimension? }
```
配套：`/api/drawer-vote`（A/B 投票 tally）、`/api/drawer-note`（私訊→email）、`watchdog-drawer.ts`（資料過期 Telegram 告警）。目前 4 張卡，每天 +1。

**重點：抽屜已經把「OWL 隱私投影 → CC sync → content collection → 頁面 + watchdog」這條 pipeline 跑通了。** 這就是品味 entity 要複用的 pattern。

### 1.3 網站 content pipeline

```
Obsidian Brand/  ──sync-vault.ts──┐
Notion DB        ──sync-notion.ts─┤→ content/*.json ──lib/content.ts loaders──→ Next.js pages
Telegram stream  ──sync-now-*.py──┤
OWL prefs.public ──sync-drawer.ts─┘
```
- `content/`：`blog/*.json`、`owl/*.json`、`site/config.json`、`now.json`、`stream.json`、`drawer.json`、（`projects.json` 是空陣列佔位）
- 讀取統一走 `lib/content.ts`（`loadBlogEntries` / `loadOwlEntries` / `loadStreamEntries` / `loadDrawerCards`…），缺檔都 graceful fallback
- **目前沒有** projects / notes / 書籤 / 「我喜歡的東西」這種 collection
- sync 都是**手動 / 本地**觸發（非 Vercel build step）

---

## 2. 核心洞察：三種不同的資料形狀

把三者攤開比較，是否該共用 schema 就一目了然：

| | 形狀 | 一筆是什麼 | 最佳呈現 |
|---|---|---|---|
| **品味散文**（現況） | 自由敘事 | 一段反思 | 散文（保留） |
| **品味 entity**（提案） | 實體 + 屬性 + 一句「為什麼」 | 一個作品/人 | 卡片 / 書架 / 聚合頁 |
| **抽屜** | 二元選擇題 + 理由 | 一道 A/B 題 | 翻牌卡 |

→ **品味 entity 與抽屜共用一個 schema 是錯的**（一個是「名詞：作品」，一個是「問句：選擇」，硬合會兩邊都彆扭，違反 W4 過度工程警戒）。
→ **它們該共用的是 pattern 與設計語言**，不是資料模型。

---

## 3. 價值 vs 成本

### 3.1 entity 化的價值（為什麼可能值得）

- **資料近乎免費**：entity 已存在且持續被維護，邊際建模成本 ≈ 0。
- **交叉連結**：blog 提到《如果這世界貓消失了》能連到該作品；作品能反連提到它的文章 → 站內網狀化。
- **聚合頁**：未來可做 `/taste` 或「我喜歡的東西」——書架、片單、歌單，一覽且可篩。
- **長期思考（W5）**：結構化資料是一次投資、多處收割（OG 卡、RSS、搜尋、之後的推薦）。
- **與 OWL 一致**：OWL 已在自動維護 entity，投影到網站順理成章。

### 3.2 成本與風險（為什麼要克制）

- **隱私投影層是真工作**：不能直接 sync `6-Entities/`（rating / tier / 私人正文會外洩）。需 OWL 新增投影 + 過濾 + 一個公開 schema 契約。**這是主要成本，且落在 OWL 不是 CC。**
- **散文不可結構化**：品味段的價值在反身敘事。entity 化若**取代**散文 = 把靈魂換成資料庫列表，違反站點「閱讀優先」收斂與 Wilson 的 voice（基於共鳴而非展示）。
- **新增維護面**：新 sync 腳本 + 新 collection + 新型別 + 新頁面 + watchdog + 一個 OWL↔網站資料契約要長期養。
- **需求未驗證（W6）**：抽屜才 4 張卡、聚合頁還沒人要。現在建整條 entity 管線，可能是「現在覺得爽」而非「讓未來更輕鬆」。

### 3.3 對照「維持散文」的簡單

維持散文：成本 0、靈魂滿、無隱私風險、無新維護面；缺點只是「不能聚合 / 不能互連」。
**結論：散文該留。entity 是疊加，不是替換。且疊加要等需求成立再做。**

---

## 4. 建議方案與資料模型

### 4.1 方案：散文為主，entity 為輔，沿用抽屜 pattern

```
6-Entities/（私，CC 不讀）
   │  OWL 投影 + 隱私過濾（只挑 public:true 的，只帶公開欄位）
   ▼
~/.openclaw/workspace/data/wilson-taste.public.json   ← 新資料契約（OWL 擁有）
   │  CC sync-taste.ts（複製 sync-drawer.ts 的 graceful 模式）
   ▼
apps/main/content/taste.json
   │  lib/content.ts: loadTasteEntries()
   ▼
獨立 /taste 頁（櫃子本體）；About 三段散文不變，只多一條引流連結
```

**IA 決定（2026-06-15，Wilson 拍板）：架子不嵌 About，獨立成 `/taste` 頁。**
About 已 15 段、偏長，再塞書架/片單/歌單會爆，而且架子的本質是「可逛、可篩、可互連」——那是一個頁面該做的事，不是頁尾附錄。所以：
- **About**：三段品味散文**原樣保留、不加卡片**，只在結尾多一條連結（傾向三段後共用一條「→ 我喜歡的東西都收在這 `/taste`」，最乾淨）。About 反而比舊提案更短。
- **`/taste`**：entity-backed 櫃子本體——書架/片單/歌單，可按 書·影·樂·人 + tag 篩。它會長大（標一個 `public:true` 就多一張），About 不會因此變長。
- 與現有站一致：跟 `/now`、`/owl`、`/stream` 同級的獨立頁。
- 副作用：**Phase 1 更單純**——不用做「嵌在 About 段落下的 shelf 元件」，直接開 `/taste` 路由吃 `taste.json`，About 只加連結。

**為什麼用 `.public.json` 投影、而不是擴充 sync-vault 直讀 `6-Entities/`：**
- CC 永遠不碰私人 entity 正文 → 隱私邊界乾淨（與抽屜一致）。
- 不把私域 vault 結構混進 `Brand/`。
- 抽屜已證明這條路可行（含 watchdog 過期告警）。

### 4.2 公開 entity schema（提案，需與 OWL 定稿）

```ts
// content/taste.json — 一筆 = 一個 Wilson 喜歡的作品/人
type TasteEntity = {
  id: string;            // 穩定公開 slug，如 "nujabes"（改名不破連結）
  type: "music" | "book" | "movie" | "person";
  title: string;         // "Nujabes" / "紙牌的秘密"
  subtitle?: string;     // "日本 Lo-fi/Hip-hop 製作人"（可選）
  year?: number;
  tags?: string[];       // 公開向的標籤
  why?: string;          // ★ 靈魂：Wilson 一句「為什麼喜歡」（OWL 策展，非直接搬私人正文）
  links?: { label: string; url: string }[]; // 外部（可選）
  relatedPosts?: string[];                   // blog slug，交叉連結（可選）
  // 不公開：rating / relationship / tier / last_contact / 私人正文
};
```

**隱私白名單原則**：預設**不**帶 rating、relationship、tier、last_contact、筆記正文。`why` 由 OWL 從筆記策展出一句**公開向**的話（私人正文可能含反思，不可直搬）。

### 4.3 品味 vs 抽屜：要不要共用？

| 共用層級 | 建議 | 理由 |
|---|---|---|
| 資料 schema | ❌ 不共用 | 名詞 vs 問句，形狀不同 |
| pipeline pattern | ✅ 共用 | OWL `.public` 投影 → sync → content → page → watchdog，抽屜已驗證 |
| 設計語言（卡片 / surface tokens） | ✅ 共用 | 視覺一致、零新 CSS |
| 隱私模式（OWL 過濾、CC 只讀 public） | ✅ 共用 | 同一條紅線 |
| 未來交叉連結 | ✅ 共用 | 抽屜卡可 `tag → entity`，entity 可被抽屜引用 |

---

## 5. 分階段路徑

### Phase 0 — 現在（不碰管線，低成本）
- **保留** About 品味散文原樣。
- 先把**抽屜**養起來、驗證互動與內容節奏（目前才 4 張卡）。
- （可選、純手工）在品味散文裡，對已寫到的作品手動加幾個 inline link（連到外部或之後的 anchor）——零管線成本，先試水溫「互連」有沒有感覺。
- **決策點**：確認「聚合 / 互連」真的是想要的價值，再進 Phase 1。

### Phase 1 — entity 補充層 MVP（需求成立後）
- **OWL**：產出 `wilson-taste.public.json`，先**策展一小撮**（About 已點名的那些 + 幾個），標 `public:true`，帶公開欄位 + 一句 `why`。
- **CC**：`sync-taste.ts`（仿 `sync-drawer.ts` graceful）+ `loadTasteEntries()` + `TasteEntity` 型別 + **開 `/taste` 路由**（書架/片單/歌單，沿用 `.surface-card`，可按 type/tag 篩）。**About 不嵌元件，只加一條引流連結**（見 §4.1 IA 決定）。散文仍是主角，`/taste` 是延伸的櫃子。
- （可選）watchdog 仿 `watchdog-drawer.ts`。

### Phase 2 — 交叉連結 + 聚合（內容量起來後）
- blog ↔ entity 雙向連結（`relatedPosts`）。
- 抽屜卡 `tag` → entity 連結。
- 「我喜歡的東西」聚合頁（書架 / 片單 / 歌單，可篩 type/tag）。
- （可選）per-entity 迷你頁。

---

## 6. 需先與 OWL 對齊的項目（🦉 OWL topic）

> **狀態：已於 2026-06-15 全數定案，見 §0.5。** 下列為當初提給 OWL 的 6 問與其定案摘要。

1. 隱私白名單 → ✅ 同意並收更緊（補擋 `heptabase_id` + 所有時間戳）。
2. 公開旗標 → ✅ 改 **opt-IN**（`public: true`）+ 第二層黑名單 scrubber。
3. 投影檔 → ✅ OWL 產 `wilson-taste.public.json`（array）+ `held.json` 審計，git 版本化。
4. 穩定 public id → ✅ OWL 新鑄 `public_id`，不複用 `heptabase_id`/檔名。
5. `why` 來源 → ✅ frontmatter `public_why`，OWL 策展，不碰正文。
6. 節奏 + watchdog → ✅ on-demand 重建 + **weekly 漂移 watchdog**（非 staleness）。

<details><summary>原始 6 問（保留供脈絡）</summary>

動到**資料層 / 隱私閘門 / 跨系統契約**，屬 OWL 守備範圍，**動工前先對齊**：

1. **隱私契約**：entity 哪些欄位「曾經可公開」？建議白名單 = `title / type / subtitle / year / tags / why / links`；黑名單 = `rating / relationship / tier / last_contact / 私人正文`。由 OWL 定義並強制。
2. **公開旗標約定**：在 `6-Entities/` 筆記加 `public: true`（或 `share: true`）frontmatter，或用策展 allowlist。**過濾邏輯由 OWL 擁有**（等同它對抽屜 `build-preferences-public.py` 的角色）。
3. **投影 schema 定稿**：`wilson-taste.public.json` 是新資料契約，要版本化（呼應全域 W9 版本控制原則）。
4. **穩定公開 id/slug**：每個 entity 一個不隨改名變動的 public id，避免交叉連結斷裂。
5. **`why` 的來源**：是從筆記正文抽、還是 OWL 另寫公開向一句話？（正文可能含私人反思，**不可直搬**）——建議 OWL 策展。
6. **產生節奏 + watchdog**：投影多久更新一次、過期是否告警（仿抽屜）。

</details>

---

## 7. 一句話收尾

> entity 系統已經在那了，誘人；但**品味的靈魂在散文，不在 schema**。
> 別把散文換成資料庫——把 entity 當成散文**之外**的書架，沿用抽屜走通的隱私 pipeline，等需求成立再分階段疊加。
> 動資料層之前，先讓 OWL 把隱私白名單與投影契約定下來。
