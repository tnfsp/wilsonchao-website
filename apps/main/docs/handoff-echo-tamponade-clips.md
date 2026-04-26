# Echo Clips 製作交班 — Tamponade Physiology

## 背景

ICU Simulator Pro 的 Case D（術後出血 → 心包填塞）需要 **tamponade 的 echo 影像**。
目前有的 clips 都是 pericardial effusion（積液），缺少 **hemodynamic compromise** 的影像。

## 專案位置

- Repo: `~/Project/_brand/new_website/`
- Echo clips 目錄: `public/assets/echo/cardiac-tamponade/`
- 現有 clips: `a4c.mp4`, `plax.mp4`, `psax.mp4`, `subcostal.mp4`, `ivc.mp4`

## 需要製作的 Clips

### 必要（Critical）

| # | View | 要顯示的 Sign | 檔名建議 | 說明 |
|---|------|--------------|----------|------|
| 1 | **A4C** | RV diastolic collapse | `a4c-rv-collapse.mp4` | Tamponade 的 hallmark — RV free wall 在舒張期向內塌陷。需要看到 pericardial effusion + 明確的 RV collapse |
| 2 | **PSAX** | D-shape sign | `psax-d-shape.mp4` | Short axis view — 因 RV 壓力過載，interventricular septum 向 LV 彎曲，LV 變成 D 字型 |

### 加分（Nice to have）

| # | View | 要顯示的 Sign | 檔名建議 | 說明 |
|---|------|--------------|----------|------|
| 3 | **A4C** | RA systolic collapse | `a4c-ra-collapse.mp4` | 右心房在收縮期向內塌陷（比 RV collapse 更早出現） |
| 4 | **Subcostal** | Swinging heart | `subcostal-swinging.mp4` | 大量積液時心臟在 pericardial sac 內搖擺 |
| 5 | **M-mode** | RV collapse timing | `mmode-rv-collapse.mp4` | M-mode 顯示 RV collapse 的時序（進階教學用） |

## 技術規格

- **格式**: MP4 (H.264), 可循環播放
- **長度**: 3-8 秒 loop
- **解析度**: 至少 480p，建議 720p
- **大小**: 盡量 < 2MB per clip
- **來源**: 公開教學資源（需 CC 授權）或自製動畫
- 建議來源：
  - LITFL Echo Library
  - Radiopaedia
  - 5MinuteEcho (YouTube CC clips)
  - GrepMed echo cases
  - 或用 Canvas/動畫自製示意版

## 如何使用

完成後放到 `public/assets/echo/cardiac-tamponade/` 目錄。

在 `components/simulator/pro/ImagingModal.tsx` 的 `ECHO_CLIPS` map 中，`cardiac_tamponade.cardiac` array 需要更新：

```typescript
cardiac_tamponade: {
  cardiac: [
    // Phase 2 早期（pericardial effusion）
    { src: "/assets/echo/cardiac-tamponade/a4c.mp4", label: "A4C — Pericardial effusion" },
    { src: "/assets/echo/cardiac-tamponade/subcostal.mp4", label: "Subcostal — Pericardial effusion" },
    // Phase 2 後期（tamponade physiology）— 新增
    { src: "/assets/echo/cardiac-tamponade/a4c-rv-collapse.mp4", label: "A4C — RV diastolic collapse（Tamponade 確診）" },
    { src: "/assets/echo/cardiac-tamponade/psax-d-shape.mp4", label: "PSAX — D-shape sign（RV pressure overload）" },
  ],
  ivc: [
    { src: "/assets/echo/cardiac-tamponade/ivc.mp4", label: "IVC — 擴張無塌陷（plethora）" },
  ],
},
```

## 臨床背景（給製作者參考）

Cardiac tamponade vs Pericardial effusion 的區別：
- **Effusion**（積液）：心包腔有液體，但心臟功能正常
- **Tamponade**（填塞）：積液壓迫心臟 → hemodynamic compromise

關鍵 echo signs of tamponade（按出現順序）：
1. RA systolic collapse（最早）
2. RV diastolic collapse（最特異性）
3. IVC plethora（IVC > 2cm，無呼吸變化）
4. Respiratory variation of mitral/tricuspid inflow（> 25%）
5. D-shape（晚期）
6. Swinging heart（大量積液）

在這個 scenario 中，是**術後**心包填塞（凝血塊，不是純液體），所以 echo 可能看到：
- Echogenic material in pericardial space（不是純黑的液體）
- Localized effusion/clot（不一定 circumferential）
- 但 hemodynamic signs 相同
