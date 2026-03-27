# ICU Simulator — Session 051 Handoff

**日期**: 2026-03-27
**接續**: Session 050

---

## 已完成

### GDD BioGears-Driven Overhaul
- **CT Output Engine** (`ct-output-engine.ts`): CT output 100% 從 BioGears `blood_volume_mL` delta + `pericardium_volume_mL` 推算。Milk CT 暫時恢復 patency ~4 min
- **Pathology Transition**: 移除 11 個 scripted `triggerTime` events。新增 `phaseTransitions` rule — `bloodVolume < 4700` (>800mL lost) 觸發 stop hemorrhage + pericardial effusion + cardiac_tamponade
- **Nurse Trigger Engine** (`nurse-trigger-engine.ts`): 14 個狀態驅動的護理師台詞，條件包含 CT rate、BP、CVP、severity、player actions、cooldown。完全取代 scripted events
- **Labs 擴充**: +20 新 labs（NT-proBNP, D-dimer, PCT, CRP, Mg, AST/ALT, LDH, Albumin, SvO₂ 等），新 categories: infection, urine。總計 ~40 項

### ACLS Modal 大改
- **Waveform Canvas**: ECG Lead II (green) + A-line (red)，120px canvas
  - CPR 中: A-line 有壓胸 artifacts (~30-40 mmHg, ~110/min)
  - 停壓: A-line flat (no ROSC) 或 pulsatile (ROSC)
  - ECG 隨 rhythm 變化 (asystole/VF/VT/PEA/sinus)
- **+5 藥物**: Atropine 1mg (max 3), CaCl₂ 1g, NaHCO₃ 50mEq, Mg 2g, Lidocaine 100mg
- **最小化**: 44px bar at bottom-[52px]，不擋 ActionBar

### UI/UX
- **ActionBar**: Milk CT 移入 ⚕️ 處置 popover，自定義 tooltip (function + shortcut)
- **ConsultModal**: 叫學長第一次就要 SBAR（單一自由文字框，不分 S/B/A/R 四格）→ AI 即時回饋 → 不管品質 5 min 到 → 遊戲繼續（移除「遊戲結束」選項）
- **DebriefPanel**: rationale 可展開/收合 + 顯示 howTo

### Ralph Loop Round 1-2
- Round 1: 7 facets audit → 6 critical, 19 medium
- Round 2: 13 medium 全修完（selectors, memo, throttle, timeline cap, auto-reconnect, `as any` removal, cleanup）
- 所有 critical 由 GDD agent 解決
- `tsc --noEmit` 零錯誤

### Performance
- 7 components 改用個別 zustand selector（PEModal, PauseThinkModal, SBARModal, VitalTrendGraph, ImagingModal, ConsultModal, DebriefPanel）
- ChatTimeline: 8 sub-components + TimelineEntryRow 加 `React.memo`
- BioGears WS: `syncBioGearsToStore` 500ms throttle
- Timeline cap 200 entries + expired activeEffects 自動清理
- BioGears auto-reconnect: exponential backoff 5 次（1s/2s/4s/8s/16s）
- `cleanupBioGearsClient()` on unmount

### Score
- 死亡分數上限 40（`Math.min(totalScore, 40)`）
- `act-recall-senior` 加 phase guard（只有 pathology == cardiac_tamponade 才算）
- 移除 6 個不必要的 `as any` cast

---

## 待辦（下次做）

### P0 — Bugs
1. **ConsultModal isPhase2**: Phase 1 不應顯示「緊急叫學長回來」— isPhase2 判斷需修
2. **CPR A-line 顯示 -13/4**: BioGears 同步問題，壓胸時 A-line 應顯示 ~30-40 mmHg 而非負數
3. **Labs CO₂**: 確認是否跟 ABG 重複，如果是則從一般 labs 移除

### P1 — Milk CT Modal
- Milk CT 從 chat timeline 回覆改為跳視窗 modal
- 顯示：操作結果（通暢/堵塞）、CT 狀態（output rate, color, patent）、提示（堵塞→考慮 POCUS）

### P2 — ACLS 藥物擴充

**Phase 1 核心** (Must-have):
| 藥物 | 劑量 | 教學價值 |
|------|------|---------|
| Vasopressin 40U | 單次 | 替代 Epi |
| Adenosine 6/12mg | rapid push, max 3 | asystole 給 = 致命錯誤 |
| D50W 50mL | 25-50g | 低血糖（H&T 可逆原因） |
| Insulin 10U | 配合 D50 | Hyperkalemia |
| Epinephrine drip | 0.1-0.5 mcg/kg/min | ROSC 後支持 |

**Phase 2 心外特色**:
| 藥物 | 教學價值 |
|------|---------|
| Protamine 25-50mg | 心外必備！給太快 = 低血壓+肺高壓 |
| Norepinephrine drip | ROSC 後 vasoplegic |
| Esmolol | 低 CO 給 = 致命 |
| Phenylephrine 100-200mcg | 低 EF 只給這個 = 惡化 |
| Calcium Gluconate 3g | peripheral line 安全替代 |

**Phase 3 進階教學**:
Procainamide, Diltiazem, Metoprolol, Naloxone, Milrinone, Dopamine

**完整清單 + 教學錯誤矩陣**: 見 ACLS 藥物 agent output（本 session）

### P3 — ACLS 藥物分類 UI
- 藥物太多需要分類（Vasopressor / Antiarrhythmic / Metabolic / etc）
- 可能需要 tab 或 accordion

### P4 — E2E Playtest
- 跑一輪 cardiac tamponade 完整流程
- Ralph Loop Round 3 驗證所有 critical 已解決

### P5 — Vercel Deploy
- Tailscale Funnel 連 BioGears

---

## 重要檔案

### 新建
| 檔案 | 內容 |
|------|------|
| `lib/simulator/engine/ct-output-engine.ts` | CT output 從 BioGears 推導 |
| `lib/simulator/engine/nurse-trigger-engine.ts` | 14 個狀態驅動護理師觸發 |

### 大改
| 檔案 | 改動 |
|------|------|
| `scenarios/pro/bleeding-to-tamponade.ts` | 移除 11 scripted events，加 phaseTransitions + nurse triggers |
| `components/simulator/pro/ACLSModal.tsx` | Waveform canvas + 5 drugs + minimize fix |
| `components/simulator/pro/ActionBar.tsx` | Milk CT→popover, custom tooltip |
| `components/simulator/pro/ConsultModal.tsx` | 單一 SBAR textarea + AI feedback + no game-end |
| `components/simulator/pro/DebriefPanel.tsx` | Expandable rationale + howTo |
| `components/simulator/pro/ChatTimeline.tsx` | React.memo all sub-components |
| `lib/simulator/store.ts` | Death cap 40, recall phase guard, nurse trigger eval, phaseTransitions, timeline cap |
| `lib/simulator/engine/biogears-engine.ts` | Remove `as any`, throttle, CT output sync |
| `lib/simulator/engine/biogears-client.ts` | Auto-reconnect + cleanup |
| `lib/simulator/data/labs.ts` | +20 labs, new categories |

---

## 注意事項

- ACLSModal.tsx 很大（~71KB），改動多 — edge cases 需仔細測
- ConsultModal Phase 1 顯示 recall 是已知 bug（isPhase2 邏輯錯）
- CPR 時 A-line -13/4 是已知 bug（BioGears sync 或 formula fallback 問題）
- 完整 ACLS 藥物清單（20 種 + 教學錯誤矩陣）在本 session agent output
