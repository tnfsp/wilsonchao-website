# 抽屜（Drawer）功能 — CC → OWL 回交班

> 寫於 2026-06-15，by CC。對稱於當初 `HANDOFF-drawer-from-owl.md`（OWL → CC）。
> 抽屜已上線 wilsonchao.com/about。這份交代：上線了什麼、要 OWL 接手的資料合約、分工沒變的部分。

---

## 0. 一句話

抽屜做完上線了。訪客可以拉開抽屜、選 A/B、翻頁看 Wilson 親筆小品文，還能「丟一張紙條」出題。**有一條資料合約要 OWL 回 Wilson：訪客出的題目存在 Vercel KV，OWL 要怎麼撈去問 Wilson。**

---

## 1. 上線了什麼

- **抽屜**：About「品味」段裡一張會長開的卡。拉開 → 訪客選 A/B → 翻頁看 Wilson 寫的一小段（小品文）。
- **內容源**：你的 `wilson-preferences.public.jsonl` → `sync-drawer` → `content/drawer.json`。
- **成稿文字**：四題的「揭曉面」小品文是 Wilson 親筆，放站方檔 `apps/main/content/drawer-passages.json`（按 questionId 對應，sync 不覆蓋）。reason 仍從你的 public 檔來，當沒有成稿時的 fallback。
- **兩顆按鈕**：再抽一張、丟一張紙條（訪客出題）。
- **taste entities（/taste）**：你之前 entity session 的產物已併入 main、跟抽屜並存——About 保留 prose 品味段 + `/taste` 連結，full shelf 在 `/taste`。

---

## 2. 要 OWL 接手的（資料合約）— 訪客出題池

「丟一張紙條」的訪客問題存 Vercel KV：

- **key**：`drawer:questions`（一個 list）
- **每筆**：`{ id, question, from?, createdAt, asked: false }`
- **用途**：OWL 撈這些，當每天問 Wilson 的素材。撈走後把該筆 `asked` 回寫 `true`，避免重複問。

### 待 OWL 回 Wilson 的一題
OWL 在本機，**讀不到 Vercel KV**。兩個選項挑一個：
- **(a)** Wilson 給 OWL 一組 KV 唯讀 token（KV_REST_API_URL + read token），OWL 直接 REST 讀。
- **(b)** CC 在站上開一個帶 secret 的受保護 GET endpoint（如 `/api/drawer-questions?key=…`），OWL 拉。

OWL 偏好哪個，回 Wilson；要 (b) 的話 CC 來開。

---

## 3. 分工沒變

| | OWL | CC / 網站 |
|---|---|---|
| raw jsonl / 隱私閘門 | ✅ 守 | ❌ 只讀 public |
| 產出 public.jsonl | ✅（每新增 raw 後 rerun `build-preferences-public.py`） | — |
| sync / 頁面 / 部署 | — | ✅ |
| 訪客出題池消費 | ✅（撈 KV 問 Wilson） | ✅（收集進 KV） |

隱私閘門還是 OWL 守。網站只讀 public 子集，從不碰 raw。

---

## 4. 順手給 OWL 的（FYI，不用動作）

- **A/B 投票**：有存 KV（`drawer:votes:{questionId}` 是 hash，欄位 A/B 計數）。前端目前不顯示比例，要做「多少人跟你一樣」聚合隨時可開。
- **私密簽到本**：訪客留言存 `drawer:notes` + 直接 Email Wilson（Resend），OWL 不用管。
- **Watchdog**：抽屜資料 >3 天沒長新碎片，每天 09:00 Telegram ping Wilson（launchd 已裝）。所以 OWL 哪天停產 public 檔，Wilson 會被通知。

---

## 5. 相關位置

- 元件：`apps/main/components/drawer/{DrawerDeck,DrawerNote,DrawerQuestion}.tsx`
- API：`apps/main/app/api/{drawer-note,drawer-vote,drawer-question}/route.ts`
- 同步：`apps/main/scripts/sync-drawer.ts`（接 `sync:vault`）、`watchdog-drawer.ts`
- 成稿：`apps/main/content/drawer-passages.json`

要改資料合約或有問題，照舊在 OWL HQ Telegram 🦉 OWL topic 喊。
