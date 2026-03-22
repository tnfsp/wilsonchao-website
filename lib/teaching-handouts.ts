export interface HandoutSection {
  title: string;
  emoji?: string;
  content: string; // markdown-like HTML
}

export interface HandoutData {
  title: string;
  subtitle: string;
  emoji: string;
  duration: string;
  objectives: string[];
  sections: HandoutSection[];
  keyTakeaways: string[];
  furtherReading?: string[];
}

export const handouts: Record<string, HandoutData> = {
  "preop-assessment": {
    title: "Module 1：術前評估",
    subtitle: "「不是看數字決定開不開，是理解這顆心臟發生了什麼事」",
    emoji: "🫀",
    duration: "60-75 分鐘",
    objectives: [
      "理解 AS 的血流動力學（蓮蓬頭效應）及 Low-flow Low-gradient AS 的陷阱",
      "看懂 Echo 報告：不只記數字，理解每個指標代表的血流意義",
      "看懂 Cath 報告：理解 SYNTAX score 量化的是解剖複雜度",
      "理解 CABG vs PCI 的決策邏輯 — 不是塞了就開",
      "學會 STS Score / EuroSCORE II 的用途 — 風險量化，幫助 Heart Team 對話",
      "理解 TAVI vs SAVR 的現代決策框架",
      "知道 Frailty 為什麼比任何分數都重要",
    ],
    sections: [
      {
        title: "AS 的物理學 — 蓮蓬頭效應",
        emoji: "🫀",
        content: `
          <p>理解 AS 的 Echo 數字之前，先理解<strong>為什麼 velocity 會變高</strong>。</p>
          <p>想像你在洗車，用手指捏住水管口 → 出口變小 → 水噴得更快更遠。這就是 AS 的物理學。</p>
          <ul>
            <li><strong>Vmax</strong>：量「水噴多快」→ Vmax 越高 = 出口越小 = AS 越嚴重</li>
            <li><strong>Mean PG</strong>：跨瓣壓力差 → 出口越小，壓差越大</li>
            <li><strong>AVA</strong>：直接量出口面積（用 continuity equation 算）</li>
          </ul>
          <h4>⚠️ Low-flow, Low-gradient AS — 最危險的陷阱</h4>
          <p>如果「水龍頭本來就沒開大」（LV 沒力氣，EF 低）→ 即使出口很小，水也噴不快。</p>
          <ul>
            <li>AVA &lt;1.0（看起來 severe）但 Vmax &lt;4、mean PG &lt;40（看起來不 severe）</li>
            <li>矛盾！→ 因為 <strong>low flow state</strong>（EF 30%）</li>
            <li>解法：<strong>Dobutamine stress echo</strong> — 增加 flow 後看 AVA 是否還是小</li>
            <li>AVA 不變 → True severe AS（需要手術）</li>
            <li>AVA 變大 → Pseudo-severe AS（心肌無力，不是瓣膜的問題）</li>
          </ul>
        `,
      },
      {
        title: "Echo 報告判讀 — 理解而非死記",
        emoji: "📋",
        content: `
          <p>三個必看指標及其生理意義：</p>
          <ul>
            <li><strong>LVEF</strong> — 左心收縮功能。但注意：EF 正常不代表沒問題（diastolic dysfunction）。MR 的病人 EF 應該偏高（因為 volume overload），EF 60% 在 severe MR 的病人其實已經代表功能下降</li>
            <li><strong>Wall motion abnormality</strong> — 哪塊心肌不動？對應冠狀動脈：anterior → LAD, lateral → LCx, inferior → RCA</li>
            <li><strong>Valve severity</strong> — 每個指標都在回答「血流被影響了多少？」</li>
          </ul>
          <h4>Valve Severity 的邏輯</h4>
          <ul>
            <li><strong>AS</strong>：出口有多窄？（AVA, Vmax, Mean PG — 三個要一致。不一致時要想 low-flow state）</li>
            <li><strong>MR</strong>：漏了多少回去？ERO = 洞的面積，Regurgitant volume = 漏出去的水量，VC = 噴射束最窄處</li>
            <li><strong>AR</strong>：逆流的噴射束有多大？（VC, ERO）</li>
            <li><strong>MS</strong>：入口有多窄？（MVA, Mean PG）</li>
          </ul>
          <h4>參考數值（查表用，不用死背）</h4>
          <table>
            <thead><tr><th>Valve</th><th>Severe Criteria</th></tr></thead>
            <tbody>
              <tr><td>AS</td><td>AVA &lt;1.0 cm², mean PG &gt;40 mmHg, Vmax &gt;4 m/s</td></tr>
              <tr><td>AR</td><td>Vena contracta &gt;6mm, ERO &gt;0.3 cm²</td></tr>
              <tr><td>MS</td><td>MVA &lt;1.0 cm², mean PG &gt;10 mmHg</td></tr>
              <tr><td>MR</td><td>Vena contracta &gt;7mm, ERO &gt;0.4 cm², Regurgitant Vol &gt;60 mL</td></tr>
            </tbody>
          </table>
          <p><em>⚠️ 數字是參考。臨床要整合 flow status、LV function、症狀一起判斷。</em></p>
        `,
      },
      {
        title: "Cath 報告 — 不是「塞了就開」",
        emoji: "📋",
        content: `
          <h4>位置比 %stenosis 更重要</h4>
          <ul>
            <li><strong>Left Main ≥50%</strong> — 為什麼緊張？LM 供應 2/3 的心肌</li>
            <li><strong>Proximal LAD</strong> — LAD 供應整個前壁 + septum → 影響最大的單一血管</li>
            <li>同樣 80% stenosis，在 LM 和在 diagonal 的意義完全不同</li>
          </ul>
          <h4>SYNTAX Score — 解剖複雜度的量化</h4>
          <p>SYNTAX Score 考慮：病變位置、分叉、鈣化、完全阻塞、血管走向。</p>
          <ul>
            <li>SYNTAX ≤22：解剖單純 → PCI ≈ CABG</li>
            <li>SYNTAX &gt;22：解剖複雜 → CABG 勝出（PCI 再狹窄率高）</li>
            <li>SYNTAX &gt;33：高度複雜 → CABG 有明顯 survival benefit</li>
          </ul>
          <h4>CABG vs PCI 的決策邏輯</h4>
          <p>核心問題不是「塞了幾條」，而是「<strong>這個解剖 PCI 能不能處理好</strong>」。</p>
          <ul>
            <li>LM + 3VD + DM → CABG（FREEDOM trial）。為什麼 DM 偏向 CABG？DM 的血管 diffuse disease → stent 容易再塞</li>
            <li>CABG 的 graft 接在病變遠端 → 即使近端惡化，遠端仍有血流。PCI 只處理「那個點」</li>
          </ul>
        `,
      },
      {
        title: "風險評估 — STS / EuroSCORE II / Frailty",
        emoji: "📊",
        content: `
          <h4>STS Score — 做了什麼</h4>
          <p>蒐集幾十個變數 → 丟進統計模型 → 根據<strong>幾十萬筆手術資料庫</strong>預測 mortality, stroke, renal failure, prolonged ventilation。</p>
          <ul>
            <li><strong>Low risk</strong>: STS &lt;4% | <strong>Intermediate</strong>: 4-8% | <strong>High</strong>: &gt;8%</li>
          </ul>
          <h4>EuroSCORE II</h4>
          <p>歐洲資料庫，變數不同。兩個都算、互相參照。EuroSCORE II 對低風險可能高估。</p>
          <h4>風險評分的真正用途</h4>
          <p>不是判「可以開」或「不能開」— 是幫 <strong>Heart Team 對話</strong>的工具。STS 2% → 「放心開」。STS 8% → 「考慮 TAVI？」。STS 15% → 「傳統手術風險太高」。</p>
          <h4>Frailty — 分數抓不到的東西</h4>
          <p>5-meter walk test、grip strength、albumin、functional independence。80 歲 EuroSCORE 8% 但每天跑步 vs 同分的臥床老人 → 完全不同。<strong>眼見為憑</strong>。</p>
        `,
      },
      {
        title: "TAVI vs SAVR — 現代決策",
        emoji: "🔀",
        content: `
          <h4>TAVI 改變了什麼？</h4>
          <p>經股動脈放瓣膜 → 不用開胸、不用 CPB。住院 2-3 天 vs 7-10 天。從 high-risk only 到 low risk 也可以做。</p>
          <h4>為什麼不全部做 TAVI？</h4>
          <ul>
            <li><strong>耐久性</strong>：長期數據還在累積。SAVR 有 30 年以上追蹤</li>
            <li><strong>Pacemaker 風險</strong>：TAVI ~10-20% vs SAVR ~3%（壓到 conduction system）</li>
            <li><strong>Paravalvular leak</strong>：TAVI 靠壓力固定，不是縫上去的</li>
            <li><strong>Bicuspid aortic valve</strong>：不對稱 annulus → TAVI 定位困難</li>
          </ul>
          <h4>決策框架（2024 ACC/AHA 精神）</h4>
          <ul>
            <li>年輕（&lt;65）+ Low risk → <strong>SAVR</strong>（耐久性）</li>
            <li>65-80 歲 + Low-Intermediate → <strong>Shared decision</strong>（Heart Team + 病人偏好）</li>
            <li>&gt;80 歲 → 多數傾向 <strong>TAVI</strong></li>
            <li>High risk / Prohibitive → <strong>TAVI</strong></li>
          </ul>
        `,
      },
      {
        title: "Valve Surgery Indication — 什麼時候要開刀？",
        emoji: "🔄",
        content: `
          <p>大原則：<strong>Symptomatic + Severe → 開</strong>。難的是：Asymptomatic + Severe。</p>
          <h4>為什麼 Asymptomatic 也可能要開？</h4>
          <p>Valve disease 是慢性的 → 心臟會代償（AS: LV hypertrophy, AR: LV dilatation, MR: LA enlargement）。等到有症狀，心肌損傷可能已經不可逆。</p>
          <h4>Asymptomatic 開刀觸發指標</h4>
          <ul>
            <li><strong>AS</strong>：LVEF &lt;50%、exercise test 有症狀、Vmax 快速增加（&gt;0.3 m/s/yr）</li>
            <li><strong>MR</strong>：LVEF &lt;60%（MR 的 EF 要高一點才正常）、LVESD &gt;40mm</li>
            <li><strong>AR</strong>：LVEF &lt;55%、LVESD &gt;50mm、LVEDD &gt;65mm</li>
          </ul>
        `,
      },
      {
        title: "Heart Team",
        emoji: "👥",
        content: `
          <p>複雜的心臟病，一個醫師的視角不夠。Heart Team = <strong>心臟外科 + 心臟內科 + 麻醉 + 影像</strong>。</p>
          <p>Guideline 明確建議 Heart Team 討論：LM disease, TAVI vs SAVR, high-risk patients。每週的內外科聯合討論會就是在做這件事。</p>
        `,
      },
    ],
    keyTakeaways: [
      "AS 的 Echo 數字：先理解蓮蓬頭效應（出口小 → 流速快），再看數字才有意義",
      "Low-flow Low-gradient AS 是最常被漏的陷阱 → Dobutamine stress echo",
      "CABG vs PCI 看的是解剖複雜度（SYNTAX），不是塞了幾條",
      "STS / EuroSCORE II 是 Heart Team 對話的工具，不是判決書",
      "Frailty 比任何分數都重要 — 眼見為憑",
      "TAVI vs SAVR 的核心考量：年齡 × 耐久性 × 手術風險",
    ],
    furtherReading: [
      "2020 ACC/AHA Guideline for Management of Valvular Heart Disease",
      "2024 ESC Guidelines on Chronic Coronary Syndromes",
      "FREEDOM Trial (CABG vs PCI in DM + MVD)",
      "PARTNER 3 and Evolut Low Risk Trials (TAVI in low-risk)",
    ],
  },

  "hemodynamics": {
    title: "Module 2：Hemodynamic Monitoring",
    subtitle: "「不是盯數字，是讀懂這個人的循環在說什麼」",
    emoji: "📊",
    duration: "60-75 分鐘",
    objectives: [
      "讀 A-line 波形：upstroke、dicrotic notch、pulse pressure 的臨床意義",
      "理解 CVP 的正確用法 — 看趨勢，不是絕對值",
      "理解 Wedge pressure（PCWP）的生理意義 — 為什麼它代表 LV 前負荷",
      "理解 CI / SVRI 的關係 — 心臟輸出 vs 血管阻力，以及代償的概念",
      "用 SvO₂ + Lactate 判斷組織灌流",
      "用三個問題邏輯鑑別 Shock type",
      "Vasopressor / Inotrope 的 flowchart 選擇邏輯",
    ],
    sections: [
      {
        title: "A-line — 讀波形而非只看數字",
        emoji: "🔴",
        content: `
          <h4>波形的每個部分都有意義</h4>
          <ul>
            <li><strong>Upstroke（上升段）</strong>— LV 射血。斜率 ≈ dP/dt → 代表 LV 收縮力。上升段變緩 = 收縮力在變差</li>
            <li><strong>Peak</strong> — 收縮壓 = LV 收縮力 + afterload 的交互作用</li>
            <li><strong>Dicrotic notch</strong> — aortic valve 關閉的瞬間。位置高 = SVR 高；位置低或消失 = SVR 低（vasoplegia）</li>
            <li><strong>Diastolic runoff</strong> — 下降段反映 peripheral resistance</li>
          </ul>
          <h4>Pulse Pressure = SBP - DBP</h4>
          <ul>
            <li>正常 ~40 mmHg</li>
            <li>Narrow（如 85/70）→ Stroke volume 下降 → CO 可能不夠</li>
            <li>Wide（如 150/40）→ AR、sepsis、IABP augmentation</li>
          </ul>
          <h4>MAP — 為什麼目標 65？</h4>
          <p>MAP = 器官灌流的驅動壓力。多數器官 autoregulation 下限在 ~60-65 mmHg。慢性高血壓的病人 autoregulation 曲線右移 → 可能需要更高 MAP。</p>
        `,
      },
      {
        title: "CVP — 最被誤解的數字",
        emoji: "📊",
        content: `
          <ul>
            <li>CVP = RA 壓力 ≈ 右心前負荷的間接指標</li>
            <li><strong>CVP 不代表 volume status</strong> — CVP 8 可以是 dry（RV compliance 好）也可以是 overloaded（RV failure）</li>
            <li>正確用法：看<strong>趨勢 + 對治療的反應</strong></li>
            <li>給 fluid → CVP 升 2 + BP 升 → volume responsive ✅</li>
            <li>給 fluid → CVP 升 6 + BP 不變 → 別再給了 ❌</li>
          </ul>
        `,
      },
      {
        title: "Swan-Ganz — 理解 Wedge Pressure",
        emoji: "🫀",
        content: `
          <h4>PCWP 到底在量什麼？</h4>
          <p>Balloon 充氣 → 擋住 PA 血流 → catheter tip 前方變成<strong>靜止的血柱</strong> → 壓力傳導到 LA → <strong>PCWP ≈ LA pressure ≈ LVEDP = LV 前負荷</strong></p>
          <h4>臨床意義</h4>
          <ul>
            <li>PCWP &gt;18 mmHg → LV filling pressure 高 → 血回堵到肺 → <strong>肺水腫</strong></li>
            <li>PCWP &lt;8 mmHg → 前負荷不足 → 可能需要 volume</li>
            <li>CI 低 + PCWP 高 → LV failure（不是缺水，是心臟沒力）</li>
            <li>CI 低 + PCWP 低 → Preload 不足（可以試 fluid）</li>
          </ul>
          <h4>CI / SVRI 的關係</h4>
          <p>CI = 心臟每分鐘打出多少血（正常 2.5-4.0）。SVRI = 血管阻力。想像水管系統：CI 是幫浦出水量，SVRI 是水管口徑。</p>
          <p><strong>代償機制</strong>：幫浦沒力（低 CI）→ 水管自動縮小（高 SVRI）→ 維持水壓（MAP）→ 所以 <strong>MAP 看起來還行，但 CI 已經掉了 → BP 會騙人</strong>。</p>
        `,
      },
      {
        title: "SvO₂ + Lactate — 組織灌流的真相",
        emoji: "🧪",
        content: `
          <h4>SvO₂ — 身體用完氧之後剩多少</h4>
          <ul>
            <li>正常 65-75%。&lt;60% → 組織在搶氧 → CO 不夠 or O₂ consumption 太大</li>
            <li>&gt;80% 不一定好 → 可能組織無法利用氧（sepsis: cytopathic hypoxia）</li>
            <li>ScvO₂（從 CVP line 抽）是替代品，正常 &gt;70%</li>
          </ul>
          <h4>Lactate — BP 會騙人，Lactate 不會</h4>
          <ul>
            <li>正常 &lt;2 mmol/L | &gt;4 → mortality 顯著上升</li>
            <li><strong>趨勢是關鍵</strong>：2→1.5→1.0 = 治療有效 ✅ | 2→3.5→5.0 = 治療不夠 ❌</li>
            <li>每次抽 ABG 都有 lactate — 養成習慣看</li>
          </ul>
          <p><strong>經典陷阱</strong>：術後 BP 100/60 看起來還行，但 Lactate 2→4→6 → BP 是 SVR 代償出來的假象，組織在缺氧。</p>
        `,
      },
      {
        title: "Shock 鑑別 — 用邏輯，不是背表格",
        emoji: "💥",
        content: `
          <h4>三個問題定位 Shock Type</h4>
          <ol>
            <li><strong>心臟在打嗎？</strong>（CO 低 → pump failure / tank empty / tank blocked；CO 正常/高 → 水管太鬆）</li>
            <li><strong>血管是緊還是鬆？</strong>（SVR 高 → 代償 CO 不足；SVR 低 → vasoplegia）</li>
            <li><strong>心臟前面有沒有擋住？</strong>（CVP ↑↑ + CO ↓↓ → Obstructive: tamponade, tension PTX, PE）</li>
          </ol>
          <h4>摸四肢就對了一半</h4>
          <ul>
            <li>冷 + 濕 → SVR 高 → Cardiogenic / Hypovolemic / Obstructive</li>
            <li>暖 → SVR 低 → Vasodilatory（sepsis, post-CPB vasoplegia）</li>
          </ul>
          <h4>術後 Tamponade — 最不能漏的</h4>
          <p>Beck's triad（低 BP + JVP 升高 + 心音變小）。<strong>CT output 突然減少 ≠ 好事 → 可能塞住了</strong>。Equalization of diastolic pressures。Hemodynamically unstable → 不要等 echo → Re-explore。</p>
        `,
      },
      {
        title: "Vasopressor / Inotrope — Flowchart 思考",
        emoji: "💉",
        content: `
          <h4>Step 1：心臟沒力，還是血管太鬆？</h4>
          <ul>
            <li><strong>CI 低 + SVR 高</strong> → 心臟沒力 + 血管代償 → <strong>Milrinone</strong>（inotrope + vasodilator → 強心 + 降後負荷）</li>
            <li><strong>CI 低 + SVR 低</strong> → 心臟沒力 + 血管也鬆 → <strong>Dobutamine + Norepinephrine</strong>（強心 + 撐血壓）</li>
            <li><strong>CI 正常 + SVR 低</strong> → Vasoplegia → <strong>Norepinephrine ± Vasopressin</strong></li>
          </ul>
          <h4>Step 2：右心還是左心？</h4>
          <p>RV failure ≠ LV failure 的處理！RV failure → 降 PVR：<strong>Milrinone ± iNO</strong>。⚠️ 不要灌 volume → RV 脹大 → septum 推 LV → 惡性循環。</p>
          <h4>藥物的「個性」</h4>
          <ul>
            <li><strong>Milrinone</strong> — inodilator。強心 + 降後負荷 + 降 PVR。缺點：降 BP</li>
            <li><strong>Dobutamine</strong> — β1 為主。First-line inotrope。些微升 HR</li>
            <li><strong>Norepinephrine</strong> — α 為主。純升壓。不太升 HR</li>
            <li><strong>Vasopressin</strong> — V1 receptor。NE 不夠時的 second-line</li>
            <li><strong>Epinephrine</strong> — α+β。最後手段。HR 飆升 + arrhythmia risk</li>
          </ul>
        `,
      },
    ],
    keyTakeaways: [
      "A-line 波形比數字更有價值：upstroke 看收縮力，dicrotic notch 看 SVR",
      "CVP 看趨勢 + 治療反應，不是絕對值",
      "PCWP 代表 LV 前負荷 — CI 低 + PCWP 高 = LV failure，不是缺水",
      "BP 會騙人（SVR 代償），Lactate 不會 — 養成看 Lactate 趨勢的習慣",
      "Shock 鑑別用三個問題：心臟在打嗎？血管緊還是鬆？前面有擋住嗎？",
      "Inotrope / vasopressor 選擇 = CI 低 or 高？SVR 低 or 高？RV or LV？",
    ],
    furtherReading: [
      "Vincent JL. Understanding cardiac output. Crit Care. 2008",
      "Marik PE. Does CVP predict fluid responsiveness? Chest. 2008",
      "De Backer D. Hemodynamic monitoring using arterial pressure waveform. ICM 2019",
    ],
  },

  "ventilator": {
    title: "Module 3：呼吸器",
    subtitle: "「先搞懂為什麼需要它，才知道什麼時候可以拿掉」",
    emoji: "🌬️",
    duration: "50-60 分鐘",
    objectives: [
      "理解正壓通氣 vs 自主呼吸的生理差異，及其對心臟的影響",
      "用情境理解 Mode 選擇（AC → PS → weaning），而非背定義",
      "理解 PEEP 的概念：recruitment vs RV afterload 的平衡",
      "系統性處理 Fighting Vent — 60 秒決策樹",
      "Weaning 的四個面向：循環、神經、呼吸、RSBI",
      "認識心外特有問題：phrenic nerve injury、cardiac weaning failure",
      "ABG 判讀：理解身體在說什麼，而非背公式",
    ],
    sections: [
      {
        title: "為什麼需要正壓通氣？",
        emoji: "🫁",
        content: `
          <h4>自主呼吸 vs 正壓通氣</h4>
          <ul>
            <li><strong>自主呼吸</strong>：橫膈下降 → 胸腔<strong>負壓</strong> → 空氣被「吸」進來。負壓 → 促進靜脈回流 → CO ↑</li>
            <li><strong>正壓通氣</strong>：機器把空氣<strong>推</strong>進去 → 胸腔正壓。正壓 → <strong>阻礙靜脈回流</strong>（CO ↓）+ 增加 RV afterload</li>
          </ul>
          <p>→ 這就是為什麼心外術後用呼吸器，hemodynamics 要特別注意。</p>
          <h4>心外術後為什麼需要呼吸器？</h4>
          <ul>
            <li>全身麻醉 → 呼吸中樞抑制</li>
            <li>CPB 後肺 atelectasis + SIRS → 氣體交換差</li>
            <li>術後疼痛 → hypoventilation</li>
            <li>Hemodynamic instability → 需要控制呼吸穩定循環</li>
          </ul>
        `,
      },
      {
        title: "Mode — 用情境理解",
        emoji: "⚙️",
        content: `
          <h4>情境 1：剛回 ICU，病人沒醒</h4>
          <p>→ <strong>AC mode</strong>：機器全部代勞。</p>
          <ul>
            <li>VC-AC：設 TV → 每次保證給到。好處：TV 穩定。注意：compliance 變差時 pressure 飆高</li>
            <li>PC-AC：設 pressure → TV 隨 compliance 變。好處：限制 peak pressure。注意：compliance 差時 TV 掉</li>
          </ul>
          <h4>情境 2：術後 6hr，病人開始呼吸</h4>
          <p>→ 可以切到 <strong>PS mode</strong>：病人自己決定呼吸節奏，機器只幫忙推一把。PS 越低 → 幫助越少 → 越接近自己呼吸 → 這就是 weaning。</p>
          <h4>起始設定及理由</h4>
          <table>
            <thead><tr><th>Setting</th><th>Value</th><th>為什麼</th></tr></thead>
            <tbody>
              <tr><td>Mode</td><td>VC-AC</td><td>病人沒醒，完全控制</td></tr>
              <tr><td>TV</td><td>6-8 mL/kg IBW</td><td>避免 VILI（lung protective）</td></tr>
              <tr><td>RR</td><td>12-16</td><td>看 PCO₂ 調整</td></tr>
              <tr><td>FiO₂</td><td>100% → ≤40%</td><td>避免 O₂ toxicity + absorption atelectasis</td></tr>
              <tr><td>PEEP</td><td>5 cmH₂O</td><td>防 atelectasis，但顧 RV</td></tr>
            </tbody>
          </table>
        `,
      },
      {
        title: "PEEP — recruitment vs RV afterload 的平衡",
        emoji: "💨",
        content: `
          <h4>為什麼需要 PEEP？</h4>
          <p>正壓通氣 → 吐氣結束時肺泡容易塌陷。PEEP = 吐氣末保持正壓 → <strong>撐住肺泡</strong> → 增加氣體交換面積 → 改善 oxygenation。</p>
          <h4>PEEP 太高的代價（心外特別重要）</h4>
          <ul>
            <li>PEEP ↑ → 胸腔正壓 ↑ → venous return ↓ → CO ↓</li>
            <li>PEEP ↑ → 肺血管被壓 → <strong>RV afterload ↑</strong> → RV 可能撐不住</li>
            <li>心外術後 RV 功能可能脆弱（CPB injury, PHT）→ 通常用 <strong>5 cmH₂O</strong> 起步</li>
          </ul>
          <h4>找最佳 PEEP</h4>
          <p>太低 → 肺泡塌陷 → 低血氧。太高 → 壓 RV → CO 掉。</p>
          <p>加 PEEP 前先問自己：「這個人的 RV 撐得住嗎？」</p>
        `,
      },
      {
        title: "Fighting Vent — 60 秒決策樹",
        emoji: "😤",
        content: `
          <p><strong>不要只給 sedation！先找原因。</strong></p>
          <ol>
            <li><strong>致命先排除（10 秒）</strong>：Tension PTX（氣管偏移 + 單側沒呼吸音）、Tamponade、Massive PE</li>
            <li><strong>管路問題（20 秒）</strong>：ET tube 位置、打折、mucus plug → 先 disconnect + 手動 bagging + 100% O₂</li>
            <li><strong>設定問題</strong>：flow rate 不夠、trigger 太鈍、auto-PEEP</li>
            <li><strong>病人問題</strong>：疼痛、膀胱脹、焦慮、缺氧、高碳酸</li>
          </ol>
          <p><strong>關鍵判斷</strong>：Bagging 容易 + SpO₂ 回來 → 不是肺，是 vent 設定。Bagging 困難 → 肺或氣道問題。</p>
        `,
      },
      {
        title: "Weaning — 看「這個人準備好了嗎」",
        emoji: "🎯",
        content: `
          <p>Weaning 的思考不是「夠不夠格拔管」，而是「<strong>有什麼理由繼續插著？</strong>」</p>
          <h4>四個面向</h4>
          <ol>
            <li><strong>循環穩定嗎？</strong> — 不需要高劑量 inotrope、沒有 active bleeding、不在 rewarming</li>
            <li><strong>神經功能 OK 嗎？</strong> — 醒了？聽指令？有力氣咳？Cuff leak test?</li>
            <li><strong>呼吸功能 OK 嗎？</strong> — P/F &gt;200, FiO₂ ≤40%, PEEP ≤5</li>
            <li><strong>RSBI &lt;105</strong> — 快而淺的呼吸 = 呼吸肌撐不住 = 拔管容易失敗</li>
          </ol>
          <h4>RSBI = f / VT</h4>
          <p>背後邏輯：呼吸肌疲勞 → 呼吸又快又淺 → f/VT 比值飆高。例：RR 20, VT 0.4L → RSBI 50 ✅ | RR 35, VT 0.2L → RSBI 175 ❌</p>
          <h4>SBT</h4>
          <p>PS 5-8 or T-piece → 30-120 分鐘。通過 → 拔！不要拖（延遲 = 增加 VAP 風險）。失敗 → 找原因再試。</p>
        `,
      },
      {
        title: "心外特有問題",
        emoji: "🔧",
        content: `
          <h4>Phrenic nerve injury</h4>
          <ul>
            <li>心臟手術時 phrenic nerve 在 pericardium 上 → 被壓或冰到</li>
            <li>CXR：hemidiaphragm 升高 → FRC 下降 → weaning 困難</li>
            <li>可能需要 tracheostomy 等恢復</li>
          </ul>
          <h4>Cardiac weaning failure</h4>
          <ul>
            <li>正壓通氣其實在「幫」LV failure 的病人（降低 LV afterload）</li>
            <li>拔管 → 回到負壓呼吸 → LV afterload 增加 → LV failure 惡化 → 拔管失敗</li>
            <li>SBT 失敗時要想：是肺不好，還是<strong>心臟不好</strong>？</li>
          </ul>
          <h4>Flash pulmonary edema</h4>
          <p>LV failure → 急性肺水腫 → 突然 desaturation + 粉紅泡沫痰。<strong>這是心臟的問題</strong>，不是呼吸器的問題 → 治心臟！</p>
        `,
      },
      {
        title: "ABG 判讀 — 心外術後的思考",
        emoji: "🧪",
        content: `
          <h4>術後常見 Pattern 與背後意義</h4>
          <ul>
            <li><strong>Respiratory acidosis</strong>（pH↓ PCO₂↑）→ 通氣不足（還沒醒、sedation 太深、mucus）→ 增加 RR 或 TV</li>
            <li><strong>Metabolic acidosis</strong>（pH↓ HCO₃↓ + Lactate↑）→ <strong>不是呼吸器的問題！</strong>是灌流不足 → 治療心臟/循環，不要用增加 RR 來「代償」</li>
            <li><strong>Mixed</strong> → 更嚴重。通氣不足 + 灌流不足同時發生</li>
          </ul>
          <h4>判讀步驟</h4>
          <p>pH → PCO₂ → HCO₃ → AG → Compensation 夠不夠？→ 不夠 = mixed disorder</p>
          <h4>Compensation 公式（查表用）</h4>
          <table>
            <thead><tr><th>Disorder</th><th>Formula</th></tr></thead>
            <tbody>
              <tr><td>Metabolic acidosis</td><td>預期 PCO₂ = 1.5 × [HCO₃] + 8 ± 2 (Winter's)</td></tr>
              <tr><td>Metabolic alkalosis</td><td>預期 PCO₂ = 0.7 × [HCO₃] + 21 ± 2</td></tr>
              <tr><td>Resp. acidosis (acute)</td><td>每 PCO₂ ↑10 → HCO₃ ↑1</td></tr>
              <tr><td>Resp. acidosis (chronic)</td><td>每 PCO₂ ↑10 → HCO₃ ↑3.5</td></tr>
            </tbody>
          </table>
        `,
      },
    ],
    keyTakeaways: [
      "正壓通氣 ≠ 自主呼吸：正壓 → 降 venous return + 增加 RV afterload → 心外要特別注意",
      "PEEP 的平衡：撐住肺泡 vs 壓 RV。加 PEEP 前問自己「RV 撐得住嗎？」",
      "Fighting vent → 先找原因再 sedate，致命的先排除",
      "Weaning 看四個面向：循環 + 神經 + 呼吸 + RSBI",
      "RSBI &lt;105 = 可以試拔管。SBT 通過 → 拔！不要拖",
      "SBT 失敗要想：是肺不好，還是心臟不好？（Cardiac weaning failure）",
      "ABG metabolic acidosis + Lactate 高 → 不是呼吸器的問題，是心臟/循環的問題",
    ],
    furtherReading: [
      "ARDSNet Protocol — Lung Protective Ventilation",
      "Boles JM et al. Weaning from mechanical ventilation. ERJ 2007",
      "Pinsky MR. Heart-lung interactions during mechanical ventilation. Curr Opin Crit Care 2012",
    ],
  },

  "icu-care": {
    title: "Module 4：ICU Care",
    subtitle: "「CABG 術後 Day 0，然後呢？」",
    emoji: "🏥",
    duration: "60 分鐘",
    objectives: [
      "接 CABG 術後病人的完整 checklist（含神經學評估）",
      "認識術後 Day-by-Day 的照護重點",
      "Inotrope / Vasopressor 劑量與選擇",
      "術後 AKI 的風險因子與處理",
      "術後血糖管理（STS guideline 140-180）",
      "Re-explore criteria 的數字",
    ],
    sections: [
      {
        title: "接病人 Checklist",
        emoji: "📋",
        content: `
          <ul>
            <li><strong>管線</strong>：ET tube, A-line, CVP/Swan, chest tube ×?, Foley, pacing wire</li>
            <li><strong>Monitor</strong>：ABP, CVP, PAP, SpO₂, Temp</li>
            <li><strong>Lab</strong>：ABG, CBC, Coag, Lactate, Electrolytes</li>
            <li><strong>Drip</strong>：什麼 inotrope/vasopressor 在跑？速度？</li>
            <li><strong>神經學評估</strong>：瞳孔、GCS、醒來後四肢有沒有在動</li>
          </ul>
          <p>⚠️ 術後 Stroke 發生率 1-5%。病人醒來後第一件事：「握我的手」「動動腳趾」。</p>
        `,
      },
      {
        title: "Day-by-Day Timeline",
        emoji: "📅",
        content: `
          <table>
            <thead><tr><th>Day</th><th>目標</th><th>注意</th></tr></thead>
            <tbody>
              <tr><td>Day 0</td><td>穩定血壓、止血、rewarming</td><td>Bleeding、Tamponade、Hypothermia</td></tr>
              <tr><td>Day 1</td><td>Extubation、開始活動</td><td>AF（高峰 Day 2-3）、Neuro check</td></tr>
              <tr><td>Day 2-3</td><td>轉一般病房、拔管線</td><td>AKI 高峰、AF、Glucose control</td></tr>
              <tr><td>Day 4-7</td><td>復健、傷口觀察</td><td>Infection（wound / pneumonia）</td></tr>
            </tbody>
          </table>
        `,
      },
      {
        title: "Inotrope / Vasopressor（含劑量）",
        emoji: "💉",
        content: `
          <table>
            <thead><tr><th>Drug</th><th>作用</th><th>劑量</th><th>選擇時機</th></tr></thead>
            <tbody>
              <tr><td>Milrinone</td><td>Inotrope + vasodilator</td><td>0.375-0.75 μg/kg/min</td><td>RV failure, PHT</td></tr>
              <tr><td>Dobutamine</td><td>Inotrope (β1)</td><td>2-20 μg/kg/min</td><td>Low CO 首選</td></tr>
              <tr><td>Norepinephrine</td><td>Vasopressor (α)</td><td>0.01-0.5 μg/kg/min</td><td>Vasoplegia</td></tr>
              <tr><td>Vasopressin</td><td>Vasopressor (V1)</td><td>0.01-0.04 U/min</td><td>NE 不夠時加上</td></tr>
              <tr><td>Epinephrine</td><td>Both</td><td>0.01-0.1 μg/kg/min</td><td>最後手段 / 急救</td></tr>
            </tbody>
          </table>
        `,
      },
      {
        title: "術後 AKI",
        emoji: "🫘",
        content: `
          <p>發生率 <strong>20-30%</strong>，CPB 後最常見 complication 之一。</p>
          <ul>
            <li>Risk：術前 CKD、DM、高齡、CPB time &gt;120 min、術中低血壓</li>
            <li>預防：維持 MAP &gt;65、adequate CO、避免 nephrotoxins</li>
            <li>監測：UO（&gt;0.5 mL/kg/hr）+ Creatinine trend</li>
          </ul>
        `,
      },
      {
        title: "術後血糖管理",
        emoji: "🍬",
        content: `
          <ul>
            <li>CPB 後常見高血糖（stress response + insulin resistance）</li>
            <li>目標 <strong>140-180 mg/dL</strong>（STS guideline）</li>
            <li>&gt;180 → Insulin drip | &lt;70 → 避免！低血糖更危險</li>
          </ul>
        `,
      },
      {
        title: "Chest Tube & Re-explore Criteria",
        emoji: "🩸",
        content: `
          <ul>
            <li><strong>&gt;400 mL</strong> 第一小時</li>
            <li><strong>&gt;200 mL/hr × 2-4 hr</strong></li>
            <li><strong>&gt;1500 mL</strong> 總量 in 12 hr</li>
            <li>突然變少 ≠ 好事 → 可能塞住 → Tamponade</li>
          </ul>
        `,
      },
    ],
    keyTakeaways: [
      "接病人第一件事：管線 + Monitor + Lab + Drip + 神經學",
      "Inotrope 選擇看 Shock type，劑量要知道",
      "AKI 很常見 — 預防比治療重要",
      "CT output 趨勢 > 單一數字，突然變少要懷疑 tamponade",
    ],
  },

  "clerk-orientation": {
    title: "Clerk Orientation",
    subtitle: "高醫心臟血管外科見習指南",
    emoji: "🫀",
    duration: "30 分鐘",
    objectives: [
      "認識心外團隊成員",
      "了解兩週排程與學習優先順序",
      "知道每天的流程",
      "學會看刀表",
    ],
    sections: [],
    keyTakeaways: [
      "核心課程 > 門診 > 跟刀，但每天都要看 primary care 病人",
      "兩週至少跟 2-3 台開心手術",
      "有問題直接打 4657096",
    ],
  },

  "varicose-vein": {
    title: "Varicose Vein — 靜脈曲張",
    subtitle: "「這條腿為什麼腫起來？」",
    emoji: "🦵",
    duration: "30-40 分鐘",
    objectives: [
      "說明下肢靜脈系統三層結構（deep / superficial / perforator）與回流機制",
      "理解瓣膜失能 → reflux → 靜脈高壓的病理生理",
      "正確使用 CEAP 分級（C0-C6）評估病人嚴重度",
      "掌握 Duplex ultrasound 的判讀重點（reflux time > 0.5s）",
      "區分保守治療與手術適應症",
      "比較 stripping / RFA / EVLA / VenaSeal / sclerotherapy 的原理與適用時機",
      "辨識需要積極處理的紅旗：出血、潰瘍、反覆蜂窩性組織炎",
    ],
    sections: [
      {
        title: "解剖與病理生理",
        emoji: "🩻",
        content: `
          <h4>下肢靜脈系統三層結構</h4>
          <ul>
            <li><strong>Deep veins</strong>（femoral, popliteal, tibial）— 在肌肉內，負責 90% 回流</li>
            <li><strong>Superficial veins</strong>（GSV, SSV）— 在皮下筋膜層</li>
            <li><strong>Perforating veins</strong> — 連接 superficial → deep，單向瓣膜</li>
          </ul>

          <h4>GSV（Great Saphenous Vein）</h4>
          <p>走向：foot medial marginal vein → <strong>medial malleolus → medial leg → medial thigh</strong> → Saphenofemoral Junction (SFJ) → common femoral vein。SFJ 位於 inguinal crease 下方約 3-4 cm。<strong>最常見的靜脈曲張來源（~80%）</strong>。</p>

          <h4>SSV（Small Saphenous Vein）</h4>
          <p>走向：foot lateral marginal vein → <strong>lateral malleolus → posterior calf</strong> → Saphenopopliteal Junction (SPJ) → popliteal vein。SPJ 位置變異大。約 15-20% 的靜脈曲張與 SSV 相關。</p>

          <h4>瓣膜失能機制</h4>
          <p>正常：calf muscle pump 收縮 → 血液往上推 → 瓣膜關閉防逆流。</p>
          <p>異常：瓣膜關不住 → <strong>reflux → 靜脈壓升高 → 管壁擴張扭曲 → 更多瓣膜壞掉 → 惡性循環</strong>。</p>

          <h4>Perforator 的角色</h4>
          <p>正常為 superficial → deep 單向。瓣膜失能時 deep system 高壓灌回 superficial。常見位置：<strong>Cockett perforators</strong>（medial calf, posterior tibial area）。Perforator incompetence 是 C5-C6 潰瘍的主因之一。</p>

          <h4>風險因子</h4>
          <ul>
            <li>久站職業（老師、護理師、廚師）</li>
            <li>女性 > 男性（~3:1）— 荷爾蒙、懷孕（子宮壓迫 IVC + progesterone 鬆弛靜脈壁）</li>
            <li>肥胖、家族史、年齡、DVT 病史</li>
          </ul>
        `,
      },
      {
        title: "臨床表現與 CEAP 分級",
        emoji: "👁️",
        content: `
          <h4>常見症狀</h4>
          <ul>
            <li>下肢痠脹、沉重感 — 越站越嚴重，抬腿改善</li>
            <li>夜間抽筋（nocturnal cramps）</li>
            <li>癢、burning sensation</li>
            <li>可見的扭曲靜脈、spider veins</li>
            <li>⚠️ 症狀嚴重度不一定與外觀成正比</li>
          </ul>

          <h4>CEAP — Clinical Classification（C0-C6）</h4>
          <table>
            <thead><tr><th>分級</th><th>定義</th><th>臨床意義</th></tr></thead>
            <tbody>
              <tr><td><strong>C0</strong></td><td>無可見或可觸及的靜脈疾病</td><td>可能仍有症狀</td></tr>
              <tr><td><strong>C1</strong></td><td>Telangiectasia / reticular veins（&lt;3mm）</td><td>蜘蛛絲狀，美觀問題為主</td></tr>
              <tr><td><strong>C2</strong></td><td>Varicose veins（≥3mm）</td><td>門診最常見</td></tr>
              <tr><td><strong>C3</strong></td><td>Edema</td><td>慢性靜脈高壓的結果</td></tr>
              <tr><td><strong>C4a</strong></td><td>Pigmentation / eczema</td><td>皮膚開始有變化</td></tr>
              <tr><td><strong>C4b</strong></td><td>Lipodermatosclerosis / atrophie blanche</td><td><strong>潰瘍前兆，需積極處理</strong></td></tr>
              <tr><td><strong>C4c</strong></td><td>Corona phlebectatica</td><td>足踝周圍 fan-shaped telangiectasia（2020 更新）</td></tr>
              <tr><td><strong>C5</strong></td><td>Healed venous ulcer</td><td>癒合但隨時可能復發</td></tr>
              <tr><td><strong>C6</strong></td><td>Active venous ulcer</td><td>典型位置：medial malleolus 上方（gaiter area）</td></tr>
            </tbody>
          </table>

          <h4>CEAP 完整寫法</h4>
          <ul>
            <li><strong>E（Etiology）</strong>：Ep（primary）/ Es（secondary, post-DVT）/ Ec（congenital）</li>
            <li><strong>A（Anatomy）</strong>：As（superficial）/ Ad（deep）/ Ap（perforator）</li>
            <li><strong>P（Pathophysiology）</strong>：Pr（reflux）/ Po（obstruction）/ Pr+o</li>
            <li>範例：C4a,s, Ep, As,p, Pr</li>
          </ul>
        `,
      },
      {
        title: "診斷",
        emoji: "🔍",
        content: `
          <h4>理學檢查</h4>
          <ul>
            <li><strong>一定要讓病人站起來</strong> — 躺著靜脈會塌掉</li>
            <li>看分布（medial = GSV？posterior = SSV？）</li>
            <li>摸皮膚溫度、induration、tenderness</li>
            <li>比較兩腳周長差異</li>
          </ul>

          <h4>Duplex Ultrasound — Gold Standard</h4>
          <p>B-mode + Doppler = 看結構 + 看血流方向。病人站立，做 Valsalva 或 calf squeeze-release。</p>
          <ul>
            <li><strong>Reflux time &gt; 0.5 秒 = pathological reflux</strong>（superficial veins）</li>
            <li>Deep veins 標準較嚴：&gt; 1.0 秒</li>
          </ul>

          <h4>超音波必須回答的問題</h4>
          <ol>
            <li>Reflux 在哪裡？GSV / SSV / perforators？</li>
            <li>SFJ / SPJ competent 嗎？</li>
            <li>Deep system 通暢嗎？（排除 DVT / post-thrombotic syndrome）</li>
            <li>GSV 直徑多少？</li>
            <li>有沒有 accessory saphenous vein？</li>
          </ol>

          <h4>靜脈 vs 動脈潰瘍鑑別</h4>
          <table>
            <thead><tr><th></th><th>Venous Ulcer</th><th>Arterial Ulcer</th></tr></thead>
            <tbody>
              <tr><td>位置</td><td>Medial malleolus（gaiter area）</td><td>Toe tips, heel, pressure points</td></tr>
              <tr><td>外觀</td><td>淺、不規則、granulation base</td><td>深、punch-out、pale base</td></tr>
              <tr><td>疼痛</td><td>抬腿改善</td><td>垂腿改善（dangling）</td></tr>
              <tr><td>周圍皮膚</td><td>色素沉澱、lipodermatosclerosis</td><td>蒼白、無毛、指甲變厚</td></tr>
              <tr><td>脈搏</td><td>可摸到</td><td>減弱或消失</td></tr>
            </tbody>
          </table>
        `,
      },
      {
        title: "治療選擇",
        emoji: "💊",
        content: `
          <h4>治療原則</h4>
          <p><strong>消除 reflux source → 降低靜脈壓 → 症狀改善</strong>。先處理 truncal reflux（GSV/SSV），再處理 tributaries。</p>

          <h4>保守治療 — 壓力襪</h4>
          <table>
            <thead><tr><th>Class</th><th>壓力</th><th>適應症</th></tr></thead>
            <tbody>
              <tr><td>I</td><td>15-20 mmHg</td><td>預防、輕微症狀</td></tr>
              <tr><td>II</td><td>20-30 mmHg</td><td><strong>最常用</strong>，中度 CVI</td></tr>
              <tr><td>III</td><td>30-40 mmHg</td><td>嚴重 CVI、潰瘍</td></tr>
            </tbody>
          </table>
          <p>穿法：<strong>早上起床前穿</strong>。禁忌：嚴重 PAD（ABI &lt; 0.6）。</p>

          <h4>手術適應症</h4>
          <ul>
            <li>有症狀的 C2 — 保守治療 3-6 月無效</li>
            <li>C4b-C6 — lipodermatosclerosis / 潰瘍</li>
            <li>Superficial thrombophlebitis 反覆發作</li>
            <li>Varicose vein 破裂出血</li>
            <li>反覆蜂窩性組織炎</li>
          </ul>

          <h4>傳統手術：High Ligation + Stripping</h4>
          <p>SFJ 高位結紮 + GSV 抽除。需 GA/spinal，傷口較大，saphenous nerve injury risk。復發率 ~20-30% at 5 years（neovascularization）。現已逐漸被微創取代。</p>

          <h4>微創熱消融</h4>
          <ul>
            <li><strong>RFA（Radiofrequency Ablation）</strong>— ClosureFast catheter, 120°C 間歇加熱</li>
            <li><strong>EVLA（Endovenous Laser Ablation）</strong>— laser fiber, 連續或脈衝加熱</li>
          </ul>
          <p>步驟：超音波導引穿刺 GSV → catheter 尖端放 SFJ 下方 2cm → tumescent anesthesia → 退出時加熱消融。</p>
          <p>優勢：local anesthesia、術後疼痛少、1-3 天恢復、5年閉合率 92-95%。</p>

          <h4>Cyanoacrylate（VenaSeal）</h4>
          <p>醫用三秒膠黏合血管壁。<strong>不需 tumescent anesthesia，不用術後穿壓力襪</strong>。2年閉合率 ~97%。少數人對膠過敏（phlebitis-like reaction ~10%）。</p>

          <h4>Sclerotherapy</h4>
          <p>注射硬化劑 → 血管壁發炎 → 纖維化閉合。Liquid（小血管、C1）/ Foam（Tessari method，較大靜脈）。常用：Polidocanol / STS。角色：C1 美容、tributary 殘餘、不適合手術者。風險：skin staining、DVT、visual disturbance。</p>

          <h4>Decision Tree</h4>
          <ul>
            <li><strong>C1</strong> → sclerotherapy / laser</li>
            <li><strong>C2 無症狀</strong> → 衛教 + 追蹤</li>
            <li><strong>C2 有症狀 / C3</strong> → 壓力襪 3-6 月 → 無效 → 微創消融</li>
            <li><strong>C4-C6</strong> → 積極處理 reflux（微創 > stripping）+ 傷口照護</li>
            <li><strong>合併 deep vein obstruction</strong> → 先處理 deep system</li>
          </ul>
        `,
      },
      {
        title: "併發症與追蹤",
        emoji: "⚡",
        content: `
          <h4>術後常見問題</h4>
          <ul>
            <li>瘀青、硬塊（induration）— 正常，2-4 週消退</li>
            <li>Phlebitis — 沿消融路徑的發炎反應，NSAID + 壓力襪</li>
            <li>Paresthesia — saphenous nerve injury（below-knee 操作）</li>
            <li>Skin burn — tumescent 不足或 laser 能量過高</li>
          </ul>

          <h4>EHIT（Endovenous Heat-Induced Thrombosis）</h4>
          <table>
            <thead><tr><th>Class</th><th>定義</th><th>處理</th></tr></thead>
            <tbody>
              <tr><td>1</td><td>Thrombus at SFJ，未延伸到 deep vein</td><td>追蹤</td></tr>
              <tr><td>2</td><td>延伸到 CFV &lt;50% lumen</td><td>抗凝</td></tr>
              <tr><td>3-4</td><td>&gt;50% 或完全阻塞</td><td><strong>等同 DVT 處理</strong></td></tr>
            </tbody>
          </table>
          <p>發生率 ~1-2%，術後 48-72h 超音波追蹤很重要。</p>

          <h4>DVT 預防</h4>
          <p>早期活動（當天走路）、壓力襪、高風險族群考慮預防性抗凝。</p>

          <h4>復發原因</h4>
          <ul>
            <li>Neovascularization（SFJ 附近長新血管，stripping 後較常見）</li>
            <li>未處理到的 tributary / perforator</li>
            <li>疾病進展（新的瓣膜失能）</li>
            <li>5 年復發率：stripping ~25% / 微創 ~10-15%</li>
          </ul>
          <p>追蹤時程：術後 1 週 → 1 月 → 6 月 → 之後每年超音波。</p>
        `,
      },
      {
        title: "What Would You Do? — 臨床情境",
        emoji: "🧠",
        content: `
          <h4>Case 1：28F，OL，雙腿 spider veins + 小 varicose veins（3-4mm）</h4>
          <p>主訴：「穿裙子很醜」。超音波：GSV no reflux。</p>
          <ul>
            <li>CEAP：C1-C2, Ep, As, Pr</li>
            <li>不需要處理 GSV（沒有 truncal reflux）</li>
            <li>→ <strong>Sclerotherapy for spider veins + 壓力襪</strong></li>
            <li>告知：美容處理，可能需多次，健保不給付</li>
          </ul>

          <h4>Case 2：62M，DM，左小腿 varicose veins 多年，半年內第三次蜂窩性組織炎</h4>
          <p>PE：medial calf pigmentation, lipodermatosclerosis, healed 2cm ulcer scar。超音波：GSV reflux from SFJ, 直徑 10mm, 2 incompetent perforators。</p>
          <ul>
            <li>CEAP：C5, Ep, As,p, Pr</li>
            <li>反覆感染 + C5 = <strong>積極手術適應症</strong></li>
            <li>→ <strong>GSV RFA/EVLA + perforator ablation</strong></li>
            <li>術前：DM 控制（HbA1c）+ 確認 ABI 排除 PAD</li>
          </ul>

          <h4>Case 3：70F，急診，左腳踝 varicose vein 破裂噴血</h4>
          <p>BP 95/60, HR 110，褲管濕透，現場已加壓止血。</p>
          <ul>
            <li>第一步：ABC！<strong>抬高患肢 + 直接加壓</strong></li>
            <li>出血控制後：figure-of-eight suture 在出血點</li>
            <li>穩定後出院，但必須<strong>安排門診 duplex + 根本治療</strong></li>
            <li>教訓：varicose vein 不只是美觀問題 — 會出血、會致命</li>
          </ul>
        `,
      },
    ],
    keyTakeaways: [
      "理解 reflux 的機制 — 所有治療都是在消除 reflux source",
      "Duplex ultrasound 是必做的 — 不做超音波不要治療",
      "CEAP ≥ C4b 要積極處理 — 不會自己好",
      "微創（RFA/EVLA/VenaSeal）> 傳統 stripping — 但要知道原理與限制",
      "治療前排除 DVT 和 PAD — 安全第一",
      "靜脈曲張是 C0 到 C6 的疾病光譜 — 判斷病人在哪個階段，決定做什麼",
    ],
  },

  "avf-avg": {
    title: "AVF/AVG 評估",
    subtitle: "透析血管通路 — 理學檢查與臨床決策",
    emoji: "💉",
    duration: "30-40 分鐘",
    objectives: [
      "了解 CKD 患者何時需要建立 vascular access（NKF-KDOQI guidelines）",
      "比較 AVF vs AVG vs CVC 的優缺點與適應症",
      "掌握 AVF 解剖選擇的優先順序與術前評估",
      "熟練 AVF/AVG 的理學檢查（看、摸、聽）",
      "能區分 stenosis 與 thrombosis",
      "認識常見併發症並知道基本處理原則",
      "處理急診情境：thrombosis 與出血",
    ],
    sections: [
      {
        title: "為什麼需要 AVF/AVG？",
        emoji: "🏥",
        content: `
          <p>CKD Stage 4（eGFR 15-29）時就要開始規劃透析血管通路。NKF-KDOQI 建議 <strong>eGFR &lt;25 時轉介外科評估</strong>。</p>
          <h4>為什麼要這麼早？</h4>
          <ul>
            <li>AVF 需要 4-6 週才能成熟（arterialization 需要時間）</li>
            <li>加上可能的 maturation failure 需要重做，實際等待時間更長</li>
            <li>太晚轉介 → 被迫使用 CVC → 感染率高、死亡率高</li>
          </ul>
          <p><strong>台灣現況</strong>：透析人口密度全球最高（~9萬人），超過 80% 用血液透析，通路問題是最常見的住院原因之一。</p>
        `,
      },
      {
        title: "三種通路比較：AVF vs AVG vs CVC",
        emoji: "⚖️",
        content: `
          <h4>AVF（Arteriovenous Fistula）— 自體動靜脈瘻管</h4>
          <ul>
            <li>✅ Patency 最好（5年 primary patency 50-70%）</li>
            <li>✅ 感染率最低（自體組織）</li>
            <li>✅ 併發症最少、維護成本最低</li>
            <li>❌ 需 4-6 週成熟，maturation failure rate 20-60%</li>
          </ul>
          <h4>AVG（Arteriovenous Graft）— 人工血管</h4>
          <ul>
            <li>✅ 2-3 週就可以使用</li>
            <li>✅ 適合血管條件差的患者</li>
            <li>❌ Patency 較差（2年 primary patency ~30-40%）</li>
            <li>❌ Stenosis 和 thrombosis 發生率高（venous anastomosis）</li>
          </ul>
          <h4>CVC（Central Venous Catheter）— 中央靜脈導管</h4>
          <ul>
            <li>✅ 馬上可以用 — 急診救命用</li>
            <li>❌ 感染率最高（bacteremia 2-5 per 1000 catheter-days）</li>
            <li>❌ Central vein stenosis — 毀掉未來做 AVF/AVG 的機會</li>
            <li>❌ Mortality 比 AVF 高 2-3 倍</li>
            <li>只應該是<strong>過渡方案</strong></li>
          </ul>
          <h4>Fistula First 哲學與更新</h4>
          <p>NKF-KDOQI 2006 推 AVF 為首選（目標 prevalence &gt;65%）。但 2019 更新為 <strong>"Patient Life Plan"</strong>：不再教條式 AVF first，而是根據個別患者狀況選擇最適合的通路。</p>
          <h4>Rule of 6s — AVF 成熟標準</h4>
          <ul>
            <li><strong>Flow &gt;600 mL/min</strong>：HD 需要 pump speed 300-450，加上 recirculation 空間</li>
            <li><strong>Diameter &gt;6 mm</strong>：太細扎不穩、flow 不夠</li>
            <li><strong>Depth &lt;6 mm</strong>：太深護理師扎不進去</li>
            <li><strong>至少等 6 週</strong>：血管壁 arterialization（smooth muscle hypertrophy + 管壁增厚）</li>
          </ul>
        `,
      },
      {
        title: "解剖選擇與術前評估",
        emoji: "🦴",
        content: `
          <h4>位置選擇順序（distal → proximal）</h4>
          <ol>
            <li><strong>Radiocephalic（Brescia-Cimino）</strong>— 手腕，首選</li>
            <li><strong>Brachiocephalic</strong> — 肘部</li>
            <li><strong>Brachiobasilic</strong> — 需 transposition（兩次手術）</li>
            <li><strong>AVG</strong>（ePTFE loop）— 最後手段</li>
          </ol>
          <p><strong>為什麼從遠端開始？</strong>遠端失敗還可以往近端做，反過來不行。近端 AVF flow 大，steal syndrome 風險高。</p>
          <h4>術前評估</h4>
          <ul>
            <li><strong>Allen Test</strong>：壓住 radial + ulnar → 放開 ulnar → 看手掌有沒有紅回來。沒有 → 不能犧牲 radial artery</li>
            <li><strong>Vessel Mapping（超音波）</strong>：Artery &gt;2mm, Vein &gt;2.5mm。看 cephalic vein 有沒有通、有沒有 stenosis</li>
            <li>DM 患者血管常有鈣化 → 超音波評估更重要</li>
          </ul>
          <h4>⚠️ 血管保護</h4>
          <ul>
            <li>CKD Stage 3+ → non-dominant arm 不要抽血、不要打 IV</li>
            <li>避免 subclavian CVC → central vein stenosis 會毀掉同側所有通路</li>
            <li>放 CVC → 優先 internal jugular</li>
          </ul>
        `,
      },
      {
        title: "理學檢查（重點中的重點）",
        emoji: "🩺",
        content: `
          <h4>👀 Inspection — 看</h4>
          <ul>
            <li>AVF 走向和大小：有沒有 aneurysmal dilatation</li>
            <li>穿刺點：紅腫、結痂、感染跡象</li>
            <li>手指顏色：發紫/白/黑 → steal syndrome</li>
            <li>手臂腫脹 → venous outflow obstruction</li>
          </ul>
          <h4>🤚 Palpation — 摸（最重要）</h4>
          <ul>
            <li><strong>Thrill</strong>：正常 AVF 在 anastomosis 附近有持續性、柔軟、低頻振動</li>
            <li>Thrill 變成 pulse（搏動感）→ 有問題！</li>
          </ul>
          <h4>Pulse Augmentation Test</h4>
          <ul>
            <li>在 AVF 上游摸 thrill，另一手壓住下游</li>
            <li>正常：壓住後 thrill 增強（壓力升高）</li>
            <li>異常：壓住後 thrill 不變或消失 → 上游有 inflow problem</li>
            <li>簡單說：壓下游測上游、壓上游測下游</li>
          </ul>
          <h4>👂 Auscultation — 聽</h4>
          <ul>
            <li>正常：continuous bruit（收縮期 + 舒張期）— 低音調、像機器聲</li>
            <li>Stenosis：bruit 變高音調（high-pitched）、只剩收縮期</li>
            <li>原理：狹窄處流速加快 → 湍流增加 → 音調升高（跟心雜音同理）</li>
          </ul>
          <h4>⚡ Stenosis vs Thrombosis 鑑別</h4>
          <table>
            <thead><tr><th></th><th>Stenosis</th><th>Thrombosis</th></tr></thead>
            <tbody>
              <tr><td>Thrill</td><td>減弱、變 pulsatile</td><td>完全消失</td></tr>
              <tr><td>Bruit</td><td>高音調、systolic only</td><td>完全消失</td></tr>
              <tr><td>觸感</td><td>軟的</td><td>硬、cord-like</td></tr>
              <tr><td>發生速度</td><td>漸進式</td><td>突然</td></tr>
              <tr><td>處理</td><td>Angioplasty</td><td>Thrombectomy ± angioplasty</td></tr>
            </tbody>
          </table>
          <p><strong>關鍵概念</strong>：Stenosis → Thrombosis 是一個光譜。Stenosis 不處理 → flow 越來越差 → 最後 thrombosis。早期發現 stenosis → angioplasty → 避免失去通路。</p>
        `,
      },
      {
        title: "常見併發症",
        emoji: "⚠️",
        content: `
          <h4>Steal Syndrome（遠端肢體缺血）</h4>
          <ul>
            <li>機轉：AVF 的 low resistance circuit 把動脈血「偷」走，遠端灌流不足</li>
            <li>Risk factors：proximal AVF（brachial-based）、DM、PVD、老年</li>
            <li>分級：Grade 1（冷）→ 2（透析時痛）→ 3（持續痛）→ 4（組織壞死）</li>
            <li>處理：1-2 觀察保暖；3-4 手術（DRIL procedure 或 ligation）</li>
            <li><strong>DRIL</strong>（Distal Revascularization Interval Ligation）：結紮 AVF 近端 artery + bypass 繞過去供應遠端，保住 AVF 又恢復灌流</li>
          </ul>
          <h4>Aneurysm vs Pseudoaneurysm</h4>
          <table>
            <thead><tr><th></th><th>True Aneurysm</th><th>Pseudoaneurysm</th></tr></thead>
            <tbody>
              <tr><td>成因</td><td>血管壁擴張（三層都在）</td><td>穿刺處破裂，血液被組織包住</td></tr>
              <tr><td>觸感</td><td>軟、可壓縮</td><td>搏動感、tension 高</td></tr>
              <tr><td>風險</td><td>皮膚變薄 → 破裂</td><td>破裂風險更高</td></tr>
              <tr><td>預防</td><td colspan="2">Rope-ladder technique（輪流穿刺不同位置）避免反覆同點穿刺</td></tr>
            </tbody>
          </table>
          <h4>High-Output Heart Failure</h4>
          <ul>
            <li>少見但要知道。AVF flow &gt;1500-2000 mL/min → preload↑ → CO↑ → LV dilatation → HF</li>
            <li>特別在 proximal AVF 容易出現</li>
            <li>確認：<strong>Nicoladoni-Branham sign</strong> — 壓住 AVF → HR 下降、BP 上升</li>
            <li>處理：banding（縮小 anastomosis）或 ligation</li>
          </ul>
        `,
      },
      {
        title: "急診情境",
        emoji: "🚨",
        content: `
          <h4>情境 1：AVF 沒有 thrill — Acute Thrombosis</h4>
          <ol>
            <li>確認：真的沒有 thrill + bruit？觸診硬繩狀？</li>
            <li>評估：什麼時候開始的？之前有 stenosis 跡象嗎？</li>
            <li>緊急透析需求 → 先放 temporary CVC（right IJV preferred）</li>
            <li>通知血管外科/放射科：24-48h 內 intervention</li>
            <li>Catheter-directed thrombolysis → Percutaneous thrombectomy → 找到 underlying stenosis → angioplasty</li>
            <li>以上都失敗 → surgical thrombectomy ± revision</li>
          </ol>
          <h4>情境 2：AVF 出血壓不住</h4>
          <ol>
            <li><strong>精準加壓</strong>：兩根手指壓在穿刺點上（⚠️ 不要壓整條 AVF → 會造成 thrombosis！）</li>
            <li>壓 15-20 分鐘，不要一直掀開看</li>
            <li>還在流 → 縫合（fine suture on puncture site）</li>
            <li>大量出血 / pseudoaneurysm 破裂 → tourniquet proximal + 手術</li>
          </ol>
          <p><strong>重點</strong>：AVF 出血可以致命。HD 患者有 uremic platelet dysfunction + heparin → 止血更困難，要積極處理。</p>
        `,
      },
      {
        title: "What Would You Do?",
        emoji: "🧠",
        content: `
          <h4>Case 1：新建 Vascular Access</h4>
          <p>55M，DM 20年、HTN，eGFR 18（CKD 4）。Allen test 正常，左手 cephalic vein 超音波直徑 2.8mm，radial artery 2.2mm。</p>
          <p>→ <strong>Left radiocephalic AVF</strong>。遠端優先、血管條件 OK（vein &gt;2.5mm, artery &gt;2mm）。DM 患者要積極追蹤成熟度。</p>
          <h4>Case 2：透析 Flow 下降</h4>
          <p>68F，HD 5年，left brachiocephalic AVF。Pump flow 從 350 降到 250，venous pressure 高。Thrill 比以前弱，聽到 high-pitched systolic bruit。</p>
          <p>→ <strong>Venous outflow stenosis</strong>。安排 fistulography + angioplasty。不處理 → 進展到 thrombosis。</p>
          <h4>Case 3：早上起來沒 Thrill</h4>
          <p>75M，HD 8年，left radiocephalic AVF。今天早上 AVF 完全沒 thrill、沒 bruit，摸起來像硬繩子。明天透析日。</p>
          <p>→ <strong>Acute thrombosis</strong>。先放 temporary CVC 確保透析，24-48h 內安排 percutaneous thrombectomy + angioplasty，失敗則 surgical intervention。</p>
        `,
      },
    ],
    keyTakeaways: [
      "提早轉介 — eGFR <25 就該開始規劃 vascular access",
      "AVF 優先，但要個人化（Patient Life Plan），不再一味 fistula first",
      "Rule of 6s — Flow >600, Diameter >6mm, Depth <6mm, 6 weeks maturation",
      "理學檢查是核心技能 — 看（inspection）、摸（palpation）、聽（auscultation）就能診斷 80% 的問題",
      "Stenosis → Thrombosis 是一個光譜，早發現 stenosis → angioplasty → 避免失去通路",
      "Thrombosis 是急症 — 24-48h 黃金期",
      "AVF 出血可以致命 — 精準加壓穿刺點，不壓整條 AVF",
      "保護 CKD 患者的血管：non-dominant arm 不抽血、避免 subclavian CVC",
    ],
  },
};
