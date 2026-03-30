# ICU Simulator — 完整支線樹狀圖

> 由 Opus 4.6 審查產出 | 2026-03-30

**情境：術後出血→心包填塞（65M, CABG x3, POD#0, Bed 3）**
**時長：30 分鐘 | 開始：02:00 AM**

---

## 1. 完整遊戲流程樹

```
開始遊戲（phase: not_started）
│
├── loadScenario → 初始化:
│   severity=30, pathology=surgical_bleeding
│   vitals: HR 98, BP 105/62, MAP 76, SpO2 97, CVP 7, Temp 35.8
│   CT: 200 cc/hr, bright_red, patent
│
└── startGame() → phase: playing
    │
    ├── t=0: 護理師開場白
    │   「林伯伯 chest tube 突然出很多，血壓在掉，你要不要來看？」
    │
    │
    ╔═══════════════════════════════════════════════════╗
    ║  PHASE 1：Surgical Bleeding                      ║
    ║  Severity: +1.5/min（治療可逆轉）                ║
    ╚═══════════════════════════════════════════════════╝
    │
    ├── BioGears 持續驅動
    │   ├── 出血 → blood volume ↓
    │   ├── CT output = hemorrhage rate × patency factor
    │   └── Severity = f(blood loss, lactate, pH)
    │
    ├── 護理師觸發（state-driven）
    │   ├── CT > 250     → 「血壓又掉了，CT 鮮紅有血塊」
    │   ├── SBP < 90     → 「血壓掉到 XX 了，要做什麼？」
    │   ├── MAP < 55     → 「MAP 只有 XX，很危險！」
    │   ├── severity>40 + 未叫學長 + >8min → 「需不需要通知學長？」
    │   └── 輸血>=4U + 未追 iCa → 「要追 ionized calcium？」
    │
    ├── t=10: Lab 結果回來 (scripted)
    │   Hb 8.2, Plt 128, INR 1.3, Fib 195
    │
    ├── ★ 玩家行動（Phase 1 Expected, 7 項）
    │   ├── [CRITICAL] CBC stat          (deadline: 5 min)
    │   ├── [CRITICAL] Coag panel        (deadline: 5 min)
    │   ├── [CRITICAL] Type & Screen     (deadline: 10 min)
    │   ├── [CRITICAL] Volume resuscitation (deadline: 10 min)
    │   ├── [CRITICAL] 叫學長            (deadline: 15 min)
    │   ├── [bonus]    ABG/Lactate       (deadline: 10 min)
    │   └── [bonus]    Protamine         (deadline: 15 min)
    │
    ├── 叫學長 → ConsultModal
    │   ├── SBAR 提交 → sbarPhase1 儲存（遊戲繼續！）
    │   │   └── +3min → 學長到場 → SeniorDialog → AI 對話
    │   └── 未叫 → 護理師催促 (n-no-senior-pressure)
    │
    ├── 藥物效果系統
    │   ├── 正確治療 → severity ↓ (NE, 輸血, Protamine, TXA)
    │   ├── 錯誤治療 → severity ↑ (出血中給 Heparin, 低血壓給 Lasix)
    │   └── Guard rail: 劑量過高→護理師拒絕, 偏高→護理師問確定嗎
    │
    │
    ╔═══════════════════════════════════════════════════════╗
    ║  ★ PHASE TRANSITION                                  ║
    ║  Primary:  bloodVolume < 4700 mL（失血 > 800 mL）    ║
    ║  Fallback: 12 min elapsed + severity > 50            ║
    ║            （BioGears 離線時的保險機制）              ║
    ╚═══════════════════════════════════════════════════════╝
    │
    ├── 自動執行：
    │   ├── BioGears: stop_hemorrhage("Aorta")
    │   ├── BioGears: pericardial_effusion(2.0 mL/min)
    │   ├── pathology → cardiac_tamponade
    │   ├── severity reset → 25（新 phase 起點）
    │   ├── 止血藥失效（Protamine, TXA → isCorrectTreatment: false）
    │   └── CT output 開始下降（pericardium 壓迫 → patency ↓）
    │
    │
    ╔═══════════════════════════════════════════════════════╗
    ║  PHASE 2：Cardiac Tamponade                          ║
    ║  Severity: +5.0/min（不可逆，只能延緩）              ║
    ║  ~14 min 內必然死亡（若無 definitive treatment）     ║
    ╚═══════════════════════════════════════════════════════╝
    │
    ├── 體檢/影像全部切換 Phase 2 版本
    │   ├── POCUS cardiac: Large pericardial effusion + RV collapse
    │   ├── POCUS IVC: Plethoric, >25mm, 無 collapsibility
    │   ├── PE heart: Muffled sounds, pulsus paradoxus
    │   ├── PE neck: JVD (+)
    │   ├── CXR: 縱膈腔變寬, water-bottle heart
    │   └── ECG: Low voltage, electrical alternans
    │
    ├── ★★★ 護理師誤導（核心教學點！）
    │   │
    │   ├── n-ct-declining:  「CT 量好像在少了」
    │   │
    │   ├── n-mislead:       CT<50 + tamponade
    │   │   「好消息！CT 少了很多，出血在止了？」
    │   │   ┌─────────────────────────────────────┐
    │   │   │ ★ 這是故意的誤導！                   │
    │   │   │ CT ↓ ≠ 改善，是 clot obstruction    │
    │   │   │                                      │
    │   │   │ 路線 A: 相信 → 放鬆 → 延遲 → 死亡  │
    │   │   │ 路線 B: 懷疑 → POCUS → 診斷 → 存活 │
    │   │   └─────────────────────────────────────┘
    │   │
    │   ├── n-cvp-rising:    「CVP 比剛剛高了」
    │   ├── n-ct-near-zero:  「CT 幾乎沒東西出來！」
    │   ├── n-ct-stopped:    CT==0 + CVP>15 → 「CT 完全停了！不太對吧？」
    │   ├── n-hint-milk:     「要不要 milk CT？」
    │   ├── n-hint-pocus:    「超音波機在旁邊」
    │   ├── n-no-senior-p2:  「要不要趕快再打給學長？」
    │   └── n-pre-arrest:    MAP<40 → 「⚠️ near-PEA！必須立即行動！」
    │
    ├── ★ 玩家行動（Phase 2 Expected, 7 項）
    │   ├── [CRITICAL] Strip/Milk CT      (deadline: 25 min)
    │   ├── [CRITICAL] Cardiac POCUS      (deadline: 27 min)
    │   ├── [CRITICAL] 再叫學長回來        (deadline: 28 min)
    │   ├── [CRITICAL] Volume challenge    (deadline: 27 min)
    │   ├── [CRITICAL] 準備 re-sternotomy  (deadline: 30 min)
    │   ├── [bonus]    ABG/Lactate Phase 2 (deadline: 28 min)
    │   └── [bonus]    調整 FiO2           (deadline: 30 min)
    │
    ├── Severity 閾值效果
    │   ├── 40: A-line → low_amplitude
    │   ├── 60: Near-PEA hemodynamics
    │   ├── 80: → PEA (cardiac arrest) 或 VF (if CAD)
    │   ├── 90: → Asystole
    │   └── ≥95 或 MAP<25: → 觸發 ACLS/死亡
    │
    │
    ╔═══════════════════════════════════════════════════╗
    ║  路線 A：成功識別 Tamponade → 存活               ║
    ╚═══════════════════════════════════════════════════╝
    │
    └── 完成: milk CT + POCUS + recall senior + volume + re-sternotomy
        └── Phase 2 SBAR 提交 → phase: outcome → debrief
            ├── survived_good (3★): 關鍵動作都完成
            └── survived_poor (2★): 延遲但完成


    ╔═══════════════════════════════════════════════════╗
    ║  路線 B：ACLS 心跳停止流程（Pro mode）            ║
    ║  觸發: severity≥80 或 MAP<25                      ║
    ╚═══════════════════════════════════════════════════╝
    │
    ├── arrest rhythm 決定:
    │   ├── severity 80-89 + CAD → VF
    │   ├── severity 80-89       → PEA
    │   └── severity ≥ 90        → Asystole
    │
    └── ACLSModal（壓縮時間 4:1, 30s real = 2min AHA）
        │
        ├── 玩家可執行:
        │   ├── 開始 CPR（每 cycle 30s = 2min AHA）
        │   ├── 電擊（VF/VT → 有機率 ROSC）
        │   │   └── 對 non-shockable 電擊 → 無效 + 教學警告
        │   ├── Epinephrine（間隔≥45s = 3min AHA）
        │   ├── Amiodarone（最多 2 doses）
        │   ├── 21 種 ACLS 藥物（4 categories）
        │   └── Reversible Causes checklist（Hs and Ts）
        │
        ├── Rhythm check（每 cycle 後）
        │   ├── 仍 arrest → 繼續 CPR
        │   ├── organized rhythm → 檢查 pulse
        │   │   └── ROSC → severity cap 70 + 2min grace → 繼續遊戲
        │   │       └── 可能 re-arrest → 再次 ACLS
        │   └── 超時 5min game = 20min AHA
        │       └── 「要終止急救嗎？」
        │
        ├── ROSC → 繼續遊戲 → 最終 SBAR → debrief
        │
        └── 終止/超時 → died (1★, 分數 cap 40)


    ╔═══════════════════════════════════════════════════╗
    ║  路線 B'：Rescue Window（Standard mode 限定）     ║
    ║  最多 2 次 rescue（防無限循環）                    ║
    ╚═══════════════════════════════════════════════════╝
    │
    └── 60 秒倒計時
        ├── 做出 rescue action → severity cap 60, 穩定 → 繼續
        └── 倒計時歸零 → 死亡（phase: death）
```

---

## 2. 所有結局

| 結局 | 星數 | 分數 | 觸發條件 |
|------|------|------|----------|
| survived_good | 3★ | ≥80 | SBAR + 大部分 critical 完成 |
| survived_poor | 2★ | 50-79 | SBAR + 部分遺漏/延遲 |
| died (ACLS) | 1★ | cap 40 | ACLS 超時 20min 或玩家終止 |
| died (direct) | 1★ | cap 40 | Pro: severity 致死 / Standard: rescue ×2 失敗 |

---

## 3. 5 個關鍵分支點

| # | 分支點 | 說明 | 不可逆？ |
|---|--------|------|----------|
| 1 | Phase Transition | bloodVol<4700, pathology 永久改變 | **是** |
| 2 | 護理師誤導 | CT↓ = clot obstruction, 不是改善。相信→死亡 vs 懷疑→存活 | 否（但延遲代價極大） |
| 3 | 再叫學長 | Phase 2 需新的 recall, Phase 1 的不算。未叫→無 re-sternotomy | 否（但延遲 = 死亡） |
| 4 | SBAR 提交 | Phase 2 SBAR 提交後遊戲結束 | **是** |
| 5 | ACLS 電擊決策 | Shockable→有 ROSC 機率, Non-shockable→無效 | 否（但浪費時間） |

---

## 4. 15 個護理師觸發（state-driven, 非固定時間）

### Phase 1 (5 個)

| ID | 觸發條件 | 台詞 | 類別 |
|----|----------|------|------|
| n-ct-high | CT > 250 | 「血壓又掉了，CT 鮮紅色有血塊」 | observation |
| n-bp-dropping | SBP < 90 | 「血壓掉到 XX 了，要做什麼？」 | observation |
| n-bp-critical | MAP < 55 | 「MAP 只有 XX，很危險！」 | escalation |
| n-no-senior | severity>40 + 未叫 + >8min | 「需不需要通知學長？」 | escalation |
| n-transfusion-ica | 輸血>=4U + 未追 iCa | 「要追 ionized calcium？」 | hint |

### Phase 2 (9 個)

| ID | 觸發條件 | 台詞 | 類別 |
|----|----------|------|------|
| n-ct-declining | CT delta > 120 from peak | 「CT 量好像在少了」 | observation |
| **n-mislead** ★★★ | CT<50 + tamponade | 「好消息！CT 少了很多，出血在止了？」 | **mislead** |
| n-cvp-rising | CVP crossed >12 | 「CVP 比剛剛高了」 | observation |
| n-ct-near-zero | CT < 10 | 「CT 幾乎沒東西出來！」 | observation |
| n-ct-stopped | CT==0 + CVP>15 | 「CT 完全停了！不太對吧？」 | escalation |
| n-hint-milk | CT<30 + 未 milk + >3min | 「要不要 milk CT？」 | hint |
| n-hint-pocus | CT<20 + 未做 POCUS | 「超音波機在旁邊」 | hint |
| n-no-senior-p2 | 未 recall + severity>40 + >3min | 「要不要趕快再打給學長？」 | escalation |
| n-pre-arrest | MAP < 40 | 「⚠️ near-PEA 狀態！必須立即行動！」 | escalation |

---

## 5. 時間軸預期

```
min 0    護理師開場白
min 1-5  玩家：PE、開 lab、開 fluid
min 5-8  護理師：SBP<90 提醒
min 8-12 護理師：MAP<55 / 催叫學長
min 10   Lab 結果回來
min 12-15 叫學長 → SBAR → 學長 +3min 到場
min 15-20 ★ PHASE TRANSITION（bloodVol<4700 或 fallback）
min 20-22 護理師：CT 在減少 / 「好消息」誤導
min 22-25 玩家應：milk CT + POCUS → 發現 tamponade
min 25-27 再叫學長 → 準備 re-sternotomy
min 27-30 Phase 2 SBAR → debrief
          或：severity ≥ 80 → ACLS → ROSC/死亡
```

---

## 6. Opus 審查發現的潛在問題（已修復）

| # | 問題 | 修復 |
|---|------|------|
| 1 | ROSC 後 severity 未降 → 無限 re-arrest 循環 | ✅ severity cap 70 + 2min grace |
| 2 | BioGears 離線時 Phase transition 永遠不觸發 | ✅ 12min + severity>50 fallback |
| 3 | act-recall-senior 不含 Phase 1 未叫學長 fallback | ✅ 加入 call_senior pattern |
| 4 | Standard mode Rescue Window 可無限觸發 | ✅ 限制 2 次 |
| 5 | Dynamic require() 破壞 tree-shaking | ✅ 改 ES6 import |
