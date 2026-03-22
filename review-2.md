# Teaching Slides Review — Module 3 & 4

> 審核者視角：心臟外科主治醫師級別，對象為醫學系 clerk
> 審核日期：2026-03-22

---

## Module 3：呼吸器（Ventilator）

### 醫學正確性
- **整體無明顯重大錯誤**，生理解釋、設定數值、ABG 判讀都正確
- ABG compensation 參考表缺了 **respiratory alkalosis**（acute & chronic）的 compensation formula：
  - Acute resp alkalosis：每 PCO₂ ↓10 → HCO₃ ↓2
  - Chronic resp alkalosis：每 PCO₂ ↓10 → HCO₃ ↓5
  - 心外術後 hyperventilation（疼痛、焦慮）其實很常見，clerk 需要會判讀
- TV 6-8 mL/kg IBW — 正確，但建議加註 **IBW 計算公式**（clerk 常直接用 actual body weight，這是最常見的錯誤）：
  - Male: 50 + 0.91 × (height cm - 152.4)
  - Female: 45.5 + 0.91 × (height cm - 152.4)
- RSBI < 105 引自 Yang & Tobin 1991 — 正確，但可加註其 **sensitivity ~97%, specificity ~65%**，讓 clerk 理解這個工具的限制（NPV 高但 PPV 不高）
- Winter's formula 計算正確（1.5 × 15 + 8 = 30.5）

### 深度評估（1-5，5=專科等級）
- 分數：**3.5/5**
- 說明：
  - ✅ 情境式教學法非常好，從「為什麼」切入而非背誦定義
  - ✅ Fighting vent 的 60 秒決策樹結構清晰，臨床實用
  - ✅ Cardiac-related weaning failure（正壓幫 LV、拔管後 afterload 增加）是很棒的心外特色內容
  - ⚠️ 缺少 **peak pressure vs plateau pressure** 的系統性教學。只在 case 提到 peak pressure 升高，但沒教 clerk 怎麼區分 compliance 問題（plateau↑）vs resistance 問題（peak↑ but plateau 正常）。這是呼吸器最核心的 troubleshooting 概念之一
  - ⚠️ 缺少 **driving pressure（ΔP = Plateau - PEEP）** 概念 — 目前被認為是比 TV 更好的 VILI predictor（Amato et al., NEJM 2015），目標 < 15 cmH₂O
  - ⚠️ Lung protective ventilation 只提到小 TV，沒有完整框架（TV ≤ 6-8, Pplat < 30, driving pressure < 15, permissive hypercapnia 概念）

### 缺漏
1. **Peak pressure vs Plateau pressure 鑑別** — 這是呼吸器 troubleshooting 的基石，必須加
2. **Driving pressure 概念** — 現代 ICU 重要指標
3. **Respiratory alkalosis compensation formula** — 表格不完整
4. **IBW 計算公式** — clerk 一定會算錯
5. **ARDS 在心外術後** — CPB-induced lung injury 嚴重時可以到 ARDS，應提及 ARDSNet strategy 的精神（已經暗示在 TV 6-8 和 PEEP，但沒明確連結）
6. **Compliance 監測** — 動態追蹤 compliance（TV / (Pplat - PEEP)）來評估肺的狀態變化
7. **High-flow nasal cannula（HFNC）** — 拔管後越來越常用，可簡要提及作為 bridge

### 具體修改建議

- **[~line 770, 心外術後起始設定 section]** TV 6-8 mL/kg IBW 旁邊加：
  ```
  ⚠️ IBW（Ideal Body Weight），不是實際體重！
  Male: 50 + 0.91 × (身高 cm - 152.4)
  Female: 45.5 + 0.91 × (身高 cm - 152.4)
  例：170cm 男性 100kg，IBW = 66 kg → TV = 396-528 mL，不是 600-800 mL
  ```

- **[~line 780, PEEP section 之前]** 建議新增一張 slide：「Peak vs Plateau — 呼吸器 Troubleshooting 的核心」
  ```
  Peak pressure = airway resistance + lung compliance + PEEP
  Plateau pressure = lung compliance + PEEP（吸氣末暫停時量測）

  Peak↑ + Plateau 正常 → Resistance 問題（mucus plug, bronchospasm, tube kink）
  Peak↑ + Plateau↑ → Compliance 問題（PTX, atelectasis, pulmonary edema, ARDS）

  Driving Pressure = Plateau - PEEP → 目標 < 15 cmH₂O
  ```

- **[~line 1030, ABG compensation 表]** 補上 respiratory alkalosis：
  ```
  Resp. alkalosis (acute) | 每 PCO₂ ↓10 → HCO₃ ↓2
  Resp. alkalosis (chronic) | 每 PCO₂ ↓10 → HCO₃ ↓5
  ```

- **[~line 880, weaning readiness]** P/F ratio 旁加註：
  ```
  P/F ratio = PaO₂ / FiO₂
  例：PaO₂ 80 on FiO₂ 0.4 → P/F = 200 → 勉強 OK
  P/F < 200 = moderate ARDS 的定義（Berlin criteria）
  ```

- **[~line 960, What Would You Do Case 1]** 既然已經提到 peak pressure 升高，建議 case 引導時加入 plateau pressure 的鑑別思路：
  ```
  → 做 inspiratory hold 量 plateau pressure
  → Peak 38 / Plateau 35 → compliance 問題（PTX? atelectasis?）
  → Peak 38 / Plateau 20 → resistance 問題（mucus plug? bronchospasm?）
  ```

---

## Module 4：Cardiac Surgery ICU Care

### 醫學正確性
- **整體正確**，drain 管理、出血鑑別、fluid management、AF 處理都符合現行實務
- Re-explore criteria（>400 mL/1hr, >200 mL/hr × 2-4hr, >1500 mL/12hr）— 這些數字在各教科書間有差異，但屬於合理範圍。建議加註「各 center 標準不同，這是常見的參考值」（目前已有類似提醒，很好）
- Amiodarone dosing（150mg/10min → 1mg/min × 6hr → 0.5mg/min × 18hr）— 正確
- 術後血糖 140-180 mg/dL（STS guideline）— 正確
- AF 發生率 ~30%，peak Day 2-3 — 正確
- AF anticoagulation ">48hr → 評估 stroke risk" — 正確方向，但可更精確：post-cardiac surgery AF 的 anticoagulation 策略仍有爭議，2023 AHA/ACC/HRS guideline 建議根據 CHA₂DS₂-VASc 評分決定，且要平衡術後出血風險
- **Mediastinitis 死亡率 10-25%** — 傳統文獻數據正確，但現代積極治療下已有改善（5-15%），可加註「早期發現 + 積極處理可降低」
- Red flags 表格中 "drain 塞住，血壓心臟" → 應為「血壓**迫**心臟」或重新措辭

### 深度評估（1-5，5=專科等級）
- 分數：**3/5**
- 說明：
  - ✅ Drain 管理的「output 突然掉 = 可能塞住 = tamponade」教得非常好，這是真正的臨床智慧
  - ✅ CVP 的限制講得很好，「CVP 不是唯一答案」
  - ✅ 「腫一圈」的 capillary leak 解釋很實用
  - ✅ Surgical vs coagulopathy 的鑑別表格清晰
  - ❌ **最大的缺漏：完全沒有 Low Cardiac Output Syndrome (LCOS)**。這是心外術後最重要的併發症（發生率 3-14%，死亡率高），涵蓋 inotrope 選擇（dobutamine vs milrinone vs epinephrine）、IABP 時機、ECMO 決策。一個心外 ICU care 的教學沒有 LCOS 等於少了一半
  - ❌ **沒有 AKI** — 心外術後 AKI 發生率 20-30%（KDIGO Stage 1+），是極常見的問題
  - ❌ **沒有 Vasoplegia** — CPB 後 vasoplegia（需 norepinephrine + vasopressin）是 R1 一定會遇到的
  - ⚠️ TEG/ROTEM 只提到名字但沒教怎麼用
  - ⚠️ 神經學併發症（stroke, delirium）只在 Red Flags 表格帶過一行

### 缺漏（依重要性排序）
1. **🔴 Low Cardiac Output Syndrome (LCOS)** — 必須加。包含：
   - 定義（CI < 2.0-2.2, SvO₂ < 60%, Lactate↑, UO↓）
   - Inotrope 選擇邏輯（Dobutamine: ↑CO ↓SVR; Milrinone: ↑CO ↓SVR ↓PVR 適合 RV failure/PHT; Epinephrine: 最強 inotrope but ↑HR ↑myocardial O₂ demand）
   - Vasopressor 邏輯（Norepinephrine: vasoplegia; Vasopressin: 輔助）
   - Mechanical support 時機：IABP → Impella → ECMO 的 escalation ladder
2. **🔴 AKI（Acute Kidney Injury）** — KDIGO staging、術後 oliguric phase 管理、何時考慮 RRT
3. **🟡 Vasoplegia** — CPB 後 distributive shock 的辨識與處理（跟 cardiogenic shock 鑑別）
4. **🟡 TEG/ROTEM 基本判讀** — 既然提了就該教。至少教：R time（凝血因子）、MA（血小板/fibrinogen）、LY30（fibrinolysis）
5. **🟡 術後 Delirium** — 發生率 30-50%，CAM-ICU 評估，預防策略
6. **🟡 Temperature management** — rewarming protocol、shivering 管理（meperidine）
7. **🟢 Early mobilization** — 加速 recovery、降低 DVT/PE 風險
8. **🟢 術後發燒的時間鑑別** — Day 0-2 SIRS vs Day 3-5 感染 vs Day 5+ wound/line infection

### 具體修改建議

- **[~line 1163, Red Flags table]** 「drain 塞住，血壓心臟」→ 修正為「drain 塞住，血壓迫心臟」或「blood accumulates → compresses heart」

- **[~line 1210, Fluid Management section 之後]** 新增一個完整 section：**Low Cardiac Output Syndrome**
  ```html
  <section>
    <h2>⚠️ Low Cardiac Output Syndrome — 心外 ICU 最重要的併發症</h2>
    
    辨識：CI < 2.2, SvO₂ < 60%, Lactate↑, UO↓, 四肢冰冷
    
    處理邏輯（階梯式）：
    1. Optimize preload（先確認 volume 夠）
    2. Inotrope 選擇：
       - Dobutamine 5-10 μg/kg/min → 首選，↑CO + ↓SVR
       - Milrinone 0.375-0.75 μg/kg/min → RV failure / PHT 首選（PDE3 inhibitor）
       - Epinephrine 0.01-0.1 μg/kg/min → 最強 inotrope，但 ↑HR
    3. 若 inotrope 頂到天了還不夠 → IABP（diastolic augmentation, ↓afterload）
    4. IABP 不夠 → ECMO（VA-ECMO）
    
    Case: 術後 6hr, CI 1.6, CVP 14, Lactate 5.5, MAP 58 on dobutamine 10
    → Volume 夠（CVP 14）→ 不是 preload 問題
    → 已經在 dobutamine → 加 Epinephrine? 還是上 IABP?
    → 如果 RV failure 為主 → Milrinone + Norepinephrine combo
  ```

- **[~line 1270, AF section 的 anticoagulation]** 加入更精確的說明：
  ```
  AF > 48hr → CHA₂DS₂-VASc 評估
  但術後 48-72hr 內 anticoagulation 要平衡出血風險
  大部分 center：先 rate control + 電解質矯正 → 多數自行轉回 sinus
  持續 AF → 出院前評估是否需要長期 anticoagulation
  ```

- **[~line 1300, Wound care section]** Blood glucose target 旁加註：
  ```
  ⚠️ 避免過度矯正 → 低血糖（< 70 mg/dL）比高血糖更危險
  NICE-SUGAR trial: 嚴格控制（81-108）vs 寬鬆控制（≤180）→ 嚴格組死亡率更高
  ```

- **[~line 1347, What Would You Do Case 1]** Fibrinogen 120 的 case：加入 TEG 判讀提示
  ```
  → Plt 85k + Fibrinogen 120 → Coagulopathy 為主
  → 如果有 TEG: MA 偏低 → confirm 血小板/fibrinogen 不足
  → 處理：Cryoprecipitate（補 fibrinogen to > 200）+ Platelet transfusion
  → 如果矯正後 output 仍不減 → 考慮 surgical bleeding → re-explore
  ```

---

## 總體評價

### 做得好的部分
1. **教學法**：情境式、從「為什麼」出發而非死背定義 — 這是最適合 clerk 的教學方式
2. **Hook case** 設計好 — 開場就把 clerk 拉進臨床情境
3. **心外特色** 有抓到 — 正壓通氣對 hemodynamics 的影響、cardiac weaning failure、phrenic nerve injury 都是心外 ICU 的核心概念
4. **Case 品質**整體很好 — realistic、有教學價值、引導思考而非給答案

### 需要加強的部分
1. **Ventilator module** 差一個 peak vs plateau 的 slide 就會完整很多
2. **ICU Care module 最關鍵的缺漏是 LCOS** — 沒有 LCOS 的心外 ICU teaching 不完整。建議至少加 4-5 張 slide 涵蓋辨識、inotrope 選擇邏輯、mechanical support escalation
3. 兩個 module 的 **參考文獻/guideline** 都沒有標註 — 建議在最後一張 slide 列出 key references（如 STS guidelines, ERAS Cardiac, ARDSNet），增加可信度也方便 clerk 延伸閱讀

### 整體分數
- Ventilator: **3.5/5** → 加入 peak/plateau + driving pressure 後可到 4/5
- ICU Care: **3/5** → 加入 LCOS + AKI 後可到 4/5
- 兩個 module 目前都在「solid intern level」，距離「specialist level」還差一些深度，但教學法和臨床思路的品質很高
