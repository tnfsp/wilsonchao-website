# ICU Simulator 生理引擎整合分析

> 最後更新：2026-03-24 | 分析基礎：BioGears 8.0 原始碼、Pulse 官網資料、Bodylight.js 文件

---

## Executive Summary

**推薦方案：BioGears C++ Server + WebSocket（混合架構）。** Vercel 前端 + 自架 BioGears physiology server，透過 WebSocket 即時推送 vitals。這條路線：(1) 使用完整的、經過驗證的心血管生理模型（Ursino baroreceptor + Guyton circulatory + 時變彈性心臟模型），(2) 開發時間約 3-4 週，(3) 可部署在 Wilson 的 Mac mini 或 $5/月 VPS 上。

WASM 方案理論上可行但風險高 — BioGears 依賴 Xerces-C（XML parser）和 CodeSynthesis XSD，這兩個 library 的 Emscripten 移植需要大量工程。**Server 模式是唯一在合理時間內能上線的路徑。**

---

## 方案比較表

| 維度 | Pulse (Server/Unity) | BioGears Server | BioGears WASM | Bodylight/Modelica | 自寫輕量模型 |
|------|---------------------|-----------------|---------------|-------------------|-------------|
| **開發時間** | 2-3 週 | 3-4 週 | 8-12 週+ | 4-6 週 | 2-3 週 |
| **生理準確度** | ★★★★★ | ★★★★★ | ★★★★★ | ★★★★☆ | ★★☆☆☆ |
| **心臟外科特化** | ★★★★☆ | ★★★★★ | ★★★★★ | ★★☆☆☆ | ★★☆☆☆ |
| **WASM 體積** | N/A (server) | N/A (server) | ~30-50 MB 😬 | ~5-10 MB | 0 (純 TS) |
| **維護成本** | 低（Kitware 維護） | 中（需跟 upstream） | 高 | 中 | 高（自己顧） |
| **教學透明度** | 低（黑箱） | 高（開源 C++） | 高 | 中 | 最高 |
| **Vercel 相容性** | 需 server | 需 server | ✅ 純前端 | ✅ 純前端 | ✅ 純前端 |
| **出血/Tamponade 模擬** | ✅ 內建 | ✅ 內建 Hemorrhage | ✅ | ❌ 需自建 | ❌ 需自建 |
| **藥物交互** | ✅ 完整 PK/PD | ✅ 完整 PK/PD | ✅ | ❌ | ❌ |
| **Baroreceptor 反射** | ✅ | ✅ Ursino 2000 | ✅ | 看 model | ❌ |
| **授權** | Apache 2.0 | Apache 2.0 | Apache 2.0 | MIT | N/A |

---

## 1. Pulse Physiology Engine（Kitware）

### 概述
Pulse 是 BioGears 的「精神續作」，由 Kitware 主導開發。C++ 核心引擎，提供 C、C#、Java、Python binding。

### 關鍵發現：Pulse Unity WebGL = 已有 WASM 路徑

**這是最重要的發現。** Pulse 官網明確列出：

> "The Pulse Unity Asset provides the Pulse C# API built for **Windows, MacOS, Linux, Android, iOS, xrOS, and WebGL platforms**."

Unity WebGL = Emscripten WASM。這代表 **Pulse 團隊已經成功將引擎編譯為 WASM**，只是它被包在 Unity Asset 裡。

### 整合路線

#### 路線 A：Pulse Unity WebGL（間接 WASM）
- **做法**：用 Unity 做一個極簡的 WebGL build，只跑 Pulse engine + 暴露 JSON API
- **優點**：官方已驗證 WASM 可行、有現成 C# binding
- **缺點**：需要 Unity 環境、WebGL build 體積大（~50-100MB）、要學 Unity
- **適合**：如果未來要做 3D 可視化

#### 路線 B：Pulse C++ Server + REST/WebSocket
- **做法**：自架 Pulse C++ 引擎作為 server process，暴露 WebSocket API
- **優點**：引擎跑 native 速度、前端完全解耦、Kitware 有維護
- **缺點**：Pulse 的 GitLab repo 有 Anubis 保護（抓不到原始碼細節）、社群比 BioGears 小
- **風險**：Pulse 沒有官方 REST API，需要自己包

#### 路線 C：Pulse Python Binding + FastAPI
- **做法**：用 Pulse 的 Python binding 包一層 FastAPI WebSocket server
- **優點**：Python 開發速度快、容易 debug
- **缺點**：Python overhead、GIL 限制（不過單用戶場景不影響）

### Pulse 的問題
1. **GitLab repo 被 Anubis 防爬保護**，無法直接讀原始碼評估
2. **社群規模較小**，GitHub/GitLab issue 討論不多
3. **沒有官方的 standalone server mode** — 需要自己包
4. Pulse Explorer（官方 web demo）是 **Qt 桌面應用**，不是 web app

### 結論
Pulse 技術上最成熟（已有 WebGL build 證明 WASM 可行），但 **入手門檻較高**：需要 clone、build、理解 API 結構。如果選 Pulse，建議走 **Python binding + FastAPI** 路線最快上手。

---

## 2. BioGears Server（⭐ 推薦方案）

### 為什麼推薦 BioGears

1. **完整開源，原始碼已經在手** — 已 clone 到 `/Users/zhaoyixiang/Project/_active/biogears-engine/`
2. **心臟外科特化程度最高** — 內建 Hemorrhage、Pericardial Effusion、Cardiac Arrest、Hemorrhagic Shock
3. **生理模型完整性**：
   - 14 個生理系統（Cardiovascular, Nervous, Respiratory, Renal, Drugs...）
   - Cardiovascular.cpp: 2,275 行（完整循環模型）
   - Nervous.cpp: 1,397 行（Ursino baroreceptor + chemoreceptor）
4. **有 CLI 工具**（bg-cli）可以直接跑 scenario — 可以快速驗證

### BioGears 核心公式（從原始碼提取）

#### 2.1 心臟彈性模型（Heart Elastance）
```
來源：Cardiovascular.cpp:1624-1640

時變彈性函數（Time-varying elastance function）:
  normalizedTime = currentCycleTime / cyclePeriod
  shape = (t/α₁)^n₁ / (1 + (t/α₁)^n₁) × 1/(1 + (t/α₂)^n₂) / maxShape
  
  參數：α₁=0.303, α₂=0.508, n₁=1.32, n₂=21.9, maxShape=0.598
  
  E_LV(t) = (E_max - E_min) × shape + E_min
  E_RV(t) = (E_max - E_min) × shape + E_min

這是 double-hill 函數，模擬心臟在收縮/舒張期的彈性變化。
→ 比你現在的 flat modifier 方案好太多，它能產生真實的脈壓變化。
```

#### 2.2 Baroreceptor 反射（Ursino 2000）
```
來源：Nervous.cpp:560-640

壓力感受器模型：
  1. 頸動脈/主動脈壁應變 → Voigt body model
     carotidStrain = 1 - √((1 + e^(-slope×ΔP)) / (A + e^(-slope×ΔP)))
     dStrain/dt = (1/τ) × (-strain + k × wallStrain)
     
  2. 應變 → 傳入神經頻率（Hz）
     f_afferent = (f_min + f_max × e^((signal-baseline)/k)) / (1 + e^((signal-baseline)/k))
     
  3. 中樞整合：交感/副交感信號
     sympathetic = f_inf + (f_0 - f_inf) × e^(k × weighted_sum)
     vagal = 同類結構
     
  4. 傳出效應：
     - HR scale = heartPeriod0 / (1 + sympatheticMod + vagalMod)
     - Elastance scale（心肌收縮力）
     - Resistance scale（血管阻力）
     - Compliance scale（靜脈容量）

引用：Ursino 2000, Magosso 2001, Lim 2013, Liang 2006, Randall 2019
```

#### 2.3 出血模型（Hemorrhage）
```
來源：Cardiovascular.cpp:1068-1130

出血 = pressure-driven flow:
  bleedRate = locationPressure / bleedResistance
  
  - 阻力基於初始設定的出血速率反推
  - 主動脈出血阻力 ×1.1（壓力更高）
  - 藥物可改變出血阻力（如 TXA → 增加阻力 → 減少出血）
  - Blood volume 即時追蹤
  - <40% baseline blood volume → cardiac arrest
```

#### 2.4 藥物系統（Drugs）
```
BioGears 有完整的 PK/PD 模型：
  - Vasopressors（Norepinephrine, Epinephrine, Vasopressin）
  - Inotropes（Dobutamine, Milrinone）
  - Protamine（heparin reversal）
  - Tranexamic acid（antifibrinolytic）
  - Blood products（pRBC, FFP, Platelet, Cryo）
  
每種藥物有：吸收、分布、代謝、排泄曲線
→ 這正是你的 ICU simulator 最需要的！
```

### BioGears 依賴分析

| 依賴 | 版本 | 用途 | Emscripten 相容 | Server 模式需要 |
|------|------|------|-----------------|----------------|
| CMake | ≥3.20 | Build system | N/A | ✅ |
| Eigen | 3.3.4 | 線性代數 | ✅ header-only | ✅ |
| Xerces-C | 3.2.3 | XML parsing | ⚠️ 困難 | ✅ |
| CodeSynthesis XSD | 4.0 | XML data binding | ❌ 極困難 | ✅ |
| Log4cpp | — | Logging | ⚠️ 需 stub | ✅ |
| dirent.h | — | 目錄操作 | ❌ 無 filesystem | ✅ |

### 架構設計：Vercel 前端 + BioGears Server

```
┌────────────────────────────────────────────────────────────────┐
│                        ARCHITECTURE                             │
│                                                                 │
│  ┌─────────────────────┐         ┌──────────────────────────┐  │
│  │   Vercel (Frontend)  │         │  Physiology Server       │  │
│  │                      │   WSS   │  (VPS / Mac mini)        │  │
│  │  Next.js 16 + React  │◄──────►│                          │  │
│  │  ProGameLayout.tsx    │        │  ┌────────────────────┐  │  │
│  │  ChatTimeline.tsx     │        │  │  BioGears C++ Core │  │  │
│  │  ActionBar.tsx        │        │  │  - Cardiovascular   │  │  │
│  │  VitalsPanel.tsx      │        │  │  - Nervous          │  │  │
│  │  OrderModal.tsx       │        │  │  - Drugs            │  │  │
│  │                      │        │  │  - BloodChemistry   │  │  │
│  └─────────────────────┘         │  │  - Respiratory      │  │  │
│                                   │  └────────────────────┘  │  │
│                                   │           ↕               │  │
│                                   │  ┌────────────────────┐  │  │
│                                   │  │  WebSocket Bridge   │  │  │
│                                   │  │  (C++ or Python)    │  │  │
│                                   │  │                     │  │  │
│                                   │  │  POST /scenario     │  │  │
│                                   │  │  WS /vitals-stream  │  │  │
│                                   │  │  POST /action       │  │  │
│                                   │  └────────────────────┘  │  │
│                                   └──────────────────────────┘  │
└────────────────────────────────────────────────────────────────┘
```

### WebSocket API 設計

```typescript
// Client → Server
interface SimCommand {
  type: 'start_scenario' | 'apply_action' | 'advance_time' | 'get_state';
  payload: {
    scenarioId?: string;
    action?: {
      type: 'hemorrhage' | 'drug_admin' | 'fluid_admin' | 'transfusion' | 'ventilator_change';
      params: Record<string, number | string>;
    };
    advanceSeconds?: number;
  };
}

// Server → Client（每秒推送）
interface VitalsUpdate {
  timestamp: number;          // simulation time (seconds)
  vitals: {
    hr: number;               // beats/min
    sbp: number;              // mmHg
    dbp: number;              // mmHg
    map: number;              // mmHg
    spo2: number;             // %
    cvp: number;              // mmHg
    rr: number;               // breaths/min
    temperature: number;      // °C
    etco2: number;            // mmHg
    cardiacOutput: number;    // L/min
  };
  bloodVolume: number;        // mL
  totalBloodLost: number;     // mL
  heartRhythm: string;       // 'NormalSinus' | 'Asystole' | etc.
  aLineWaveform: string;     // derived from elastance + pressure
  labs?: {                    // 只在有新 lab result 時推送
    hgb: number;
    inr: number;
    fibrinogen: number;
    lactate: number;
    pH: number;
    baseExcess: number;
    iCa: number;
  };
  activeSubstances: Array<{   // 正在作用的藥物
    name: string;
    concentration: number;
    effect: string;
  }>;
}
```

### 實作步驟

#### Phase 1：Build BioGears + CLI 驗證（Day 1-3）
```bash
# 在 Mac mini 或 VPS 上
cd /Users/zhaoyixiang/Project/_active/biogears-engine
mkdir build && cd build
cmake .. -DCMAKE_BUILD_TYPE=Release
make -j8

# 測試出血 scenario
./bin/bg-cli --scenario ../share/data/Scenarios/Patient/Hemorrhage.xml
```

#### Phase 2：WebSocket Bridge（Day 4-10）
兩個選項：

**選項 A：Python Bridge（推薦起步）**
```python
# biogears_server.py
import asyncio
import websockets
import subprocess
import json

class BioGearsSession:
    def __init__(self):
        # 透過 BioGears Python binding（SWIG）或 subprocess 控制
        self.engine = None
    
    async def start_scenario(self, scenario_config):
        """初始化 BioGears engine with patient + pathology"""
        pass
    
    async def apply_action(self, action):
        """Apply hemorrhage / drug / fluid action"""
        pass
    
    async def advance_and_get_state(self, seconds):
        """前進 N 秒，回傳 vitals snapshot"""
        pass

async def handler(websocket):
    session = BioGearsSession()
    async for message in websocket:
        cmd = json.loads(message)
        if cmd['type'] == 'start_scenario':
            await session.start_scenario(cmd['payload'])
        elif cmd['type'] == 'apply_action':
            result = await session.apply_action(cmd['payload'])
            await websocket.send(json.dumps(result))
        # ... vitals streaming loop

asyncio.run(websockets.serve(handler, "0.0.0.0", 8080))
```

**選項 B：C++ WebSocket Server（效能最佳）**
```cpp
// 使用 uWebSockets 或 Boost.Beast
// 直接 link libbiogears，in-process 呼叫 engine API
// 延遲 <1ms，但開發時間較長
```

#### Phase 3：前端 WebSocket Client + 替換現有 engine（Day 11-18）
```typescript
// lib/simulator/engine/biogears-client.ts
class BioGearsClient {
  private ws: WebSocket;
  private onVitalsUpdate: (vitals: VitalsUpdate) => void;

  connect(serverUrl: string): Promise<void> { ... }
  startScenario(config: ScenarioConfig): Promise<void> { ... }
  applyAction(action: SimAction): Promise<ActionResult> { ... }
  
  // 替換現有 patient-engine.ts 的 computeVitals()
  // 前端不再計算 vitals，改為接收 server push
}
```

#### Phase 4：Scenario 適配 + 測試（Day 19-25）
- 把 `postop-bleeding.ts` 的事件腳本轉換為 BioGears Hemorrhage actions
- 驗證 vitals 趨勢是否符合臨床經驗
- 校準出血速率、藥物反應時間

### Server 部署選項

| 選項 | 成本 | 延遲 | 維護 |
|------|------|------|------|
| **Mac mini（已有）** | $0 | ~50ms (local) / ~150ms (Tailnet) | 低 |
| **Fly.io** | $5/月 | ~30ms (Asia) | 極低 |
| **Railway** | $5/月 | ~50ms | 極低 |
| **Hetzner VPS (Tokyo)** | €4/月 | ~20ms | 中 |
| **AWS Lightsail (ap-northeast-1)** | $3.5/月 | ~20ms | 中 |

**推薦**：先用 Mac mini 開發測試，production 部署到 Fly.io（有 Docker 支援、自動 TLS、Asia region）。

### 延遲分析

ICU simulator 是事件驅動（不是 real-time），所以延遲要求寬鬆：

- Clerk 按下「開 CBC」→ server 收到 action → 回傳確認：**<200ms 可接受**
- 時間快轉（advance 10 min）→ server 計算 600 個 timestep → 回傳新 vitals：**<500ms 可接受**
- Vitals streaming（每秒推送）：**只在 advance 完後推一次即可**

這不是 FPS 遊戲，200ms 延遲完全不影響體驗。

---

## 3. BioGears WASM（高風險備選）

### 可行性評估

**結論：技術上可能，但工程量巨大，不建議作為首選。**

#### 障礙分析

| 障礙 | 嚴重度 | 解法 | 工作量 |
|------|--------|------|--------|
| **Xerces-C XML parser** | 🔴 高 | 移植到 Emscripten 或替換為 pugixml | 2-3 週 |
| **CodeSynthesis XSD** | 🔴 高 | 生成的 C++ 可能可以直接編譯，但 runtime 部分需移植 | 2-3 週 |
| **Log4cpp** | 🟡 中 | Stub out 或替換為 console.log | 1-2 天 |
| **Filesystem 操作** | 🟡 中 | 用 Emscripten virtual FS 或 preload data | 3-5 天 |
| **Eigen** | 🟢 低 | Header-only，Emscripten 相容 | 0 |
| **C++20 features** | 🟡 中 | Emscripten 支援大部分，需逐一確認 | 1 週 |
| **WASM 體積** | 🟡 中 | 需要精心裁剪，估計 30-50MB | 持續優化 |

#### 最小可行路徑
如果真的要做 WASM：
1. 先只編譯 Cardiovascular + Nervous + BloodChemistry + Drugs（4/14 系統）
2. 用 pugixml 替換 Xerces-C
3. 手動剝離 CodeSynthesis 依賴，改用 JSON 配置
4. 估計 8-12 週工程量

**這條路有意義的前提是**：有很多用戶同時使用，server 成本變高。對於教學用途（幾十個同時用戶），server 方案完全夠用。

---

## 4. Bodylight / Modelica WASM

### 概述
Bodylight.js 是捷克查理大學開發的框架，將 Modelica 生理模型編譯為 WASM 在瀏覽器中運行。

### 工作流程
```
Modelica Model → FMU (with source) → Bodylight FMU Compiler → WASM
```

### 優點
- ✅ 純前端運行，無需 server
- ✅ FMI 標準（Functional Mock-up Interface）
- ✅ 有現成的心血管模型（Meurs, Guyton 模型等）
- ✅ 體積較小（5-10MB）
- ✅ Web component 架構，可嵌入任何前端

### 缺點
- ❌ **沒有心臟外科特化** — 沒有出血模型、沒有藥物 PK/PD
- ❌ 需要 Modelica 環境（Dymola 或 OpenModelica）
- ❌ Bodylight 社群非常小（GitHub stars < 50）
- ❌ 模型選擇有限，要自己找或寫 Modelica model
- ❌ Debug 困難（Modelica → FMU → WASM 三層轉換）

### 適用場景
如果只是展示心血管生理學（壓力-容積環、Frank-Starling 曲線），Bodylight 很適合。但要做完整的 ICU 模擬（出血、藥物、死亡三角），需要自己在 Modelica 裡重建一切。**工作量不比自寫 TypeScript 少，但 debug 更痛苦。**

### 結論
❌ 不推薦用於 ICU simulator。適合純教學演示，不適合互動式模擬。

---

## 5. 其他方案

### OpenCOR / CellML
- CellML 模型庫有大量心血管模型（Noble cardiac cell models, Luo-Rudy）
- OpenCOR 是桌面應用，沒有 web runtime
- 模型粒度太細（cellular level），不適合 organ-level ICU 模擬
- ❌ 不推薦

### JSim (Java-based)
- 華盛頓大學開發的生理建模環境
- Java applet 已死（瀏覽器不支援）
- 沒有 modern web 路徑
- ❌ 不推薦

### HumMod
- 最完整的人體生理模型之一（>5000 變數）
- 但只有 GUI 應用，沒有 library/API
- C++ 原始碼結構不適合抽取
- ❌ 不推薦

---

## 6. 自寫輕量模型（退路方案）

> Wilson 明確傾向完整引擎，此方案僅作為「如果引擎整合遇到 blocker」的退路。

### 核心做法
從 BioGears Cardiovascular.cpp + Nervous.cpp 中提取關鍵公式，翻譯為 TypeScript。

### 可提取的核心模組
1. **Heart Elastance**（~30 行 TS） — double-hill function
2. **Baroreceptor Feedback**（~80 行 TS） — Voigt body + sigmoid
3. **Sympathetic/Vagal Efferent**（~60 行 TS） — log-transformed first-order filter
4. **Hemorrhage Flow**（~20 行 TS） — pressure-driven bleed

### 會失去什麼
- 完整的 blood chemistry（O2/CO2 transport, acid-base）
- 藥物 PK/PD（吸收、分佈、代謝、排泄曲線）
- 系統間交互作用（出血 → 低血壓 → baroreceptor → 心率代償 → 但因低溫 coagulopathy 加重）
- Respiratory-cardiovascular coupling

### 結論
退路可用，但會回到「教學準確但臨床不可信」的層級。如果 BioGears Server 方案順利（預期會），不需要走這條路。

---

## 推薦路線圖

### 短期（Week 1-4）：BioGears Server MVP

```
Week 1: Build BioGears on Mac mini
        └→ 跑通 Hemorrhage scenario via CLI
        └→ 驗證 vitals output 符合臨床預期

Week 2: Python WebSocket Bridge
        └→ SWIG binding 或 subprocess 控制 BioGears
        └→ 基本 API: start_scenario, apply_action, get_vitals
        
Week 3: 前端 WebSocket 整合
        └→ BioGearsClient.ts 替換 patient-engine.ts
        └→ VitalsPanel 改為接收 server push
        
Week 4: Scenario 適配
        └→ postop-bleeding 事件轉換為 BioGears actions
        └→ Hemorrhage + Drug + Transfusion 整合測試
```

### 中期（Week 5-8）：完善 + 部署

```
Week 5-6: 藥物系統整合
          └→ Vasopressor / Inotrope / Protamine / TXA
          └→ Blood products (pRBC, FFP, Platelet, Cryo)
          └→ Guard rails 驗證
          
Week 7: Production 部署
        └→ Fly.io Docker 部署
        └→ WSS (TLS) 設定
        └→ 延遲測試 + 監控
        
Week 8: 壓力測試 + 教學測試
        └→ 邀請 2-3 位 R 來試玩
        └→ 收集 feedback
```

### 長期（Month 3+）：更多場景 + 優化

```
- 新增場景：Tamponade, LCOS, Vasoplegia, Tension PTX
- 探索 WASM 路線（如果 user base 增長、server 成本上升）
- 考慮 Pulse Engine 作為替代（如果 Kitware 推出 official web API）
```

---

## 附錄

### A. 關鍵論文

| 論文 | 主題 | BioGears 中的應用 |
|------|------|-------------------|
| Ursino (2000) "Acute cardiovascular response to isocapnic hypoxia" | Baroreceptor + Chemoreceptor | Nervous.cpp 核心模型 |
| Magosso & Ursino (2001) "A mathematical model of CO2 effect on cardiovascular regulation" | 化學感受器 | CentralSignalProcess() |
| Lim et al. (2013) "Cardiovascular response to physical stress" | 壓力感受器權重 | Sympathetic signal weights |
| Liang & Liu (2006) "Simulation of hemodynamic responses to the Valsalva maneuver" | 頸動脈/主動脈權重分配 | wSH_ABA, wSH_ABC |
| Randall et al. (2019) "Model-based inference" | Voigt body 壁應變模型 | BaroreceptorFeedback() |
| Pruett et al. (2013) "Population model of the baroreceptor reflex" | 壓力感受器適應 | kAdapt_Per_hr = 0.042 |
| Guyton (1991) "Textbook of Medical Physiology" | 循環系統基礎 | 整體架構 |

### B. BioGears 核心公式摘要

#### B.1 Heart Elastance（double-hill function）
```
E(t) = (E_max - E_min) × φ(t) + E_min

φ(t) = [(t/0.303)^1.32 / (1 + (t/0.303)^1.32)] × [1 / (1 + (t/0.508)^21.9)] / 0.598

其中 t 為心臟週期內的標準化時間 (0-1)
E_max (左心): ~2.5 mmHg/mL,  E_min: ~0.1 mmHg/mL
```

#### B.2 Baroreceptor Wall Strain（Voigt body）
```
wallStrain = 1 - √((1 + e^(-0.04×ΔP)) / (5 + e^(-0.04×ΔP)))
dε/dt = (1/0.9) × (-ε + 0.1 × wallStrain)
signal = wallStrain - ε

ΔP = systolicPressure - operatingPoint (± pain/exercise/drug effects)
```

#### B.3 Afferent → Central → Efferent Pathway
```
Afferent:
  f = (2.52 + 47.78 × e^((signal-baseline)/0.075)) / (1 + e^(...))

Central (Sympathetic to heart):
  fSH = 2.1 + (16.11-2.1) × e^(0.0675 × weighted_sum)
  weighted_sum = -0.4×f_carotid - 0.6×f_aortic + 1.0×f_chemo - 1.38×f_cardiopulm - threshold

Efferent (Heart Rate):
  HR_scale = heartPeriod0 / (1 + sympatheticMod + vagalMod)
  d(sympatheticMod)/dt = (1/2.0) × (-mod + gain × ln(signal - 2.66 + 1))
  d(vagalMod)/dt = (1/1.5) × (-mod + gain × vagalSignal)
```

#### B.4 Hemorrhage
```
bleedResistance = locationPressure / initialBleedRate
actualBleedRate = locationPressure / (bleedResistance × (1 - drugEffect))
bloodVolumeLost += actualBleedRate × dt

Cardiac arrest trigger: bloodVolume < 0.4 × baseline
```

### C. BioGears 依賴安裝（Mac / Linux）

```bash
# macOS
brew install cmake eigen xerces-c

# CodeSynthesis XSD（需手動安裝）
# https://www.codesynthesis.com/download/xsd/
# 或用 Homebrew tap

# Build
cd biogears-engine
mkdir build && cd build
cmake .. -DCMAKE_BUILD_TYPE=Release \
         -DBiogears_BUILD_HOWTOS=ON \
         -DCMAKE_PREFIX_PATH="/opt/homebrew"
make -j$(nproc)
```

### D. 現有 patient-engine.ts 與 BioGears 的對照

| 現有功能 | patient-engine.ts | BioGears 等價 |
|----------|-------------------|---------------|
| Vitals 計算 | flat modifier × severity | 時變彈性 + circuit solver |
| 出血 | severity +0.4/min | pressure-driven hemorrhage |
| HR 變化 | pathology modifier | baroreceptor reflex |
| BP 變化 | linear interpolation | Windkessel + compliance |
| 藥物效果 | ActiveEffect.vitalChanges | 完整 PK/PD model |
| 死亡三角 | boolean checklist | 實際 temperature ↔ coagulopathy feedback |
| A-line waveform | 文字描述 | 可從 elastance curve 推導 |

**關鍵差異**：現有引擎的 vitals 是「從結果反推」（severity → vitals modifier），BioGears 是「從原因推導」（hemorrhage → blood volume ↓ → preload ↓ → CO ↓ → baroreceptor → HR ↑ → BP 嘗試代償）。後者在臨床上更可信，因為它能產生教科書上描述的「代償期 → 失代償期」轉換。

---

*分析完成。下一步：在 Mac mini 上 build BioGears 並跑通 Hemorrhage scenario。*
