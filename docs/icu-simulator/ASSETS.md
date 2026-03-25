# ICU Simulator — 影像素材清單

> 最後更新：2026-03-25
> 路徑前綴：`/Users/zhaoyixiang/Project/_brand/new_website/public/assets/`

---

## 概覽

| 類型 | 數量 | 路徑 |
|------|------|------|
| Echo POCUS videos（MP4）| 20 個 | `public/assets/echo/` |
| CXR images（PNG）| 2 個 | `public/assets/cxr/` |

目前素材以 Echo（心臟超音波）為主，CXR 為輔。ECG 圖庫尚未建立（Phase 3 待辦）。

---

## Echo / POCUS 影片（MP4）

### Cardiac Tamponade（心包填塞）

路徑：`/assets/echo/cardiac-tamponade/`

| 檔案 | 心超切面 | 內容描述 | 使用 scenario |
|------|---------|---------|--------------|
| `a4c.mp4` | A4C（心尖四腔切面）| 心包積液環繞，RV 在舒張期塌陷 | cardiac-tamponade（Pro + Standard）|
| `plax.mp4` | PLAX（胸骨傍長軸）| 後方心包積液 | cardiac-tamponade（Pro）|
| `psax.mp4` | PSAX（胸骨傍短軸）| 短軸確認積液 + D-sign | cardiac-tamponade（Pro）|
| `subcostal.mp4` | Subcostal（劍下）| 最佳評估 pericardium 的角度 | cardiac-tamponade（Pro + Standard）|
| `ivc.mp4` | IVC（下腔靜脈）| IVC 擴張無塌陷（raised RAP）| cardiac-tamponade（Pro + Standard）|
| `posterior.mp4` | Posterior view | 後方積液特寫 | cardiac-tamponade（Pro）|

### Hypovolemia（低血容）

路徑：`/assets/echo/hypovolemia/`

| 檔案 | 切面 | 內容描述 | 使用 scenario |
|------|------|---------|--------------|
| `ivc-long.mp4` | IVC long axis | IVC 高度塌陷（>50% collapse），提示 volume depletion | postop-bleeding（Pro）|
| `ivc-trans.mp4` | IVC transverse | 橫切面確認塌陷 | postop-bleeding（Pro）|

### Lung B-lines（肺水腫）

路徑：`/assets/echo/lung-b-lines/`

| 檔案 | 切面 | 內容描述 | 使用 scenario |
|------|------|---------|--------------|
| `b-lines.mp4` | Lung POCUS | 典型 B-lines（彗星尾徵），提示肺水腫 | septic-shock（Pro）|
| `confluent-b-lines.mp4` | Lung POCUS | Confluent B-lines（白肺），嚴重肺水腫 | septic-shock（Pro）|

### Lung Pneumothorax（氣胸）

路徑：`/assets/echo/lung-pneumothorax/`

| 檔案 | 切面 | 內容描述 | 使用 scenario |
|------|------|---------|--------------|
| `absent-sliding.mp4` | Lung POCUS | 無 pleural sliding（正常：可見 sliding），提示氣胸 | 未來 tension PTX scenario |

### Pericardial Effusion（心包積液，無填塞）

路徑：`/assets/echo/pericardial-effusion/`

| 檔案 | 切面 | 內容描述 | 使用 scenario |
|------|------|---------|--------------|
| `a4c.mp4` | A4C | 心包積液，但心腔未塌陷（尚未填塞）| 教學對比用 |

### RV Dilation（右心室擴張）

路徑：`/assets/echo/rv-dilation/`

| 檔案 | 切面 | 內容描述 | 使用 scenario |
|------|------|---------|--------------|
| `a4c-mcconnell.mp4` | A4C | McConnell sign（RV apex 保留收縮，free wall 無動）→ 提示 PE | 未來 PE scenario |
| `psax-d-sign.mp4` | PSAX | D-sign（室間隔受壓呈 D 形）→ RV overload | 未來 PE / RV failure scenario |

### Takotsubo（章魚壺心肌病）

路徑：`/assets/echo/takotsubo/`

| 檔案 | 切面 | 內容描述 | 使用 scenario |
|------|------|---------|--------------|
| `a4c.mp4` | A4C | 心尖氣球樣膨出（ballooning），基底正常收縮 | 未來 Takotsubo scenario |
| `plax.mp4` | PLAX | 長軸確認心尖 akinesis | 未來 Takotsubo scenario |
| `psax-1.mp4` | PSAX at base | 基底部正常收縮 | 未來 Takotsubo scenario |
| `psax-2.mp4` | PSAX at apex | 心尖部無動 | 未來 Takotsubo scenario |

---

## CXR 影像（PNG）

### Cardiac Tamponade

路徑：`/assets/cxr/cardiac-tamponade/`

| 檔案 | 內容描述 | 授權 | 使用 scenario |
|------|---------|------|--------------|
| `water-bottle-sign.png` | Water-bottle sign（心影擴大呈水桶形）→ 大量心包積液的典型 CXR | Wikimedia Commons, CC-BY-SA 4.0 | cardiac-tamponade（Standard）|

### Cardiogenic Shock

路徑：`/assets/cxr/cardiogenic-shock/`

| 檔案 | 內容描述 | 授權 | 使用 scenario |
|------|---------|------|--------------|
| `pulmonary-edema.png` | 雙側肺門浸潤，Kerley B lines，肺血管重分布 → 心因性肺水腫 | Wikimedia Commons, CC-BY-SA 3.0 | septic-shock / lcos（Standard）|

---

## 素材來源說明

### 主要來源

**LITFL（Life in the Fast Lane）** — `https://litfl.com`
- 高品質臨床教學影像庫
- ECG、POCUS、CXR 教學影片
- 授權：CC-BY-NC-SA 4.0
- 目前在 `StandardImagingModal.tsx` 中標注：`📷 LITFL ECG Library, CC-BY-NC-SA 4.0`
- **⚠️ 重要**：NC（Non-Commercial）限制 — 若網站有商業化（付費功能），需重新確認授權

### 其他來源

**Wikimedia Commons**
- CXR 圖片（cardiac-tamponade, cardiogenic-shock）
- 授權：CC-BY-SA 3.0 / CC-BY-SA 4.0
- 允許商業使用，需 attribution + ShareAlike

**各 echo 影片的實際來源**：
- 目前 `public/assets/echo/` 內的 MP4 檔案尚未在 code 中標注個別來源
- 推測來源：LITFL POCUS 影片庫（基於 `StandardImagingModal.tsx` 的 LITFL 標注）
- **待辦**：確認每個影片的確切來源 URL + 授權文件

---

## 授權狀況

| 來源 | 授權類型 | 教育用途 | 商業用途 | Attribution 要求 |
|------|---------|---------|---------|----------------|
| LITFL | CC-BY-NC-SA 4.0 | ✅ | ❌（NC 限制）| 必須標注 LITFL + 相同授權分享 |
| Wikimedia Commons（CC-BY-SA 4.0） | CC-BY-SA 4.0 | ✅ | ✅ | 必須 attribution + ShareAlike |
| Wikimedia Commons（CC-BY-SA 3.0） | CC-BY-SA 3.0 | ✅ | ✅ | 必須 attribution + ShareAlike |

### ⚠️ 授權風險提示

1. **LITFL NC 限制**：網站若開始提供付費訂閱或商業教育服務，LITFL 素材可能需要替換或另行取得授權
2. **Attribution 缺失**：目前 Echo 影片在 UI 上沒有逐一顯示來源（只有 CXR 有 attribution）。建議加上。
3. **官方授權確認**：建議直接聯繫 LITFL 取得教育用途書面許可（他們通常歡迎教學使用）

---

## 各 Scenario 影像素材對照

### Postop Bleeding（術後出血）
- CXR：無（pathology = `surgical_bleeding`，無對應圖片）
- Echo：`/assets/echo/hypovolemia/ivc-long.mp4`、`ivc-trans.mp4`（IVC 塌陷 = volume depletion）

### Cardiac Tamponade（心包填塞）
- CXR：`/assets/cxr/cardiac-tamponade/water-bottle-sign.png`
- Echo：cardiac-tamponade 目錄全部 6 個影片（Standard: a4c + subcostal + ivc；Pro: 全部）

### Septic Shock（敗血性休克）
- CXR：`/assets/cxr/cardiogenic-shock/pulmonary-edema.png`（複用，提示肺水腫）
- Echo：`/assets/echo/lung-b-lines/` × 2

---

## 素材缺口（待補）

| 所需素材 | 用途 | 優先度 |
|---------|------|--------|
| CXR: Normal postop（胸骨鋼絲 + 清晰肺野）| 術後出血 baseline | P2 |
| CXR: Widened mediastinum | 心包填塞備用 | P2 |
| CXR: Tension pneumothorax | 未來 PTX scenario | P3 |
| Echo: LV hypovolemia（hyperdynamic, empty LV）| 術後出血確診 | P2 |
| ECG: Normal sinus rhythm post-CABG | 心律基線 | P3 |
| ECG: Atrial fibrillation | 術後 AF scenario | P3 |
| ECG: Low voltage + electrical alternans | 心包填塞特徵 ECG | P3 |

---

*素材清單由 Owl 整理，2026-03-25。來源確認工作待 Wilson sign-off。*
