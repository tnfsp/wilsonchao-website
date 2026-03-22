interface SlideData {
  title: string;
  subtitle: string;
  html: string;
}

export const slides: Record<string, SlideData> = {
  "preop-assessment": {
    title: "Module 1：術前評估",
    subtitle: "「這個人為什麼要開刀？」",
    html: `
<!-- Title -->
<section data-background-color="#001219">
  <div class="emoji-big">🫀</div>
  <h1>術前評估</h1>
  <p class="subtitle">「這個人為什麼要開刀？」</p>
  <p class="author">Wilson Chao — 高醫心臟外科</p>
</section>

<!-- Hook -->
<section data-background-color="#001219">
  <p class="hook">💬 拿一份真的 Echo + Cath 報告<br/>「告訴我這個人需不需要開刀，為什麼？」</p>
</section>

<!-- Echo -->
<section>
  <section data-background-color="#001219">
    <h2>📋 Echo 報告怎麼讀</h2>
    <ul>
      <li><span class="highlight">LVEF</span> — 左心功能的第一個數字</li>
      <li><span class="highlight">Wall motion</span> — 哪裡不動？對應哪條血管？</li>
      <li><span class="highlight">Valve gradient / regurgitation severity</span></li>
      <li>不是每個數字都重要，但這三個一定要看</li>
    </ul>
  </section>

  <section data-background-color="#001219">
    <h2>Valve Severity Criteria</h2>
    <table>
      <tr><th>Valve</th><th>Severe Criteria</th></tr>
      <tr><td>AS</td><td>AVA &lt;1.0 cm², mean PG &gt;40 mmHg, Vmax &gt;4 m/s</td></tr>
      <tr><td>AR</td><td>Vena contracta &gt;6mm, ERO &gt;0.3 cm²</td></tr>
      <tr><td>MS</td><td>MVA &lt;1.0 cm², mean PG &gt;10 mmHg</td></tr>
      <tr><td>MR</td><td>Vena contracta &gt;7mm, ERO &gt;0.4 cm², Regurgitant Vol &gt;60 mL</td></tr>
    </table>
  </section>

  <section data-background-color="#001219">
    <h3>💬 Mini-Case：Echo 判讀</h3>
    <p>75M, Echo 顯示：LVEF 35%, severe AS (AVA 0.7), moderate MR</p>
    <ul>
      <li class="fragment">AS 是 severe — 符合手術標準嗎？</li>
      <li class="fragment">LVEF 35% — 這影響你的決策嗎？</li>
      <li class="fragment">MR 要一起處理嗎？</li>
    </ul>
  </section>
</section>

<!-- Cath -->
<section data-background-color="#001219">
  <h2>📋 Cath 報告怎麼讀</h2>
  <ul>
    <li>幾條塞？塞在哪？<span class="highlight">proximal</span> 還是 distal？</li>
    <li class="fragment"><span class="danger">Left Main</span> — 一看到就要緊張</li>
    <li class="fragment"><span class="danger">三條病變 (3VD)</span> — 尤其合併 DM</li>
    <li class="fragment">Stenosis% 不是唯一依據 — 位置和範圍更重要</li>
  </ul>
</section>

<!-- Risk Scoring -->
<section>
  <section data-background-color="#001219">
    <h2>📊 風險評估 — 術前必做</h2>
    <p>不能只問「要不要開」，還要問「開了會不會活」</p>
  </section>

  <section data-background-color="#001219">
    <h3>STS Score</h3>
    <ul>
      <li><span class="highlight">Society of Thoracic Surgeons Risk Calculator</span></li>
      <li class="fragment">預測：mortality, morbidity, stroke, renal failure, infection, prolonged ventilation</li>
      <li class="fragment">變數：年齡、性別、BMI、DM、COPD、renal function、LVEF、手術類型…</li>
      <li class="fragment"><span class="highlight">Low risk</span>: &lt;4% | <span class="highlight">Intermediate</span>: 4-8% | <span class="danger">High</span>: &gt;8%</li>
    </ul>
  </section>

  <section data-background-color="#001219">
    <h3>EuroSCORE II</h3>
    <ul>
      <li>歐洲常用，跟 STS 類似但變數不同</li>
      <li class="fragment">兩個都算，互相參照</li>
      <li class="fragment">⚠️ 風險評分是<strong>參考</strong>，不是判決 — 分數高不代表不能開</li>
    </ul>
  </section>

  <section data-background-color="#001219">
    <h3>Frailty 評估</h3>
    <ul>
      <li>風險評分 catch 不到的東西：<span class="highlight">Frailty</span></li>
      <li class="fragment">5-meter walk test、grip strength、albumin、independence</li>
      <li class="fragment">80 歲 EuroSCORE 8%，但每天跑步 → 跟同分的臥床老人完全不同</li>
      <li class="fragment"><span class="highlight">眼見為憑</span>：病人走進來的樣子，比任何分數都重要</li>
    </ul>
  </section>
</section>

<!-- CABG vs PCI -->
<section>
  <section data-background-color="#001219">
    <h2>⚖️ CABG vs PCI</h2>
    <p>不是「塞了就開」</p>
    <ul>
      <li class="fragment"><span class="highlight">SYNTAX Score</span> — 解剖複雜度</li>
      <li class="fragment">SYNTAX ≤22：PCI ≈ CABG</li>
      <li class="fragment">SYNTAX &gt;22：<span class="success">CABG 勝出</span></li>
      <li class="fragment"><span class="danger">LM + 3VD + DM</span> → CABG 有 survival benefit</li>
    </ul>
  </section>

  <section data-background-color="#001219">
    <h2>快速決策樹</h2>
    <ul>
      <li>Left Main ≥50% → 🔧 <span class="highlight">CABG</span>（除非 SYNTAX ≤22 + 低風險）</li>
      <li>3VD + DM → 🔧 <span class="highlight">CABG</span></li>
      <li>1-2VD, non-proximal LAD → 💊 <span class="success">PCI</span></li>
      <li>3VD, low SYNTAX → 討論</li>
    </ul>
  </section>
</section>

<!-- Valve Surgery Indication + TAVI -->
<section>
  <section data-background-color="#001219">
    <h2>🔄 Valve：什麼時候要開刀？</h2>
    <ul>
      <li><span class="highlight">Symptomatic</span> + Severe → 開</li>
      <li class="fragment"><span class="highlight">Asymptomatic</span> + Severe → 看條件
        <ul>
          <li>LVEF &lt;50%</li>
          <li>LVESD &gt;40mm (MR)</li>
          <li>快速惡化</li>
        </ul>
      </li>
      <li class="fragment">Repair vs Replace：MV 能 repair 盡量 repair</li>
    </ul>
  </section>

  <section data-background-color="#001219">
    <h2>🔀 AS 的現代決策：TAVI vs SAVR</h2>
    <ul>
      <li>不再是「開刀 or 不開刀」— 現在是「怎麼開」</li>
      <li class="fragment"><span class="highlight">Low risk (STS &lt;4%)</span> → SAVR 或 TAVI 都行（shared decision）</li>
      <li class="fragment"><span class="highlight">Intermediate (STS 4-8%)</span> → 兩者皆可，看解剖</li>
      <li class="fragment"><span class="danger">High risk / 禁忌手術</span> → TAVI</li>
      <li class="fragment">⚠️ 年輕病人：TAVI valve 耐久性仍不如 SAVR</li>
    </ul>
  </section>
</section>

<!-- Heart Team -->
<section data-background-color="#001219">
  <h2>👥 Heart Team</h2>
  <p>複雜的心臟病，不是一個人決定</p>
  <ul>
    <li class="fragment"><span class="highlight">心臟外科</span> + <span class="highlight">心臟內科</span> + 麻醉 + 影像</li>
    <li class="fragment">每個禮拜的<strong>內外科聯合討論會</strong>就是在做這件事</li>
    <li class="fragment">Guideline 建議 Heart Team 討論的情境：
      <ul>
        <li>Left Main disease</li>
        <li>TAVI vs SAVR 抉擇</li>
        <li>High-risk patients</li>
      </ul>
    </li>
  </ul>
</section>

<!-- Framework -->
<section data-background-color="#001219">
  <h2>🧠 思考框架</h2>
  <p style="text-align:center; font-size:1.1em;">
    <span class="fragment">病人坐在你面前</span><br/>
    <span class="fragment">→ Echo/Cath 告訴你什麼</span><br/>
    <span class="fragment">→ STS/EuroSCORE 風險多高</span><br/>
    <span class="fragment">→ Frailty — 這個<span class="highlight">「人」</span>撐得住嗎</span><br/>
    <span class="fragment">→ Heart Team 一起決定最佳策略</span>
  </p>
</section>

<!-- What Would You Do -->
<section data-background-color="#001219">
  <h2>❓ What Would You Do?</h2>
  <ol>
    <li class="fragment">70F, severe AS, AVA 0.8, asymptomatic, LVEF 65%, STS 2.5%<br/><small>→ 開不開？TAVI or SAVR？</small></li>
    <li class="fragment">55M, 3VD + DM, SYNTAX 28, LVEF 45%<br/><small>→ CABG or PCI？</small></li>
    <li class="fragment">80M, severe MR, LVEF 30%, STS 12%, frail, walks with walker<br/><small>→ 你怎麼跟家屬談？</small></li>
  </ol>
</section>
`,
  },

  hemodynamics: {
    title: "Module 2：Hemodynamic Monitoring",
    subtitle: "「三秒鐘看一眼 monitor，你看什麼？」",
    html: `
<section data-background-color="#001219">
  <div class="emoji-big">📊</div>
  <h1>Hemodynamic Monitoring</h1>
  <p class="subtitle">「三秒鐘看一眼 monitor，你看什麼？」</p>
  <p class="author">Wilson Chao — 高醫心臟外科</p>
</section>

<section data-background-color="#001219">
  <p class="hook">💬 ICU 巡房，床邊一堆數字在跳<br/>你只有三秒，要看哪裡？</p>
</section>

<!-- Invasive: A-line -->
<section>
  <section data-background-color="#001219">
    <h2>🔴 Invasive Monitoring</h2>
    <h3>A-line / ABP</h3>
    <ul>
      <li><span class="highlight">MAP</span> — 器官灌流的指標，目標 &gt;65 mmHg</li>
      <li>Waveform 看趨勢，不是盯單一數字</li>
      <li>Pulse pressure (SBP-DBP) — 越窄越擔心 CO 不夠</li>
    </ul>
  </section>

  <section data-background-color="#001219">
    <h3>CVP</h3>
    <ul>
      <li>代表：右心前負荷的<em>趨勢</em></li>
      <li class="fragment"><span class="danger">不代表</span>：volume status 的絕對值</li>
      <li class="fragment">單一數字沒意義，看<span class="highlight">趨勢</span>和<span class="highlight">對治療的反應</span></li>
    </ul>
  </section>

  <section data-background-color="#001219">
    <h3>PA Catheter (Swan-Ganz)</h3>
    <ul>
      <li><span class="highlight">PAP</span> — 肺動脈壓力</li>
      <li><span class="highlight">PCWP</span> — 反映 LVEDP（左心前負荷）</li>
      <li><span class="highlight">CO / CI</span> — 心輸出量</li>
      <li><span class="highlight">SVR / PVR</span> — 阻力</li>
      <li><span class="highlight">SvO₂</span> — 混合靜脈血氧飽和度（組織有沒有得到足夠的氧）</li>
    </ul>
  </section>

  <section data-background-color="#001219">
    <h3>SvO₂ / ScvO₂ — 組織灌流的指標</h3>
    <ul>
      <li><span class="highlight">SvO₂</span>（PA catheter）正常 65-75%</li>
      <li><span class="highlight">ScvO₂</span>（CVP line 可抽）正常 &gt;70%</li>
      <li class="fragment">SvO₂ &lt;60% → 組織在缺氧 → CO 不夠或氧氣消耗太多</li>
      <li class="fragment">配合 <span class="highlight">Lactate</span> 一起看，更完整</li>
    </ul>
  </section>
</section>

<!-- Lactate -->
<section data-background-color="#001219">
  <h2>🧪 Lactate — 灌流不足的代謝指標</h2>
  <ul>
    <li><span class="highlight">正常 &lt;2 mmol/L</span></li>
    <li class="fragment">&gt;2 → 組織缺氧或灌流不足的警訊</li>
    <li class="fragment">&gt;4 → <span class="danger">嚴重</span>，mortality 顯著上升</li>
    <li class="fragment"><span class="highlight">趨勢最重要</span>：在降 → 治療有效 | 在升 → 灌流持續不足</li>
    <li class="fragment">每次抽 ABG 都有 lactate — 養成習慣看</li>
  </ul>
  <p class="fragment" style="font-size:0.85em;">💬 <strong>Mini-Case</strong>：術後 6hr, BP 100/60 看起來還行，但 lactate 從 2.1 → 3.8 → 5.2<br/>→ BP 騙人，組織在缺氧。你要找原因。</p>
</section>

<!-- Non-invasive -->
<section>
  <section data-background-color="#001219">
    <h2>🟢 Non-invasive Monitoring</h2>
    <h3>FloTrac / EV1000</h3>
    <ul>
      <li>一句話：<span class="highlight">Pulse contour 估 SV</span></li>
      <li>臨床重點：<span class="highlight">SVV</span> — volume responsive?</li>
      <li class="fragment"><span class="danger">什麼時候不準</span>：arrhythmia、open chest、severe vasoplegia</li>
    </ul>
  </section>

  <section data-background-color="#001219">
    <h3>POCUS</h3>
    <ul>
      <li><span class="highlight">IVC</span> — collapsibility → volume status</li>
      <li><span class="highlight">Lung US</span> — B-lines = 肺水腫</li>
      <li><span class="highlight">Focused cardiac</span> — function, effusion</li>
    </ul>
  </section>

  <section data-background-color="#001219">
    <h3>🫀 心超在心外 ICU</h3>
    <ul>
      <li>LV function — EF、wall motion</li>
      <li class="fragment"><span class="danger">Pericardial effusion / Tamponade</span> — 術後最怕的</li>
      <li class="fragment">RV function — TAPSE、RV FAC（術後 RV failure 早期偵測）</li>
      <li class="fragment">Valve function — 術後新的 regurgitation?</li>
      <li class="fragment">Volume responsiveness — SV variation with PLR</li>
    </ul>
  </section>
</section>

<!-- Shock -->
<section>
  <section data-background-color="#001219">
    <h2>💥 Shock 鑑別</h2>
    <table>
      <tr><th>Type</th><th>CVP</th><th>CO</th><th>SVR</th><th>Lactate</th><th>四肢</th></tr>
      <tr><td>Cardiogenic</td><td>↑</td><td>↓</td><td>↑</td><td>↑</td><td>🥶 冷</td></tr>
      <tr><td>Hypovolemic</td><td>↓</td><td>↓</td><td>↑</td><td>↑</td><td>🥶 冷</td></tr>
      <tr><td>Vasodilatory</td><td>↓/N</td><td>↑/N</td><td>↓</td><td>±</td><td>🔥 暖</td></tr>
      <tr class="fragment"><td><span class="danger">Obstructive</span></td><td>↑↑</td><td>↓↓</td><td>↑</td><td>↑↑</td><td>🥶 冷</td></tr>
    </table>
  </section>

  <section data-background-color="#001219">
    <h2>⚠️ 術後 Tamponade</h2>
    <p><span class="danger">= Obstructive Shock</span></p>
    <ul>
      <li class="fragment">低血壓 + JVP 升高 + 心音變小</li>
      <li class="fragment">Chest tube output 突然減少（不是好事！可能塞住了）</li>
      <li class="fragment">Echo：pericardial collection + diastolic collapse</li>
      <li class="fragment">→ <span class="danger">Re-explore</span></li>
    </ul>
  </section>
</section>

<!-- Low CO Syndrome -->
<section>
  <section data-background-color="#001219">
    <h2>💔 Low Cardiac Output Syndrome</h2>
    <p>心外術後<span class="danger">最常見也最危險</span>的問題</p>
  </section>

  <section data-background-color="#001219">
    <h3>怎麼認出來？</h3>
    <ul>
      <li class="fragment"><span class="danger">CI &lt;2.2 L/min/m²</span></li>
      <li class="fragment">SvO₂ &lt;60%、Lactate 上升</li>
      <li class="fragment">末梢冷、尿量減少、意識改變</li>
      <li class="fragment">MAP 不一定低（SVR 代償性升高 → 末梢更缺血）</li>
    </ul>
  </section>

  <section data-background-color="#001219">
    <h3>處理邏輯</h3>
    <ul>
      <li class="fragment">1️⃣ 排除可逆原因：<span class="danger">Tamponade</span>、<span class="danger">Tension PTX</span>、<span class="danger">Graft failure</span></li>
      <li class="fragment">2️⃣ 優化 preload（但不要 overload）</li>
      <li class="fragment">3️⃣ Inotrope：<span class="highlight">Dobutamine</span>（首選）或 <span class="highlight">Milrinone</span>（高 SVR / RV failure）</li>
      <li class="fragment">4️⃣ 仍不夠 → MCS（IABP → ECMO）</li>
    </ul>
  </section>
</section>

<!-- Vasopressor / Inotrope -->
<section>
  <section data-background-color="#001219">
    <h2>💉 Vasopressor / Inotrope 邏輯</h2>
    <p>診斷了 shock type，然後呢？</p>
  </section>

  <section data-background-color="#001219">
    <table>
      <tr><th>情境</th><th>首選</th><th>邏輯</th></tr>
      <tr><td>Low CO + 高 SVR</td><td><span class="highlight">Milrinone</span></td><td>降後負荷 + 強心</td></tr>
      <tr><td>Low CO + 低 SVR</td><td><span class="highlight">Dobutamine + NE</span></td><td>強心 + 撐血壓</td></tr>
      <tr><td>Vasoplegia</td><td><span class="highlight">NE + Vasopressin</span></td><td>血管收縮</td></tr>
      <tr><td>RV failure</td><td><span class="highlight">Milrinone ± iNO</span></td><td>降 PVR</td></tr>
    </table>
  </section>

  <section data-background-color="#001219">
    <h3>💬 Mini-Case</h3>
    <p>CABG 術後 3hr：MAP 55, CI 1.6, SVR 1900, CVP 14, Lactate 4.5</p>
    <ul>
      <li class="fragment">低 CO + 高 SVR → <span class="highlight">Milrinone</span></li>
      <li class="fragment">如果加了 Milrinone 後 BP 更掉 → 加 Norepinephrine</li>
      <li class="fragment">如果仍無改善 → 考慮 IABP</li>
    </ul>
  </section>
</section>

<section data-background-color="#001219">
  <h2>❓ What Would You Do?</h2>
  <ol>
    <li class="fragment">術後 6 小時，BP 80/50, CVP 18, CI 1.8, SVR 1800, Lactate 5.1<br/><small>→ 什麼 shock？第一步？</small></li>
    <li class="fragment">Chest tube 前 2 小時 output 200ml/hr，突然變 20ml/hr，同時 BP 掉<br/><small>→ 你在擔心什麼？</small></li>
    <li class="fragment">SVV 18%，Lactate 1.5，BP 90/60，ScvO₂ 72%<br/><small>→ 要不要給 fluid？還需要知道什麼？</small></li>
  </ol>
</section>
`,
  },

  ventilator: {
    title: "Module 3：呼吸器",
    subtitle: "「術後 4 小時，病人 fighting vent」",
    html: `
<section data-background-color="#001219">
  <div class="emoji-big">🌬️</div>
  <h1>呼吸器</h1>
  <p class="subtitle">「術後 4 小時，病人 fighting vent，你怎麼想？」</p>
  <p class="author">Wilson Chao — 高醫心臟外科</p>
</section>

<section data-background-color="#001219">
  <p class="hook">💬 CABG 術後回 ICU，4 小時後<br/>護理師 call「病人 desaturation + agitation！」</p>
</section>

<!-- Modes -->
<section>
  <section data-background-color="#001219">
    <h2>⚙️ Mode 的臨床選擇</h2>
    <p>不是背定義，是知道什麼時候用什麼</p>
    <table>
      <tr><th>Mode</th><th>什麼時候用</th></tr>
      <tr><td>VC (Volume Control)</td><td>術後剛回來、還沒醒</td></tr>
      <tr><td>PC (Pressure Control)</td><td>肺比較差、需要限壓</td></tr>
      <tr><td>PS (Pressure Support)</td><td>準備拔管、讓病人練習</td></tr>
      <tr><td>SIMV</td><td>過渡、逐步撤離</td></tr>
    </table>
  </section>

  <section data-background-color="#001219">
    <h3>心外術後常見起始設定</h3>
    <ul>
      <li>Mode: VC or PC</li>
      <li>TV: 6-8 mL/kg IBW</li>
      <li>RR: 12-16</li>
      <li>FiO₂: 開始 100% → 快速調降</li>
      <li>PEEP: 5 cmH₂O</li>
    </ul>
  </section>
</section>

<!-- Fighting Vent -->
<section>
  <section data-background-color="#001219">
    <h2>😤 Fighting Vent — 怎麼處理？</h2>
    <p>開場那個 scenario 的答案來了</p>
  </section>

  <section data-background-color="#001219">
    <h3>鑑別診斷決策樹</h3>
    <p>病人 agitation + desaturation → <strong>不要只給 sedation！先找原因</strong></p>
    <ul>
      <li class="fragment">1️⃣ <span class="danger">致命的先排除</span>：Tension PTX、Tamponade、PE</li>
      <li class="fragment">2️⃣ <span class="highlight">管路問題</span>：ET tube 移位、打折、mucus plug → 聽診 + suction</li>
      <li class="fragment">3️⃣ <span class="highlight">設定問題</span>：flow 不夠、trigger 太鈍、auto-PEEP</li>
      <li class="fragment">4️⃣ <span class="highlight">病人問題</span>：疼痛、膀胱脹、焦慮、缺氧、高碳酸</li>
    </ul>
  </section>

  <section data-background-color="#001219">
    <h3>💬 Mini-Case：Fighting Vent</h3>
    <p>CABG 術後 4hr, 護理師 call: SpO₂ 85%, RR 30, 病人在掙扎</p>
    <ul>
      <li class="fragment">第一步：<span class="highlight">手動 bagging + 100% O₂</span> → 穩定氧氣</li>
      <li class="fragment">同時：聽診（兩側有沒有呼吸音？）、看 chest tube、ABG</li>
      <li class="fragment">左邊沒呼吸音 + 氣管偏移 → <span class="danger">Tension PTX → 先 needle decompression</span></li>
      <li class="fragment">兩側呼吸音正常 + mucus → suction + 重新接回 vent</li>
    </ul>
  </section>
</section>

<!-- Weaning -->
<section>
  <section data-background-color="#001219">
    <h2>🎯 Weaning — 什麼時候可以拔管？</h2>
    <ul>
      <li class="fragment"><span class="highlight">Hemodynamic stable</span> — 不需要大量 inotrope</li>
      <li class="fragment"><span class="highlight">Awake</span> — 聽指令、有力氣咳</li>
      <li class="fragment"><span class="highlight">Adequate gas exchange</span> — P/F &gt;200, FiO₂ ≤40%</li>
      <li class="fragment"><span class="highlight">RSBI (f/VT) &lt;105</span> — 最有實證的拔管預測指標</li>
      <li class="fragment"><span class="highlight">SBT</span> — PS 5-8, CPAP 30-120 min</li>
      <li class="fragment">通過 SBT → 拔！不要拖</li>
    </ul>
  </section>

  <section data-background-color="#001219">
    <h3>RSBI = f/VT</h3>
    <ul>
      <li>f = 呼吸次數 (breaths/min)、VT = 潮氣容積 (L)</li>
      <li class="fragment"><span class="success">&lt;105</span> → 可能成功拔管</li>
      <li class="fragment"><span class="danger">&gt;105</span> → 快而淺 → 可能失敗</li>
      <li class="fragment">例：RR 25, VT 0.3L → RSBI = 83 → 可以試</li>
      <li class="fragment">例：RR 35, VT 0.2L → RSBI = 175 → 不行</li>
    </ul>
  </section>
</section>

<!-- Trouble Shooting -->
<section>
  <section data-background-color="#001219">
    <h2>🔧 Trouble Shooting</h2>
    <h3>Desaturation</h3>
    <ul>
      <li class="fragment"><span class="highlight">Atelectasis</span> — 最常見，尤其左下肺</li>
      <li class="fragment"><span class="highlight">Pleural effusion</span></li>
      <li class="fragment"><span class="danger">Flash pulmonary edema</span> — 心外術後常見！LV failure → 急性肺水腫</li>
      <li class="fragment"><span class="danger">Pneumothorax</span> — 聽診！</li>
      <li class="fragment"><span class="danger">PE</span> — 術後臥床</li>
    </ul>
  </section>

  <section data-background-color="#001219">
    <h3>High Peak Pressure</h3>
    <ul>
      <li class="fragment"><span class="highlight">Mucus plug</span> — suction!</li>
      <li class="fragment"><span class="highlight">Bronchospasm</span></li>
      <li class="fragment"><span class="danger">Tension pneumothorax</span> — 要命的</li>
    </ul>
    <p class="fragment" style="font-size:0.85em;">心外特有：<span class="highlight">Phrenic nerve injury</span> → 橫膈膜癱瘓 → weaning 困難</p>
  </section>
</section>

<!-- ABG -->
<section>
  <section data-background-color="#001219">
    <h2>🧪 ABG 判讀</h2>
    <p>術後常見 Pattern：</p>
    <ul>
      <li class="fragment"><span class="highlight">Respiratory acidosis</span> — 還沒醒、通氣不足</li>
      <li class="fragment"><span class="danger">Metabolic acidosis</span> — Low CO → tissue hypoperfusion</li>
      <li class="fragment">Mixed — 兩個都有，更要小心</li>
    </ul>
  </section>

  <section data-background-color="#001219">
    <h3>Compensation 公式</h3>
    <ul>
      <li><strong>Metabolic acidosis</strong>：預期 PCO₂ = 1.5 × [HCO₃] + 8 ± 2（Winter's formula）</li>
      <li class="fragment"><strong>Metabolic alkalosis</strong>：預期 PCO₂ = 0.7 × [HCO₃] + 21 ± 2</li>
      <li class="fragment"><strong>Respiratory acidosis (acute)</strong>：每 PCO₂ ↑10 → HCO₃ ↑1</li>
      <li class="fragment"><strong>Respiratory acidosis (chronic)</strong>：每 PCO₂ ↑10 → HCO₃ ↑3.5</li>
    </ul>
    <p class="fragment" style="font-size:0.8em;">口訣：pH → PCO₂ → HCO₃ → AG → compensation 夠不夠？</p>
  </section>

  <section data-background-color="#001219">
    <h3>💬 ABG 實戰題</h3>
    <p>pH 7.28, PCO₂ 32, HCO₃ 15, Lactate 4.8</p>
    <ul>
      <li class="fragment">Acidosis → HCO₃ 低 → <span class="highlight">Metabolic acidosis</span></li>
      <li class="fragment">Winter's: 1.5 × 15 + 8 = 30.5 → 實際 PCO₂ 32 → compensation 夠</li>
      <li class="fragment">Lactate 高 → <span class="danger">Lactic acidosis → 灌流不足！</span></li>
      <li class="fragment">→ 不是呼吸器的問題，是 <strong>心臟或循環</strong>的問題</li>
    </ul>
  </section>
</section>

<section data-background-color="#001219">
  <h2>❓ What Would You Do?</h2>
  <ol>
    <li class="fragment">術後 4 hr, SpO₂ 88%, ABG: pH 7.28, PCO₂ 52, PO₂ 58<br/><small>→ 什麼問題？怎麼處理？</small></li>
    <li class="fragment">SBT 30 min 後 RR 35, VT 200mL (RSBI=175), SpO₂ 91%<br/><small>→ 拔不拔？</small></li>
    <li class="fragment">術後第 3 天，一直 weaning 失敗，CXR 左 hemidiaphragm 升高<br/><small>→ 你在想什麼？</small></li>
  </ol>
</section>
`,
  },

  "icu-care": {
    title: "Module 4：ICU Care",
    subtitle: "「CABG 術後 Day 0，然後呢？」",
    html: `
<section data-background-color="#001219">
  <div class="emoji-big">🏥</div>
  <h1>Cardiac Surgery ICU Care</h1>
  <p class="subtitle">「CABG 術後 Day 0，病人推進 ICU，然後呢？」</p>
  <p class="author">Wilson Chao — 高醫心臟外科</p>
</section>

<section data-background-color="#001219">
  <p class="hook">💬 65 歲男性，CABG ×3<br/>（LIMA-LAD, SVG-OM, SVG-RCA）<br/>CPB time 90 min，剛推進 ICU<br/><br/>走一遍。</p>
</section>

<!-- Checklist -->
<section>
  <section data-background-color="#001219">
    <h2>📋 接病人 Checklist</h2>
    <ul>
      <li class="fragment"><span class="highlight">管線</span>：ET tube, A-line, CVP/Swan, chest tube ×?, Foley, pacing wire</li>
      <li class="fragment"><span class="highlight">Monitor</span>：ABP, CVP, PAP, SpO₂, Temp</li>
      <li class="fragment"><span class="highlight">第一組 Lab</span>：ABG, CBC, Coag, <span class="highlight">Lactate</span>, Electrolytes</li>
      <li class="fragment"><span class="highlight">Drip</span>：什麼 inotrope/vasopressor 在跑？速度？</li>
      <li class="fragment"><span class="danger">神經學評估</span>：瞳孔、Glasgow Coma Scale、醒來後四肢有沒有在動</li>
    </ul>
  </section>

  <section data-background-color="#001219">
    <h3>⚠️ 為什麼要看神經學？</h3>
    <ul>
      <li>術後 <span class="danger">Stroke</span> 發生率 1-5%（CPB 相關）</li>
      <li class="fragment">越早發現、越早處理 → 預後越好</li>
      <li class="fragment">病人醒來後第一件事：<strong>「握我的手」「動動腳趾」</strong></li>
      <li class="fragment">單側無力或不醒 → <span class="danger">立即通知、安排 CT</span></li>
    </ul>
  </section>
</section>

<!-- Day-by-Day Timeline -->
<section>
  <section data-background-color="#001219">
    <h2>📅 術後 Day-by-Day</h2>
  </section>

  <section data-background-color="#001219">
    <table>
      <tr><th>Day</th><th>目標</th><th>注意</th></tr>
      <tr><td><span class="highlight">Day 0</span></td><td>穩定血壓、止血、rewarming</td><td>Bleeding、Tamponade、Hypothermia</td></tr>
      <tr><td><span class="highlight">Day 1</span></td><td>Extubation、開始活動</td><td>AF（高峰 Day 2-3）、Neuro check</td></tr>
      <tr><td><span class="highlight">Day 2-3</span></td><td>轉一般病房、拔管線</td><td>AKI 高峰、AF、Glucose control</td></tr>
      <tr><td><span class="highlight">Day 4-7</span></td><td>復健、傷口觀察</td><td>Infection（wound / pneumonia）</td></tr>
    </table>
  </section>
</section>

<!-- Inotropes -->
<section>
  <section data-background-color="#001219">
    <h2>💉 Inotrope / Vasopressor</h2>
    <table>
      <tr><th>Drug</th><th>作用</th><th>劑量</th><th>選擇時機</th></tr>
      <tr><td>Milrinone</td><td>Inotrope + vasodilator</td><td>0.375-0.75 μg/kg/min</td><td>RV failure, PHT</td></tr>
      <tr><td>Dobutamine</td><td>Inotrope (β1)</td><td>2-20 μg/kg/min</td><td>Low CO 首選</td></tr>
      <tr><td>Norepinephrine</td><td>Vasopressor (α)</td><td>0.01-0.5 μg/kg/min</td><td>Vasoplegia</td></tr>
      <tr><td>Vasopressin</td><td>Vasopressor (V1)</td><td>0.01-0.04 U/min</td><td>NE 不夠時加上</td></tr>
      <tr><td>Epinephrine</td><td>Both</td><td>0.01-0.1 μg/kg/min</td><td>最後手段 / 急救</td></tr>
    </table>
  </section>

  <section data-background-color="#001219">
    <h3>快速決策</h3>
    <ul>
      <li>低 CO + 低 SVR → <span class="highlight">Dobutamine + Norepinephrine</span></li>
      <li>低 CO + 高 SVR → <span class="highlight">Milrinone</span>（降後負荷）</li>
      <li>RV failure → <span class="highlight">Milrinone ± iNO</span></li>
      <li>Vasoplegia（低 SVR, 正常 CO）→ <span class="highlight">Norepinephrine + Vasopressin</span></li>
    </ul>
  </section>
</section>

<!-- Post-op HTN -->
<section data-background-color="#001219">
  <h2>📈 術後高血壓</h2>
  <p>不只有低血壓！術後早期高血壓很常見</p>
  <ul>
    <li class="fragment"><strong>原因</strong>：疼痛、寒顫（shivering）、Hypothermia rewarming、焦慮、膀胱脹</li>
    <li class="fragment"><strong>為什麼要控制</strong>：<span class="danger">Anastomosis bleeding!</span> 剛縫好的血管承受不住高壓</li>
    <li class="fragment"><strong>目標</strong>：SBP &lt;140（剛開完的前幾小時更嚴格）</li>
    <li class="fragment"><strong>處理</strong>：先處理原因（止痛、保暖）→ Nicardipine drip / NTG drip</li>
  </ul>
</section>

<!-- Chest tube & Bleeding -->
<section>
  <section data-background-color="#001219">
    <h2>🩸 Chest Tube & Bleeding</h2>
    <ul>
      <li>Output 判讀：<span class="danger">&gt;200 mL/hr</span> × 2-3 hr → 要注意</li>
      <li class="fragment">顏色：鮮紅 vs 暗紅 vs serous</li>
      <li class="fragment"><span class="highlight">趨勢</span>比單一數字重要</li>
      <li class="fragment">突然變少 ≠ 好事 → 可能塞住 → <span class="danger">tamponade</span></li>
    </ul>
  </section>

  <section data-background-color="#001219">
    <h3>Re-explore Criteria</h3>
    <ul>
      <li class="fragment"><span class="danger">&gt;400 mL</span> 第一小時</li>
      <li class="fragment"><span class="danger">&gt;200 mL/hr</span> × 2-4 小時</li>
      <li class="fragment"><span class="danger">&gt;1500 mL</span> 總量 in 12 hr</li>
      <li class="fragment">合併 hemodynamic instability</li>
    </ul>
    <p class="fragment">Workup：CBC, PT/aPTT, Fibrinogen, ± TEG/ROTEM</p>
  </section>
</section>

<!-- AKI -->
<section>
  <section data-background-color="#001219">
    <h2>🫘 術後 AKI</h2>
    <p>發生率 <span class="danger">20-30%</span>，CPB 後最常見 complication 之一</p>
  </section>

  <section data-background-color="#001219">
    <h3>Risk Factors</h3>
    <ul>
      <li class="fragment">術前 CKD、DM、高齡</li>
      <li class="fragment">CPB time 長（>120 min）</li>
      <li class="fragment">術中低血壓、大量輸血</li>
      <li class="fragment">Nephrotoxins（contrast、NSAIDs）</li>
    </ul>
  </section>

  <section data-background-color="#001219">
    <h3>預防 & 處理</h3>
    <ul>
      <li class="fragment"><span class="highlight">維持 MAP &gt;65</span>、adequate CO</li>
      <li class="fragment">避免 nephrotoxins</li>
      <li class="fragment">監測 UO（目標 &gt;0.5 mL/kg/hr）+ Creatinine trend</li>
      <li class="fragment">KDIGO staging → 必要時 early CRRT consult</li>
    </ul>
  </section>
</section>

<!-- Glucose -->
<section data-background-color="#001219">
  <h2>🍬 術後血糖管理</h2>
  <ul>
    <li>CPB 後常見高血糖（stress response + steroid + insulin resistance）</li>
    <li class="fragment"><span class="highlight">目標 140-180 mg/dL</span>（STS guideline）</li>
    <li class="fragment"><span class="danger">&gt;180</span> → Insulin drip → 增加 infection、wound healing 差</li>
    <li class="fragment"><span class="danger">&lt;70</span> → 避免！低血糖比高血糖更危險</li>
    <li class="fragment">DM 病人術後尤其要密切監測（q1-2h）</li>
  </ul>
</section>

<!-- AF -->
<section data-background-color="#001219">
  <h2>💓 術後 AF</h2>
  <p>心外術後最常見 complication — <span class="highlight">~30%</span>，高峰 Day 2-3</p>
  <ul>
    <li class="fragment">Hemodynamically stable → <span class="success">Rate control</span>（Amiodarone, β-blocker）</li>
    <li class="fragment">Hemodynamically unstable → <span class="danger">Cardioversion</span></li>
    <li class="fragment">Amiodarone：150mg IV bolus → 1mg/min × 6hr → 0.5mg/min × 18hr</li>
    <li class="fragment">&gt;48 hr or stroke risk → anticoagulate</li>
  </ul>
</section>

<!-- Pacing -->
<section data-background-color="#001219">
  <h2>⚡ Pacing Wire</h2>
  <ul>
    <li>為什麼術後留？→ 術中 manipulation + 水腫 → AV block risk</li>
    <li class="fragment">Bradycardia, AV block → 暫時性 pacing</li>
    <li class="fragment">通常 48-72 hr 後移除（如果不需要）</li>
  </ul>
</section>

<!-- Red Flags -->
<section data-background-color="#001219">
  <h2>🚩 Red Flags 總整理</h2>
  <table>
    <tr><th>Red Flag</th><th>想到什麼</th></tr>
    <tr><td>JVP↑ + BP↓ + CT output↓</td><td><span class="danger">Tamponade</span></td></tr>
    <tr><td>CT output &gt;200/hr × 3hr</td><td><span class="danger">Surgical bleeding</span></td></tr>
    <tr><td>單側肢體無力 / 不醒</td><td><span class="danger">Stroke</span></td></tr>
    <tr><td>腳變白變冷</td><td><span class="danger">Limb ischemia (IABP)</span></td></tr>
    <tr><td>Sternal wound 紅腫滲液</td><td><span class="danger">Mediastinitis</span></td></tr>
    <tr><td>UO &lt;0.5 mL/kg/hr × 6hr</td><td><span class="danger">AKI</span></td></tr>
    <tr><td>Glucose &gt;250 持續不降</td><td><span class="danger">Insulin resistance / Infection?</span></td></tr>
  </table>
</section>

<section data-background-color="#001219">
  <h2>❓ What Would You Do?</h2>
  <ol>
    <li class="fragment">術後 2 hr, CT output: 1hr 150mL, 2hr 250mL, 3hr 300mL<br/><small>→ 趨勢在說什麼？下一步？</small></li>
    <li class="fragment">術後 Day 1, 突然 AF with RVR, HR 150, BP 90/60<br/><small>→ 第一步？</small></li>
    <li class="fragment">術後 Day 2, Cr 1.2 → 2.1, UO 15mL/hr, Lactate 正常<br/><small>→ AKI stage? 處理？</small></li>
  </ol>
</section>
`,
  },

  cabg: {
    title: "選修 A：CABG 全攻略",
    subtitle: "從 Cath 到 Close — Case-based",
    html: `
<section data-background-color="#001219">
  <div class="emoji-big">🔧</div>
  <h1>CABG 全攻略</h1>
  <p class="subtitle">從 Cath 到 Close — 一個 Case 走一遍</p>
  <p class="author">Wilson Chao — 高醫心臟外科</p>
</section>

<section data-background-color="#001219">
  <p class="hook">💬 60M, DM, 3VD<br/>LAD proximal 90%, LCx-OM 80%, RCA mid 85%<br/>SYNTAX 32, LVEF 50%<br/><br/>你會怎麼 plan？</p>
</section>

<section data-background-color="#001219">
  <h2>📋 Indication 確認</h2>
  <ul>
    <li>3VD + DM → <span class="highlight">Class I for CABG</span></li>
    <li>SYNTAX &gt;22 → CABG &gt; PCI</li>
    <li>LVEF 50% → 不算太差，good candidate</li>
  </ul>
</section>

<!-- Conduit -->
<section>
  <section data-background-color="#001219">
    <h2>🩸 Conduit 選擇</h2>
    <table>
      <tr><th>Conduit</th><th>10-yr Patency</th><th>備註</th></tr>
      <tr><td><span class="highlight">LIMA</span></td><td>~95%</td><td>黃金標準 → <span class="success">LAD</span></td></tr>
      <tr><td>RIMA</td><td>~90%</td><td>Bilateral IMA → sternal wound risk</td></tr>
      <tr><td>SVG</td><td>~60%</td><td>最常用、容易取</td></tr>
      <tr><td>Radial</td><td>~80%</td><td>要 Allen test, target 要夠塞</td></tr>
    </table>
  </section>

  <section data-background-color="#001219">
    <h3>黃金法則</h3>
    <div class="big-number">LIMA → LAD</div>
    <p style="text-align:center;">這是心外最重要的一條 graft</p>
  </section>
</section>

<!-- Steps -->
<section>
  <section data-background-color="#001219">
    <h2>🔪 手術大步驟</h2>
    <ol>
      <li class="fragment"><span class="highlight">Sternotomy</span> — 打開胸骨</li>
      <li class="fragment"><span class="highlight">Harvesting</span> — 取 LIMA + SVG</li>
      <li class="fragment"><span class="highlight">Cannulation</span> — 接上體外循環</li>
      <li class="fragment"><span class="highlight">Cross clamp</span> — 停心、cardioplegia</li>
      <li class="fragment"><span class="highlight">Anastomosis</span> — 接血管（distal → proximal）</li>
      <li class="fragment"><span class="highlight">Weaning CPB</span> — 讓心臟重新跳</li>
      <li class="fragment"><span class="highlight">Close</span> — 鋼絲固定胸骨</li>
    </ol>
  </section>

  <section data-background-color="#001219">
    <h3>💬 On-pump vs Off-pump (OPCAB)</h3>
    <ul>
      <li><span class="highlight">On-pump</span>（傳統）：用 CPB，心臟停下來縫 → 視野好、穩定</li>
      <li class="fragment"><span class="highlight">Off-pump (OPCAB)</span>：心臟跳著縫 → 不需要 CPB</li>
      <li class="fragment">OPCAB 優勢：避免 CPB 的全身發炎、可能減少 stroke</li>
      <li class="fragment">OPCAB 挑戰：技術難度高、不是每個病人都適合</li>
      <li class="fragment">⚠️ 台灣大部分仍以 on-pump 為主流</li>
    </ul>
  </section>
</section>

<!-- Post-op -->
<section>
  <section data-background-color="#001219">
    <h2>🏥 術後 ICU — Day 0-2</h2>
  </section>

  <section data-background-color="#001219">
    <h3>Day 0 重點</h3>
    <ul>
      <li class="fragment">Rewarming → 注意 shivering → <span class="danger">高血壓 → graft bleeding</span></li>
      <li class="fragment">Bleeding monitoring（CT output q1h）</li>
      <li class="fragment">Hemodynamic support（inotrope weaning 目標）</li>
      <li class="fragment">醒來後：<span class="highlight">neuro check</span> — 四肢有在動嗎？</li>
    </ul>
  </section>

  <section data-background-color="#001219">
    <h3>Day 1-2</h3>
    <ul>
      <li class="fragment">Extubation（多數 Day 0 晚上或 Day 1 早上）</li>
      <li class="fragment">AF 高峰（Day 2-3）→ monitor 觀察</li>
      <li class="fragment">開始下床活動、胸腔復健</li>
      <li class="fragment">ECG 追蹤 — 新的 ST changes?</li>
    </ul>
  </section>
</section>

<section data-background-color="#001219">
  <h2>❓ What Would You Do?</h2>
  <ol>
    <li class="fragment">術中 weaning CPB 困難，心臟跳但 CO 不夠<br/><small>→ 可能原因？下一步？（提示：想想 stunning、air、graft）</small></li>
    <li class="fragment">術後 Day 1，ECG 新的 ST elevation in V1-V4<br/><small>→ 你最擔心什麼？（graft to LAD territory...）</small></li>
    <li class="fragment">術後 Day 0, SBP 170, 病人在寒顫，CT output 增加<br/><small>→ 怎麼處理？順序？</small></li>
  </ol>
</section>
`,
  },

  valve: {
    title: "選修 B：Valve Surgery",
    subtitle: "Repair or Replace?",
    html: `
<section data-background-color="#001219">
  <div class="emoji-big">🔄</div>
  <h1>Valve Surgery</h1>
  <p class="subtitle">Repair or Replace?</p>
  <p class="author">Wilson Chao — 高醫心臟外科</p>
</section>

<section data-background-color="#001219">
  <p class="hook">💬 Case 1: 55F, severe MR, prolapse of P2<br/>Case 2: 70M, severe AS, AVA 0.7, syncope<br/><br/>一個要修，一個要換。為什麼？</p>
</section>

<!-- Severity -->
<section data-background-color="#001219">
  <h2>📏 Severity Grading 重點</h2>
  <table>
    <tr><th></th><th>Mild</th><th>Moderate</th><th>Severe</th></tr>
    <tr><td>AS (AVA)</td><td>&gt;1.5</td><td>1.0-1.5</td><td><span class="danger">&lt;1.0 cm²</span></td></tr>
    <tr><td>AR (VC)</td><td>&lt;3mm</td><td>3-6mm</td><td><span class="danger">&gt;6mm</span></td></tr>
    <tr><td>MS (MVA)</td><td>&gt;1.5</td><td>1.0-1.5</td><td><span class="danger">&lt;1.0 cm²</span></td></tr>
    <tr><td>MR (ERO)</td><td>&lt;0.2</td><td>0.2-0.4</td><td><span class="danger">&gt;0.4 cm²</span></td></tr>
  </table>
</section>

<!-- MR: Degenerative vs Functional -->
<section>
  <section data-background-color="#001219">
    <h2>🔍 MR 不是都一樣</h2>
    <h3>Degenerative vs Functional MR</h3>
  </section>

  <section data-background-color="#001219">
    <table>
      <tr><th></th><th>Degenerative (Primary)</th><th>Functional (Secondary)</th></tr>
      <tr><td>原因</td><td>瓣膜本身壞了（prolapse, flail）</td><td>心臟擴大拉扯瓣膜</td></tr>
      <tr><td>Echo 特徵</td><td>Leaflet 過長/斷裂</td><td>Leaflet 正常但 annulus 擴大</td></tr>
      <tr><td>手術</td><td><span class="success">Repair 首選！</span>成功率 &gt;95%</td><td>Repair 效果差，常復發</td></tr>
      <tr><td>預後</td><td>修好 = 治好</td><td>根本問題是心臟，不是瓣膜</td></tr>
    </table>
  </section>

  <section data-background-color="#001219">
    <h3>💬 Mini-Case</h3>
    <p>Case A: 50F, LVEF 65%, posterior leaflet prolapse, severe MR</p>
    <p>Case B: 60M, LVEF 25%, dilated LV, severe MR, no prolapse</p>
    <ul>
      <li class="fragment">Case A → <span class="success">Degenerative → MV Repair!</span> 預後很好</li>
      <li class="fragment">Case B → Functional MR → 修瓣膜不一定改善預後，要處理心衰</li>
    </ul>
  </section>
</section>

<!-- TAVR vs SAVR -->
<section>
  <section data-background-color="#001219">
    <h2>🔀 AS 的現代戰場：TAVR vs SAVR</h2>
  </section>

  <section data-background-color="#001219">
    <table>
      <tr><th></th><th>SAVR（開刀換瓣膜）</th><th>TAVR（經導管換瓣膜）</th></tr>
      <tr><td>方式</td><td>Sternotomy + CPB</td><td>經 femoral artery 放瓣膜</td></tr>
      <tr><td>傷口</td><td>正中開胸</td><td>大腿小傷口</td></tr>
      <tr><td>住院</td><td>7-10 天</td><td>2-3 天</td></tr>
      <tr><td>耐久性</td><td>長（mechanical 永久）</td><td>較短（10-15 年，持續進步中）</td></tr>
      <tr><td>Pacemaker 風險</td><td>低 (~3%)</td><td>較高 (~10-20%)</td></tr>
    </table>
  </section>

  <section data-background-color="#001219">
    <h3>怎麼選？</h3>
    <ul>
      <li class="fragment"><span class="highlight">Low risk + 年輕（&lt;65）</span> → 傾向 SAVR（耐久性）</li>
      <li class="fragment"><span class="highlight">Intermediate risk</span> → 兩者皆可（Heart Team 討論）</li>
      <li class="fragment"><span class="danger">High risk / 手術禁忌</span> → TAVR</li>
      <li class="fragment">⚠️ Bicuspid aortic valve → TAVR 技術挑戰較大</li>
    </ul>
  </section>
</section>

<!-- AR Timing -->
<section data-background-color="#001219">
  <h2>⏰ AR 手術 Timing</h2>
  <ul>
    <li><span class="highlight">Symptomatic severe AR</span> → 開</li>
    <li class="fragment"><span class="highlight">Asymptomatic</span> severe AR + 以下任一：
      <ul>
        <li>LVEF &lt;55%</li>
        <li>LVESD &gt;50mm（或 &gt;25mm/m²）</li>
        <li>LVEDD &gt;65mm</li>
      </ul>
    </li>
    <li class="fragment">重點：AR 是 <strong>volume overload</strong> → LV 會慢慢擴大 → 等到有症狀可能太晚</li>
  </ul>
</section>

<!-- Repair vs Replace -->
<section>
  <section data-background-color="#001219">
    <h2>⚖️ Repair vs Replace</h2>
    <ul>
      <li><span class="success">MV Repair 優勢</span>：保留 native valve、不用 anticoagulation、低死亡率</li>
      <li class="fragment">MR 能 repair → repair（尤其 degenerative MR）</li>
      <li class="fragment">AS → 幾乎都要 <span class="highlight">replace</span></li>
    </ul>
  </section>

  <section data-background-color="#001219">
    <h3>Mechanical vs Bioprosthetic</h3>
    <table>
      <tr><th></th><th>Mechanical</th><th>Bioprosthetic</th></tr>
      <tr><td>耐用性</td><td>永久</td><td>10-15 年</td></tr>
      <tr><td>Anticoagulation</td><td><span class="danger">終身 warfarin</span></td><td>不需要</td></tr>
      <tr><td>適合誰</td><td>年輕（&lt;50-60）</td><td>年長、不能 anticoag</td></tr>
    </table>
  </section>
</section>

<!-- IE -->
<section data-background-color="#001219">
  <h2>🦠 Infective Endocarditis</h2>
  <p>什麼時候找心外開刀？</p>
  <ul>
    <li class="fragment"><span class="danger">Heart failure</span> from valve destruction</li>
    <li class="fragment"><span class="danger">Uncontrolled infection</span>（abscess, persistent bacteremia）</li>
    <li class="fragment"><span class="danger">Large vegetation</span> &gt;10mm + embolic events</li>
    <li class="fragment">Prosthetic valve IE — 多數需要手術</li>
  </ul>
</section>

<section data-background-color="#001219">
  <h2>❓ What Would You Do?</h2>
  <ol>
    <li class="fragment">35F, severe MR (P2 prolapse), LVEF 60%, asymptomatic<br/><small>→ Degenerative or Functional? 要不要現在開？</small></li>
    <li class="fragment">75M, severe AS, AVA 0.7, syncope, STS 8%<br/><small>→ TAVR or SAVR? 為什麼？</small></li>
    <li class="fragment">60M, severe AR, LVEF 50%, LVESD 52mm, 沒症狀<br/><small>→ 開不開？為什麼不能再等？</small></li>
  </ol>
</section>
`,
  },

  cpb: {
    title: "選修 C：CPB & Myocardial Protection",
    subtitle: "「人類怎麼學會停住心臟」",
    html: `
<section data-background-color="#001219">
  <div class="emoji-big">❄️</div>
  <h1>CPB & Myocardial Protection</h1>
  <p class="subtitle">「人類怎麼學會停住心臟」</p>
  <p class="author">Wilson Chao — 高醫心臟外科</p>
</section>

<section data-background-color="#001219">
  <p class="hook">💬 1953 年，John Gibbon 用一台冰箱大小的機器<br/>第一次讓人的心臟停下來<br/><br/>又活過來。</p>
</section>

<!-- History -->
<section>
  <section data-background-color="#001219">
    <h2>📜 歷史</h2>
    <ul>
      <li><span class="highlight">1953</span> — Gibbon：第一台 heart-lung machine</li>
      <li class="fragment"><span class="highlight">1954</span> — Lillehei：Cross-circulation<br/><small>用爸爸當 pump（真的）</small></li>
      <li class="fragment"><span class="highlight">1960s</span> — 現代 CPB circuit 成形</li>
      <li class="fragment">從「不可能」到「常規手術」只花了 10 年</li>
    </ul>
  </section>
</section>

<!-- Circuit -->
<section>
  <section data-background-color="#001219">
    <h2>🔧 站在手術台旁邊看到什麼</h2>
    <ul>
      <li><span class="highlight">Perfusionist</span> — 操作體外循環的專家</li>
      <li class="fragment">Circuit：<span class="highlight">Pump + Oxygenator + Heat Exchanger + Reservoir</span></li>
      <li class="fragment">Cannulation：<span class="highlight">Aorta</span>（arterial）+ <span class="highlight">RA or Bicaval</span>（venous）</li>
      <li class="fragment">血從 RA 出去 → 機器氧合 → 打回 aorta</li>
    </ul>
  </section>

  <section data-background-color="#001219">
    <h3>💉 Heparin / ACT / Protamine</h3>
    <ul>
      <li><span class="highlight">Heparin</span>：上 CPB 前打 → 防止血在管路裡凝固</li>
      <li class="fragment"><span class="highlight">ACT (Activated Clotting Time)</span>：目標 &gt;480 秒</li>
      <li class="fragment"><span class="highlight">Protamine</span>：下 CPB 後打 → 中和 heparin</li>
      <li class="fragment">⚠️ Protamine 可能引起 <span class="danger">低血壓、過敏、肺高壓</span></li>
      <li class="fragment">術後流血不止？→ 查 ACT，可能 heparin 沒完全中和</li>
    </ul>
  </section>
</section>

<!-- Cardioplegia -->
<section>
  <section data-background-color="#001219">
    <h2>❄️ 心臟怎麼停、怎麼保護</h2>
    <ul>
      <li><span class="highlight">Cardioplegia</span> — 高鉀溶液讓心臟停在 diastole</li>
      <li class="fragment">冷（4°C）→ 降低代謝率 → 減少缺血傷害</li>
      <li class="fragment">Antegrade（從 aortic root）vs Retrograde（從 coronary sinus）</li>
      <li class="fragment">每 15-20 min 重新給 → 維持心臟保護</li>
    </ul>
    <p class="fragment"><span class="danger">Cross clamp time</span> 越短越好 — 這是心臟缺血的時間</p>
  </section>

  <section data-background-color="#001219">
    <h3>Cardioplegia 種類</h3>
    <table>
      <tr><th>種類</th><th>特色</th></tr>
      <tr><td><span class="highlight">Blood cardioplegia</span></td><td>最常用，含氧能力好，每 15-20 min 重給</td></tr>
      <tr><td><span class="highlight">Crystalloid</span></td><td>經典（St. Thomas, HTK），簡單但保護力稍弱</td></tr>
      <tr><td><span class="highlight">del Nido</span></td><td>一次給可維持 60-90 min，小兒心臟手術常用，成人越來越流行</td></tr>
    </table>
  </section>
</section>

<!-- Weaning -->
<section data-background-color="#001219">
  <h2>💓 Weaning — 最緊張的時刻</h2>
  <ul>
    <li class="fragment">Cross clamp off → 血流回心臟</li>
    <li class="fragment">心臟重新跳起來（有時要電擊）</li>
    <li class="fragment"><span class="danger">Weaning 失敗</span>：stunning、air embolism、graft 問題</li>
    <li class="fragment">需要 mechanical support → IABP → ECMO</li>
  </ul>
</section>

<!-- CPB effects -->
<section data-background-color="#001219">
  <h2>⚠️ CPB 對身體做了什麼</h2>
  <ul>
    <li class="fragment"><span class="highlight">SIRS</span> — 血液碰到人工管路 → 全身發炎</li>
    <li class="fragment"><span class="highlight">Coagulopathy</span> — 血小板消耗 + hemodilution</li>
    <li class="fragment"><span class="highlight">Hemodilution</span> — 管路要 prime fluid</li>
    <li class="fragment">為什麼術後病人會「腫一圈」→ capillary leak</li>
  </ul>
</section>

<!-- Mini-Case -->
<section data-background-color="#001219">
  <h3>💬 Mini-Case：術後出血</h3>
  <p>CABG 術後 2hr, CT output 250mL/hr, ACT 180 (正常 &lt;140)</p>
  <ul>
    <li class="fragment">ACT 還太高 → Protamine 沒完全中和 Heparin</li>
    <li class="fragment">→ 補 Protamine → 追蹤 ACT</li>
    <li class="fragment">如果 ACT 正常但還在流 → 查 Plt, Fibrinogen, TEG → 考慮 surgical bleeding</li>
  </ul>
</section>

<section data-background-color="#001219">
  <h2>❓ What Would You Do?</h2>
  <ol>
    <li class="fragment">CPB time 已經 180 min，cross clamp 120 min<br/><small>→ 你在擔心什麼？（提示：心臟已經缺血 2 小時）</small></li>
    <li class="fragment">Weaning 時心臟在跳但 MAP 一直上不來<br/><small>→ 可能的原因？</small></li>
    <li class="fragment">術後 ACT 正常、Plt/Fibrinogen 正常，但 CT output 仍 300mL/hr<br/><small>→ 下一步？</small></li>
  </ol>
</section>
`,
  },

  mcs: {
    title: "選修 D：Mechanical Circulatory Support",
    subtitle: "「凌晨三點，cardiogenic shock call in」",
    html: `
<section data-background-color="#001219">
  <div class="emoji-big">⚡</div>
  <h1>Mechanical Circulatory Support</h1>
  <p class="subtitle">「凌晨三點，cardiogenic shock call in」</p>
  <p class="author">Wilson Chao — 高醫心臟外科</p>
</section>

<section data-background-color="#001219">
  <p class="hook">💬 凌晨三點，急診打來<br/>55M, anterior STEMI, post-PCI cardiogenic shock<br/>BP 70/40 on max dose inotrope<br/><br/>你到的時候看到什麼？下一步？</p>
</section>

<!-- Spectrum (Updated) -->
<section data-background-color="#001219">
  <h2>📈 MCS 的光譜（2026 更新版）</h2>
  <div style="text-align:center; font-size:1.2em;">
    <span class="fragment">IABP</span>
    <span class="fragment"> → <span class="highlight">Impella</span></span>
    <span class="fragment"> → <span class="highlight">VA-ECMO</span></span>
    <span class="fragment"> → <span class="highlight">ECpella</span></span>
    <span class="fragment"> → <span class="highlight">VAD</span></span>
    <span class="fragment"> → <span class="success">Heart Transplant</span></span>
  </div>
  <p class="fragment" style="text-align:center; font-size:0.8em;">支持力越來越強，侵入性也越大</p>
</section>

<!-- IABP -->
<section>
  <section data-background-color="#001219">
    <h2>🎈 IABP</h2>
    <ul>
      <li>原理：<span class="highlight">Diastolic augmentation + Systolic unloading</span></li>
      <li class="fragment">Diastole 充氣 → 增加冠狀動脈灌流</li>
      <li class="fragment">Systole 放氣 → 減少 afterload</li>
      <li class="fragment">效果：CO 增加 ~0.5 L/min（modest）</li>
    </ul>
  </section>

  <section data-background-color="#001219">
    <h3>IABP — 實務</h3>
    <ul>
      <li>從 femoral artery 放入</li>
      <li>CXR 確認：tip 在 <span class="highlight">descending aorta, 左鎖骨下動脈下方</span></li>
      <li class="fragment"><span class="danger">禁忌</span>：severe AR、aortic dissection、severe PVD</li>
      <li class="fragment">Complication：<span class="danger">limb ischemia</span>（每小時檢查足背脈搏）</li>
    </ul>
  </section>
</section>

<!-- Impella -->
<section>
  <section data-background-color="#001219">
    <h2>⚡ Impella</h2>
    <p>微型軸流幫浦 — 直接從 LV 把血抽到 aorta</p>
  </section>

  <section data-background-color="#001219">
    <table>
      <tr><th>型號</th><th>Flow</th><th>置放</th></tr>
      <tr><td>Impella CP</td><td>~3.5 L/min</td><td>經 femoral, 14F</td></tr>
      <tr><td>Impella 5.0/5.5</td><td>~5 L/min</td><td>經 axillary, 需要 cut-down</td></tr>
    </table>
    <ul>
      <li class="fragment"><span class="highlight">最大優勢</span>：直接 unload LV → 降低心肌氧耗 → 幫助恢復</li>
      <li class="fragment">IABP 做不到的：IABP 只間接幫忙，Impella 直接抽血</li>
      <li class="fragment"><span class="danger">注意</span>：hemolysis、vascular complication、device migration</li>
    </ul>
  </section>

  <section data-background-color="#001219">
    <h3>💬 Decision Point</h3>
    <p>IABP 放了 2 小時，BP 仍 70/40，Lactate 從 5 → 7</p>
    <ul>
      <li class="fragment">IABP 不夠 → 升級！</li>
      <li class="fragment">選擇：Impella 或 VA-ECMO？</li>
      <li class="fragment">如果主要是 LV failure → <span class="highlight">Impella</span>（直接 unload）</li>
      <li class="fragment">如果合併 RV failure 或心跳停止 → <span class="highlight">VA-ECMO</span></li>
    </ul>
  </section>
</section>

<!-- ECMO -->
<section>
  <section data-background-color="#001219">
    <h2>🔴 VA-ECMO</h2>
    <ul>
      <li><span class="highlight">觸發條件</span>：SBP &lt;80 on max inotrope + malperfusion signs</li>
      <li class="fragment"><span class="highlight">Bridge to recovery</span> — 等心臟恢復</li>
      <li class="fragment"><span class="highlight">Bridge to decision</span> — 穩定後再決定下一步</li>
      <li class="fragment"><span class="highlight">Bridge to bridge</span> — 等更長期的支持</li>
    </ul>
  </section>

  <section data-background-color="#001219">
    <h3>ECMO Complications</h3>
    <table>
      <tr><th>Complication</th><th>為什麼</th></tr>
      <tr><td><span class="danger">Limb ischemia</span></td><td>Femoral cannula 擋血流 → 加 DPC (distal perfusion cannula)</td></tr>
      <tr><td><span class="danger">LV distension</span></td><td>ECMO 增加 afterload → LV 排不出 → 脹大</td></tr>
      <tr><td><span class="danger">Bleeding</span></td><td>Anticoagulation (aPTT 60-80) + consumption</td></tr>
      <tr><td><span class="danger">Infection</span></td><td>Cannula site</td></tr>
    </table>
  </section>

  <section data-background-color="#001219">
    <h3>LV Distension → Venting 策略</h3>
    <ul>
      <li>ECMO 增加 afterload → LV 無法射出 → <span class="danger">LV 越脹越大 → 惡性循環</span></li>
      <li class="fragment">Venting 方法：
        <ul>
          <li><span class="highlight">IABP + ECMO</span>：IABP 降 afterload</li>
          <li><span class="highlight">ECpella</span>：Impella + ECMO，最有效的 LV unloading</li>
          <li>Surgical vent（atrial septostomy / LV vent）</li>
        </ul>
      </li>
    </ul>
  </section>

  <section data-background-color="#001219">
    <h3>ECMO 有沒有效？+ Weaning</h3>
    <ul>
      <li><span class="highlight">Pulsatility</span> — 有 pulse pressure → 心臟在恢復</li>
      <li><span class="highlight">Lactate trend</span> — 在降 → 灌流改善</li>
      <li><span class="highlight">End-organ perfusion</span> — 尿量、意識</li>
      <li class="fragment" style="margin-top:15px;"><strong>Weaning trial</strong>：逐步降 flow → 觀察 hemodynamics</li>
      <li class="fragment">Maintain support &gt;24-48hr 穩定後才試 wean</li>
      <li class="fragment">Wean 失敗 → Bridge to VAD or Transplant 討論</li>
    </ul>
  </section>

  <section data-background-color="#001219">
    <h3>🏥 你進 ICU 看 ECMO 病人，第一件事檢查什麼？</h3>
    <ul>
      <li class="fragment"><span class="highlight">ACT</span> — anticoagulation 夠不夠？</li>
      <li class="fragment"><span class="highlight">兩隻腳的顏色和脈搏</span> — limb ischemia?</li>
      <li class="fragment"><span class="highlight">Oxygenator 膜的顏色</span> — 暗 = 效能下降</li>
      <li class="fragment"><span class="highlight">Cannula 位置</span> — 有沒有移位？</li>
      <li class="fragment"><span class="highlight">Flow 和 RPM</span> — 穩定嗎？</li>
    </ul>
  </section>
</section>

<!-- Anticoagulation -->
<section data-background-color="#001219">
  <h2>💊 MCS Anticoagulation</h2>
  <ul>
    <li>所有 MCS 都需要 anticoagulation — 血碰到人工表面就會凝</li>
    <li class="fragment"><span class="highlight">ECMO</span>：Heparin drip, aPTT 60-80 sec</li>
    <li class="fragment"><span class="highlight">Impella</span>：Heparin + Purge solution</li>
    <li class="fragment"><span class="danger">永恆的拉鋸</span>：anticoagulate 太多 → 出血 | 太少 → blood clot</li>
    <li class="fragment">每天：ACT/aPTT + Plt + Fibrinogen + Hemolysis markers (LDH, pfHb)</li>
  </ul>
</section>

<!-- VAD -->
<section data-background-color="#001219">
  <h2>🫀 VAD（概念）</h2>
  <ul>
    <li>LVAD — 左心室輔助裝置，長期支持</li>
    <li class="fragment"><span class="highlight">Bridge to Transplant</span> — 等心臟移植</li>
    <li class="fragment"><span class="highlight">Destination Therapy</span> — 不適合移植的終極方案</li>
    <li class="fragment">生活品質：可以回家、工作、旅行 — 只是背個電池包</li>
    <li class="fragment">⚠️ 需要終身 anticoagulation + driveline 照護</li>
  </ul>
</section>

<section data-background-color="#001219">
  <h2>❓ What Would You Do?</h2>
  <ol>
    <li class="fragment">ECMO Day 3, 沒有 pulsatility, lactate 上升, LV 脹大<br/><small>→ 代表什麼？LV venting 策略？</small></li>
    <li class="fragment">IABP 放了之後，右腳變白變冷，ABI 0.3<br/><small>→ 怎麼辦？可以等嗎？</small></li>
    <li class="fragment">ECMO Day 5, 開始有 pulsatility, Lactate 1.2, 穩定<br/><small>→ 可以 wean 嗎？怎麼做？</small></li>
  </ol>
</section>
`,
  },

  aortic: {
    title: "選修 E：Aortic Surgery",
    subtitle: "「最刺激的急診」",
    html: `
<section data-background-color="#001219">
  <div class="emoji-big">🚨</div>
  <h1>Aortic Surgery</h1>
  <p class="subtitle">「最刺激的急診」</p>
  <p class="author">Wilson Chao — 高醫心臟外科</p>
</section>

<section data-background-color="#001219">
  <p class="hook">💬 40 歲男性，突發撕裂性胸痛<br/>CT 一照 — Type A Dissection<br/><br/>接下來 48 小時決定生死。</p>
</section>

<!-- Initial Workup -->
<section data-background-color="#001219">
  <h2>🏥 ER 來了一個 suspected dissection</h2>
  <p>CT 之前你先做什麼？</p>
  <ul>
    <li class="fragment"><span class="highlight">ECG</span> — 排除 STEMI（dissection 吃到 coronary = 致命）</li>
    <li class="fragment"><span class="highlight">CXR</span> — widened mediastinum?</li>
    <li class="fragment"><span class="highlight">Bedside Echo</span> — pericardial effusion? AR? Wall motion?</li>
    <li class="fragment"><span class="highlight">兩手量血壓</span> — 差 &gt;20mmHg → branch involvement</li>
    <li class="fragment">然後 → <span class="danger">CT Angiography</span>（確診 gold standard）</li>
  </ul>
</section>

<!-- Classification -->
<section>
  <section data-background-color="#001219">
    <h2>📋 分類</h2>
    <h3>Stanford Classification</h3>
    <table>
      <tr><th></th><th>Type A</th><th>Type B</th></tr>
      <tr><td>範圍</td><td>涉及 <span class="danger">ascending aorta</span></td><td>只有 descending</td></tr>
      <tr><td>處理</td><td><span class="danger">緊急手術</span></td><td>先 medical（控 BP）</td></tr>
      <tr><td>死亡率</td><td>每小時增加 <span class="danger">1-2%</span></td><td>相對低</td></tr>
    </table>
    <p class="fragment" style="text-align:center;"><span class="danger">Type A = 跟時間賽跑</span></p>
  </section>

  <section data-background-color="#001219">
    <h3>DeBakey Classification</h3>
    <table>
      <tr><th>DeBakey</th><th>範圍</th><th>= Stanford</th></tr>
      <tr><td>Type I</td><td>Ascending → Arch → Descending</td><td>Type A</td></tr>
      <tr><td>Type II</td><td>只有 Ascending</td><td>Type A</td></tr>
      <tr><td>Type III</td><td>只有 Descending</td><td>Type B</td></tr>
    </table>
    <p class="fragment" style="font-size:0.85em;">很多 attending 還在用 DeBakey — 兩套都要會</p>
  </section>
</section>

<!-- Marfan -->
<section data-background-color="#001219">
  <h2>🧬 40 歲 Dissection — 你的第一個問題</h2>
  <p>「有沒有 <span class="highlight">Marfan syndrome</span> 或其他結締組織疾病？」</p>
  <ul>
    <li class="fragment"><span class="highlight">Marfan</span>、<span class="highlight">Loeys-Dietz</span>、<span class="highlight">Ehlers-Danlos (vascular type)</span></li>
    <li class="fragment">年輕、高瘦、長手指、水晶體脫位、主動脈根部擴大</li>
    <li class="fragment">家族史：有沒有人猝死、主動脈手術？</li>
    <li class="fragment">⚠️ 影響手術策略：Marfan → 更可能需要 <span class="highlight">Bentall + aggressive arch repair</span></li>
    <li class="fragment">⚠️ 影響追蹤：終身 CT 追蹤 + 家族篩檢 + <span class="highlight">遺傳諮詢</span></li>
  </ul>
</section>

<!-- CT -->
<section>
  <section data-background-color="#001219">
    <h2>🔍 CT 怎麼看</h2>
    <ul>
      <li><span class="highlight">Intimal flap</span> — 那條線就是撕裂的內膜</li>
      <li class="fragment"><span class="highlight">True lumen</span> — 通常比較小、顯影比較快</li>
      <li class="fragment"><span class="highlight">False lumen</span> — 通常比較大</li>
      <li class="fragment">看 <span class="highlight">extent</span>：從哪裡撕到哪裡？</li>
      <li class="fragment"><span class="danger">Branch vessel</span>：有沒有被吃掉？→ <span class="danger">Malperfusion syndrome</span></li>
    </ul>
  </section>

  <section data-background-color="#001219">
    <h3>⚠️ Malperfusion Syndrome</h3>
    <ul>
      <li>Dissection flap 蓋住 branch vessel → 下游缺血</li>
      <li class="fragment">Coronary → <span class="danger">MI</span></li>
      <li class="fragment">Carotid → <span class="danger">Stroke</span></li>
      <li class="fragment">SMA → <span class="danger">Bowel ischemia</span>（腹痛、lactate↑）</li>
      <li class="fragment">Renal → <span class="danger">AKI</span></li>
      <li class="fragment">Iliac → <span class="danger">Limb ischemia</span>（腿的脈搏！）</li>
    </ul>
    <p class="fragment" style="font-size:0.85em;">CT 要看的不只是 dissection 本身，而是<strong>每個器官有沒有被波及</strong></p>
  </section>
</section>

<!-- Surgery -->
<section>
  <section data-background-color="#001219">
    <h2>🔪 術式概念</h2>
    <table>
      <tr><th>術式</th><th>換什麼</th><th>什麼時候</th></tr>
      <tr><td>Ascending replacement</td><td>升主動脈</td><td>Tear 只在 ascending</td></tr>
      <tr><td>Bentall</td><td>Aortic root + valve</td><td>合併 AR / root 擴大</td></tr>
      <tr><td>Hemi-arch</td><td>升主 + 部分 arch</td><td>Tear 延伸到 arch</td></tr>
      <tr><td>Total arch</td><td>整個 arch + branches</td><td>Arch 嚴重受累</td></tr>
    </table>
  </section>

  <section data-background-color="#001219">
    <h3>DHCA — Deep Hypothermic Circulatory Arrest</h3>
    <ul>
      <li>Arch surgery 需要的特殊技術</li>
      <li class="fragment">體溫降到 <span class="highlight">18-20°C</span> → 停止所有循環 → 腦和器官靠低溫保護</li>
      <li class="fragment">安全時間：約 <span class="highlight">30-40 分鐘</span></li>
      <li class="fragment">代價：coagulopathy（凝血功能崩壞）、神經損傷風險</li>
      <li class="fragment">現代改良：Selective cerebral perfusion（只灌腦）→ 安全時間更長</li>
    </ul>
  </section>

  <section data-background-color="#001219">
    <h3>⏰ 時間就是器官</h3>
    <div class="big-number">1-2% / hr</div>
    <p style="text-align:center;">Type A 不治療的死亡率<br/>每延遲一小時，風險增加</p>
    <p class="fragment" style="text-align:center;">→ 診斷確認 → 立即通知 OR → 盡快上台</p>
  </section>
</section>

<!-- Type B -->
<section>
  <section data-background-color="#001219">
    <h2>📌 Type B — 不只是「吃藥控制」</h2>
  </section>

  <section data-background-color="#001219">
    <h3>Uncomplicated vs Complicated</h3>
    <table>
      <tr><th></th><th>Uncomplicated</th><th>Complicated</th></tr>
      <tr><td>處理</td><td>Medical（控 BP + HR）</td><td><span class="danger">TEVAR</span></td></tr>
      <tr><td>定義</td><td>沒有以下任一</td><td>Malperfusion、Rupture、Rapid expansion、Refractory pain/HTN</td></tr>
    </table>
  </section>

  <section data-background-color="#001219">
    <h3>TEVAR (Thoracic Endovascular Aortic Repair)</h3>
    <ul>
      <li>經 femoral artery 放 stent graft → 蓋住 entry tear</li>
      <li class="fragment">比開胸手術：傷口小、恢復快、mortality 低</li>
      <li class="fragment">Complicated Type B 的現代標準治療</li>
      <li class="fragment">⚠️ 不是萬能：landing zone 不夠、branch involvement → 可能需要 hybrid or open</li>
    </ul>
  </section>
</section>

<!-- Post-op -->
<section data-background-color="#001219">
  <h2>🏥 術後特殊照顧</h2>
  <ul>
    <li class="fragment"><span class="danger">Spinal cord protection</span> — 脊髓缺血 → 下肢癱瘓<br/><small>CSF drainage, MAP &gt;80</small></li>
    <li class="fragment"><span class="danger">End-organ perfusion</span> — 腸、腎、四肢<br/><small>branch vessel malperfusion</small></li>
    <li class="fragment"><span class="highlight">BP 控制</span> — SBP 100-120, HR &lt;80<br/><small>β-blocker first line</small></li>
    <li class="fragment">Coagulopathy — DHCA 的代價（大量輸血準備）</li>
  </ul>
</section>

<!-- ER Checklist -->
<section data-background-color="#001219">
  <h2>📋 Suspected Aortic Dissection — ER Protocol</h2>
  <ul>
    <li>□ <span class="highlight">兩條 large bore IV</span></li>
    <li>□ Type & Screen + <span class="highlight">備血</span>（至少 4U PRBC）</li>
    <li>□ ECG（排除 STEMI）</li>
    <li>□ CXR</li>
    <li>□ 兩手量 BP + 四肢脈搏</li>
    <li>□ Bedside Echo</li>
    <li>□ <span class="danger">CT Angiography — STAT</span></li>
    <li>□ 確認 Type A → <span class="danger">立即 call OR + 心外團隊</span></li>
    <li>□ BP control：Esmolol or Labetalol（先降 HR 再降 BP）</li>
  </ul>
</section>

<section data-background-color="#001219">
  <h2>❓ What Would You Do?</h2>
  <ol>
    <li class="fragment">CT 顯示 Type A dissection，但 BP 穩定，沒有 complication<br/><small>→ 可以觀察嗎？（提示：1-2%/hr）</small></li>
    <li class="fragment">術後 6 hr，發現雙腳無法移動<br/><small>→ Spinal cord ischemia → 怎麼處理？</small></li>
    <li class="fragment">35M, Type B, 持續背痛 + 左腳脈搏摸不到 + Lactate 6<br/><small>→ Uncomplicated or Complicated? 下一步？</small></li>
  </ol>
</section>
`,
  },

  "clerk-orientation": {
    title: "Clerk Orientation",
    subtitle: "高醫心臟血管外科見習指南",
    html: `
<!-- Title -->
<section data-background-color="#001219">
  <div class="emoji-big">🫀</div>
  <h1>Clerk Orientation</h1>
  <p class="subtitle">高醫心臟血管外科見習指南</p>
  <p class="author">趙玴祥 — KMUH CVS CR</p>
</section>

<!-- Welcome -->
<section data-background-color="#001219">
  <h2>歡迎來到心臟外科！</h2>
  <p class="hook">接下來兩週，你會看到心臟停下來再跳起來。</p>
</section>

<!-- Team -->
<section>
  <section data-background-color="#001219">
    <h2>👥 我們的團隊</h2>
  </section>

  <section data-background-color="#001219">
    <h3>科主任 & 科導師</h3>
    <table>
      <tr><td><strong>科主任</strong></td><td>潘俊彥 主任</td></tr>
      <tr><td><strong>科導師</strong></td><td>曾政哲 主治醫師</td></tr>
    </table>
  </section>

  <section data-background-color="#001219">
    <h3>主治醫師群</h3>
    <div style="display:flex;flex-wrap:wrap;gap:12px;justify-content:center;margin-top:20px;">
      <span class="highlight">謝炯昭</span>
      <span class="highlight">黃建偉</span>
      <span class="highlight">曾政哲</span>
      <span class="highlight">吳柏俞</span>
      <span class="highlight">潘俊彥</span>
      <span class="highlight">羅時逸</span>
    </div>
  </section>
</section>

<!-- Courses -->
<section>
  <section data-background-color="#001219">
    <h2>📖 課程負責</h2>
  </section>

  <section data-background-color="#001219">
    <table>
      <tr><td><strong>教學住診</strong></td><td>邱肇基 副教授</td><td>主動聯絡報告 case</td></tr>
      <tr><td><strong>文獻研討</strong></td><td>陳英富 教授</td><td>找科秘要 paper</td></tr>
      <tr><td><strong>核心課程<br/><small>（小兒心臟）</small></strong></td><td>羅時逸 醫師</td><td>主動詢問日期時間</td></tr>
      <tr><td><strong>核心課程<br/><small>（心臟外科導論）</small></strong></td><td>吳柏俞 醫師</td><td>主動詢問日期時間</td></tr>
    </table>
  </section>
</section>

<!-- Priority -->
<section data-background-color="#001219">
  <h2>🎯 學習優先順序</h2>
  <ol>
    <li class="fragment"><strong>核心課程</strong> — 上課 &gt; 一切</li>
    <li class="fragment"><strong>門診跟診</strong> — 有門診就去</li>
    <li class="fragment"><strong>跟刀</strong> — 沒課就進刀房</li>
  </ol>
  <p class="fragment" style="margin-top:30px;color:#f4a261;font-weight:bold;">⚠️ 每天必須看 primary care 病人</p>
</section>

<!-- Goals -->
<section>
  <section data-background-color="#001219">
    <h2>🏆 兩週你要帶走的東西</h2>
  </section>

  <section data-background-color="#001219">
    <ul>
      <li class="fragment">看懂術後 monitor 上的數字 — 哪些要緊、哪些可以等</li>
      <li class="fragment">至少跟 <strong>2-3 台開心手術</strong>，知道大步驟在幹什麼</li>
      <li class="fragment">照顧 1-3 個病人，寫得出 Admission Note 和 Progress Note</li>
      <li class="fragment">報一次完整的 case，讓主治醫師聽得懂</li>
      <li class="fragment">看懂 Echo / Cath 報告的 surgical indication</li>
    </ul>
  </section>
</section>

<!-- Daily Rhythm -->
<section>
  <section data-background-color="#001219">
    <h2>⏰ 一天的節奏</h2>
  </section>

  <section data-background-color="#001219">
    <table>
      <tr><td><strong>07:00–07:30</strong></td><td>Pre-round：先看你的病人。看不完就提早來。</td></tr>
      <tr><td><strong>07:30</strong></td><td>晨會<br/><small>週四：心外晨報會 + 文獻研討（10ES 討論室）</small><br/><small>週五：大外科晨會（6F 講堂）</small></td></tr>
      <tr><td><strong>08:30–</strong></td><td>跟刀 / 上課（依排程）</td></tr>
      <tr><td><strong>16:00</strong></td><td>週四：心臟內外科聯合討論會</td></tr>
      <tr><td><strong>下班前</strong></td><td>寫 Progress Note — 當天完成！</td></tr>
    </table>
  </section>
</section>

<!-- Week 1 -->
<section>
  <section data-background-color="#001219">
    <h2>📅 第一週</h2>
  </section>

  <section data-background-color="#001219">
    <table style="font-size:0.7em;">
      <thead>
        <tr><th>時間</th><th>一</th><th>二</th><th>三</th><th>四</th><th>五</th></tr>
      </thead>
      <tbody>
        <tr><td>07:30</td><td></td><td></td><td></td><td style="color:#4ecdc4;">晨會 + 文獻研討</td><td></td></tr>
        <tr><td>08:30</td><td style="color:#a8e6cf;">Orientation</td><td></td><td></td><td></td><td></td></tr>
        <tr><td>09:00</td><td></td><td style="color:#dda0dd;">教學住診</td><td></td><td></td><td></td></tr>
        <tr><td>16:00</td><td></td><td></td><td></td><td style="color:#f4a261;">內外科聯合討論</td><td></td></tr>
      </tbody>
    </table>
    <p style="margin-top:15px;font-size:0.8em;color:#aaa;">核心課程請主動與老師詢問上課日期及時間</p>
  </section>
</section>

<!-- Week 2 -->
<section>
  <section data-background-color="#001219">
    <h2>📅 第二週</h2>
  </section>

  <section data-background-color="#001219">
    <table style="font-size:0.7em;">
      <thead>
        <tr><th>時間</th><th>一</th><th>二</th><th>三</th><th>四</th><th>五</th></tr>
      </thead>
      <tbody>
        <tr><td>07:30</td><td></td><td></td><td></td><td style="color:#4ecdc4;">晨會 + 文獻研討</td><td></td></tr>
        <tr><td>08:30</td><td style="color:#ff6b6b;">核心課程</td><td></td><td></td><td></td><td></td></tr>
        <tr><td>09:00</td><td></td><td style="color:#dda0dd;">教學住診 (ICU)</td><td></td><td style="color:#4ecdc4;">文獻研討</td><td></td></tr>
        <tr><td>15:00</td><td></td><td></td><td></td><td></td><td style="color:#a8e6cf;">Feedback</td></tr>
      </tbody>
    </table>
  </section>
</section>

<!-- Patient Care -->
<section>
  <section data-background-color="#001219">
    <h2>🩺 病人照護</h2>
  </section>

  <section data-background-color="#001219">
    <ul>
      <li>分配 <strong>1-3 名病人</strong>，出院後重新分配</li>
      <li class="fragment">每天 pre-round：<strong>Vital signs → 管路 → 傷口 → 病人感受</strong></li>
      <li class="fragment">Admission Note — 24 小時內完成</li>
      <li class="fragment">Progress Note — 每天寫，SOAP 格式</li>
    </ul>
  </section>
</section>

<!-- OR -->
<section data-background-color="#001219">
  <h2>🔪 跟刀</h2>
  <ul>
    <li>兩週至少看 <strong>2-3 台開心手術</strong></li>
    <li class="fragment">沒課的時候就進刀房</li>
    <li class="fragment">你跟的主治沒開心手術？→ 去看其他主治的</li>
    <li class="fragment">刷手前先問：「可以上台嗎？」</li>
  </ul>
</section>

<!-- Records -->
<section data-background-color="#001219">
  <h2>📝 記錄與回饋</h2>
  <ul>
    <li>見習結束 → <strong>準時上網填寫教學單張</strong></li>
    <li class="fragment">上課、開會紀錄 → 教學管理系統詳填，<strong>隔天交出</strong></li>
    <li class="fragment">Feedback：第二週週五 15:00-16:00（趙玴祥醫師）</li>
  </ul>
</section>

<!-- Pro Tips -->
<section>
  <section data-background-color="#001219">
    <h2>💡 Pro Tips</h2>
  </section>

  <section data-background-color="#001219">
    <h3>Discipline</h3>
    <ul>
      <li class="fragment"><strong>Pre-round</strong> — 每天 7:30 前先看病人</li>
      <li class="fragment"><strong>Lab Data 背起來</strong> — 被問的時候不要翻手機</li>
      <li class="fragment"><strong>隨時準備 5 min case report</strong> — 你的病人，你最清楚</li>
    </ul>
  </section>

  <section data-background-color="#001219">
    <h3>態度</h3>
    <ul>
      <li class="fragment"><strong>主動聯繫老師</strong> — 不要等人來找你</li>
      <li class="fragment"><strong>問問題</strong> — 我們喜歡問問題的 clerk</li>
      <li class="fragment"><strong>準備充分再 call</strong> — 聯繫 senior 前先了解病人狀況</li>
    </ul>
  </section>
</section>

<!-- Contact -->
<section data-background-color="#001219">
  <h2>📞 聯絡方式</h2>
  <table>
    <tr><td><strong>趙玴祥醫師（公務機）</strong></td><td style="color:#4ecdc4;font-size:1.2em;">4657096</td></tr>
    <tr><td><strong>2CI 護理站</strong></td><td>院內分機查詢</td></tr>
  </table>
  <p style="margin-top:20px;color:#f4a261;">有問題直接打，不要猶豫。<br/>不確定該不該打 → 打。</p>
</section>

<!-- Navigation -->
<section>
  <section data-background-color="#001219">
    <h2>🗺️ 地理導航</h2>
  </section>

  <section data-background-color="#001219">
    <h3>2CI — CVSICU</h3>
    <ul>
      <li><strong>C 棟電梯</strong>坐到 <strong>2 樓</strong></li>
      <li>出電梯 → <strong>往牙科方向走</strong></li>
      <li>到底就是 2CI（心臟血管外科加護病房）</li>
    </ul>
  </section>

  <section data-background-color="#001219">
    <h3>刀房入口</h3>
    <ul>
      <li>刀房在 <strong>2 樓</strong></li>
      <li>👩 <strong>女生入口</strong> — 2CI 前面</li>
      <li>👨 <strong>男生入口</strong> — 心導管室旁邊</li>
    </ul>
    <p style="margin-top:15px;color:#aaa;">第一天找不到？問護理站，大家都很友善。</p>
  </section>
</section>

<!-- How to read OR schedule -->
<section>
  <section data-background-color="#001219">
    <h2>📋 看懂刀表</h2>
  </section>

  <section data-background-color="#001219">
    <h3>重點欄位</h3>
    <ul>
      <li class="fragment"><strong>術式名稱</strong> — CABG、MVR、AVR、Bentall… 先搞懂縮寫</li>
      <li class="fragment"><strong>主刀醫師</strong> — 知道今天誰開什麼</li>
      <li class="fragment"><strong>刀房號碼</strong> — 確認去對間</li>
      <li class="fragment"><strong>預估時間</strong> — 開心手術通常 4-8 小時</li>
    </ul>
  </section>

  <section data-background-color="#001219">
    <h3>策略</h3>
    <ul>
      <li class="fragment">每天早上先看刀表 → 決定今天跟哪台</li>
      <li class="fragment">優先跟 <strong>CABG、Valve</strong> — 最經典的開心手術</li>
      <li class="fragment">如果主治問「要不要上台？」→ 答案永遠是 <strong>Yes</strong></li>
    </ul>
  </section>
</section>

<!-- Common Mistakes -->
<section>
  <section data-background-color="#001219">
    <h2>⚠️ 常見 Mistakes</h2>
    <p class="hook">前人踩過的坑，你不用再踩</p>
  </section>

  <section data-background-color="#001219">
    <ul>
      <li class="fragment"><span class="danger">❌ 沒 pre-round 就去晨會</span> → 被問病人狀況答不出來</li>
      <li class="fragment"><span class="danger">❌ Progress Note 拖到隔天</span> → 越堆越多，品質越差</li>
      <li class="fragment"><span class="danger">❌ 等老師來找你上課</span> → 核心課程要<strong>你主動約</strong></li>
      <li class="fragment"><span class="danger">❌ Call 學長前沒看病人</span> → 「他怎樣？」「呃…我還沒去看」💀</li>
      <li class="fragment"><span class="danger">❌ 兩週都沒進刀房</span> → 來心外不看心臟？</li>
    </ul>
  </section>
</section>

<!-- Checklist -->
<section>
  <section data-background-color="#001219">
    <h2>✅ Checklist</h2>
  </section>

  <section data-background-color="#001219">
    <h3>📌 第一天</h3>
    <ul>
      <li>□ 找趙玴祥醫師報到</li>
      <li>□ 認識 2CI 護理站、刀房入口</li>
      <li>□ 拿到分配的病人名單</li>
      <li>□ 主動聯繫核心課程老師約時間</li>
      <li>□ 存公務機號碼 4657096</li>
    </ul>
  </section>

  <section data-background-color="#001219">
    <h3>📌 第一週結束前</h3>
    <ul>
      <li>□ 至少跟過 1 台開心手術</li>
      <li>□ 寫過 Admission Note</li>
      <li>□ 每天 Progress Note 都有交</li>
      <li>□ 參加過晨會 + 文獻研討</li>
      <li>□ 會看刀表、知道明天開什麼</li>
    </ul>
  </section>

  <section data-background-color="#001219">
    <h3>📌 離科前</h3>
    <ul>
      <li>□ 跟過 2-3 台開心手術</li>
      <li>□ 報過至少 1 次 case</li>
      <li>□ 核心課程全部上完</li>
      <li>□ 教學單張<strong>準時上網填寫</strong></li>
      <li>□ 上課/開會紀錄填教學管理系統</li>
      <li>□ 第二週週五 15:00 Feedback</li>
    </ul>
  </section>
</section>

<!-- Teaching Resources -->
<section data-background-color="#001219">
  <h2>📚 教學資源</h2>
  <p style="margin-top:20px;">所有投影片都在：</p>
  <p><a href="/teaching" style="color:#4ecdc4;font-size:1.3em;font-weight:bold;">wilsonchao.com/teaching</a></p>
  <p style="margin-top:15px;color:#aaa;">4 個必修 Module + 5 個選修主題</p>
</section>

<!-- End -->
<section data-background-color="#001219">
  <h2>有問題隨時找我 👋</h2>
  <p style="margin-top:20px;">趙玴祥</p>
  <p style="font-size:1.1em;color:#4ecdc4;">📱 4657096</p>
  <p style="color:#aaa;">祝你在心臟外科的兩週收穫滿滿！</p>
</section>
`,
  },
};
