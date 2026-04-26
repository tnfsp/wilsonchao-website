# Review-4：MCS & Aortic Surgery 教學投影片醫學審核

> 審核對象：teaching-slides.ts — "mcs" (L1958-2160) & "aortic" (L2161-2385)
> 目標學習者：醫學系 clerk（見習醫學生）
> 審核標準：專科等級醫學正確性與教學深度

---

## MCS — 機械循環支持

### 醫學正確性

1. **IABP CO 增量**：投影片說「CO 只增加 ~0.5 L/min」— 這個數字合理（文獻 0.3-0.5 L/min），但建議標註出處（如 Trost & Hillis, Circulation 2006）避免被挑戰。
2. **IABP 禁忌症缺漏**：列了 severe AR、aortic dissection、severe PVD，但遺漏了 **abdominal aortic aneurysm** 和 **uncontrolled sepsis / coagulopathy**（相對禁忌）。Severe PVD 更準確的說法是 severe **aortoiliac** disease（不只是 peripheral）。
3. **ECMO aPTT target**：寫「aPTT 60-80 sec」— 這是常見範圍但偏高。許多中心 target 更低（aPTT 50-70 或 1.5x baseline），尤其在出血高風險時。建議改為「aPTT 1.5-2x baseline（各院不同，約 50-80 sec）」以避免學生以為是絕對標準。
4. **VV-ECMO cannulation**：寫「Femoral vein → Oxygenator → IJV（回右心）」— 方向反了。標準 VV-ECMO 是 **drainage from femoral vein / IJ vein → oxygenator → return via IJ vein（right atrium）**。更精確：多數是 femoral drainage + IJ return，或用 dual-lumen Avalon cannula from IJ。目前寫法 oversimplified 且可能誤導。
5. **Impella 的角色描述過於簡略**：只在 flowchart 中提到「Significant LV failure → Impella」，但沒解釋 Impella 的原理（Archimedes screw pump across AV into LV）、型號差異（CP vs 5.0/5.5）、放置路徑。作為 MCS 教學，Impella 值得獨立一個 section。
6. **SHOCK-II trial 引用正確**，但建議補充：IABP-SHOCK II 顯示 IABP 在 AMI-CS 中不降低 30-day mortality → 目前 **ESC/AHA guideline 已降級到 Class IIb/III**。

### 深度評估（1-5，5=專科等級）

- 分數：**3.5/5**
- 說明：IABP 和 VA-ECMO 部分教得不錯，尤其 LV distension → venting 策略的邏輯串接很好，是 clerk 應該理解的核心概念。但 **Impella 幾乎沒教**（只在 flowchart 提一句），LVAD 的部分太淺（沒有 INTERMACS profile、patient selection criteria、HeartMate 3 vs 舊款的差異）。Anticoagulation section 只有一張 slide，對於 MCS 管理來說不夠。整體像是「MCS 概論」而非「MCS 專科教學」。

### 缺漏

1. **Impella 獨立教學**：原理、型號（CP/5.0/5.5）、放置方式（percutaneous vs surgical axillary）、血行動力學效果（直接 LV unloading）、vs IABP/ECMO 的比較。目前完全缺失。
2. **SCAI Shock Classification（Stage A-E）**：2019 後是 cardiogenic shock 的共通語言，clerk 應該知道。目前完全沒提。
3. **INTERMACS profile**：決定 LVAD timing 的核心工具（Profile 1-7），BTT vs DT 的 decision-making 幾乎完全取決於此。目前只用「年輕/老」來區分太簡化。
4. **Right heart failure on ECMO/LVAD**：VA-ECMO 上了之後 RV failure 是另一個大陷阱（尤其 LV recovery 後 weaning 時），完全沒提。LVAD 術後 RV failure 是最常見的 early complication。
5. **Weaning protocol**：Case 3 問 weaning 但投影片沒教 weaning criteria 和 trial-off 方法（flow reduction trial、echo parameters）。
6. **ECMO 併發症**：只提了 LV distension 和 anticoagulation，但 **limb ischemia（distal perfusion cannula）**、**differential hypoxemia（Harlequin syndrome）**、**acquired vWF deficiency** 都是高頻考點和臨床重點。

### 具體修改建議

- **L1978（IABP 禁忌症）**：加上 `abdominal aortic aneurysm`、`severe aortoiliac disease`（取代 severe PVD）
- **L2035（VV-ECMO 表格）**：修正血流路徑為 `Femoral/IJ vein (drainage) → Oxygenator → IJ vein (return to RA)` 或 `Dual-lumen cannula via IJ`
- **L2060-2070 之間**：新增 Impella 獨立 section（至少一張原理 + 一張型號比較 + 一張 hemodynamic comparison table：IABP vs Impella vs VA-ECMO）
- **L2100（LVAD section）**：加 INTERMACS profile 1-7 表格，至少列 Profile 1（crash & burn）到 Profile 4（resting symptoms），解釋為什麼 Profile 1 不適合直接裝 LVAD（先 ECMO bridge）
- **L2120（Anticoagulation）**：aPTT 改為 `1.5-2x baseline（institutional protocol varies）`；加一行提 distal perfusion cannula 的適應症
- **L2095（ECMO section 末尾）**：新增 slide 談 VA-ECMO 特有併發症：① Limb ischemia → distal perfusion cannula ② Differential hypoxemia（North-South syndrome / Harlequin）→ 右手 SpO₂ 監測 ③ Hemolysis
- **L2140（Decision Flowchart）**：加上 SCAI Shock Stage 作為 framework（Stage C-E 才需要 MCS）

---

## Aortic Surgery — 主動脈手術

### 醫學正確性

1. **Type A 每小時死亡率 1-2%**：這是經典引用（Hirst et al. 1958, IRAD registry），數字正確。但建議標註「未手術的情況下」以及來源，避免學生以為這是術後 mortality。
2. **Stanford & DeBakey 分類正確**，但目前國際趨勢已加入 **TEM (Thrombosed/Entry/Malperfusion) classification** 和 **2020 SVS/STS reporting standards**。至少應提及分類在演進中。
3. **Type B BP 目標 SBP 100-120, HR <60-80**：HR 的寫法有歧義。標準 target 是 **HR <60 bpm**（not 60-80）。2022 ACC/AHA guideline 明確：「Target HR <60 bpm, SBP 100-120 mmHg」。寫 <60-80 會讓學生以為 70-80 也可以，這會削弱 impulse control 的力道。
4. **DHCA 溫度**：寫 18-20°C — 這是 deep hypothermia 的範圍沒錯。但現在很多中心用 **moderate hypothermia (24-28°C)** + selective cerebral perfusion（不需要降到那麼低），尤其在 hemiarch 時。建議加註「DHCA 18-20°C for prolonged arrest；moderate HCA 24-28°C + SCP for shorter procedures — trend shifting toward warmer」。
5. **Bentall procedure 描述**：寫「Composite graft + mechanical valve + reimplant coronaries」— 正確但不完整。現在 **David procedure（valve-sparing root replacement）** 是年輕病人（尤其 Marfan）的首選，因為避免終身 anticoagulation。完全沒提 David/Yacoub 是一個重大缺漏。
6. **TEVAR rapid expansion criteria**：寫 >5mm/6months — 這個數字合理（2022 STS/SVS guideline），但更常見的引用是 **>5mm/year 或 >10mm/year depending on source**。建議改為 >5mm in 6 months（或 >10mm/year），並標明 guideline 來源。
7. **ER Protocol 備血 6U PRBC**：太少。Type A dissection surgery 常規備血應是 **10U PRBC + FFP + Platelets + Cryoprecipitate**，尤其預期 DHCA 時。6U 是 general cardiac surgery 的量。

### 深度評估（1-5，5=專科等級）

- 分數：**3.5/5**
- 說明：分類教學邏輯很好（先講 why → 再講 what），Type A 的急迫性講解到位，malperfusion 是 clerk 最容易忽略的概念且教得很清楚。手術策略從 ascending only → Bentall → hemiarch → total arch 的階梯也有邏輯。但缺少 **valve-sparing root replacement**、**frozen elephant trunk**、**endovascular 時代的演進**（TEVAR + FET in Type A）、以及 **chronic dissection 的處理**（完全沒提）。Aortic aneurysm（非 dissection）也完全沒教，但標題是「主動脈手術」，如果只教 dissection 應改標題。

### 缺漏

1. **Valve-sparing root replacement（David / Yacoub）**：年輕 Marfan 病人的首選，目前完全沒提。Case 1 的 answer 暗示 Bentall，但如果 root 55mm + AR 在年輕人，David procedure 應列入鑑別。
2. **Frozen Elephant Trunk (FET)**：現代 aortic surgery 的重要進展，尤其在 DeBakey I 延伸到 descending 的 case。一次手術同時處理 ascending + arch + proximal descending。
3. **Acute vs Chronic dissection 的區別**：完全沒提。14 天是分界，chronic dissection 的處理策略完全不同（不是急診、aneurysmal degeneration 才介入）。
4. **Intramural Hematoma (IMH) 和 Penetrating Aortic Ulcer (PAU)**：Acute aortic syndrome 的三個成員（dissection + IMH + PAU），只教了 dissection。
5. **Connective tissue disease screening**：Marfan 在投影片中被提到兩次但沒教 criteria。至少應提 Ghent criteria、FBN1、以及 Loeys-Dietz / vEDS 的存在。
6. **Cerebral perfusion monitoring**：DHCA 時的 NIRS (near-infrared spectroscopy) 監測，以及 selective antegrade vs retrograde cerebral perfusion 的比較。
7. **Aortic aneurysm**：標題是「主動脈手術」但只教 dissection。如果刻意排除 aneurysm，標題應改為「Aortic Dissection」。如果要涵蓋，至少需要 ascending aneurysm criteria（>5.5cm, or >4.5cm in Marfan）和 descending aneurysm（>5.5-6.0cm → TEVAR/open）。

### 具體修改建議

- **L2268（HR target）**：`HR <60-80` 改為 `HR <60 bpm`，與 ACC/AHA guideline 一致
- **L2286（Bentall slide）**：在 Bentall 之後新增 bullet：`David procedure（valve-sparing root replacement）— 年輕/Marfan 且 valve leaflet 正常 → 保留自己的 valve → 不用終身 anticoagulation`
- **L2300（DHCA）**：加一行：`Moderate HCA (24-28°C) + ACP 是目前許多中心的趨勢（比 DHCA 出血少、rewarming 快）`
- **L2310-2340（Type B section 後）**：新增 slide：Acute Aortic Syndrome 三兄弟（Dissection / IMH / PAU），各一行簡介 + 治療原則
- **L2340（Type B complicated 後）**：新增 slide 提 Frozen Elephant Trunk 的概念（一句話 + 示意）
- **L2350（ER checklist）**：備血量改為 `至少 10U PRBC + FFP + Plt + Cryo（DHCA 預期大量出血）`
- **L2350（ER checklist 末尾）**：加 `□ 詢問 Marfan/CTD family history`
- **L2370（Case 1）**：hint 加上 `如果 valve leaflet 正常 → 可考慮 David procedure vs Bentall`
- **L2380（Case 2）**：加 hint `考慮 Frozen Elephant Trunk 的角色`

---

## 整體評價

| 項目 | MCS | Aortic |
|------|-----|--------|
| 醫學正確性 | ⚠️ VV-ECMO 路徑有誤、HR target 需修正 | ⚠️ HR target 有誤、備血量偏低 |
| 深度 | 3.5/5 | 3.5/5 |
| 邏輯連貫性 | ★★★★ 好 | ★★★★☆ 很好 |
| Case 品質 | ★★★★ 寫實且有層次 | ★★★★ 涵蓋三種情境 |
| 最大缺漏 | Impella、SCAI classification | David procedure、Acute Aortic Syndrome |

**總結**：兩套投影片的教學骨架很好，hook case 能引起興趣，邏輯串接清楚。主要問題是 **深度停在 R1-R2 level**，要到專科等級需要補上述缺漏的概念。幾個數據錯誤（VV-ECMO 路徑、HR target、備血量）需要修正以確保正確性。
