# DESIGN-IMAGING-UPGRADE.md
> 影像升級策略（2026-03-25 更新）

## 策略總覽

**原則**：每個 scenario 用真實醫學影像，per-scenario sourcing

**授權**：
| Source | License | OK for teaching? |
|--------|---------|-------------------|
| LITFL (Life in the Fast Lane) | CC-BY-NC-SA 4.0 | ✅ 非商業教學 |
| NIH ChestX-ray14 | CC0 Public Domain | ✅ 任何用途 |
| Radiopaedia | CC-BY-NC-SA 3.0 | ✅ 備案（有 bot 防護） |

**已排除方案**：
- ❌ AI-generated CXR（測試過 Prompt2MedImage — 不同 pathology 影像幾乎無法區分，教學價值為零）
- ❌ NIH batch download（112K 張太雜，改為 per-scenario 精選）

---

## Per-Scenario Sourcing Workflow

建新 scenario 時，按此流程準備影像：

```
1. 列出 scenario 需要的所有影像（用下方 Checklist Template）
2. 每張影像：LITFL 先找 → NIH ChestX-ray14 備選 → Radiopaedia 最後
3. 下載到 public/assets/{type}/{scenario-or-pathology}/
4. scenario.json 裡寫好 path + attribution
5. 跑一次 dev server 確認顯示正常
```

---

## 影像類型

### Echo（心臟超音波）✅ 已完成

**狀態**：LITFL MP4 已下載，echo-video-map.ts 已建好

| Pathology | Views | Source |
|-----------|-------|--------|
| Cardiac Tamponade | A4C, subcostal, IVC, PLAX, PSAX, posterior | LITFL Case 005 |
| Pericardial Effusion | A4C | LITFL Case 006 |
| Hypovolemia | IVC long, IVC trans | LITFL Case 015 |
| RV Dilation / PE | PSAX (D-sign), A4C (McConnell) | LITFL Case 079 |
| Takotsubo / Low EF | PLAX, PSAX, A4C | LITFL Case 091 |
| Pulmonary Oedema | B-lines, confluent B-lines | LITFL |
| Pneumothorax | Absent lung sliding | LITFL |

**仍缺**：
- [ ] Normal cardiac function（正常 A4C with good EF）
- [ ] Normal IVC（partial inspiratory collapse）
- [ ] Lung A-lines（normal aerated lung）

**整合方案**：
- Cardiac views → MP4 loop（scenario state 決定播哪個）
- IVC → 保留 Canvas rendering option（CVP/RR 連動）+ MP4 備選
- Lung US → MP4 + 靜態 JPG 混合

### CXR（胸部 X 光）🔲 待做

**來源策略**：per-scenario 精選，不 batch download

| 需要的 CXR Types | 描述 | 首選來源 |
|-------------------|------|----------|
| normal | 正常 CXR | LITFL / NIH |
| pulmonary_edema | 肺水腫（butterfly pattern） | LITFL CXR library |
| pleural_effusion | 肋膜積液 | LITFL / NIH |
| cardiomegaly | 心臟擴大 | LITFL / NIH |
| tension_ptx | 張力性氣胸 | LITFL / NIH |
| hemothorax | 血胸 | NIH (Effusion label) |
| pericardial_effusion | 水瓶心 | LITFL / NIH |

**存放**：`public/assets/cxr/{pathology}/` — 每種 2-3 張不同 severity

### EKG（心電圖）🔲 待做

**來源**：LITFL ECG Library（非常完整，CC-BY-NC-SA 4.0）

| 需要的 EKG Types | 描述 | LITFL 頁面 |
|-------------------|------|------------|
| stemi_anterior | Anterior STEMI | litfl.com/anterior-stemi-ecg-library/ |
| stemi_inferior | Inferior STEMI | litfl.com/inferior-stemi-ecg-library/ |
| af_rvr | AF with RVR | litfl.com/atrial-fibrillation-ecg-library/ |
| vt | Ventricular tachycardia | litfl.com/ventricular-tachycardia-ecg-library/ |
| normal_sinus | Normal sinus rhythm | LITFL ECG basics |
| sinus_tachycardia | Sinus tachycardia | LITFL |
| right_heart_strain | S1Q3T3, RV strain pattern | LITFL PE ECG |

**存放**：`public/assets/ekg/{pattern}/` — 靜態 JPG/PNG

### CT（電腦斷層）🔲 待做

**來源**：LITFL Radiology Library / Radiopaedia

| 需要的 CT Types | 描述 | 來源 |
|-----------------|------|------|
| aortic_dissection | Type A/B dissection | LITFL / Radiopaedia |
| pe_filling_defect | Pulmonary embolism | LITFL / Radiopaedia |
| tension_ptx | Tension pneumothorax | LITFL / Radiopaedia |
| pericardial_effusion | Pericardial effusion on CT | Radiopaedia |

**存放**：`public/assets/ct/{pathology}/` — 靜態 JPG/PNG

---

## Attribution 模板

所有外部影像必須加 attribution：

```
Source: LITFL (Life in the Fast Lane) | Author: [Author Name]
License: CC-BY-NC-SA 4.0 | URL: [source URL]
```

NIH images:
```
Source: NIH ChestX-ray14 | License: CC0 Public Domain
```

---

## New Scenario Imaging Checklist Template

建新 scenario 時，複製此 checklist 到 `scenarios/{id}/IMAGING-CHECKLIST.md`：

```markdown
# Imaging Checklist — {scenario-id}

## Echo
- [ ] Which cardiac views needed? (PLAX / PSAX / A4C / subcostal)
- [ ] IVC assessment needed? (video or canvas)
- [ ] Lung US needed? (B-lines / A-lines / absent sliding)
- [ ] Source: existing echo-video-map entry or new LITFL case?

## CXR
- [ ] Which pathology? (normal / edema / effusion / cardiomegaly / ptx)
- [ ] Sourced from: LITFL / NIH / Radiopaedia
- [ ] Downloaded to: public/assets/cxr/{pathology}/
- [ ] Added to scenario.json

## EKG
- [ ] Which pattern? (NSR / sinus tachy / STEMI / AF / VT / etc.)
- [ ] Sourced from: LITFL ECG Library
- [ ] Downloaded to: public/assets/ekg/{pattern}/
- [ ] Added to scenario.json

## CT (if applicable)
- [ ] Which finding? (dissection / PE / ptx / etc.)
- [ ] Sourced from: LITFL / Radiopaedia
- [ ] Downloaded to: public/assets/ct/{pathology}/
- [ ] Added to scenario.json

## Attribution
- [ ] All images have source + license in scenario.json
- [ ] Attribution overlay renders in UI
```

---

## 實作優先級

1. ✅ **Echo** — Done. LITFL MP4 integrated via echo-video-map.ts
2. 🔲 **CXR** — Per-scenario. Start with cardiogenic-shock-01 needs
3. 🔲 **EKG** — Per-scenario. LITFL ECG Library is excellent
4. 🔲 **CT** — Only when scenarios require it (aortic dissection, PE)
