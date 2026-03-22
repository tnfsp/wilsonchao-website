# Teaching Slides 醫學審核報告 (Review #1)

審核者角色：心臟外科主治醫師級別教學內容審核  
對象：醫學系 Clerk（見習醫學生）  
審核日期：2026-03-22

---

## Module 1：術前評估 (preop-assessment)

### 醫學正確性

1. **Low-flow Low-gradient AS 的分類不夠完整**：投影片只提到「classical low-flow low-gradient AS」（EF 低的），但遺漏了 **paradoxical low-flow low-gradient AS**（EF 正常但 stroke volume index <35 mL/m²，常見於老年高血壓合併 LVH 的小心室）。這是 2020 ACC/AHA VHD guideline 明確區分的兩種亞型，clerk 很容易在臨床遇到後者。

2. **Dobutamine stress echo 判讀標準不夠精確**：投影片說「Vmax 升高但 AVA 沒變 → True severe」。更精確的說法應該是：
   - Flow reserve (+)：SV 增加 ≥20%，且 AVA 仍 <1.0 cm²，mean PG 升至 ≥40 mmHg → **True severe**
   - Flow reserve (+)：SV 增加 ≥20%，AVA 增加至 >1.0 cm² → **Pseudo-severe**
   - **Flow reserve (−)**：SV 未增加 ≥20% → 無法鑑別，但這群病人預後最差（需要提及）

3. **SYNTAX Score 分層數值**：投影片用 ≤22 / >22 / >33 是合理的（基於 SYNTAX trial），但應註明這是原始 SYNTAX trial 的 tertile 分層。目前 **SYNTAX II** 已整合臨床變數，純解剖 SYNTAX 在臨床決策中的角色在演變。不算錯，但可以更 up-to-date。

4. **TAVI Pacemaker rate "~10-20%"**：這個數字偏高且範圍太大。目前新一代 device：
   - **Self-expanding (Evolut PRO+/FX)**：~15-17%
   - **Balloon-expandable (SAPIEN 3/Ultra)**：~6-8%
   建議區分裝置類型，或修正為更精確的區間。

5. **MR severe criteria**：ERO >0.4 cm² 是 **primary (degenerative) MR** 的標準。**Secondary (functional) MR** 的 severe criteria 是 ERO ≥0.2 cm²（2020 ACC/AHA guideline）。投影片的 reference table 未區分，這在臨床判斷上差異極大。

6. **AR severe criteria**：投影片只列 Vena contracta >6mm 和 ERO >0.3 cm²，遺漏了重要的定量指標：**Regurgitant Volume >60 mL**, **Regurgitant Fraction ≥50%**, **Holodiastolic flow reversal in descending aorta**。

7. **Valve surgery indication — AS asymptomatic trigger**：投影片提到「Vmax 快速增加 (>0.3 m/s/yr)」。根據 2020 ACC/AHA guideline，rapid progression 是 Class IIa indication（可考慮），但標準為 Vmax 增加 ≥0.3 m/s/yr **且** very severe AS (Vmax ≥5 m/s)。單純快速增加不一定到手術門檻，需要更精確表述。

8. **CABG vs PCI — FREEDOM trial 引用**：投影片說「LM + 3VD + DM → CABG has survival benefit (FREEDOM trial)」。**FREEDOM trial 的設計不包含 LM disease**（排除條件之一）。FREEDOM 證明的是「multivessel CAD + DM → CABG 優於 PCI」。LM disease 的證據來自 **EXCEL** 和 **NOBLE** trial。這是明確的引用錯誤。

9. **TAVI vs SAVR 年齡切點**：投影片用 <65 / 65-80 / >80。2020 ACC/AHA guideline 建議：
   - <65 歲且 life expectancy >20 年 → SAVR (Class I)
   - 65-80 歲 → Shared decision making
   - ≥80 歲或 life expectancy <10 年 → TAVI (Class I)
   投影片的分法大致正確，但 2024 ACC/AHA 更新已將部分切點微調至以 life expectancy 為主而非絕對年齡。

### 深度評估（1-5，5=專科等級）

- **分數：3.5/5**
- **說明**：
  - 優點：用比喻（水管）解釋 flow physiology 很好，low-flow low-gradient AS 的概念有帶到，CABG vs PCI 的決策邏輯清楚，有帶 SYNTAX score、frailty、Heart Team 的概念。整體邏輯串聯（pathology → severity → intervention → risk → team decision）很優。
  - 不足：
    1. **Valvular disease 只深入了 AS**，MR/AR/MS 只帶到 severity criteria 表格，沒有討論手術 timing 的思考邏輯（尤其 MR repair vs replacement、AR 的 LV size trigger）
    2. **缺乏 CT-based assessment**：TAVI sizing 需要的 CT annulus measurement、coronary height、access route 評估完全未提
    3. **Pulmonary hypertension 評估**：術前 echo 的 RVSP/PASP、PVR 概念未涵蓋 — 這對手術風險影響極大
    4. **Coronary anatomy beyond stenosis**：未提 chronic total occlusion (CTO)、collateral circulation、graftability 的概念

### 缺漏

1. **Paradoxical low-flow low-gradient AS**（EF preserved, SVI <35）— 遺漏
2. **Primary vs Secondary MR 的嚴重度標準差異** — 遺漏，臨床影響很大
3. **CT assessment for TAVI / 術前 imaging modalities** — 完全未提
4. **Pulmonary hypertension 的術前評估** — 未提
5. **Renal function / eGFR 對手術風險的影響** — 未提
6. **Coronary CTO、collateral、target vessel quality** 的概念 — 未提
7. **Antiplatelet / Anticoagulation 的術前處理** — 未提（Aspirin, P2Y12 inhibitor washout, warfarin bridging）
8. **Infective endocarditis as surgical indication** — 完全未涵蓋
9. **Emergency vs Urgent vs Elective 的分類與決策差異** — 未提

### 具體修改建議

- **[Line ~56-67]** Low-flow low-gradient AS 段落：加入 paradoxical low-flow low-gradient 的概念（EF ≥50% + SVI <35 mL/m²），並說明此時可用 **Calcium score (Agatston)** 來輔助判斷（male >2000, female >1200 支持 true severe）。
- **[Line ~63-66]** Dobutamine stress echo 判讀：加入 flow reserve 的定義（SV 增加 ≥20%），以及 flow reserve (-) 的臨床意義（預後最差但手術仍可能有益）。
- **[Line ~128-131]** FREEDOM trial 引用：修正為「Multivessel CAD + DM → CABG has survival benefit (FREEDOM trial)」，移除 LM。LM 的證據另外引用 EXCEL/NOBLE。
- **[Line ~234-238]** TAVI pacemaker rate：修正為區分 device type — 「Self-expanding valve ~15-17%, Balloon-expandable ~6-8%」。
- **[Line ~300-310]** Severity criteria 表格：
  - MR 行分成兩列：**Primary MR**（ERO ≥0.4, RegVol ≥60 mL）和 **Secondary MR**（ERO ≥0.2, RegVol ≥30 mL）
  - AR 行加入 RegVol >60 mL, holodiastolic flow reversal
- **[Line ~271-283]** Asymptomatic trigger 段落：AS 的 Vmax rapid progression 條件需加上「且 Vmax ≥5 m/s（very severe）」的前提，否則容易誤導為任何快速進展都要開。
- **[全域建議]** 新增一個 section：**術前 Imaging Checklist**（Echo + Cath + CT 的各自角色），以及 **MR/AR 的手術 timing 思考邏輯**（不能只有表格，要有如同 AS 一樣的思考串聯）。

---

## Module 2：Hemodynamic Monitoring (hemodynamics)

### 醫學正確性

1. **SVRI 正常值 "1200-2000 dyne·s/cm⁵/m²"**：SVRI 的正常範圍通常引用為 **1970-2390 dyne·s/cm⁵·m²**（部分教科書）或 **800-1600 dyne·s/cm⁵**（SVR，非 indexed）。投影片中間文段用 SVRI，但 reference table 的 unit 標示只寫 "1200-2000" 沒有單位。建議統一並確認來源。各家教科書數值略有差異，但至少需標明單位且一致。

2. **CVP 正常值 "2-8 mmHg"**：這是 commonly cited range，但部分權威來源（如 Miller's Anesthesia）用 **0-8 mmHg**。不算錯，但投影片在 clinical context 裡教「CVP 不代表 volume status」的觀念非常好，這比數字本身重要。

3. **SvO₂ vs ScvO₂ 的區分**：投影片只提 SvO₂（from PA catheter），但現實中很多心外 ICU 是看 **ScvO₂**（from CVC in SJ/subclavian）。應該提到 ScvO₂ 通常比 SvO₂ 高 ~5%，且兩者趨勢一致但數值不完全相等。不提這個的話，clerk 進 ICU 會搞混。

4. **Lactate 的非缺氧原因未提**：Lactate 升高不只是 tissue hypoxia。心外術後常見：
   - **Epinephrine** 會刺激 glycolysis → type B lactic acidosis
   - **肝功能不全**（右心衰竭 → 肝瘀血）→ lactate clearance 下降
   - **CPB 期間的 hemodilution + hypothermia** 影響 lactate metabolism
   投影片直接說「Lactate 升高 = 組織在做無氧代謝（多數情況）」加了括弧算有暗示，但對 clerk 來說不夠明確。

5. **Dobutamine 的描述**：「β1 為主。強心 + 些微升 HR」— Dobutamine 實際上是 β1 + β2 agonist，β2 效果會造成 **peripheral vasodilation**（降低 SVR），這在臨床上很重要（某些病人用了反而 BP 掉）。描述不完整。

6. **Epinephrine 的描述**：「最後手段」— 在心外 ICU，epinephrine 其實常被用作 **first-line** inotrope + vasopressor（尤其在 post-CPB weaning 困難時）。將其描述為「最後手段」可能給 clerk 錯誤印象。不同 center 有不同 practice。

7. **IABP timing**：投影片提到 「CI 仍 <2.0 + Lactate 持續上升 → 考慮 IABP」。但 **IABP 在 SHOCK II trial 後已不是 cardiogenic shock 的 routine recommendation**（Class IIa → IIb in ESC guideline）。當然心外術後的 low CO 和 AMI-cardiogenic shock 不完全相同，且許多心外中心仍常用 IABP，但應註明其爭議性。此外，應該提到 **Impella** 作為另一個 option。

8. **Vasopressin**：投影片說「NE 效果不夠時的 second-line vasopressor」。這在 sepsis (Surviving Sepsis Campaign) 是對的，但在 **post-CPB vasoplegia**，vasopressin 被許多中心作為 **first-line** 使用（因為 CPB 後 vasopressin store depletion 是重要的病理機制）。Context matters。

9. **SVV >13% 作為 volume responsiveness 的 cutoff**：這個 cutoff 來自早期文獻。更近期的 meta-analysis 多用 **>12%** 或 **>10%** 作為 threshold。不是嚴重錯誤，但可以加上「各文獻有差異」的 caveat。

10. **Tamponade — Beck's triad**：投影片提到「低血壓 + JVP 升高 + 心音變小」。在心外術後，**classic Beck's triad 只在 <30% 的術後 tamponade 出現**（因為術後可以是 localized/posterior tamponade，JVP 和心音變化不明顯）。投影片有提到 chest tube output 的重要性，這很好，但應強調術後 tamponade 的表現往往是 **atypical** 的。

### 深度評估（1-5，5=專科等級）

- **分數：4/5**
- **說明**：
  - 優點：
    1. **A-line waveform analysis** 講得很好 — upstroke/dicrotic notch/pulse pressure 的生理意義連結清楚，不是死記
    2. **CVP 的正確理解**（不代表 volume status）是很重要的觀念修正
    3. **PCWP 的物理原理**（靜止血柱壓力傳導）解釋得很直覺
    4. **Shock 的三個問題鑑別法**非常實用，比傳統背表格好太多
    5. **Vasopressor/Inotrope 的 flowchart 思考**是 clerk 最需要的臨床思維訓練
    6. **Mini-cases** 品質高，都很 realistic
  - 不足：
    1. **缺少 TEE 的角色**：心外術中/術後的 TEE 是核心監測工具，完全未提
    2. **PA catheter waveform interpretation** 未教（RA/RV/PA/Wedge 四個 waveform 的判讀）
    3. **Post-CPB vasoplegia** 只在 case 裡出現，沒有專門段落解釋機制（complement activation, NO, vasopressin depletion）
    4. **Bleeding / Coagulopathy** — 心外術後另一個極重要的 hemodynamic 影響因子，完全未涵蓋

### 缺漏

1. **TEE（術中 + 術後）** — 心外 hemodynamic monitoring 的核心工具，未提
2. **PA catheter waveform** — 放了 Swan-Ganz 但沒教怎麼看波形，只教了 wedge
3. **Post-CPB vasoplegia 的機制與處理** — 應獨立成段
4. **Methylene blue** — vasoplegia 的 rescue therapy，心外特有的知識
5. **Bleeding / Coagulopathy 對 hemodynamics 的影響** — 心外術後出血是常見的低血壓原因
6. **Temperature management** — 術後 rewarming 對 hemodynamics 的影響（shivering → O₂ consumption ↑, vasodilation）
7. **ScvO₂ vs SvO₂** 的差異與使用時機
8. **Type B lactic acidosis** — epinephrine-induced, 術後常見
9. **Impella / VA-ECMO** — 作為 IABP 之外的 mechanical support option
10. **Goal-directed therapy protocol** — 術後 hemodynamic optimization 的系統化流程

### 具體修改建議

- **[Line ~467]** SvO₂ 段落後：加入 ScvO₂ 的概念 — 「在沒有 PA catheter 的情況下，ScvO₂（from CVC）可作為替代指標。ScvO₂ 通常比 SvO₂ 高 ~5%，趨勢判讀原則相同。」
- **[Line ~480-490]** Lactate 段落：在「Lactate 升高 = 組織在做無氧代謝」後加入 caveat：「⚠️ 但注意 Type B lactic acidosis：epinephrine infusion、肝瘀血（右心衰）、CPB 後的代謝效應都可以升高 lactate，不一定代表灌流不足。判斷時要結合 SvO₂、末梢、尿量。」
- **[Line ~585]** Dobutamine 描述：修正為「β1 + β2。強心 + **vasodilation**（β2）。注意：可能降低 SVR → 血壓偏低的病人用了可能 BP 更掉。」
- **[Line ~590]** Epinephrine 描述：修正為「α + β 都強。Post-CPB weaning 困難時有些中心作為 first-line。高劑量時 HR 飆升 + arrhythmia + **splanchnic vasoconstriction** + type B lactic acidosis。」
- **[Line ~575]** Vasopressin 描述後加：「Post-CPB vasoplegia 時可作為 first-line（機制：CPB 後 vasopressin store depletion）。」
- **[Line ~542-548]** Tamponade 段落：加入「⚠️ 術後 tamponade 往往是 **atypical** 的 — localized clot 只壓 RA 或 RV → classic Beck's triad 可能不完整。高度懷疑時不要等到 triad 齊全。」
- **[Line ~619-623]** IABP 提及處：加入「注意：IABP 在 cardiogenic shock 的角色有爭議（SHOCK II trial），但在心外術後 low CO syndrome 仍被廣泛使用。其他 mechanical support options：Impella（LV unloading）、VA-ECMO（full circulatory support）。」
- **[Line ~630-642]** FloTrac/Non-invasive 段落後：**新增 TEE section** — 術後 bedside TEE 可以快速評估：LV/RV function, new wall motion abnormality (graft failure?), pericardial effusion, new valvular lesion, volume status。
- **[Reference table, Line ~668]** 加上 SVRI 的單位：dyne·s/cm⁵·m²。
- **[全域建議]** 新增一段 **Post-CPB Vasoplegia**：機制（complement activation, NO pathway, endogenous vasopressin depletion）→ 表現（warm shock with adequate CO）→ 處理（NE first-line, Vasopressin first-line in many cardiac centers, Methylene blue as rescue）。

---

## 總體評價

### 優點（兩個 module 共通）

1. **教學風格極佳** — 用比喻、問問題、從物理學切入，不是死記表格。這對 clerk 的學習效果遠勝傳統教學。
2. **"What Would You Do?" cases** 品質高 — 都是臨床上真正會遇到的情境，提示引導思考但不直接給答案。
3. **強調思考框架** — 兩個 module 都在教「怎麼想」而不是「背什麼」，這是對的方向。
4. **反覆強調「數字會騙人」** — CVP 不代表 volume, BP 不代表 perfusion, EF 正常不代表沒問題。這些 cognitive anchoring 非常重要。
5. **邏輯串聯清楚** — Module 1 從 pathology → severity → intervention → risk → team decision；Module 2 從 monitoring → interpretation → shock classification → treatment。

### 主要改善方向

1. **Module 1 的 valve disease 太偏 AS** — MR/AR 需要更多 depth（尤其 MR repair vs replacement 的 timing）
2. **Module 2 缺 TEE 和 coagulopathy** — 這兩個是心外 ICU 的日常
3. **Guideline 引用需更精確** — FREEDOM trial 不含 LM（明確錯誤）、severity criteria 需區分 primary vs secondary MR
4. **藥物描述需要更 nuanced** — 尤其 dobutamine 的 vasodilation 效果、epinephrine 在心外的角色、vasopressin 在 post-CPB 的特殊地位

### 整體評分

| Module | 醫學正確性 | 教學深度 | 邏輯連貫 | Case 品質 | 完整性 |
|--------|-----------|---------|---------|----------|--------|
| 術前評估 | 7/10 | 3.5/5 | 4.5/5 | 4/5 | 3/5 |
| Hemodynamics | 8/10 | 4/5 | 4.5/5 | 4.5/5 | 3.5/5 |

> **結論**：教學風格和思考框架是這套投影片最大的資產。醫學內容的「架構」正確，但需要在 precision 和 completeness 上提升。特別是 FREEDOM trial 的 LM 引用錯誤需要立即修正。建議在修改後再做一輪 fact-check。
