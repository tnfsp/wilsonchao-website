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
    subtitle: "「這個人為什麼要開刀？」",
    emoji: "🫀",
    duration: "45-60 分鐘",
    objectives: [
      "看懂 Echo 報告中 valve severity 的判斷標準",
      "看懂 Cath 報告的 stenosis 位置與嚴重度",
      "理解 CABG vs PCI 的決策邏輯（SYNTAX Score）",
      "學會使用 STS Score / EuroSCORE II 風險評估",
      "理解 TAVI vs SAVR 的現代決策流程",
      "知道 Heart Team 的概念與運作",
    ],
    sections: [
      {
        title: "Echo 報告判讀",
        emoji: "📋",
        content: `
          <p>三個一定要看的指標：<strong>LVEF</strong>（左心功能）、<strong>Wall motion</strong>（哪裡不動？對應哪條血管？）、<strong>Valve gradient / regurgitation severity</strong>。</p>
          <h4>Valve Severity Criteria</h4>
          <table>
            <thead><tr><th>Valve</th><th>Severe Criteria</th></tr></thead>
            <tbody>
              <tr><td>AS</td><td>AVA &lt;1.0 cm², mean PG &gt;40 mmHg, Vmax &gt;4 m/s</td></tr>
              <tr><td>AR</td><td>Vena contracta &gt;6mm, ERO &gt;0.3 cm²</td></tr>
              <tr><td>MS</td><td>MVA &lt;1.0 cm², mean PG &gt;10 mmHg</td></tr>
              <tr><td>MR</td><td>Vena contracta &gt;7mm, ERO &gt;0.4 cm², Regurgitant Vol &gt;60 mL</td></tr>
            </tbody>
          </table>
        `,
      },
      {
        title: "Cath 報告判讀",
        emoji: "📋",
        content: `
          <p>重點看：幾條塞？塞在哪？<strong>proximal</strong> 還是 distal？</p>
          <ul>
            <li><strong>Left Main</strong> — 一看到就要緊張</li>
            <li><strong>3VD（三條病變）</strong> — 尤其合併 DM</li>
            <li>Stenosis% 不是唯一依據 — 位置和範圍更重要</li>
          </ul>
        `,
      },
      {
        title: "風險評估 — STS Score & EuroSCORE II",
        emoji: "📊",
        content: `
          <p>不能只問「要不要開」，還要問「開了會不會活」。</p>
          <h4>STS Score</h4>
          <ul>
            <li>預測：mortality, morbidity, stroke, renal failure, infection, prolonged ventilation</li>
            <li><strong>Low risk</strong>: &lt;4% | <strong>Intermediate</strong>: 4-8% | <strong>High</strong>: &gt;8%</li>
          </ul>
          <h4>Frailty 評估</h4>
          <p>風險評分抓不到的：5-meter walk test、grip strength、albumin、independence。80 歲 EuroSCORE 8% 但每天跑步 → 跟同分的臥床老人完全不同。<strong>眼見為憑</strong>。</p>
        `,
      },
      {
        title: "CABG vs PCI",
        emoji: "⚖️",
        content: `
          <ul>
            <li><strong>SYNTAX Score</strong> — 解剖複雜度評分</li>
            <li>SYNTAX ≤22：PCI ≈ CABG</li>
            <li>SYNTAX &gt;22：CABG 勝出</li>
            <li>Left Main ≥50% → CABG（除非 SYNTAX ≤22 + 低風險）</li>
            <li>3VD + DM → CABG 有 survival benefit</li>
          </ul>
        `,
      },
      {
        title: "TAVI vs SAVR",
        emoji: "🔀",
        content: `
          <ul>
            <li><strong>Low risk (STS &lt;4%)</strong> → SAVR 或 TAVI 都行（shared decision）</li>
            <li><strong>Intermediate (STS 4-8%)</strong> → 兩者皆可，看解剖</li>
            <li><strong>High risk / 禁忌手術</strong> → TAVI</li>
            <li>年輕病人：TAVI valve 耐久性仍不如 SAVR</li>
          </ul>
        `,
      },
      {
        title: "Heart Team",
        emoji: "👥",
        content: `
          <p>複雜的心臟病，不是一個人決定。<strong>心臟外科 + 心臟內科 + 麻醉 + 影像</strong>。每週的內外科聯合討論會就是在做這件事。</p>
        `,
      },
    ],
    keyTakeaways: [
      "術前評估 = Echo/Cath 判讀 + 風險評分 + Frailty + Heart Team",
      "STS/EuroSCORE 是參考，不是判決",
      "AS 的決策現在是 TAVI vs SAVR，不只是開或不開",
    ],
  },

  hemodynamics: {
    title: "Module 2：Hemodynamic Monitoring",
    subtitle: "「三秒鐘看一眼 monitor，你看什麼？」",
    emoji: "📊",
    duration: "45-60 分鐘",
    objectives: [
      "知道 A-line、CVP、PA catheter 各量什麼",
      "理解 CVP 看趨勢而非絕對值",
      "學會用 Lactate 和 SvO₂ 判斷組織灌流",
      "鑑別四種 Shock type 的 hemodynamic pattern",
      "認識 Low Cardiac Output Syndrome",
      "理解 Vasopressor / Inotrope 的選擇邏輯",
    ],
    sections: [
      {
        title: "Invasive Monitoring",
        emoji: "🔴",
        content: `
          <h4>A-line</h4>
          <ul>
            <li><strong>MAP</strong> — 器官灌流指標，目標 &gt;65 mmHg</li>
            <li>Pulse pressure (SBP-DBP) — 越窄越擔心 CO 不夠</li>
          </ul>
          <h4>CVP</h4>
          <p>代表右心前負荷的<em>趨勢</em>。<strong>不代表</strong> volume status 的絕對值。看趨勢和對治療的反應。</p>
          <h4>PA Catheter (Swan-Ganz)</h4>
          <ul>
            <li>PAP — 肺動脈壓力</li>
            <li>PCWP — 反映 LVEDP（左心前負荷）</li>
            <li>CO / CI — 心輸出量</li>
            <li>SvO₂ — 混合靜脈血氧飽和度（正常 65-75%）</li>
          </ul>
        `,
      },
      {
        title: "Lactate — 組織灌流的代謝指標",
        emoji: "🧪",
        content: `
          <ul>
            <li>正常 &lt;2 mmol/L</li>
            <li>&gt;2 → 警訊 | &gt;4 → 嚴重，mortality 顯著上升</li>
            <li><strong>趨勢最重要</strong>：在降 → 治療有效 | 在升 → 灌流持續不足</li>
            <li>每次抽 ABG 都有 lactate — 養成習慣看</li>
          </ul>
        `,
      },
      {
        title: "Shock 鑑別",
        emoji: "💥",
        content: `
          <table>
            <thead><tr><th>Type</th><th>CVP</th><th>CO</th><th>SVR</th><th>Lactate</th><th>四肢</th></tr></thead>
            <tbody>
              <tr><td>Cardiogenic</td><td>↑</td><td>↓</td><td>↑</td><td>↑</td><td>🥶 冷</td></tr>
              <tr><td>Hypovolemic</td><td>↓</td><td>↓</td><td>↑</td><td>↑</td><td>🥶 冷</td></tr>
              <tr><td>Vasodilatory</td><td>↓/N</td><td>↑/N</td><td>↓</td><td>±</td><td>🔥 暖</td></tr>
              <tr><td>Obstructive</td><td>↑↑</td><td>↓↓</td><td>↑</td><td>↑↑</td><td>🥶 冷</td></tr>
            </tbody>
          </table>
        `,
      },
      {
        title: "Low Cardiac Output Syndrome",
        emoji: "💔",
        content: `
          <p>心外術後<strong>最常見也最危險</strong>的問題。</p>
          <ul>
            <li>CI &lt;2.2 L/min/m²、SvO₂ &lt;60%、Lactate 上升</li>
            <li>末梢冷、尿量減少、意識改變</li>
            <li>MAP 不一定低（SVR 代償性升高）</li>
          </ul>
          <h4>處理邏輯</h4>
          <ol>
            <li>排除可逆原因：Tamponade、Tension PTX、Graft failure</li>
            <li>優化 preload</li>
            <li>Inotrope：Dobutamine（首選）或 Milrinone（高 SVR / RV failure）</li>
            <li>仍不夠 → MCS（IABP → ECMO）</li>
          </ol>
        `,
      },
      {
        title: "Vasopressor / Inotrope 邏輯",
        emoji: "💉",
        content: `
          <table>
            <thead><tr><th>情境</th><th>首選</th><th>邏輯</th></tr></thead>
            <tbody>
              <tr><td>Low CO + 高 SVR</td><td>Milrinone</td><td>降後負荷 + 強心</td></tr>
              <tr><td>Low CO + 低 SVR</td><td>Dobutamine + NE</td><td>強心 + 撐血壓</td></tr>
              <tr><td>Vasoplegia</td><td>NE + Vasopressin</td><td>血管收縮</td></tr>
              <tr><td>RV failure</td><td>Milrinone ± iNO</td><td>降 PVR</td></tr>
            </tbody>
          </table>
        `,
      },
    ],
    keyTakeaways: [
      "三秒看 monitor：MAP → CVP trend → Lactate",
      "Lactate 是你的好朋友 — BP 會騙人，Lactate 不會",
      "Low CO Syndrome = 心外術後最常見的問題，早認早治",
      "Shock type 決定用藥邏輯",
    ],
  },

  ventilator: {
    title: "Module 3：呼吸器",
    subtitle: "「術後 4 小時，病人 fighting vent」",
    emoji: "🌬️",
    duration: "40-50 分鐘",
    objectives: [
      "知道 VC/PC/PS 各自適用場景",
      "處理 Fighting Vent 的決策樹",
      "學會用 RSBI 預測拔管成功率",
      "ABG 判讀 + compensation 公式",
      "心外術後特有問題：phrenic nerve injury、flash pulmonary edema",
    ],
    sections: [
      {
        title: "Mode 的臨床選擇",
        emoji: "⚙️",
        content: `
          <table>
            <thead><tr><th>Mode</th><th>什麼時候用</th></tr></thead>
            <tbody>
              <tr><td>VC (Volume Control)</td><td>術後剛回來、還沒醒</td></tr>
              <tr><td>PC (Pressure Control)</td><td>肺比較差、需要限壓</td></tr>
              <tr><td>PS (Pressure Support)</td><td>準備拔管、讓病人練習</td></tr>
              <tr><td>SIMV</td><td>過渡、逐步撤離</td></tr>
            </tbody>
          </table>
          <h4>心外術後起始設定</h4>
          <p>TV: 6-8 mL/kg IBW | RR: 12-16 | FiO₂: 100% → 快速調降 | PEEP: 5 cmH₂O</p>
        `,
      },
      {
        title: "Fighting Vent — 怎麼處理？",
        emoji: "😤",
        content: `
          <p><strong>不要只給 sedation！先找原因。</strong></p>
          <ol>
            <li>致命的先排除：Tension PTX、Tamponade、PE</li>
            <li>管路問題：ET tube 移位、打折、mucus plug → 聽診 + suction</li>
            <li>設定問題：flow 不夠、trigger 太鈍、auto-PEEP</li>
            <li>病人問題：疼痛、膀胱脹、焦慮、缺氧、高碳酸</li>
          </ol>
        `,
      },
      {
        title: "Weaning & RSBI",
        emoji: "🎯",
        content: `
          <h4>拔管條件</h4>
          <ul>
            <li>Hemodynamic stable、Awake、P/F &gt;200, FiO₂ ≤40%</li>
            <li><strong>RSBI (f/VT) &lt;105</strong> — 最有實證的拔管預測指標</li>
            <li>通過 SBT → 拔！不要拖</li>
          </ul>
          <h4>RSBI 計算</h4>
          <p>f = 呼吸次數, VT = 潮氣容積 (L)。例：RR 25, VT 0.3L → RSBI = 83 ✅ | RR 35, VT 0.2L → RSBI = 175 ❌</p>
        `,
      },
      {
        title: "ABG 判讀 + Compensation",
        emoji: "🧪",
        content: `
          <p>口訣：pH → PCO₂ → HCO₃ → AG → compensation 夠不夠？</p>
          <ul>
            <li><strong>Metabolic acidosis</strong>：Winter's formula — 預期 PCO₂ = 1.5 × [HCO₃] + 8 ± 2</li>
            <li><strong>Metabolic alkalosis</strong>：預期 PCO₂ = 0.7 × [HCO₃] + 21 ± 2</li>
            <li><strong>Respiratory acidosis (acute)</strong>：每 PCO₂ ↑10 → HCO₃ ↑1</li>
            <li><strong>Respiratory acidosis (chronic)</strong>：每 PCO₂ ↑10 → HCO₃ ↑3.5</li>
          </ul>
        `,
      },
    ],
    keyTakeaways: [
      "Fighting vent → 先找原因再 sedate，致命的先排除",
      "RSBI &lt;105 = 可以試拔管",
      "ABG 的 compensation 公式要會算",
      "Phrenic nerve injury 是心外特有的 weaning 失敗原因",
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

  cabg: {
    title: "選修 A：CABG 全攻略",
    subtitle: "從 Cath 到 Close",
    emoji: "🔧",
    duration: "40-50 分鐘",
    objectives: [
      "CABG indication 確認（3VD + DM, SYNTAX >22）",
      "Conduit 選擇與 patency rate",
      "LIMA → LAD 黃金法則",
      "On-pump vs Off-pump (OPCAB)",
      "術後 ICU Day 0-2 照護重點",
    ],
    sections: [
      {
        title: "Conduit 選擇",
        emoji: "🩸",
        content: `
          <table>
            <thead><tr><th>Conduit</th><th>10-yr Patency</th><th>備註</th></tr></thead>
            <tbody>
              <tr><td><strong>LIMA</strong></td><td>~95%</td><td>黃金標準 → LAD</td></tr>
              <tr><td>RIMA</td><td>~90%</td><td>Bilateral IMA → sternal wound risk</td></tr>
              <tr><td>SVG</td><td>~60%</td><td>最常用、容易取</td></tr>
              <tr><td>Radial</td><td>~80%</td><td>要 Allen test</td></tr>
            </tbody>
          </table>
        `,
      },
      {
        title: "手術大步驟",
        emoji: "🔪",
        content: `
          <ol>
            <li>Sternotomy — 打開胸骨</li>
            <li>Harvesting — 取 LIMA + SVG</li>
            <li>Cannulation — 接上 CPB</li>
            <li>Cross clamp — 停心、cardioplegia</li>
            <li>Anastomosis — 接血管（distal → proximal）</li>
            <li>Weaning CPB — 讓心臟重新跳</li>
            <li>Close — 鋼絲固定胸骨</li>
          </ol>
        `,
      },
      {
        title: "On-pump vs Off-pump (OPCAB)",
        emoji: "💬",
        content: `
          <ul>
            <li><strong>On-pump</strong>（傳統）：用 CPB，心臟停下來縫 → 視野好、穩定</li>
            <li><strong>Off-pump (OPCAB)</strong>：心臟跳著縫 → 不需要 CPB，避免全身發炎</li>
            <li>OPCAB 挑戰：技術難度高、不是每個病人都適合</li>
            <li>台灣大部分仍以 on-pump 為主流</li>
          </ul>
        `,
      },
    ],
    keyTakeaways: [
      "LIMA → LAD 是心外最重要的一條 graft",
      "CABG vs PCI 看 SYNTAX Score + 合併症",
      "OPCAB 是替代方案但非主流",
    ],
  },

  valve: {
    title: "選修 B：Valve Surgery",
    subtitle: "Repair or Replace?",
    emoji: "🔄",
    duration: "50-60 分鐘",
    objectives: [
      "Valve severity grading",
      "區分 Degenerative vs Functional MR",
      "TAVR vs SAVR 的現代決策",
      "AR 手術 timing",
      "Mechanical vs Bioprosthetic valve 的選擇",
      "IE 手術指徵",
    ],
    sections: [
      {
        title: "Degenerative vs Functional MR",
        emoji: "🔍",
        content: `
          <table>
            <thead><tr><th></th><th>Degenerative (Primary)</th><th>Functional (Secondary)</th></tr></thead>
            <tbody>
              <tr><td>原因</td><td>瓣膜本身壞了（prolapse, flail）</td><td>心臟擴大拉扯瓣膜</td></tr>
              <tr><td>手術</td><td>Repair 首選！成功率 &gt;95%</td><td>Repair 效果差，常復發</td></tr>
              <tr><td>預後</td><td>修好 = 治好</td><td>根本問題是心臟</td></tr>
            </tbody>
          </table>
        `,
      },
      {
        title: "TAVR vs SAVR",
        emoji: "🔀",
        content: `
          <table>
            <thead><tr><th></th><th>SAVR</th><th>TAVR</th></tr></thead>
            <tbody>
              <tr><td>方式</td><td>Sternotomy + CPB</td><td>經 femoral artery</td></tr>
              <tr><td>住院</td><td>7-10 天</td><td>2-3 天</td></tr>
              <tr><td>耐久性</td><td>長</td><td>較短（持續進步中）</td></tr>
              <tr><td>Pacemaker 風險</td><td>低 (~3%)</td><td>較高 (~10-20%)</td></tr>
            </tbody>
          </table>
          <p>Low risk + 年輕 → 傾向 SAVR | High risk → TAVR</p>
        `,
      },
      {
        title: "AR 手術 Timing",
        emoji: "⏰",
        content: `
          <ul>
            <li>Symptomatic severe AR → 開</li>
            <li>Asymptomatic + LVEF &lt;55% 或 LVESD &gt;50mm → 開</li>
            <li>AR 是 volume overload → LV 慢慢擴大 → 等到有症狀可能太晚</li>
          </ul>
        `,
      },
    ],
    keyTakeaways: [
      "MR 能 repair 就 repair（Degenerative）",
      "AS 的決策是 TAVR vs SAVR，不只是開或不開",
      "AR 不能等到有症狀才開 — LV 擴大是不可逆的",
    ],
  },

  cpb: {
    title: "選修 C：CPB & Myocardial Protection",
    subtitle: "「人類怎麼學會停住心臟」",
    emoji: "❄️",
    duration: "40-50 分鐘",
    objectives: [
      "CPB circuit 基本組成",
      "Heparin / ACT / Protamine 的角色",
      "Cardioplegia 種類與給予方式",
      "CPB 對全身的影響",
      "Weaning CPB 的關鍵時刻",
    ],
    sections: [
      {
        title: "Heparin / ACT / Protamine",
        emoji: "💉",
        content: `
          <ul>
            <li><strong>Heparin</strong>：上 CPB 前打 → 防止血在管路裡凝固</li>
            <li><strong>ACT</strong>：目標 &gt;480 秒</li>
            <li><strong>Protamine</strong>：下 CPB 後打 → 中和 heparin</li>
            <li>⚠️ Protamine 可能引起低血壓、過敏、肺高壓</li>
            <li>術後流血不止？→ 查 ACT，可能 heparin 沒完全中和</li>
          </ul>
        `,
      },
      {
        title: "Cardioplegia 種類",
        emoji: "❄️",
        content: `
          <table>
            <thead><tr><th>種類</th><th>特色</th></tr></thead>
            <tbody>
              <tr><td>Blood cardioplegia</td><td>最常用，含氧能力好，每 15-20 min 重給</td></tr>
              <tr><td>Crystalloid</td><td>經典（St. Thomas, HTK），簡單但保護力稍弱</td></tr>
              <tr><td>del Nido</td><td>一次給可維持 60-90 min，小兒常用，成人越來越流行</td></tr>
            </tbody>
          </table>
        `,
      },
      {
        title: "CPB 對身體的影響",
        emoji: "⚠️",
        content: `
          <ul>
            <li><strong>SIRS</strong> — 血液碰到人工管路 → 全身發炎</li>
            <li><strong>Coagulopathy</strong> — 血小板消耗 + hemodilution</li>
            <li><strong>Hemodilution</strong> — 管路要 prime fluid</li>
            <li>為什麼術後病人會「腫一圈」→ capillary leak</li>
          </ul>
        `,
      },
    ],
    keyTakeaways: [
      "Heparin → CPB → Protamine，ACT 是關鍵監測",
      "Cross clamp time = 心臟缺血時間 → 越短越好",
      "術後凝血異常：先查 ACT → Plt → Fibrinogen → TEG",
    ],
  },

  mcs: {
    title: "選修 D：Mechanical Circulatory Support",
    subtitle: "「凌晨三點，cardiogenic shock call in」",
    emoji: "⚡",
    duration: "50-60 分鐘",
    objectives: [
      "MCS 光譜：IABP → Impella → ECMO → ECpella → VAD → Transplant",
      "IABP 原理、禁忌、併發症",
      "Impella 的角色與優勢",
      "VA-ECMO 的觸發條件與併發症",
      "LV distension 與 venting 策略",
      "ECMO weaning 概念",
    ],
    sections: [
      {
        title: "IABP",
        emoji: "🎈",
        content: `
          <ul>
            <li>原理：Diastolic augmentation + Systolic unloading</li>
            <li>效果：CO 增加 ~0.5 L/min（modest）</li>
            <li>禁忌：severe AR、aortic dissection、severe PVD</li>
            <li>Complication：limb ischemia（每小時檢查足背脈搏）</li>
          </ul>
        `,
      },
      {
        title: "Impella",
        emoji: "⚡",
        content: `
          <p>微型軸流幫浦 — 直接從 LV 把血抽到 aorta。</p>
          <ul>
            <li>Impella CP: ~3.5 L/min（經 femoral）</li>
            <li>Impella 5.0/5.5: ~5 L/min（經 axillary, 需 cut-down）</li>
            <li>最大優勢：直接 unload LV → 降低心肌氧耗</li>
          </ul>
        `,
      },
      {
        title: "VA-ECMO & LV Venting",
        emoji: "🔴",
        content: `
          <p>觸發：SBP &lt;80 on max inotrope + malperfusion signs</p>
          <h4>LV Distension 處理</h4>
          <ul>
            <li>IABP + ECMO：IABP 降 afterload</li>
            <li>ECpella：Impella + ECMO，最有效的 LV unloading</li>
            <li>Surgical vent（atrial septostomy / LV vent）</li>
          </ul>
        `,
      },
      {
        title: "Anticoagulation",
        emoji: "💊",
        content: `
          <ul>
            <li>ECMO：Heparin drip, aPTT 60-80 sec</li>
            <li>永恆的拉鋸：太多 → 出血 | 太少 → blood clot</li>
            <li>每天：ACT/aPTT + Plt + Fibrinogen + Hemolysis markers</li>
          </ul>
        `,
      },
    ],
    keyTakeaways: [
      "MCS 光譜：IABP → Impella → ECMO → ECpella → VAD",
      "Impella 直接 unload LV，IABP 只間接幫忙",
      "ECMO 最大問題：LV distension → 需要 venting 策略",
      "Anticoagulation 是永恆的 bleeding vs clotting 拉鋸",
    ],
  },

  aortic: {
    title: "選修 E：Aortic Surgery",
    subtitle: "「最刺激的急診」",
    emoji: "🚨",
    duration: "50-60 分鐘",
    objectives: [
      "Aortic dissection 的 ER 初始 workup",
      "Stanford + DeBakey classification",
      "年輕 dissection → 想到 Marfan / 結締組織疾病",
      "CT 判讀：true vs false lumen、malperfusion",
      "DHCA 的概念與代價",
      "Type B：uncomplicated vs complicated + TEVAR",
    ],
    sections: [
      {
        title: "ER 初始 Workup",
        emoji: "🏥",
        content: `
          <ol>
            <li>ECG — 排除 STEMI</li>
            <li>CXR — widened mediastinum?</li>
            <li>Bedside Echo — pericardial effusion? AR?</li>
            <li>兩手量血壓 — 差 &gt;20mmHg → branch involvement</li>
            <li>CT Angiography（確診）</li>
          </ol>
        `,
      },
      {
        title: "Classification",
        emoji: "📋",
        content: `
          <h4>Stanford</h4>
          <p>Type A（涉及 ascending）→ 緊急手術 | Type B（只有 descending）→ 先 medical</p>
          <h4>DeBakey</h4>
          <ul>
            <li>Type I = Ascending → Arch → Descending（= Stanford A）</li>
            <li>Type II = 只有 Ascending（= Stanford A）</li>
            <li>Type III = 只有 Descending（= Stanford B）</li>
          </ul>
        `,
      },
      {
        title: "Marfan & 結締組織疾病",
        emoji: "🧬",
        content: `
          <p>40 歲 dissection → 第一個問題：「有沒有 Marfan?」</p>
          <ul>
            <li>Marfan、Loeys-Dietz、Ehlers-Danlos (vascular type)</li>
            <li>影響手術策略：Bentall + aggressive arch repair</li>
            <li>影響追蹤：終身 CT 追蹤 + 家族篩檢 + 遺傳諮詢</li>
          </ul>
        `,
      },
      {
        title: "DHCA & Type B / TEVAR",
        emoji: "⏰",
        content: `
          <h4>DHCA (Deep Hypothermic Circulatory Arrest)</h4>
          <p>體溫降到 18-20°C → 停止所有循環 → 腦靠低溫保護。安全時間約 30-40 分鐘。代價：coagulopathy。</p>
          <h4>Type B: Complicated → TEVAR</h4>
          <p>Complicated = malperfusion、rupture、rapid expansion、refractory pain。TEVAR = 經 femoral 放 stent graft → 蓋住 entry tear。</p>
        `,
      },
    ],
    keyTakeaways: [
      "Type A = 每小時死亡率 1-2% → 立即手術",
      "年輕 dissection → 問 Marfan",
      "DeBakey 和 Stanford 兩套都要會",
      "Complicated Type B → TEVAR 是現代標準",
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
};
