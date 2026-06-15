# 設計守則 — wilsonchao.com

> 這是個**閱讀優先的個人書寫站**,不是作品集、不是 landing page。
> 任何設計決策的第一問:**這會幫助閱讀,還是在跟文字搶注意力?**

## 核心立場(看過 taste-skill 之後的結論)

坊間的「AI 設計品味」工具(如 taste-skill)優化的是**驚艷**——非對稱版面、滾動視差、磁吸互動、高資訊密度。那是給作品集/SaaS 的。

**這個站要反過來調**:

| 維度 | 這個站的取向 |
|------|------------|
| Design variance | **低** — 置中、乾淨、可預期 |
| Motion | **極低** — 只留必要的 hover/focus 過渡,尊重 `prefers-reduced-motion` |
| Visual density | **寬鬆** — 留白即呼吸,像書的內頁 |

品味不靠加東西,靠**克制**與**一致性**。我們已經有好設計;重點是讓它一致地生效。

## 三條鐵則

1. **單一真相來源** — 排版規則寫在 `globals.css` 的 `.prose` / `.owl-prose` 裡。
   **不要**在元件用一長串 `[&_p]:...` arbitrary variants 去覆蓋它(那會權重打架、悄悄蓋掉設計)。
   元件層只放結構,不放排版細節。
2. **不靠 utility 贏 cascade** — 像 `.prose{max-width:65ch}` vs `max-w-none` 這種同權重相爭很脆弱。
   要覆蓋就在 `globals.css` 加**自己的 scoped class**(定義在 tailwind import 之後,順序穩定贏)。
3. **新樣式先想 scope** — 改 `.prose` 會波及首頁/about/owl。
   只想影響 blog 就用 `.prose-blog`;只想影響 owl 就用 `.owl-prose`。先 grep 確認 class 用在哪幾頁。

## 兩套排版系統(各有識別,不要混)

- **`.prose` + `.prose-blog`** → `/blog` 文章。Sans(Geist + Noto Sans TC)、青色 accent、17px、行高 1.9、段距 1.5em。日常書寫的密度。
- **`.owl-prose`** → `/owl` essay。Serif(Newsreader + Noto Serif TC)、紙感暖底、紫色 accent、18px、38rem 窄欄。文學・沉靜。

兩者都是「閱讀優先」的同一種價值,只是聲音不同。**blog 的目標是向 owl 的工藝水準看齊,但保留自己的 sans 識別**,而不是變成 owl。

## 設計 token(`globals.css` `:root`,亮暗模式自動翻轉)

- `--background #f8f4ea` 暖米底 / `--foreground #001219` 深墨
- `--accent #0a9396` 青(主) / `--accent-strong #ca6702` 橘(強調、kicker)
- `--owl-accent #7c5cbf` 紫(僅 /owl)
- 顏色一律用 token,**不要寫死 hex**,否則 dark mode 會破。

## 標題階層慣例(文章頁 header)

kicker(類型,accent-strong 小字大字距)→ 大標 → meta(日期·閱讀時間,muted)收成**一組**,再以較大間距隔到內文。三者不要用均等 `space-y` 排,那會把階層壓平。

## 中文大標排版

`tracking-tight`(負字距)是 **Latin** 大標的慣例;套在大號**中文字**上會讓字擠在一起,該拿掉(中文方塊字本就等寬,負字距只會更悶)。多行對句用收緊的 `line-height`(~1.15)讓它讀成一個整體的塊。

## 首頁敘事順序(漏斗:先給證據,再開口)

`Hero(誰)→ intro(聲音)→ 如何逛(入口指引)→ 精選 + 最近寫的(這裡有什麼值得讀)→ 訂閱 CTA(讀完才邀請)→ footer`

**鐵則:訂閱/邀請類 CTA 收在頁尾**,不要放在文章之前——把「要求」放在「證據」後面,漏斗才順。「如何逛這個地方」是 wayfinding,放在前面當入口。

---

_更新時機:每次對排版/視覺做出有理由的決策後,補一行在這裡(記「為什麼」,不只記「改了什麼」)。_
