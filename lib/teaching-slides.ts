interface SlideData {
  title: string;
  subtitle: string;
  html: string;
}

export const slides: Record<string, SlideData> = {
  "preop-assessment": {
    title: "Module 1：術前評估",
    subtitle: "「不是看數字決定開不開，是理解這顆心臟發生了什麼事」",
    html: `
<!-- Title -->
<section data-background-color="#001219">
  <div class="emoji-big">🫀</div>
  <h1>術前評估</h1>
  <p class="subtitle">「不是看數字決定開不開，是理解這顆心臟發生了什麼事」</p>
  <p class="author">Wilson Chao — 高醫心臟外科</p>
</section>

<!-- Hook -->
<section data-background-color="#001219">
  <p class="hook">💬 一份 Echo 報告寫 severe AS，AVA 0.8 cm²<br/>另一份也寫 severe AS，但 Vmax 只有 3.2 m/s<br/><br/>兩個都是 severe，但一個可能需要開刀，另一個可能不用。<br/><strong>為什麼？</strong></p>
</section>

<!-- AS: Understanding Flow Physics -->
<section>
  <section data-background-color="#001219">
    <h2>🫀 先搞懂 AS — 為什麼 Velocity 會變高？</h2>
    <p>想像你在洗車，拿著水管。</p>
    <ul>
      <li class="fragment">水龍頭全開，水流平穩 — 這是正常的 aortic valve</li>
      <li class="fragment">現在你用手指<span class="highlight">捏住水管口</span> — 水噴得更快更遠</li>
      <li class="fragment">出口變小 → <span class="highlight">流速變快</span> — 這就是 AS 的物理學</li>
      <li class="fragment">Echo 上量到的 <strong>Vmax</strong> 就是在量「水噴多快」</li>
    </ul>
    <p class="fragment" style="margin-top:20px;">所以 <span class="highlight">Vmax 越高 = 開口越小 = AS 越嚴重</span></p>
  </section>

  <section data-background-color="#001219">
    <h3>但等等 — Velocity 高就一定是 severe AS 嗎？</h3>
    <p>回到水管比喻：如果水龍頭<strong>本來就沒開多大</strong>呢？</p>
    <ul>
      <li class="fragment">水量小（low flow）→ 即使出口很小，水也噴不快</li>
      <li class="fragment">這就是 <span class="danger">Low-flow, Low-gradient AS</span> 的陷阱</li>
      <li class="fragment">AVA 算出來 &lt;1.0（嚴重），但 Vmax 不到 4、mean PG &lt;40</li>
    </ul>
  </section>

  <section data-background-color="#001219">
    <h3>⚠️ Low-flow, Low-gradient AS — 最容易被誤判的情境</h3>
    <p>75M, LVEF 30%, AVA 0.8 cm², mean PG 28 mmHg, Vmax 3.2 m/s</p>
    <ul>
      <li class="fragment">看 PG 和 Vmax → 好像不嚴重？</li>
      <li class="fragment">但 <span class="danger">EF 只有 30%</span> — 心臟沒力氣推血出去</li>
      <li class="fragment">就像水龍頭沒開大 → 出口雖小但水噴不快</li>
      <li class="fragment"><span class="highlight">怎麼辦？Dobutamine stress echo</span></li>
      <li class="fragment">給 dobutamine 增加 flow → 如果 Vmax 升高但 AVA 沒變 → <strong>True severe AS</strong></li>
      <li class="fragment">如果 AVA 跟著變大 → <strong>Pseudo-severe AS</strong>（瓣膜其實沒那麼壞，是心肌無力）</li>
    </ul>
  </section>

  <section data-background-color="#001219">
    <h3>⚠️ Paradoxical Low-flow, Low-gradient AS — EF 正常但也是 Low-flow！</h3>
    <p>LVEF 55%+, AVA 0.8 cm², mean PG 30 mmHg — EF 正常，PG 不到 severe…真的不嚴重嗎？</p>
    <ul>
      <li class="fragment">這些病人往往有 <span class="highlight">concentric hypertrophy + 小 LV cavity</span></li>
      <li class="fragment">EF preserved，但 <span class="danger">SVI（Stroke Volume Index）&lt;35 mL/m²</span> → 實際打出去的血量很少</li>
      <li class="fragment">典型：年長女性、高血壓、LVH → 「EF 好但 flow 差」的矛盾</li>
      <li class="fragment"><span class="highlight">輔助判斷</span>：CT Calcium Score（Agatston）
        <ul>
          <li>男性 &gt;2000 / 女性 &gt;1200 Agatston units → 支持 True severe AS</li>
          <li>鈣化越重 → 瓣膜越硬 → 越可能是真的嚴重</li>
        </ul>
      </li>
      <li class="fragment">⚠️ Dobutamine stress echo 在這群病人的幫助有限（EF 本來就好）→ 靠 <strong>SVI + Calcium score</strong> 綜合判斷</li>
    </ul>
  </section>

  <section data-background-color="#001219">
    <h3>📋 Echo 報告：三個一定要看的東西</h3>
    <ul>
      <li><span class="highlight">LVEF</span> — 左心收縮功能。但記住：EF 正常不代表心臟沒問題（diastolic dysfunction）</li>
      <li class="fragment"><span class="highlight">Wall motion abnormality</span> — 哪一塊心肌不動？對應哪條冠狀動脈？<br/><small>anterior wall → LAD, lateral wall → LCx, inferior wall → RCA</small></li>
      <li class="fragment"><span class="highlight">Valve disease severity</span> — 不只看數字，要理解血流動力學的意義</li>
    </ul>
  </section>
</section>

<!-- Valve Severity: Understanding, not memorizing -->
<section>
  <section data-background-color="#001219">
    <h2>📏 Valve Severity — 理解背後的邏輯</h2>
    <p>每個 valve lesion 的嚴重度指標，都在回答同一個問題：<br/><strong>「血流被影響了多少？」</strong></p>
  </section>

  <section data-background-color="#001219">
    <h3>AS：出口有多窄？</h3>
    <ul>
      <li><strong>AVA (Aortic Valve Area)</strong> — 直接量開口大小。用 continuity equation 算的</li>
      <li class="fragment"><strong>Mean PG</strong> — 跨瓣壓力差。出口越小，壓差越大</li>
      <li class="fragment"><strong>Vmax</strong> — 流速。蓮蓬頭效應</li>
      <li class="fragment">⚠️ 三個指標要一起看。不一致的時候（low-flow state），要想為什麼</li>
    </ul>
  </section>

  <section data-background-color="#001219">
    <h3>MR：漏了多少回去？</h3>
    <ul>
      <li><strong>ERO (Effective Regurgitant Orifice)</strong> — 漏洞有多大</li>
      <li class="fragment"><strong>Regurgitant Volume</strong> — 每次心跳漏回去多少血</li>
      <li class="fragment"><strong>Vena contracta</strong> — 逆流噴射束最窄的地方</li>
      <li class="fragment">想像水管有個洞 — ERO 是洞的面積，Regurgitant volume 是漏出去的水量</li>
    </ul>
  </section>

  <section data-background-color="#001219">
    <h3>💬 Mini-Case：Echo 判讀的思考</h3>
    <p>75M, Echo：LVEF 35%, AVA 0.7 cm², mean PG 25 mmHg, Vmax 3.0 m/s, moderate MR</p>
    <ul>
      <li class="fragment">AVA &lt;1.0 → severe AS by area</li>
      <li class="fragment">但 PG 和 Vmax 都不到 severe criteria → <span class="danger">矛盾！</span></li>
      <li class="fragment">看 LVEF 35% → 心臟沒力了 → <span class="highlight">Low-flow, Low-gradient AS</span></li>
      <li class="fragment">→ 需要 dobutamine stress echo 來分辨 true vs pseudo-severe</li>
      <li class="fragment">MR 在這種情境下可能是 functional（LV 擴大拉開 annulus）</li>
    </ul>
  </section>
</section>

<!-- Cath: Beyond the Numbers -->
<section>
  <section data-background-color="#001219">
    <h2>📋 Cath 報告 — 不是「塞了就開」</h2>
    <p>很多醫學生以為：三條血管塞了 → 開 CABG。<br/>沒那麼簡單。</p>
  </section>

  <section data-background-color="#001219">
    <h3>位置比 %stenosis 更重要</h3>
    <ul>
      <li class="fragment"><span class="danger">Left Main ≥50%</span> — 為什麼緊張？因為 LM 供應 <strong>2/3 的心肌</strong></li>
      <li class="fragment"><span class="highlight">Proximal LAD</span> — LAD 供應整個前壁 + septum → 塞在源頭影響最大</li>
      <li class="fragment">Distal RCA 80% vs Proximal LAD 70% — 後者更嚴重</li>
      <li class="fragment">同樣 80% stenosis，在 LM 和在 diagonal 的意義完全不同</li>
    </ul>
  </section>

  <section data-background-color="#001219">
    <h3>SYNTAX Score — 不只是一個數字</h3>
    <p>SYNTAX Score 量化的是<strong>冠狀動脈疾病的解剖複雜度</strong>。</p>
    <ul>
      <li class="fragment">考慮：病變位置、分叉、鈣化程度、完全阻塞、血管走向</li>
      <li class="fragment">SYNTAX ≤22：解剖相對單純 → PCI 能處理得跟 CABG 一樣好</li>
      <li class="fragment">SYNTAX &gt;22：解剖太複雜 → PCI 放 stent 困難、再狹窄率高 → <span class="highlight">CABG 勝出</span></li>
      <li class="fragment">SYNTAX &gt;33：高度複雜 → <span class="success">CABG 有明顯 survival benefit</span></li>
    </ul>
  </section>

  <section data-background-color="#001219">
    <h3>CABG vs PCI 的決策邏輯</h3>
    <p>不是「塞了幾條」的問題，是<strong>「這個解剖 PCI 能不能處理好」</strong>的問題。</p>
    <ul>
      <li class="fragment"><span class="danger">Multivessel CAD + DM</span> → CABG has survival benefit（<strong>FREEDOM trial</strong>）</li>
      <li class="fragment"><span class="danger">LM disease</span> → CABG vs PCI 長期比較（<strong>EXCEL / NOBLE trials</strong>）→ 長期追蹤傾向 CABG，尤其 LM + 複雜病變</li>
      <li class="fragment">為什麼 DM 特別偏向 CABG？DM 的血管 diffuse disease → stent 容易再塞</li>
      <li class="fragment">CABG 的 bypass graft 接在病變的遠端 → 即使近端繼續惡化，遠端仍有血流</li>
      <li class="fragment">PCI 只處理「那個點」→ 其他地方繼續惡化就沒辦法</li>
    </ul>
  </section>
</section>

<!-- Risk Scoring: What They Really Mean -->
<section>
  <section data-background-color="#001219">
    <h2>📊 風險評估 — 量化「開了會怎樣」</h2>
    <p>你決定這個病人需要手術。下一個問題：<br/><strong>「他承受得住嗎？」</strong></p>
  </section>

  <section data-background-color="#001219">
    <h3>STS Score — 做了什麼</h3>
    <ul>
      <li>蒐集幾十個變數（年齡、性別、BMI、DM、COPD、腎功能、LVEF、手術類型…）</li>
      <li class="fragment">丟進統計模型 → 預測這台手術的 mortality, stroke, renal failure, prolonged ventilation</li>
      <li class="fragment">不是占卜 — 是根據<strong>幾十萬筆手術資料庫</strong>算出的經驗值</li>
    </ul>
    <p class="fragment" style="margin-top:15px;"><span class="highlight">Low risk</span>: STS &lt;4% | <span class="highlight">Intermediate</span>: 4-8% | <span class="danger">High</span>: &gt;8%</p>
  </section>

  <section data-background-color="#001219">
    <h3>EuroSCORE II — 同一件事，不同角度</h3>
    <ul>
      <li>歐洲資料庫 → 變數組合不同、母群體不同</li>
      <li class="fragment">兩個都算，互相參照。如果一個說 low risk 另一個說 intermediate → 要警覺</li>
      <li class="fragment">⚠️ EuroSCORE II 對低風險病人可能<strong>高估</strong>風險</li>
    </ul>
  </section>

  <section data-background-color="#001219">
    <h3>風險評分的真正用途</h3>
    <p>不是拿來判「可以開」或「不能開」— 是拿來<strong>幫 Heart Team 對話</strong>的工具。</p>
    <ul>
      <li class="fragment">STS 2% → 「這台很安全，我們放心開」</li>
      <li class="fragment">STS 8% → 「有一定風險，TAVI 可能是更好的選擇」</li>
      <li class="fragment">STS 15% → 「傳統手術風險太高，TAVI 或 conservative treatment」</li>
      <li class="fragment">但 STS 15% + 每天跑步的老人 vs STS 8% + 臥床的老人 → <span class="highlight">分數一樣的人可以完全不同</span></li>
    </ul>
  </section>

  <section data-background-color="#001219">
    <h3>Frailty — 分數抓不到的東西</h3>
    <ul>
      <li>5-meter walk test、grip strength、albumin、functional independence</li>
      <li class="fragment">80 歲 EuroSCORE 8% 但每天跑步 → 跟同分的臥床老人完全不同</li>
      <li class="fragment"><span class="highlight">眼見為憑</span>：病人走進來的樣子，比任何分數都重要</li>
      <li class="fragment">這就是為什麼要 <strong>Heart Team 討論</strong> — 數字 + 臨床判斷</li>
    </ul>
  </section>
</section>

<!-- TAVI vs SAVR: Modern Decision Making -->
<section>
  <section data-background-color="#001219">
    <h2>🔀 AS 的現代決策：TAVI vs SAVR</h2>
    <p>2010 年以前：severe AS = 開胸換瓣膜，沒別的選擇。<br/>現在不一樣了。</p>
  </section>

  <section data-background-color="#001219">
    <h3>TAVI 改變了什麼？</h3>
    <ul>
      <li class="fragment">經股動脈放瓣膜 → 不用開胸、不用體外循環</li>
      <li class="fragment">住院 2-3 天 vs 開胸的 7-10 天</li>
      <li class="fragment">從「只給 high risk 病人」→ 現在 low risk 也可以做（PARTNER 3, Evolut Low Risk trials）</li>
    </ul>
  </section>

  <section data-background-color="#001219">
    <h3>那為什麼不全部做 TAVI？</h3>
    <ul>
      <li class="fragment"><span class="danger">耐久性</span>：TAVI valve 的長期數據還在累積。SAVR（尤其 mechanical）已經有 30 年以上的追蹤</li>
      <li class="fragment"><span class="danger">Pacemaker 風險</span>：Self-expanding valve ~15-17% / Balloon-expandable ~6-8% vs SAVR ~3% — TAVI valve 壓到 conduction system</li>
      <li class="fragment"><span class="danger">Paravalvular leak</span>：TAVI 比 SAVR 更常見（valve 沒有縫上去，靠壓力固定）</li>
      <li class="fragment"><span class="danger">Bicuspid aortic valve</span>：不對稱的 annulus → TAVI 定位困難</li>
      <li class="fragment">50 歲的病人，TAVI valve 如果只撐 15 年 → 65 歲要再做一次？</li>
    </ul>
  </section>

  <section data-background-color="#001219">
    <h3>決策框架（2024 ACC/AHA guideline 精神）</h3>
    <ul>
      <li><span class="highlight">年輕（&lt;65）+ Low risk</span> → <strong>SAVR</strong>（耐久性是關鍵考量）</li>
      <li class="fragment"><span class="highlight">65-80 歲 + Low-Intermediate risk</span> → <strong>Shared decision</strong>（Heart Team + 病人偏好）</li>
      <li class="fragment"><span class="highlight">&gt;80 歲</span> → <strong>多數傾向 TAVI</strong>（除非解剖不適合）</li>
      <li class="fragment"><span class="danger">High risk / Prohibitive risk</span> → <strong>TAVI</strong></li>
      <li class="fragment">解剖因素：bicuspid, low coronary height, 小 annulus → 影響 TAVI feasibility</li>
    </ul>
  </section>
</section>

<!-- Valve Surgery Indication -->
<section>
  <section data-background-color="#001219">
    <h2>🔄 Valve Surgery：什麼時候要開刀？</h2>
    <p>大原則：<span class="highlight">Symptomatic + Severe → 開</span><br/>難的是：Asymptomatic + Severe → 開不開？</p>
  </section>

  <section data-background-color="#001219">
    <h3>為什麼 Asymptomatic 也可能要開？</h3>
    <ul>
      <li class="fragment">Valve disease 是慢性的 → 心臟會 <strong>代償</strong></li>
      <li class="fragment">AS：LV hypertrophy → 維持 EF → 但終究會失代償</li>
      <li class="fragment">AR：LV dilatation → 維持 stroke volume → 但心肌會 fibrosis</li>
      <li class="fragment">MR：LA enlargement → 維持 forward flow → 但會 AF、PHT</li>
      <li class="fragment"><span class="danger">等到有症狀，心肌損傷可能已經不可逆</span></li>
    </ul>
  </section>

  <section data-background-color="#001219">
    <h3>Asymptomatic 開刀的觸發指標</h3>
    <ul>
      <li><strong>AS</strong>：LVEF &lt;50%、exercise test 有症狀、Vmax 快速增加（&gt;0.3 m/s/yr）</li>
      <li class="fragment"><strong>MR</strong>：LVEF &lt;60%（注意：MR 的 EF 要高一點才正常，因為有 volume overload）、LVESD &gt;40mm</li>
      <li class="fragment"><strong>AR</strong>：LVEF &lt;55%、LVESD &gt;50mm、LVEDD &gt;65mm</li>
      <li class="fragment">MV degenerative MR：repair likelihood &gt;95% + experienced center → 可以考慮早開</li>
    </ul>
  </section>
</section>

<!-- Preop Imaging Roles -->
<section data-background-color="#001219">
  <h2>🔍 術前 Imaging — 誰負責看什麼？</h2>
  <p>不是每個檢查都看一樣的東西。<strong>用對工具問對問題</strong>。</p>
  <table style="font-size:0.7em;">
    <tr><th>工具</th><th>看什麼</th><th>優勢</th></tr>
    <tr>
      <td><span class="highlight">Echo (TTE/TEE)</span></td>
      <td>Valve severity、LV/RV function、Wall motion、Pericardial effusion</td>
      <td>即時、床邊、動態血流 — <strong>第一線工具</strong></td>
    </tr>
    <tr>
      <td><span class="highlight">Cardiac Cath</span></td>
      <td>冠狀動脈 stenosis、Hemodynamics（直接量壓力）、Shunt evaluation</td>
      <td>Gold standard for coronary anatomy — <strong>同時可以 PCI</strong></td>
    </tr>
    <tr>
      <td><span class="highlight">Cardiac CT (CTA)</span></td>
      <td>Aortic annulus sizing (TAVI)、Coronary anatomy、Aorta pathology、Calcium score、Peripheral access</td>
      <td>3D 解剖 + 鈣化量化 — <strong>TAVI planning 必做</strong></td>
    </tr>
  </table>
  <p class="fragment" style="font-size:0.85em; margin-top:15px;">💡 Echo 告訴你 <em>function</em>、Cath 告訴你 <em>coronary disease</em>、CT 告訴你 <em>anatomy + calcification</em>。三者互補，不能互相取代。</p>
</section>

<!-- Heart Team -->
<section data-background-color="#001219">
  <h2>👥 Heart Team — 不是走形式</h2>
  <p>複雜的心臟病，一個醫師的視角不夠。</p>
  <ul>
    <li class="fragment"><span class="highlight">心臟外科</span>：手術風險、術式選擇</li>
    <li class="fragment"><span class="highlight">心臟內科</span>：冠心症處理、TAVI feasibility</li>
    <li class="fragment"><span class="highlight">麻醉</span>：術中風險評估</li>
    <li class="fragment"><span class="highlight">影像</span>：CT 解剖分析（TAVI sizing, coronary anatomy）</li>
    <li class="fragment">每週的<strong>內外科聯合討論會</strong>就是在做這件事</li>
    <li class="fragment">Guideline 明確建議 Heart Team 討論：LM disease, TAVI vs SAVR, high-risk patients</li>
  </ul>
</section>

<!-- Framework -->
<section data-background-color="#001219">
  <h2>🧠 思考框架</h2>
  <p style="text-align:center; font-size:1.1em;">
    <span class="fragment">這顆心臟出了什麼問題？（Pathology）</span><br/>
    <span class="fragment">→ 嚴重到需要介入嗎？（Severity + Symptoms）</span><br/>
    <span class="fragment">→ 怎麼介入？CABG / PCI / SAVR / TAVI / Repair？</span><br/>
    <span class="fragment">→ 這個<span class="highlight">「人」</span>承受得住嗎？（STS + Frailty）</span><br/>
    <span class="fragment">→ Heart Team 一起做最佳決策</span>
  </p>
</section>

<!-- What Would You Do -->
<section data-background-color="#001219">
  <h2>❓ What Would You Do?</h2>
  <ol>
    <li class="fragment">70F, severe AS (AVA 0.8, Vmax 4.5, mean PG 48), asymptomatic, LVEF 65%, STS 2.5%<br/><small>→ Asymptomatic + severe — 開不開？如果開，TAVI or SAVR？<br/>提示：她 70 歲，STS low risk。想想耐久性 vs 侵入性。</small></li>
    <li class="fragment">72M, LVEF 30%, AVA 0.9, Vmax 3.1, mean PG 22, 有 DOE<br/><small>→ 看起來不到 severe？但你看到什麼不對勁？<br/>提示：Low-flow, low-gradient。下一步做什麼？</small></li>
    <li class="fragment">55M, 3VD + DM, SYNTAX 32, LVEF 45%<br/><small>→ CABG or PCI？為什麼 DM 是關鍵因子？</small></li>
    <li class="fragment">82F, severe AS, STS 14%, 使用助行器, albumin 2.8<br/><small>→ Frailty 對你的決策有什麼影響？怎麼跟家屬談？</small></li>
  </ol>
</section>

<!-- Reference: Severity Criteria -->
<section data-background-color="#001219">
  <h2>📎 參考：Valve Severity Criteria</h2>
  <table style="font-size:0.75em;">
    <tr><th>Valve</th><th>指標</th><th>Severe Criteria</th></tr>
    <tr><td rowspan="3">AS</td><td>AVA</td><td>&lt;1.0 cm²</td></tr>
    <tr><td>Mean PG</td><td>&gt;40 mmHg</td></tr>
    <tr><td>Vmax</td><td>&gt;4 m/s</td></tr>
    <tr><td>AR</td><td>VC / ERO / RegVol / RF</td><td>&gt;6mm / &gt;0.3 cm² / &gt;60 mL / ≥50%<br/><small>+ Holodiastolic flow reversal in descending aorta</small></td></tr>
    <tr><td>MS</td><td>MVA / Mean PG</td><td>&lt;1.0 cm² / &gt;10 mmHg</td></tr>
    <tr><td>MR (Primary)</td><td>VC / ERO / RegVol</td><td>&gt;7mm / ≥0.4 cm² / ≥60 mL</td></tr>
    <tr><td>MR (Secondary)</td><td>ERO / RegVol</td><td>≥0.2 cm² / ≥30 mL</td></tr>
  </table>
  <p style="font-size:0.8em; color:#aaa;">⚠️ 數字是參考。臨床要整合 flow status、LV function、症狀一起判斷。</p>
</section>
`,
  },

  "hemodynamics": {
    title: "Module 2：Hemodynamic Monitoring",
    subtitle: "「不是盯數字，是讀懂這個人的循環在說什麼」",
    html: `
<section data-background-color="#001219">
  <div class="emoji-big">📊</div>
  <h1>Hemodynamic Monitoring</h1>
  <p class="subtitle">「不是盯數字，是讀懂這個人的循環在說什麼」</p>
  <p class="author">Wilson Chao — 高醫心臟外科</p>
</section>

<section data-background-color="#001219">
  <p class="hook">💬 CABG 術後 3 小時，你走進 ICU<br/>Monitor 上一堆數字：ABP 95/52, CVP 14, PAP 38/18, CI 1.9, SVR 1600<br/><br/>你有三秒鐘。你在想什麼？</p>
</section>

<!-- A-line: Reading the Waveform -->
<section>
  <section data-background-color="#001219">
    <h2>🔴 A-line — 不只是血壓數字</h2>
    <p>A-line 最有價值的不是那三個數字（SBP/DBP/MAP），<br/>是那條<strong>波形</strong>。</p>
  </section>

  <section data-background-color="#001219">
    <h3>讀波形：每個起伏都有意義</h3>
    <ul>
      <li class="fragment"><span class="highlight">Upstroke（上升段）</span>— LV 射血。斜率代表 LV 收縮力（dP/dt）
        <ul><li>上升段變緩 → LV 收縮力在變差</li></ul>
      </li>
      <li class="fragment"><span class="highlight">Peak</span> — 收縮壓。代表 LV 收縮力 + afterload 的交互作用</li>
      <li class="fragment"><span class="highlight">Dicrotic notch</span> — 那個小 V 型凹陷 → <strong>aortic valve 關閉</strong> 的瞬間
        <ul>
          <li>Notch 位置高 → SVR 高（血管緊）</li>
          <li>Notch 位置低或消失 → SVR 低（vasoplegia）</li>
        </ul>
      </li>
      <li class="fragment"><span class="highlight">Diastolic runoff</span> — 舒張期的下降段 → 反映 peripheral resistance</li>
    </ul>
  </section>

  <section data-background-color="#001219">
    <h3>Pulse Pressure 告訴你什麼</h3>
    <p><strong>Pulse Pressure = SBP - DBP</strong></p>
    <ul>
      <li class="fragment">正常 ~40 mmHg</li>
      <li class="fragment"><span class="danger">Narrow pulse pressure</span>（如 85/70）→ Stroke volume 在下降 → CO 可能不夠</li>
      <li class="fragment"><span class="highlight">Wide pulse pressure</span>（如 150/40）→ 想到 AR、sepsis、IABP augmentation</li>
      <li class="fragment">趨勢比單一數字重要：從 40 → 25 → 15 → 你要緊張了</li>
    </ul>
  </section>

  <section data-background-color="#001219">
    <h3>MAP — 為什麼是 65？</h3>
    <ul>
      <li>MAP 代表的是<strong>器官灌流的驅動壓力</strong></li>
      <li class="fragment">MAP = DBP + 1/3 × Pulse Pressure（因為 diastole 比 systole 長）</li>
      <li class="fragment">多數器官的 autoregulation 下限在 MAP ~60-65 mmHg</li>
      <li class="fragment">低於這個值 → 器官血流被動依賴壓力 → <span class="danger">灌流不足</span></li>
      <li class="fragment">⚠️ 但慢性高血壓的病人，autoregulation 曲線右移 → 可能需要更高的 MAP</li>
    </ul>
  </section>
</section>

<!-- CVP -->
<section data-background-color="#001219">
  <h2>CVP — 最被誤解的數字</h2>
  <ul>
    <li>CVP 代表：<span class="highlight">RA 壓力</span> ≈ 右心前負荷的間接指標</li>
    <li class="fragment"><span class="danger">CVP 不代表 volume status</span> — 這是最常見的誤解</li>
    <li class="fragment">CVP 8 的病人可以是 dry（RV compliance 好），也可以是 overloaded（RV failure）</li>
    <li class="fragment"><span class="highlight">正確用法</span>：看 <strong>趨勢</strong> + <strong>對治療的反應</strong></li>
    <li class="fragment">給 500mL fluid → CVP 從 6 → 8，BP 上升 → volume responsive ✅</li>
    <li class="fragment">給 500mL fluid → CVP 從 12 → 18，BP 沒變 → 別再給了 ❌</li>
  </ul>
</section>

<!-- Swan-Ganz: Understanding Wedge Pressure -->
<section>
  <section data-background-color="#001219">
    <h2>🫀 Swan-Ganz — 理解 Wedge Pressure</h2>
    <p>PA catheter 的精華在 <strong>PCWP（Wedge Pressure）</strong>。<br/>但它到底在量什麼？</p>
  </section>

  <section data-background-color="#001219">
    <h3>Wedge Pressure 的生理意義</h3>
    <ul>
      <li class="fragment">Balloon 充氣 → 擋住 PA 分支的血流</li>
      <li class="fragment">catheter tip 前方變成一段<strong>靜止的血柱</strong>（no flow）</li>
      <li class="fragment">靜止血柱 → 壓力傳導 → 一路傳到 <span class="highlight">LA</span></li>
      <li class="fragment">所以 PCWP ≈ LA pressure ≈ <strong>LVEDP（左心舒張末壓）</strong></li>
      <li class="fragment">LVEDP 反映的是 <span class="highlight">LV 的前負荷</span></li>
    </ul>
  </section>

  <section data-background-color="#001219">
    <h3>PCWP 高 vs 低的臨床意義</h3>
    <ul>
      <li class="fragment"><span class="danger">PCWP &gt;18 mmHg</span> → LV filling pressure 高 → 血液回堵到肺 → <strong>肺水腫</strong></li>
      <li class="fragment"><span class="highlight">PCWP &lt;8 mmHg</span> → LV 前負荷不足 → 可能需要 volume</li>
      <li class="fragment">心外術後常見情境：CI 低 + PCWP 高 → LV failure → 不是缺水，是心臟沒力氣</li>
      <li class="fragment">CI 低 + PCWP 低 → Preload 不足 → 可以試 fluid challenge</li>
    </ul>
  </section>

  <section data-background-color="#001219">
    <h3>CI / SVRI — 心臟輸出 vs 血管阻力</h3>
    <p>理解這兩個數字的<strong>關係</strong>，比記住公式重要。</p>
    <ul>
      <li class="fragment"><strong>CI (Cardiac Index)</strong> = CO / BSA → 心臟每分鐘打出多少血（標準化後）
        <ul><li>正常 2.5-4.0 L/min/m² | <span class="danger">&lt;2.2 = Low CO</span></li></ul>
      </li>
      <li class="fragment"><strong>SVRI</strong> = 血管對血流的阻力（標準化後）
        <ul><li>正常 1200-2000 dyne·s/cm⁵/m²</li></ul>
      </li>
      <li class="fragment">想像水管系統：CI 是幫浦出水量，SVRI 是水管口徑</li>
      <li class="fragment">幫浦沒力（低 CI）→ 水管會自動縮小（高 SVRI）來維持水壓（MAP）→ <span class="danger">代償！</span></li>
      <li class="fragment">所以 MAP 看起來還行，但 CI 已經掉了 → <span class="danger">BP 會騙人</span></li>
    </ul>
  </section>
</section>

<!-- SvO2 and Lactate -->
<section>
  <section data-background-color="#001219">
    <h2>🧪 SvO₂ + Lactate — 組織有沒有拿到氧？</h2>
    <p>所有的 hemodynamic monitoring 最終只有一個問題：<br/><strong>「組織有沒有得到足夠的氧？」</strong></p>
  </section>

  <section data-background-color="#001219">
    <h3>SvO₂ — 身體告訴你的答案</h3>
    <ul>
      <li class="fragment"><span class="highlight">SvO₂</span>（從 PA catheter 抽）= 混合靜脈血氧飽和度</li>
      <li class="fragment">代表：身體「用完氧之後」剩多少</li>
      <li class="fragment">正常 65-75% — 身體送出去的氧，用了 25-35%，剩下回來</li>
      <li class="fragment"><span class="danger">SvO₂ &lt;60%</span> → 身體在搶氧 → CO 不夠 or 氧消耗太大（發燒、shivering）</li>
      <li class="fragment">SvO₂ &gt;80% → 看起來好？不一定。可能組織無法利用氧（sepsis — cytopathic hypoxia）</li>
    </ul>
    <p class="fragment" style="margin-top:15px; font-size:0.9em;">
      💡 <strong>ScvO₂ vs SvO₂</strong>：沒有 PA catheter 時，從 CVC 抽的是 <span class="highlight">ScvO₂</span>（上腔靜脈血氧）。ScvO₂ 通常比 SvO₂ 高 ~5%（因為不包含 coronary sinus 的低氧血）。趨勢一致可互相參考，但<strong>絕對值不能直接互換</strong>。
    </p>
  </section>

  <section data-background-color="#001219">
    <h3>Lactate — BP 會騙人，Lactate 不會</h3>
    <ul>
      <li class="fragment"><span class="highlight">正常 &lt;2 mmol/L</span></li>
      <li class="fragment">Lactate 升高 = 組織在做<strong>無氧代謝</strong>（多數情況）= 氧不夠</li>
      <li class="fragment">&gt;4 mmol/L → <span class="danger">mortality 顯著上升</span></li>
      <li class="fragment"><span class="highlight">趨勢是關鍵</span>：
        <ul>
          <li>2 → 1.5 → 1.0 → 治療有效 ✅</li>
          <li>2 → 3.5 → 5.0 → 灌流在惡化，你的治療不夠 ❌</li>
        </ul>
      </li>
      <li class="fragment">⚠️ <span class="danger">Type B Lactic Acidosis</span> — Lactate 升高 ≠ 一定是灌流不足！
        <ul>
          <li><strong>Epinephrine</strong>：刺激 glycolysis → 即使灌流 OK 也會升 Lactate</li>
          <li><strong>肝瘀血</strong>：RV failure → hepatic congestion → Lactate 清除變差</li>
          <li><strong>CPB 後代謝效應</strong>：rewarming + washout → 短暫性 Lactate spike</li>
          <li>→ Lactate 在升但灌流指標 OK？先想有沒有 Type B 原因</li>
        </ul>
      </li>
    </ul>
  </section>

  <section data-background-color="#001219">
    <h3>💬 Mini-Case：BP 騙人</h3>
    <p>術後 6hr, BP 100/60 看起來還行</p>
    <p>但 Lactate 從 2.1 → 3.8 → 5.2</p>
    <ul>
      <li class="fragment">BP 看起來 OK，是因為 SVR 代償性升高</li>
      <li class="fragment">但 CO 已經不夠 → 末梢灌流不足 → Lactate 在爬</li>
      <li class="fragment">→ <span class="danger">不要被 BP 騙了。去量 CI、看 SvO₂、摸四肢、看尿量</span></li>
    </ul>
  </section>
</section>

<!-- Shock Differential -->
<section>
  <section data-background-color="#001219">
    <h2>💥 Shock — 用邏輯鑑別，不是背表格</h2>
    <p>Shock 的本質：<strong>組織灌流不足</strong>。<br/>鑑別的邏輯：問三個問題。</p>
  </section>

  <section data-background-color="#001219">
    <h3>三個問題定位 Shock Type</h3>
    <ol>
      <li class="fragment"><strong>心臟在打嗎？</strong>（CO 高 or 低？）
        <ul>
          <li>CO 低 → Pump failure（cardiogenic）or Tank empty（hypovolemic）or Tank blocked（obstructive）</li>
          <li>CO 高/正常 → 水管太鬆（vasodilatory / distributive）</li>
        </ul>
      </li>
      <li class="fragment"><strong>血管是緊還是鬆？</strong>（SVR 高 or 低？）
        <ul>
          <li>SVR 高 → 身體在代償 CO 不足（cardiogenic/hypovolemic）</li>
          <li>SVR 低 → 血管不會收縮（vasoplegia / sepsis）</li>
        </ul>
      </li>
      <li class="fragment"><strong>心臟前面有沒有擋住？</strong>（CVP 高 + CO 低 = obstructive？）
        <ul>
          <li>CVP ↑↑ + CO ↓↓ → Tamponade、Tension PTX、massive PE</li>
        </ul>
      </li>
    </ol>
  </section>

  <section data-background-color="#001219">
    <h3>摸四肢就對了一半</h3>
    <ul>
      <li class="fragment"><span class="highlight">冷 + 濕</span> → SVR 高 → 身體在代償 → Cardiogenic / Hypovolemic / Obstructive</li>
      <li class="fragment"><span class="highlight">暖 + 乾（或暖 + 濕）</span> → SVR 低 → Vasodilatory（sepsis, post-CPB vasoplegia）</li>
      <li class="fragment">心外術後最常見的組合：<span class="danger">冷四肢 + 低 CI + 高 SVR = Low CO Syndrome</span></li>
    </ul>
  </section>

  <section data-background-color="#001219">
    <h2>⚠️ 術後 Tamponade — 最不能漏的診斷</h2>
    <p><span class="danger">= Obstructive Shock</span></p>
    <ul>
      <li class="fragment">低血壓 + JVP 升高 + 心音變小（Beck's triad）</li>
      <li class="fragment"><span class="danger">Chest tube output 突然減少</span> — 不是好事！塞住了 → 血積在 pericardium</li>
      <li class="fragment">Equalization of diastolic pressures：CVP ≈ PCWP ≈ PAd → 都被壓在一起</li>
      <li class="fragment">Echo 可以確認，但如果 hemodynamically unstable → <span class="danger">不要等 echo，直接 re-explore</span></li>
      <li class="fragment">⚠️ <span class="danger">術後 tamponade 往往 atypical</span> — localized clot 可能只壓 RA 或 RV
        <ul>
          <li>Beck's triad 可能不完整（JVP 不一定高、心音不一定小）</li>
          <li>只壓 RA → isolated RA collapse → CVP 升高但不典型</li>
          <li>只壓 RV → RV failure pattern → 容易誤判為單純 RV dysfunction</li>
          <li>→ 術後低血壓 + CT output 驟減 → <strong>高度懷疑就對了</strong></li>
        </ul>
      </li>
    </ul>
  </section>
</section>

<!-- Low CO Syndrome -->
<section>
  <section data-background-color="#001219">
    <h2>💔 Low Cardiac Output Syndrome</h2>
    <p>心外術後<span class="danger">最常見也最重要</span>的問題</p>
  </section>

  <section data-background-color="#001219">
    <h3>為什麼術後心臟會「沒力」？</h3>
    <ul>
      <li class="fragment"><span class="highlight">Myocardial stunning</span> — CPB 期間的缺血 + reperfusion injury → 心肌暫時性收縮不良</li>
      <li class="fragment"><span class="highlight">Incomplete revascularization</span> — graft 沒接好或 spasm</li>
      <li class="fragment"><span class="highlight">Pre-existing dysfunction</span> — 術前 EF 就差的病人</li>
      <li class="fragment"><span class="highlight">Volume issues</span> — 太多或太少都不行</li>
      <li class="fragment">關鍵：<span class="danger">MAP 不一定低</span>（SVR 代償）→ 要看 CI + Lactate + SvO₂ + 尿量 + 末梢</li>
    </ul>
  </section>

  <section data-background-color="#001219">
    <h3>處理邏輯（Flowchart 思考）</h3>
    <ul>
      <li class="fragment">1️⃣ <span class="danger">先排除致命且可逆的</span>：
        <ul>
          <li>Tamponade → Echo / clinical signs → Re-explore</li>
          <li>Tension PTX → 聽診 + CXR → Needle decompression</li>
          <li>Acute graft failure → ECG ST changes → 回 OR</li>
        </ul>
      </li>
      <li class="fragment">2️⃣ 優化 Preload：PCWP 的 sweet spot（通常 12-18）</li>
      <li class="fragment">3️⃣ 選 Inotrope（見下一段）</li>
      <li class="fragment">4️⃣ 仍不夠 → Mechanical support（IABP → Impella → VA-ECMO）
        <ul>
          <li>⚠️ IABP：<strong>SHOCK II trial</strong> 顯示在 AMI cardiogenic shock 中 IABP 未改善 30-day mortality → 角色受到質疑</li>
          <li>但心外術後 Low CO（post-cardiotomy shock）仍有其角色 — 機轉不同於 AMI</li>
          <li><strong>Impella</strong>：更強的 LV unloading（CP ~3.7 L/min），適合需要更多支持但不到 ECMO 的情境</li>
          <li><strong>VA-ECMO</strong>：終極支持，快速惡化時可直接上</li>
        </ul>
      </li>
    </ul>
  </section>
</section>

<!-- Vasopressor / Inotrope Logic -->
<section>
  <section data-background-color="#001219">
    <h2>💉 升壓劑 / 強心劑 — Flowchart 思考</h2>
    <p>不是背表格。是問：<strong>「這個人的循環哪裡出問題？」</strong></p>
  </section>

  <section data-background-color="#001219">
    <h3>Step 1：心臟沒力，還是血管太鬆？</h3>
    <ul>
      <li class="fragment"><strong>CI 低 + SVR 高</strong> → 心臟沒力 + 血管在代償
        <ul><li>需要：<span class="highlight">強心 + 降後負荷</span> → <strong>Milrinone</strong>（PDE3 inhibitor：inotrope + vasodilator）</li></ul>
      </li>
      <li class="fragment"><strong>CI 低 + SVR 低</strong> → 心臟沒力 + 血管也鬆
        <ul><li>需要：<span class="highlight">強心 + 撐血壓</span> → <strong>Dobutamine + Norepinephrine</strong></li></ul>
      </li>
      <li class="fragment"><strong>CI 正常/高 + SVR 低</strong> → 心臟在打，血管太鬆（vasoplegia）
        <ul><li>需要：<span class="highlight">純血管收縮</span> → <strong>Norepinephrine ± Vasopressin</strong></li></ul>
      </li>
    </ul>
  </section>

  <section data-background-color="#001219">
    <h3>Step 2：右心還是左心？</h3>
    <ul>
      <li class="fragment"><strong>RV failure</strong> 的處理跟 LV failure 不一樣！
        <ul>
          <li>RV failure → PAP 高 → RV 推不過去</li>
          <li>需要降 PVR：<span class="highlight">Milrinone ± inhaled Nitric Oxide (iNO)</span></li>
          <li>⚠️ Volume 要小心：RV failure 給太多 volume → RV 脹大 → septum 推向 LV → LV 也跟著不好</li>
        </ul>
      </li>
    </ul>
  </section>

  <section data-background-color="#001219">
    <h3>藥物的「個性」</h3>
    <ul>
      <li><span class="highlight">Milrinone</span> — inodilator。強心 + 降後負荷 + 降 PVR。缺點：會降 BP → 低 SVR 的人不適合</li>
      <li class="fragment"><span class="highlight">Dobutamine</span> — β1 + β2。強心 + vasodilation（β2 效果）。⚠️ 可能降低 SVR → <span class="danger">血壓偏低時反而 BP 更掉</span>。最常用的 first-line inotrope</li>
      <li class="fragment"><span class="highlight">Norepinephrine</span> — α 為主。純升壓。不太增加 HR（跟 dopamine 不同）</li>
      <li class="fragment"><span class="highlight">Vasopressin</span> — V1 receptor。Post-CPB vasoplegia 時可作為 <strong>first-line</strong>（機制：CPB 後 vasopressin store depletion → 補充式用藥特別合理）。也常作為 NE 的 second-line add-on</li>
      <li class="fragment"><span class="highlight">Epinephrine</span> — α + β 都強。Post-CPB weaning 困難時有些中心作為 first-line。高劑量：<span class="danger">HR 飆升 + splanchnic vasoconstriction + type B lactic acidosis</span>（不是灌流不足，是藥物代謝效應）</li>
    </ul>
  </section>

  <section data-background-color="#001219">
    <h3>💬 Mini-Case：藥怎麼選？</h3>
    <p>CABG 術後 3hr：MAP 55, CI 1.6, SVRI 2200, CVP 14, PCWP 20, Lactate 4.5</p>
    <ul>
      <li class="fragment">CI 1.6（低）+ SVRI 2200（高）→ 心臟沒力 + 血管代償性收縮</li>
      <li class="fragment">PCWP 20 → 前負荷夠了（甚至偏高）→ 不需要再給 volume</li>
      <li class="fragment">→ <span class="highlight">Milrinone</span>：強心 + 降後負荷 → 讓 LV 更容易射血</li>
      <li class="fragment">如果加了 Milrinone 後 MAP 更掉（vasodilation 效果太強）→ 加 <span class="highlight">Norepinephrine</span> 撐壓</li>
      <li class="fragment">2 小時後 CI 仍 &lt;2.0 + Lactate 持續上升 → 考慮 <span class="danger">IABP</span></li>
    </ul>
  </section>
</section>

<!-- Non-invasive -->
<section>
  <section data-background-color="#001219">
    <h2>🟢 Non-invasive 工具</h2>
  </section>

  <section data-background-color="#001219">
    <h3>FloTrac / EV1000</h3>
    <ul>
      <li>Pulse contour analysis → 從 A-line 波形估算 SV 和 CO</li>
      <li class="fragment">最有用的指標：<span class="highlight">SVV (Stroke Volume Variation)</span></li>
      <li class="fragment">SVV &gt;13% → 這個病人給 fluid 後 CO 可能會上升（volume responsive）</li>
      <li class="fragment"><span class="danger">限制</span>：arrhythmia、spontaneous breathing、open chest → 不準</li>
    </ul>
  </section>

  <section data-background-color="#001219">
    <h3>🫀 Bedside Echo — 心外 ICU 最強武器</h3>
    <ul>
      <li><strong>LV function</strong> — EF eyeballing、wall motion</li>
      <li class="fragment"><span class="danger">Pericardial effusion / Tamponade</span> — 術後第一個要排除的！</li>
      <li class="fragment"><strong>RV function</strong> — TAPSE &lt;16mm → RV dysfunction</li>
      <li class="fragment">IVC collapsibility → volume responsiveness 的快速評估</li>
      <li class="fragment">新的 valvular regurgitation → 術後 valve/graft 問題？</li>
    </ul>
  </section>

  <section data-background-color="#001219">
    <h3>🔍 術後 Bedside TEE — TTE 看不清時的終極武器</h3>
    <p>心外術後病人常有：敷料、chest tube、皮下氣腫 → TTE 窗口差。<strong>TEE 直接從食道看</strong>。</p>
    <ul>
      <li class="fragment"><span class="highlight">LV / RV function</span> — 術後 stunning？New wall motion abnormality？Graft failure？</li>
      <li class="fragment"><span class="highlight">Pericardial effusion</span> — 尤其 posterior loculated collection，TTE 容易漏</li>
      <li class="fragment"><span class="highlight">Volume status</span> — LV cavity size、IVC/SVC、mitral inflow pattern</li>
      <li class="fragment"><span class="highlight">New valvular issue</span> — SAM after MV repair？Paravalvular leak？</li>
      <li class="fragment">⚠️ 需要鎮靜 + 有 esophageal injury 風險 → 不是常規，但 <strong>hemodynamic instability 原因不明時非常有價值</strong></li>
    </ul>
  </section>
</section>

<!-- Post-CPB Vasoplegia -->
<section>
  <section data-background-color="#001219">
    <h2>🔥 Post-CPB Vasoplegia — 心外術後特有的 Shock</h2>
    <p>CABG 術後 off CPB，CI 2.8 看起來不差，但 MAP 55、SVR 低到不行、四肢暖暖的。<br/><strong>心臟在打，但血管完全不收縮。</strong></p>
  </section>

  <section data-background-color="#001219">
    <h3>為什麼會 Vasoplegia？</h3>
    <ul>
      <li class="fragment"><span class="highlight">Complement activation</span> — 血液接觸 CPB circuit 的異物表面 → C3a/C5a → 全身性發炎</li>
      <li class="fragment"><span class="highlight">iNOS upregulation</span> — 大量 NO 釋放 → smooth muscle 無法收縮</li>
      <li class="fragment"><span class="highlight">Vasopressin store depletion</span> — CPB 過程中 vasopressin 大量消耗 → 術後儲備不足</li>
      <li class="fragment">高風險：長 CPB time、術前 ACEi/ARB、amiodarone、LVEF 差</li>
    </ul>
  </section>

  <section data-background-color="#001219">
    <h3>辨識 + 處理</h3>
    <ul>
      <li class="fragment"><strong>表現</strong>：Warm shock — 四肢暖、CO adequate、MAP 低、SVR 極低 → 像 sepsis 但剛下 CPB</li>
      <li class="fragment"><strong>第一線</strong>：<span class="highlight">Norepinephrine</span>（α1 效果撐 SVR）</li>
      <li class="fragment"><strong>加上</strong>：<span class="highlight">Vasopressin</span> 0.01-0.04 U/min — 補充被耗盡的 vasopressin stores，機轉上特別合理</li>
      <li class="fragment"><strong>Rescue</strong>：<span class="danger">Methylene Blue</span> 1.5-2 mg/kg — 抑制 NO/cGMP pathway
        <ul>
          <li>NE + Vasopressin 都拉不起來時考慮</li>
          <li>⚠️ 禁忌：G6PD deficiency、SSRI 併用（serotonin syndrome）</li>
        </ul>
      </li>
      <li class="fragment">記住：Vasoplegia ≠ volume depletion → <span class="danger">不要一直灌 fluid</span></li>
    </ul>
  </section>
</section>

<!-- What Would You Do -->
<section data-background-color="#001219">
  <h2>❓ What Would You Do?</h2>
  <ol>
    <li class="fragment">術後 6 小時，BP 80/50, CVP 18, CI 1.8, SVRI 2100, PCWP 22, Lactate 5.1<br/><small>→ CI 低 + SVRI 高 + PCWP 高 → 什麼 syndrome？第一個排除什麼？用什麼藥？</small></li>
    <li class="fragment">Chest tube 前 2 小時 output 200ml/hr，突然變 20ml/hr，同時 BP 從 100 掉到 70<br/><small>→ CT 不是好了，是塞住了。你在擔心什麼？下一步？</small></li>
    <li class="fragment">術後 4hr, MAP 58, CI 2.8, SVRI 650, Lactate 2.5, 四肢暖<br/><small>→ CO 正常但 SVR 低 → 什麼 type？為什麼心外術後會發生？用什麼藥？</small></li>
    <li class="fragment">A-line 波形：upstroke 變緩、pulse pressure 從 40 縮到 15、dicrotic notch 消失<br/><small>→ 波形在告訴你什麼？（提示：LV contractility + SVR）</small></li>
  </ol>
</section>

<!-- Reference -->
<section data-background-color="#001219">
  <h2>📎 參考：Hemodynamic 正常值</h2>
  <table style="font-size:0.75em;">
    <tr><th>Parameter</th><th>Normal</th><th>臨床意義</th></tr>
    <tr><td>MAP</td><td>&gt;65 mmHg</td><td>器官灌流驅動壓</td></tr>
    <tr><td>CVP</td><td>2-8 mmHg</td><td>RA pressure（看趨勢）</td></tr>
    <tr><td>PCWP</td><td>6-12 mmHg</td><td>LV 前負荷</td></tr>
    <tr><td>CI</td><td>2.5-4.0 L/min/m²</td><td>&lt;2.2 = Low CO</td></tr>
    <tr><td>SVRI</td><td>1200-2000</td><td>血管阻力</td></tr>
    <tr><td>SvO₂</td><td>65-75%</td><td>&lt;60% = 組織缺氧</td></tr>
    <tr><td>Lactate</td><td>&lt;2 mmol/L</td><td>&gt;4 = 嚴重灌流不足</td></tr>
  </table>
  <p style="font-size:0.8em; color:#aaa;">⚠️ 數字只是參考。永遠要結合臨床情境判斷。</p>
</section>
`,
  },

  "ventilator": {
    title: "Module 3：呼吸器",
    subtitle: "「先搞懂為什麼需要它，才知道什麼時候可以拿掉」",
    html: `
<section data-background-color="#001219">
  <div class="emoji-big">🌬️</div>
  <h1>呼吸器</h1>
  <p class="subtitle">「先搞懂為什麼需要它，才知道什麼時候可以拿掉」</p>
  <p class="author">Wilson Chao — 高醫心臟外科</p>
</section>

<section data-background-color="#001219">
  <p class="hook">💬 CABG 術後 4 小時<br/>護理師 call：「SpO₂ 85%！病人在掙扎！」<br/><br/>你跑進 ICU。你有 60 秒。<br/>你的腦中跑過什麼？</p>
</section>

<!-- Why Positive Pressure Ventilation? -->
<section>
  <section data-background-color="#001219">
    <h2>🫁 先從生理開始：為什麼需要正壓通氣？</h2>
    <p>理解呼吸器，要先理解<strong>自主呼吸</strong>是怎麼運作的。</p>
  </section>

  <section data-background-color="#001219">
    <h3>自主呼吸 vs 正壓通氣</h3>
    <ul>
      <li class="fragment"><strong>自主呼吸</strong>：橫膈下降 → 胸腔<span class="highlight">負壓</span> → 空氣被「吸」進來
        <ul><li>負壓 → 促進靜脈回流（venous return ↑）→ CO ↑</li></ul>
      </li>
      <li class="fragment"><strong>正壓通氣</strong>：機器把空氣<span class="highlight">推</span>進去 → 胸腔正壓
        <ul>
          <li>正壓 → <span class="danger">阻礙靜脈回流</span>（venous return ↓）→ CO 可能 ↓</li>
          <li>正壓 → 增加 RV afterload（擠壓肺血管）</li>
        </ul>
      </li>
      <li class="fragment">這就是為什麼心外術後放呼吸器，<span class="danger">hemodynamics 要特別注意</span></li>
    </ul>
  </section>

  <section data-background-color="#001219">
    <h3>心外術後為什麼需要呼吸器？</h3>
    <ul>
      <li class="fragment">全身麻醉 → 呼吸中樞抑制 → 還沒醒</li>
      <li class="fragment">CPB 後肺 atelectasis + SIRS → 氣體交換變差</li>
      <li class="fragment">術後疼痛 → 不敢深呼吸 → hypoventilation</li>
      <li class="fragment">Hemodynamic instability → 需要控制呼吸來穩定循環</li>
      <li class="fragment">目標：<span class="highlight">讓肺休息、維持氧合、等心臟和身體穩定後盡快拔管</span></li>
    </ul>
  </section>
</section>

<!-- Modes: Scenario-based -->
<section>
  <section data-background-color="#001219">
    <h2>⚙️ Mode — 用情境理解，不要背定義</h2>
  </section>

  <section data-background-color="#001219">
    <h3>情境 1：剛從 OR 推回 ICU，病人還沒醒</h3>
    <ul>
      <li class="fragment">病人完全沒有自主呼吸 → 機器要<strong>全部代勞</strong></li>
      <li class="fragment">→ <span class="highlight">AC mode（Assist-Control）</span>：你設定 RR 和 TV，機器保證每次都給到</li>
      <li class="fragment">Volume Control (VC-AC)：設定 TV → 機器保證這個 volume 每次都給
        <ul><li>好處：TV 穩定、minute ventilation 可預測</li>
        <li>注意：如果肺 compliance 變差（atelectasis），pressure 會飆高</li></ul>
      </li>
      <li class="fragment">Pressure Control (PC-AC)：設定 pressure → TV 隨 compliance 變化
        <ul><li>好處：限制 peak pressure → 保護肺</li>
        <li>注意：如果 compliance 變差，TV 會掉 → 可能通氣不足</li></ul>
      </li>
    </ul>
  </section>

  <section data-background-color="#001219">
    <h3>情境 2：術後 6 小時，病人開始有呼吸</h3>
    <ul>
      <li class="fragment">病人漸漸醒了，開始自己呼吸</li>
      <li class="fragment">如果還是 AC mode → 每次病人的呼吸都觸發機器全力給 → <span class="danger">可能 over-ventilation</span></li>
      <li class="fragment">→ 可以考慮切到 <span class="highlight">PS mode（Pressure Support）</span></li>
      <li class="fragment">PS：病人自己決定什麼時候吸、吸多快 → 機器只是<strong>幫忙推一把</strong></li>
      <li class="fragment">PS 越低 → 幫助越少 → 越接近自己呼吸 → 這就是 <span class="highlight">weaning</span> 的過程</li>
    </ul>
  </section>

  <section data-background-color="#001219">
    <h3>心外術後的起始設定（為什麼這樣設）</h3>
    <ul>
      <li><strong>Mode</strong>: VC-AC → 因為病人還沒醒，需要完全控制</li>
      <li class="fragment"><strong>TV: 6-8 mL/kg IBW</strong> → 為什麼不多給？因為大 TV → 肺過度膨脹 → VILI（ventilator-induced lung injury）
        <ul>
          <li>IBW 怎麼算？<strong>Male: 50 + 0.91 × (身高 cm − 152.4)</strong>｜<strong>Female: 45.5 + 0.91 × (身高 cm − 152.4)</strong></li>
          <li>例：170 cm 男性 → IBW = 50 + 0.91 × 17.6 = <span class="highlight">66 kg</span> → TV = 396-528 mL</li>
        </ul>
      </li>
      <li class="fragment"><strong>RR: 12-16</strong> → 正常呼吸速率，調整看 ABG 的 PCO₂</li>
      <li class="fragment"><strong>FiO₂: 100% → 快速調降到 ≤40%</strong> → 高 FiO₂ 有氧毒性 + 會造成 absorption atelectasis</li>
      <li class="fragment"><strong>PEEP: 5 cmH₂O</strong> → 為什麼？往下看</li>
    </ul>
  </section>
</section>

<!-- Peak vs Plateau Pressure -->
<section>
  <section data-background-color="#001219">
    <h2>📊 Peak vs Plateau Pressure — 鑑別高壓原因</h2>
    <p>呼吸器壓力報警了！但壓力高不是一個診斷，要問：<strong>是哪種壓力高？</strong></p>
  </section>

  <section data-background-color="#001219">
    <h3>兩種壓力，兩種意義</h3>
    <ul>
      <li class="fragment"><span class="highlight">Peak Pressure（尖峰壓）</span> = Airway Resistance + Lung Compliance + PEEP
        <ul><li>包含管路阻力 + 肺的彈性 + PEEP → 是「全部加總」</li></ul>
      </li>
      <li class="fragment"><span class="highlight">Plateau Pressure（平台壓）</span> = Lung Compliance + PEEP
        <ul><li>做 inspiratory hold → 氣流停止 → 剩下的壓力反映肺本身 → 目標 &lt; 30 cmH₂O</li></ul>
      </li>
      <li class="fragment"><span class="highlight">Driving Pressure（驅動壓）</span> = Plateau − PEEP → 反映肺泡的真正壓力負擔 → <span class="danger">目標 &lt; 15 cmH₂O</span>
        <ul><li>最新證據：Driving Pressure 比 TV 更能預測 VILI 和死亡率</li></ul>
      </li>
    </ul>
  </section>

  <section data-background-color="#001219">
    <h3>鑑別：Peak 高了，問題在哪？</h3>
    <table style="font-size:0.8em;">
      <tr><th>情境</th><th>Peak</th><th>Plateau</th><th>代表</th><th>原因</th></tr>
      <tr><td>🔴 Resistance 問題</td><td>↑↑</td><td>正常</td><td>氣道阻力增加</td><td>Mucus plug、Bronchospasm、ET tube kink/biting</td></tr>
      <tr><td>🔴 Compliance 問題</td><td>↑↑</td><td>↑↑</td><td>肺變硬了</td><td>PTX、Atelectasis、Pulmonary edema、Abdominal distension</td></tr>
    </table>
    <p class="fragment" style="font-size:0.85em;">💡 <strong>一句話記法</strong>：Peak 高 + Plateau 正常 → 問題在「管子」；Peak 高 + Plateau 也高 → 問題在「肺」</p>
  </section>
</section>

<!-- PEEP: Understanding the Concept -->
<section>
  <section data-background-color="#001219">
    <h2>💨 PEEP — 不只是一個數字</h2>
    <p>PEEP 可能是呼吸器最重要也最容易被誤解的設定。</p>
  </section>

  <section data-background-color="#001219">
    <h3>為什麼需要 PEEP？</h3>
    <ul>
      <li class="fragment">正壓通氣 → 吐氣結束時肺泡容易<span class="danger">塌陷（atelectasis）</span></li>
      <li class="fragment">尤其心外術後：CPB 後肺 compliance 差、surfactant 受損、肺水腫</li>
      <li class="fragment">PEEP = 在吐氣末保持一個正壓 → <span class="highlight">撐住肺泡不讓它塌</span></li>
      <li class="fragment">肺泡打開 → 增加氣體交換面積 → 改善 oxygenation</li>
      <li class="fragment">這就是 <span class="highlight">lung recruitment</span> 的概念</li>
    </ul>
  </section>

  <section data-background-color="#001219">
    <h3>PEEP 太高的代價 — 心外特別要注意</h3>
    <ul>
      <li class="fragment">PEEP ↑ → 胸腔正壓 ↑ → <span class="danger">venous return ↓ → CO ↓</span></li>
      <li class="fragment">PEEP ↑ → 肺血管被壓 → <span class="danger">RV afterload ↑ → RV 可能撐不住</span></li>
      <li class="fragment">心外術後的病人，RV 功能本來就可能脆弱（CPB injury, PHT）</li>
      <li class="fragment">所以心外 ICU 的 PEEP 通常用 <span class="highlight">5 cmH₂O</span> 起步，需要時慢慢調</li>
      <li class="fragment">加 PEEP 前先問自己：<strong>「這個人的 RV 撐得住嗎？」</strong></li>
    </ul>
  </section>

  <section data-background-color="#001219">
    <h3>PEEP 的甜蜜點</h3>
    <p>太低 → 肺泡塌陷 → 低血氧<br/>太高 → 壓 RV → CO 掉<br/>要找到 <span class="highlight">最佳 PEEP</span>：改善氧合但不影響 hemodynamics</p>
    <ul>
      <li class="fragment">觀察：加 PEEP 5→8 → SpO₂ 改善 + BP 穩定 → 可以</li>
      <li class="fragment">觀察：加 PEEP 8→12 → SpO₂ 沒改善 + BP 掉 → 太高了，退回來</li>
    </ul>
  </section>
</section>

<!-- Fighting Vent -->
<section>
  <section data-background-color="#001219">
    <h2>😤 Fighting Vent — 系統性處理</h2>
    <p>回到開場的情境。病人在掙扎，SpO₂ 掉。<br/><strong>不要只給 sedation！先找原因。</strong></p>
  </section>

  <section data-background-color="#001219">
    <h3>60 秒決策樹</h3>
    <ol>
      <li class="fragment"><span class="danger">致命的先排除（10 秒）</span>：
        <ul>
          <li>Tension PTX → 氣管偏移 + 單側沒呼吸音 → Needle decompression</li>
          <li>Tamponade → JVP 升高 + BP 掉 + CT output 減少 → Re-explore</li>
          <li>Massive PE → 突然 desaturation + RV failure signs</li>
        </ul>
      </li>
      <li class="fragment"><span class="highlight">管路問題（20 秒）</span>：
        <ul>
          <li>ET tube 位置：太深（right main bronchus）、太淺（快掉出來）、打折</li>
          <li>Mucus plug → suction！心外術後痰多是常見的</li>
          <li>先 disconnect + <strong>手動 bagging + 100% O₂</strong> → 穩定後再找原因</li>
        </ul>
      </li>
      <li class="fragment"><span class="highlight">設定問題</span>：
        <ul>
          <li>Flow rate 不夠 → 病人吸不到氣 → 用力吸 → fighting</li>
          <li>Trigger 太鈍 → 病人呼吸但觸發不了 → 焦慮</li>
          <li>Auto-PEEP（air trapping）→ COPD 病人特別注意</li>
        </ul>
      </li>
      <li class="fragment"><span class="highlight">病人問題</span>：疼痛、膀胱脹、焦慮、缺氧、高碳酸血症</li>
    </ol>
  </section>

  <section data-background-color="#001219">
    <h3>💬 Mini-Case：Fighting Vent</h3>
    <p>CABG 術後 4hr, SpO₂ 85%, RR 30, 病人在掙扎</p>
    <ul>
      <li class="fragment">第一步：<span class="highlight">Disconnect + 手動 bagging + 100% O₂</span></li>
      <li class="fragment">同時：聽診（兩側有呼吸音嗎？）、看 chest tube、check A-line</li>
      <li class="fragment">如果 bagging 容易 + SpO₂ 回來 → 不是肺的問題，可能是 vent 設定 → 重新調</li>
      <li class="fragment">如果 bagging 困難 + 單側沒呼吸音 → <span class="danger">PTX or mucus plug or ET tube 問題</span></li>
      <li class="fragment">如果 bagging OK 但 SpO₂ 還是差 → 想 intrapulmonary shunt（atelectasis, pulmonary edema）</li>
    </ul>
  </section>
</section>

<!-- Weaning: Readiness, not Numbers -->
<section>
  <section data-background-color="#001219">
    <h2>🎯 Weaning — 不是看數字，是看「這個人準備好了嗎」</h2>
    <p>Weaning 的思考不是「夠不夠格拔管」，<br/>而是「<strong>有什麼理由繼續插著？</strong>」</p>
  </section>

  <section data-background-color="#001219">
    <h3>Weaning Readiness：四個面向</h3>
    <ol>
      <li class="fragment"><span class="highlight">循環穩定嗎？</span>
        <ul>
          <li>不需要高劑量 inotrope</li>
          <li>沒有 active bleeding</li>
          <li>不是正在 rewarming（shivering 會增加 O₂ consumption）</li>
        </ul>
      </li>
      <li class="fragment"><span class="highlight">神經功能 OK 嗎？</span>
        <ul>
          <li>醒了嗎？聽指令嗎？</li>
          <li>有力氣咳嗎？（咳嗽能力 = 拔管後保護氣道的能力）</li>
          <li>Cuff leak test — 有漏氣 = 氣道沒有太腫</li>
        </ul>
      </li>
      <li class="fragment"><span class="highlight">呼吸功能 OK 嗎？</span>
        <ul>
          <li>P/F ratio &gt;200（或至少 &gt;150）</li>
          <li>FiO₂ ≤40%、PEEP ≤5</li>
          <li>沒有嚴重的 respiratory acidosis</li>
        </ul>
      </li>
      <li class="fragment"><span class="highlight">RSBI (f/VT) &lt;105</span> — 最有實證的預測指標
        <ul>
          <li>快而淺的呼吸 = 呼吸肌撐不住 = 拔管容易失敗</li>
        </ul>
      </li>
    </ol>
  </section>

  <section data-background-color="#001219">
    <h3>RSBI — 為什麼這個數字有用？</h3>
    <ul>
      <li><strong>RSBI = f / VT</strong>（呼吸次數 ÷ 潮氣容積 in Liters）</li>
      <li class="fragment">背後的邏輯：呼吸肌疲勞的人會<span class="danger">呼吸又快又淺</span>
        <ul>
          <li>RR 升高（因為每口吸不到夠的氣）</li>
          <li>VT 下降（因為肌肉沒力）</li>
          <li>→ f/VT 比值飆高 → 呼吸模式不永續</li>
        </ul>
      </li>
      <li class="fragment">例：RR 20, VT 0.4L → RSBI = 50 → 很輕鬆 → <span class="success">拔！</span></li>
      <li class="fragment">例：RR 35, VT 0.2L → RSBI = 175 → 快要不行了 → <span class="danger">不拔</span></li>
    </ul>
  </section>

  <section data-background-color="#001219">
    <h3>SBT（Spontaneous Breathing Trial）</h3>
    <ul>
      <li class="fragment">PS 5-8 or T-piece → 讓病人「幾乎靠自己呼吸」30-120 分鐘</li>
      <li class="fragment">觀察：RR、SpO₂、HR、BP、病人表情、用力程度</li>
      <li class="fragment">通過 SBT → <span class="success">拔！不要拖</span>。延遲拔管 = 增加 VAP 風險</li>
      <li class="fragment">失敗 → 找原因：心臟？肺？神經肌肉？營養？→ 處理後再試</li>
    </ul>
  </section>
</section>

<!-- Troubleshooting -->
<section>
  <section data-background-color="#001219">
    <h2>🔧 Troubleshooting — 心外特有問題</h2>
  </section>

  <section data-background-color="#001219">
    <h3>Desaturation 鑑別</h3>
    <ul>
      <li class="fragment"><span class="highlight">Atelectasis</span> — <strong>最常見</strong>，尤其左下肺（心臟手術壓迫 + phrenic nerve）</li>
      <li class="fragment"><span class="highlight">Pleural effusion</span> — 術後第 2-3 天常見</li>
      <li class="fragment"><span class="danger">Flash pulmonary edema</span> — LV failure → 急性肺水腫 → 突然 desaturation + 粉紅泡沫痰
        <ul><li>這是心臟的問題，不是呼吸器的問題 → 治心臟！</li></ul>
      </li>
      <li class="fragment"><span class="danger">Pneumothorax</span> — 聽診 + 看 chest tube</li>
      <li class="fragment">Phrenic nerve injury → 單側橫膈膜不動 → CXR 看到 hemidiaphragm 升高</li>
    </ul>
  </section>

  <section data-background-color="#001219">
    <h3>Weaning 失敗的心外特有原因</h3>
    <ul>
      <li class="fragment"><span class="highlight">Phrenic nerve injury</span> — 心臟手術時 phrenic nerve 在 pericardium 上，容易被壓或冰到
        <ul><li>CXR：hemidiaphragm 升高</li>
        <li>影響：FRC 下降 → weaning 困難 → 可能需要 tracheostomy</li></ul>
      </li>
      <li class="fragment"><span class="highlight">Cardiac-related weaning failure</span>
        <ul>
          <li>正壓通氣其實在「幫」LV failure 的病人（降低 LV afterload）</li>
          <li>拔管 → 回到負壓呼吸 → LV afterload 增加 → LV failure 惡化 → 拔管失敗</li>
          <li>所以 SBT 失敗的病人，要想：是肺不好，還是<strong>心臟不好</strong>？</li>
        </ul>
      </li>
    </ul>
  </section>
</section>

<!-- ABG -->
<section>
  <section data-background-color="#001219">
    <h2>🧪 ABG 判讀 — 心外術後的思考</h2>
    <p>ABG 不只是算公式。是理解<strong>身體在說什麼</strong>。</p>
  </section>

  <section data-background-color="#001219">
    <h3>術後常見 Pattern 與背後意義</h3>
    <ul>
      <li class="fragment"><span class="highlight">Respiratory acidosis</span>（pH↓ PCO₂↑）
        <ul><li>通氣不足 → 還沒醒、sedation 太深、mucus plug</li>
        <li>處理：增加 RR 或 TV → 排出更多 CO₂</li></ul>
      </li>
      <li class="fragment"><span class="danger">Metabolic acidosis</span>（pH↓ HCO₃↓ + Lactate↑）
        <ul><li><strong>這不是呼吸器的問題！</strong>是灌流不足 → 無氧代謝 → lactic acidosis</li>
        <li>不要用增加 RR 來「代償」→ 要<span class="danger">治療根本原因（改善 CO）</span></li></ul>
      </li>
      <li class="fragment"><span class="highlight">Mixed</span>（respiratory + metabolic acidosis）
        <ul><li>更嚴重：通氣不足 + 灌流不足 → 同時發生</li>
        <li>多見於 Low CO Syndrome 合併 hypoventilation</li></ul>
      </li>
    </ul>
  </section>

  <section data-background-color="#001219">
    <h3>💬 ABG 實戰題</h3>
    <p>pH 7.28, PCO₂ 32, HCO₃ 15, Lactate 4.8</p>
    <ul>
      <li class="fragment">pH 低 → acidosis</li>
      <li class="fragment">HCO₃ 低 → metabolic acidosis 為主</li>
      <li class="fragment">Winter's formula: 預期 PCO₂ = 1.5 × 15 + 8 = 30.5 → 實際 32 → compensation 剛好</li>
      <li class="fragment"><span class="danger">Lactate 4.8 → Lactic acidosis → 組織灌流不足！</span></li>
      <li class="fragment">→ 這不是呼吸器的問題。去看 hemodynamics — <strong>是心臟或循環出問題</strong></li>
      <li class="fragment">→ 不要把 RR 調上去「代償」metabolic acidosis。要去治療根本原因</li>
    </ul>
  </section>
</section>

<!-- What Would You Do -->
<section data-background-color="#001219">
  <h2>❓ What Would You Do?</h2>
  <ol>
    <li class="fragment">術後 2hr, 還在 AC mode, 突然 peak pressure 從 22 → 38 cmH₂O, SpO₂ 92%<br/><small>→ 第一步：做 <strong>inspiratory hold 看 plateau pressure</strong>。<br/>如果 Plateau 正常（&lt;30）→ Resistance 問題 → suction mucus plug？bronchospasm？tube kink？<br/>如果 Plateau 也高（&gt;30）→ Compliance 問題 → PTX？atelectasis？pulmonary edema？<br/>→ 同時算 Driving Pressure（Plateau − PEEP），&gt;15 cmH₂O 要警覺 VILI 風險</small></li>
    <li class="fragment">SBT 30 分鐘後，RR 35, VT 200mL, SpO₂ 91%, BP 從 110 升到 150<br/><small>→ RSBI = 175 → 不能拔。但為什麼 BP 升高？<br/>提示：負壓呼吸 → LV afterload 增加 → 可能是 cardiac weaning failure</small></li>
    <li class="fragment">術後 Day 3，weaning 失敗兩次，CXR 左 hemidiaphragm 升高<br/><small>→ 你在想什麼？<br/>Phrenic nerve injury → 下一步做什麼確認？處理方式？</small></li>
    <li class="fragment">術後 4hr, ABG: pH 7.22, PCO₂ 35, HCO₃ 14, Lactate 6.2, SpO₂ 95%<br/><small>→ SpO₂ 正常但 Lactate 6.2 → 問題不在肺。問題在哪？</small></li>
  </ol>
</section>

<!-- Reference -->
<section data-background-color="#001219">
  <h2>📎 參考：ABG Compensation 公式</h2>
  <table style="font-size:0.75em;">
    <tr><th>Disorder</th><th>Compensation Formula</th></tr>
    <tr><td>Metabolic acidosis</td><td>預期 PCO₂ = 1.5 × [HCO₃] + 8 ± 2 (Winter's)</td></tr>
    <tr><td>Metabolic alkalosis</td><td>預期 PCO₂ = 0.7 × [HCO₃] + 21 ± 2</td></tr>
    <tr><td>Resp. acidosis (acute)</td><td>每 PCO₂ ↑10 → HCO₃ ↑1</td></tr>
    <tr><td>Resp. acidosis (chronic)</td><td>每 PCO₂ ↑10 → HCO₃ ↑3.5</td></tr>
    <tr><td>Resp. alkalosis (acute)</td><td>每 PCO₂ ↓10 → HCO₃ ↓2</td></tr>
    <tr><td>Resp. alkalosis (chronic)</td><td>每 PCO₂ ↓10 → HCO₃ ↓5</td></tr>
  </table>
  <p style="font-size:0.8em; color:#aaa;">步驟：pH → PCO₂ → HCO₃ → AG → Compensation 夠不夠？→ 不夠 = mixed disorder</p>
</section>

<!-- Reference: Vent Settings -->
<section data-background-color="#001219">
  <h2>📎 參考：心外術後呼吸器起始設定</h2>
  <table style="font-size:0.8em;">
    <tr><th>Setting</th><th>Value</th><th>為什麼</th></tr>
    <tr><td>Mode</td><td>VC-AC</td><td>病人沒醒，完全控制</td></tr>
    <tr><td>TV</td><td>6-8 mL/kg IBW</td><td>避免 VILI（IBW: M=50+0.91×(Ht-152.4), F=45.5+0.91×(Ht-152.4)）</td></tr>
    <tr><td>RR</td><td>12-16</td><td>看 ABG 的 PCO₂ 調整</td></tr>
    <tr><td>FiO₂</td><td>100% → ≤40%</td><td>避免 O₂ toxicity</td></tr>
    <tr><td>PEEP</td><td>5 cmH₂O</td><td>防 atelectasis，但顧 RV</td></tr>
  </table>
</section>
`,
  },

  "icu-care": {
    title: "Module 4：Cardiac Surgery ICU Care",
    subtitle: "「為什麼這樣做，而不只是做什麼」",
    html: `
<section data-background-color="#001219">
  <div class="emoji-big">🏥</div>
  <h1>Cardiac Surgery ICU Care</h1>
  <p class="subtitle">「為什麼這樣做，而不只是做什麼」</p>
  <p class="author">Wilson Chao — 高醫心臟外科</p>
</section>

<section data-background-color="#001219">
  <p class="hook">💬 65M, CABG ×3 (LIMA-LAD, SVG-OM, SVG-RCA)<br/>CPB time 90 min, cross clamp 55 min<br/>剛推進 ICU，身上掛滿管線<br/><br/>你是值班 R1，接下來 12 小時都是你的。<br/>從哪裡開始？</p>
</section>

<!-- Section 1: Drain 管理 -->
<section>
  <section data-background-color="#001219">
    <h2>🩸 Drain 管理 — 不只是量 output</h2>
    <p>先問自己：<strong>為什麼要放 chest tube？</strong></p>
  </section>

  <section data-background-color="#001219">
    <h3>為什麼放？</h3>
    <ul>
      <li class="fragment">開胸手術 = 在胸腔/縱膈腔製造一個大傷口</li>
      <li class="fragment">CPB 後凝血功能受損 → 術後<strong>一定會</strong>有出血</li>
      <li class="fragment">如果血積在心包膜裡出不來 → <span class="danger">Cardiac Tamponade</span></li>
      <li class="fragment">所以 drain 的核心功能：<strong>讓血出來，別讓它壓住心臟</strong></li>
    </ul>
  </section>

  <section data-background-color="#001219">
    <h3>看什麼？怎麼看？</h3>
    <ul>
      <li class="fragment"><strong>量</strong>：q1h 記錄。正常趨勢：第一小時最多，逐漸減少</li>
      <li class="fragment"><strong>性質</strong>：
        <ul>
          <li>鮮紅、不凝固 → 持續 surgical bleeding</li>
          <li>暗紅 → 可能是 coagulopathy（瀰漫性滲血）</li>
          <li>漿液性（serous）→ 正常癒合過程</li>
        </ul>
      </li>
      <li class="fragment"><strong>趨勢比單一數字重要</strong></li>
    </ul>
  </section>

  <section data-background-color="#001219">
    <h3>⚠️ 最危險的情境</h3>
    <p><span class="danger">Output 突然從 150→20 mL/hr，同時 BP 開始掉</span></p>
    <ul>
      <li class="fragment">直覺反應：「出血減少了，很好！」</li>
      <li class="fragment">真正的意思：<span class="danger">drain 被血塊塞住了</span></li>
      <li class="fragment">血出不來 → 壓心臟 → Tamponade → Obstructive shock</li>
      <li class="fragment">驗證：Echo 看 pericardial collection + diastolic collapse</li>
    </ul>
  </section>

  <section data-background-color="#001219">
    <h3>什麼時候拔？</h3>
    <ul>
      <li class="fragment">Output &lt;100 mL/8hr（或 &lt;50 mL/8hr 更保守）</li>
      <li class="fragment">性質轉為漿液性</li>
      <li class="fragment">CXR 沒有顯著積液</li>
      <li class="fragment">通常 Day 1-2 可以拔</li>
      <li class="fragment">⚠️ 拔完要追 CXR — 確認沒有 pneumothorax 或大量積液</li>
    </ul>
  </section>
</section>

<!-- Section 2: 術後出血 vs 凝血異常 -->
<section>
  <section data-background-color="#001219">
    <h2>🔍 術後出血：Surgical vs Coagulopathy</h2>
    <p>出血了 → 不是只喊 re-explore，先鑑別</p>
  </section>

  <section data-background-color="#001219">
    <h3>💬 Case：術後 3hr，CT output 持續 250 mL/hr</h3>
    <p>你怎麼想？</p>
    <ul>
      <li class="fragment">先問：<strong>血的性質？</strong>鮮紅 vs 暗紅滲出</li>
      <li class="fragment">再看：<strong>Lab</strong> — ACT/aPTT、Plt、Fibrinogen、INR</li>
    </ul>
  </section>

  <section data-background-color="#001219">
    <h3>鑑別邏輯</h3>
    <table>
      <tr><th></th><th>Surgical Bleeding</th><th>Coagulopathy</th></tr>
      <tr><td>血的樣子</td><td>鮮紅、量大、不太止</td><td>暗紅、到處滲、wound 也在滲</td></tr>
      <tr><td>Lab</td><td>Coag 正常</td><td>ACT↑ / Plt↓ / Fibrinogen↓ / INR↑</td></tr>
      <tr><td>對治療的反應</td><td>輸血不會改善</td><td>矯正凝血因子 → 改善</td></tr>
      <tr><td>處理</td><td><span class="danger">Re-explore</span></td><td>Protamine / FFP / Plt / Cryo / TEG-guided</td></tr>
    </table>
  </section>

  <section data-background-color="#001219">
    <h3>🧪 TEG 快速判讀 — 不用背數字，記邏輯</h3>
    <p>TEG 把凝血過程畫成一條曲線，每個階段對應一個問題：</p>
    <table style="font-size:0.75em;">
      <tr><th>TEG 參數</th><th>反映什麼</th><th>異常時</th><th>治療</th></tr>
      <tr><td><span class="highlight">R time</span>（反應時間）</td><td>凝血因子啟動速度</td><td>R 延長 → 凝血因子不足</td><td>FFP / Protamine（如果 heparin 殘餘）</td></tr>
      <tr><td><span class="highlight">MA</span>（最大振幅）</td><td>血小板 + Fibrinogen 的強度</td><td>MA 低 → 血塊太弱</td><td>Platelet（MA 主要靠 Plt）/ Cryoprecipitate（Fibrinogen 低時）</td></tr>
      <tr><td><span class="highlight">LY30</span>（30 分鐘溶解率）</td><td>纖維蛋白溶解</td><td>LY30 &gt;3% → Fibrinolysis</td><td>TXA（Tranexamic acid）</td></tr>
    </table>
    <p class="fragment" style="font-size:0.85em;">💡 <strong>一句話記法</strong>：R = 凝血因子 → FFP｜MA = 血小板強度 → Plt/Cryo｜LY30 = 溶太快 → TXA</p>
  </section>

  <section data-background-color="#001219">
    <h3>為什麼 CPB 後容易 coagulopathy？</h3>
    <ul>
      <li class="fragment"><strong>Hemodilution</strong> — 管路 prime 1-2L 液體，稀釋凝血因子</li>
      <li class="fragment"><strong>血小板消耗</strong> — 血碰到人工管路表面 → 活化 + 消耗</li>
      <li class="fragment"><strong>Heparin 殘餘</strong> — Protamine 可能沒完全中和</li>
      <li class="fragment"><strong>Fibrinolysis</strong> — CPB 會活化纖溶系統</li>
      <li class="fragment"><strong>Hypothermia</strong> — 低溫抑制凝血酶活性</li>
    </ul>
  </section>

  <section data-background-color="#001219">
    <h3>Re-explore Criteria</h3>
    <ul>
      <li><span class="danger">&gt;400 mL</span> 第一小時</li>
      <li><span class="danger">&gt;200 mL/hr</span> × 連續 2-4 hr</li>
      <li><span class="danger">&gt;1500 mL</span> 12 hr 總量</li>
      <li>合併 hemodynamic instability</li>
    </ul>
    <p class="fragment">⚠️ 這些數字是<strong>參考</strong>，不是死線。臨床判斷 + 趨勢更重要。<br/>Lab 正常但量持續大 → 高度懷疑 surgical bleeding → re-explore。</p>
  </section>
</section>

<!-- Section 3: Fluid Management -->
<section>
  <section data-background-color="#001219">
    <h2>💧 Fluid Management — CVP 不是唯一答案</h2>
    <p>「CVP 12，需不需要給 fluid？」<br/>這個問題本身就問錯了。</p>
  </section>

  <section data-background-color="#001219">
    <h3>為什麼 CVP 不夠？</h3>
    <ul>
      <li class="fragment">CVP 反映<strong>右心前負荷</strong>，不是全身 volume status</li>
      <li class="fragment">同樣 CVP 12 — 一個是 hypovolemia with RV dysfunction，一個是 euvolemia</li>
      <li class="fragment">CVP 受 intrathoracic pressure、compliance、tricuspid function 影響</li>
      <li class="fragment"><strong>單一 CVP 值沒有意義</strong> — 要看趨勢和整合其他指標</li>
    </ul>
  </section>

  <section data-background-color="#001219">
    <h3>整合評估：四個指標一起看</h3>
    <table>
      <tr><th>指標</th><th>告訴你什麼</th><th>目標</th></tr>
      <tr><td><span class="highlight">CVP 趨勢</span></td><td>右心前負荷變化方向</td><td>看趨勢，不看絕對值</td></tr>
      <tr><td><span class="highlight">Urine output</span></td><td>腎灌流是否足夠</td><td>&gt;0.5 mL/kg/hr</td></tr>
      <tr><td><span class="highlight">Lactate</span></td><td>組織灌流是否足夠</td><td>&lt;2 mmol/L，且在下降</td></tr>
      <tr><td><span class="highlight">CI (Cardiac Index)</span></td><td>心臟打出去夠不夠</td><td>&gt;2.2 L/min/m²</td></tr>
    </table>
  </section>

  <section data-background-color="#001219">
    <h3>💬 Case：要不要給 fluid？</h3>
    <p>術後 4hr：CVP 8, UO 0.3 mL/kg/hr, Lactate 3.2, CI 2.0</p>
    <ul>
      <li class="fragment">CVP 8 不算高，但更重要的是：</li>
      <li class="fragment">UO 偏低 + Lactate 偏高 + CI 偏低 → 組織灌流不足</li>
      <li class="fragment">→ 試 fluid challenge（250-500 mL crystalloid over 15-20 min）</li>
      <li class="fragment">→ 看反應：CI 有沒有上來？UO 有沒有改善？</li>
      <li class="fragment">→ 如果 fluid 沒反應 → 不是 preload 的問題 → 考慮 inotrope</li>
    </ul>
  </section>

  <section data-background-color="#001219">
    <h3>⚠️ 術後特殊情境：「腫一圈」</h3>
    <ul>
      <li class="fragment">CPB 後 capillary leak → 第三空間積水 → 病人看起來很腫</li>
      <li class="fragment">但<strong>血管內可能是乾的</strong>（intravascular depletion + interstitial edema）</li>
      <li class="fragment">這時候：病人看起來腫，但 UO 少、Lactate 高 → 還是需要 volume</li>
      <li class="fragment">Day 2-3 capillary leak 回復 → 開始利尿 → 把第三空間的水拉回來</li>
    </ul>
  </section>
</section>

<!-- Section 4: 術後 AF -->
<section>
  <section data-background-color="#001219">
    <h2>💓 術後 AF — 為什麼心臟手術後特別容易？</h2>
    <p>~30% 發生率，高峰 Day 2-3。不是巧合。</p>
  </section>

  <section data-background-color="#001219">
    <h3>為什麼？— 五個因素疊加</h3>
    <ul>
      <li class="fragment"><strong>1. 心房 manipulation</strong> — 手術中直接碰心房（尤其 valve surgery）→ 心房肌肉受傷 + 發炎</li>
      <li class="fragment"><strong>2. 全身 SIRS</strong> — CPB 引起的全身發炎反應 → 心房組織水腫</li>
      <li class="fragment"><strong>3. 電解質失衡</strong> — 術後低 K⁺、低 Mg²⁺ → 降低心肌電穩定性</li>
      <li class="fragment"><strong>4. 交感神經亢奮</strong> — 疼痛、壓力、catecholamine → 心率加快</li>
      <li class="fragment"><strong>5. Volume shifts</strong> — Day 2-3 第三空間的水回來 → 心房擴張</li>
    </ul>
    <p class="fragment">→ 這就是為什麼高峰在 Day 2-3：<strong>發炎最高 + 水開始回流</strong></p>
  </section>

  <section data-background-color="#001219">
    <h3>處理邏輯</h3>
    <ul>
      <li class="fragment"><strong>Step 1：穩不穩定？</strong>
        <ul>
          <li>Hemodynamically unstable（SBP &lt;90, altered consciousness, chest pain）→ <span class="danger">Synchronized cardioversion</span></li>
          <li>Stable → 往下走</li>
        </ul>
      </li>
      <li class="fragment"><strong>Step 2：矯正誘因</strong>
        <ul>
          <li>K⁺ &gt;4.0, Mg²⁺ &gt;2.0</li>
          <li>控制疼痛</li>
          <li>Volume status 評估</li>
        </ul>
      </li>
      <li class="fragment"><strong>Step 3：Rate control</strong>
        <ul>
          <li>首選 <span class="highlight">Amiodarone</span>（心臟術後最常用，不太降血壓）</li>
          <li>替代 <span class="highlight">β-blocker</span>（如果 LVEF 正常）</li>
        </ul>
      </li>
      <li class="fragment"><strong>Step 4：Anticoagulation</strong> — AF 持續 &gt;48hr → 用 <span class="highlight">CHA₂DS₂-VASc</span> 評估 stroke risk
        <ul>
          <li>C=CHF, H=HTN, A₂=Age≥75(×2), D=DM, S₂=Stroke/TIA(×2), V=Vascular dz, A=Age 65-74, Sc=Sex(F)</li>
          <li>Score ≥2（男）或 ≥3（女）→ 建議 anticoagulate</li>
          <li>⚠️ 但心外術後要<strong>平衡出血風險</strong>：術後 24-48hr 內 anticoagulation 可能增加 re-explore 風險</li>
          <li>通常 Day 2-3 後，bleeding 風險下降再開始 heparin bridge 或 warfarin</li>
        </ul>
      </li>
    </ul>
  </section>

  <section data-background-color="#001219">
    <h3>Amiodarone 在心外 ICU 的實際用法</h3>
    <ul>
      <li>Loading：<span class="highlight">150 mg IV over 10 min</span></li>
      <li>Maintenance：<span class="highlight">1 mg/min × 6hr → 0.5 mg/min × 18hr</span></li>
      <li class="fragment">優點：rate + rhythm control，不太影響血壓</li>
      <li class="fragment">缺點：長期用有甲狀腺、肺毒性（但術後短期用不太擔心）</li>
      <li class="fragment">⚠️ 如果病人已經在用 β-blocker → 小心 bradycardia</li>
    </ul>
  </section>
</section>

<!-- Section 5: Wound Care -->
<section>
  <section data-background-color="#001219">
    <h2>🩹 Wound Care — Sternotomy 傷口照護</h2>
    <p>Sternotomy wound infection = <span class="danger">Mediastinitis</span> = 致命</p>
  </section>

  <section data-background-color="#001219">
    <h3>為什麼 sternotomy 感染特別嚴重？</h3>
    <ul>
      <li class="fragment">胸骨下面就是心臟和大血管</li>
      <li class="fragment">感染深入 → <span class="danger">Mediastinitis</span>（死亡率 10-25%）</li>
      <li class="fragment">不像其他傷口可以慢慢處理 — 需要 aggressive debridement + 長期抗生素</li>
    </ul>
  </section>

  <section data-background-color="#001219">
    <h3>Risk factors & 預防</h3>
    <ul>
      <li class="fragment"><strong>Risk factors</strong>：DM（最重要）、BMI &gt;30、bilateral IMA harvesting、re-operation、CPB time 長</li>
      <li class="fragment"><strong>血糖控制</strong>：術後 <span class="highlight">140-180 mg/dL</span>（STS guideline）</li>
      <li class="fragment"><strong>Prophylactic antibiotics</strong>：術前 + 術後 48hr</li>
      <li class="fragment"><strong>Sternal precaution</strong>：6-8 週內避免用手撐起身體、提重物</li>
    </ul>
  </section>

  <section data-background-color="#001219">
    <h3>🚩 Red Flags</h3>
    <ul>
      <li class="fragment">Sternal wound 紅腫、疼痛加劇</li>
      <li class="fragment">傷口滲液（尤其是膿性分泌物）</li>
      <li class="fragment">胸骨不穩定（sternal click / instability）</li>
      <li class="fragment">持續發燒 + WBC 升高 + wound 變化</li>
      <li class="fragment">→ 立即通知主治，可能需要 CT + surgical intervention</li>
    </ul>
  </section>

  <section data-background-color="#001219">
    <h3>🌡️ 術後發燒 — 時間就是線索</h3>
    <p>不是所有發燒都要 antibiotics，先看<strong>什麼時候開始燒</strong>：</p>
    <table style="font-size:0.8em;">
      <tr><th>時間</th><th>最可能原因</th><th>處理邏輯</th></tr>
      <tr><td><span class="highlight">Day 0-2</span></td><td>SIRS / CPB inflammatory response</td><td>正常反應，支持性治療。不用急著加 antibiotics</td></tr>
      <tr><td><span class="danger">Day 3-5</span></td><td>感染開始（肺炎、UTI、bloodstream）</td><td>抽 blood culture、UA、CXR → 對症下藥</td></tr>
      <tr><td><span class="danger">Day 5+</span></td><td>Wound infection / Line infection / C. diff</td><td>檢查所有管路 insertion site、wound、考慮拔 line tip culture</td></tr>
    </table>
    <p class="fragment" style="font-size:0.85em;">💡 Day 0-2 發燒 + WBC 高但 procalcitonin 低 → 多半是 SIRS，不是感染</p>
  </section>
</section>

<!-- Section 6: 術後高血壓 -->
<section data-background-color="#001219">
  <h2>📈 術後高血壓 — 被忽略的危險</h2>
  <ul>
    <li class="fragment">原因：疼痛、shivering、rewarming、焦慮、膀胱脹</li>
    <li class="fragment">為什麼要控制？ → <span class="danger">剛縫好的 anastomosis 承受不住高壓 → bleeding</span></li>
    <li class="fragment">目標：SBP &lt;140（CABG 術後前幾小時更嚴格）</li>
    <li class="fragment">處理：先處理原因（止痛、保暖） → NTG drip / Nicardipine drip</li>
  </ul>
</section>

<!-- Section 7: Pacing Wire -->
<section data-background-color="#001219">
  <h2>⚡ Pacing Wire</h2>
  <ul>
    <li class="fragment">為什麼留？ → 術中 manipulation + 心肌水腫 → 傳導系統暫時受損 → AV block risk</li>
    <li class="fragment">用途：Bradycardia、AV block → 暫時性 pacing</li>
    <li class="fragment">通常 48-72 hr 沒用到就拔</li>
    <li class="fragment">⚠️ 拔的時候：要準備好 external pacing，以防萬一</li>
  </ul>
</section>

<!-- Section 8: LCOS -->
<section>
  <section data-background-color="#001219">
    <h2>💔 LCOS — Low Cardiac Output Syndrome</h2>
    <p>心外術後最可怕的併發症之一。<br/><strong>不是等到 shock 才叫 LCOS，早期辨識是關鍵。</strong></p>
  </section>

  <section data-background-color="#001219">
    <h3>怎麼認出來？— 五個線索</h3>
    <ul>
      <li class="fragment"><span class="danger">CI &lt; 2.2 L/min/m²</span> — 心臟打出去的量不夠</li>
      <li class="fragment"><span class="danger">SvO₂ &lt; 60%</span> — 組織把氧氣榨乾了（extraction ↑ 因為 delivery ↓）</li>
      <li class="fragment"><span class="danger">Lactate ↑</span> — 組織缺氧 → 無氧代謝 → 乳酸堆積</li>
      <li class="fragment"><span class="danger">UO &lt; 0.5 mL/kg/hr</span> — 腎臟灌流不足</li>
      <li class="fragment"><span class="danger">四肢冰冷、皮膚花斑</span> — 末梢循環關掉了（vasoconstriction 代償）</li>
    </ul>
    <p class="fragment">💡 不是五個都要到。<strong>趨勢比絕對值重要</strong> — Lactate 從 2 → 4、UO 從 40 → 15 → 在惡化！</p>
  </section>

  <section data-background-color="#001219">
    <h3>Inotrope 選擇邏輯 — 不是背藥名，是看場景</h3>
    <table style="font-size:0.75em;">
      <tr><th>藥物</th><th>機轉</th><th>什麼時候用</th><th>注意</th></tr>
      <tr><td><span class="highlight">Dobutamine</span></td><td>β1 為主 → ↑ contractility</td><td><strong>首選</strong>：單純 LV failure</td><td>可能降 SVR → BP 稍降</td></tr>
      <tr><td><span class="highlight">Milrinone</span></td><td>PDE3 inhibitor → ↑ contractility + 降肺血管阻力</td><td><strong>RV failure / PHT</strong>：降 PVR 救 RV</td><td>降 SVR 更明顯 → 可能需要合併 vasopressor</td></tr>
      <tr><td><span class="highlight">Epinephrine</span></td><td>β1 + β2 + α → 最強 inotrope</td><td><strong>最後武器</strong>：上面兩個不夠時</td><td>↑ HR、↑ MVO₂、arrhythmia、lactate 假升高</td></tr>
    </table>
    <p class="fragment" style="font-size:0.85em;">💡 <strong>思路</strong>：Dobutamine 不夠 → 加 Milrinone（尤其有 PHT）→ 還不夠 → Epinephrine → 還不夠 → 想 mechanical support</p>
  </section>

  <section data-background-color="#001219">
    <h3>Mechanical Support Escalation — 藥物撐不住時</h3>
    <ul>
      <li class="fragment"><span class="highlight">IABP</span>（Intra-Aortic Balloon Pump）
        <ul><li>最容易放、最快啟動。降 LV afterload + 增加 diastolic coronary perfusion</li>
        <li>CI 提升有限（~0.5 L/min），適合 borderline LCOS</li></ul>
      </li>
      <li class="fragment"><span class="highlight">Impella</span>
        <ul><li>Axial flow pump 放在 LV → 直接把血打到 aorta</li>
        <li>支持力比 IABP 強（Impella CP ~3.7 L/min），但更侵入性</li></ul>
      </li>
      <li class="fragment"><span class="danger">ECMO（VA-ECMO）</span>
        <ul><li>終極武器：完全取代心肺功能</li>
        <li>適應症：refractory cardiogenic shock、無法脫離 CPB</li>
        <li>代價：出血、limb ischemia、感染、LV distension（可能需要 vent）</li></ul>
      </li>
    </ul>
    <p class="fragment">→ Escalation 不是照順序走，是看<strong>惡化速度</strong>。快速惡化 → 直接上 ECMO</p>
  </section>

  <section data-background-color="#001219">
    <h3>💬 Case：LCOS 你怎麼處理？</h3>
    <p>68M, AVR + CABG ×2, CPB time 140 min。術後 3hr：</p>
    <p>CI 1.8, SvO₂ 52%, Lactate 5.5, UO 10 mL/hr, MAP 58, 四肢冰冷</p>
    <ul>
      <li class="fragment">已經在 Dobutamine 10 mcg/kg/min + Norepinephrine 0.1 mcg/kg/min</li>
      <li class="fragment">Echo：LVEF 25%（術前 45%），no tamponade</li>
      <li class="fragment">→ 你的下一步？</li>
      <li class="fragment">思路：加 Milrinone？直接上 IABP？還是跳到 ECMO？</li>
      <li class="fragment">💡 CPB 140 min + LVEF 從 45→25% → stunned myocardium，有機會恢復 → IABP 先 bridge</li>
      <li class="fragment">如果 2-4hr 後 Lactate 繼續升、CI 沒改善 → escalate to ECMO</li>
    </ul>
  </section>
</section>

<!-- Section 9: AKI -->
<section>
  <section data-background-color="#001219">
    <h2>🫘 術後 AKI — 不只是 Cr 升高</h2>
    <p>心外術後 AKI 發生率 ~30%，需要 RRT ~2-5%。<br/><strong>早期辨識 + 避免二次傷害是關鍵。</strong></p>
  </section>

  <section data-background-color="#001219">
    <h3>KDIGO Staging — 嚴重度分級</h3>
    <table style="font-size:0.8em;">
      <tr><th>Stage</th><th>Cr 標準</th><th>UO 標準</th></tr>
      <tr><td>Stage 1</td><td>Cr ↑ 1.5-1.9× baseline 或 ↑ ≥0.3 mg/dL</td><td>&lt;0.5 mL/kg/hr × 6-12hr</td></tr>
      <tr><td>Stage 2</td><td>Cr ↑ 2.0-2.9× baseline</td><td>&lt;0.5 mL/kg/hr × ≥12hr</td></tr>
      <tr><td>Stage 3</td><td>Cr ↑ ≥3× baseline 或 Cr ≥4.0 或需要 RRT</td><td>&lt;0.3 mL/kg/hr × ≥24hr 或 anuria ≥12hr</td></tr>
    </table>
    <p class="fragment">💡 術後 <strong>UO 比 Cr 更即時</strong> — Cr 要 24-48hr 才反映，UO 幾小時就能看出趨勢</p>
  </section>

  <section data-background-color="#001219">
    <h3>術後 Oliguric Phase 管理</h3>
    <ul>
      <li class="fragment"><strong>先排除 prerenal</strong>：Volume 夠不夠？CO 夠不夠？→ Fluid challenge / optimize CI</li>
      <li class="fragment"><strong>停腎毒性藥物</strong>：NSAIDs、aminoglycosides、contrast（術後避免不必要的 CT with contrast）</li>
      <li class="fragment"><strong>維持灌流壓</strong>：MAP &gt;65 mmHg（CKD baseline 可能需要更高）</li>
      <li class="fragment"><strong>利尿劑的角色</strong>：Furosemide 可以增加 UO，但<strong>不改變 AKI 進程</strong>
        <ul><li>用途：控制 volume overload，不是「治療」AKI</li></ul>
      </li>
      <li class="fragment"><strong>什麼時候考慮 RRT？</strong>
        <ul>
          <li>Refractory hyperkalemia（K⁺ &gt;6.5 + ECG changes）</li>
          <li>Refractory metabolic acidosis（pH &lt;7.15）</li>
          <li>Refractory volume overload（利尿劑無效 + 肺水腫）</li>
          <li>Uremic symptoms（encephalopathy, pericarditis）</li>
        </ul>
      </li>
    </ul>
    <p class="fragment">⚠️ <strong>不要等到全部 criteria 都到才 consult 腎臟科</strong> — 趨勢在惡化就該早討論</p>
  </section>
</section>

<!-- Red Flags -->
<section data-background-color="#001219">
  <h2>🚩 Red Flags 總整理</h2>
  <table>
    <tr><th>Red Flag</th><th>想到什麼</th><th>為什麼</th></tr>
    <tr><td>CT output↓ + BP↓ + JVP↑</td><td><span class="danger">Tamponade</span></td><td>drain 塞住，血壓迫心臟</td></tr>
    <tr><td>CT output &gt;200/hr × 3hr</td><td><span class="danger">Surgical bleeding / Coagulopathy</span></td><td>先鑑別再處理</td></tr>
    <tr><td>單側肢體無力</td><td><span class="danger">Stroke</span></td><td>CPB air embolism / thrombosis</td></tr>
    <tr><td>腳變白變冷</td><td><span class="danger">Limb ischemia</span></td><td>IABP / cannula site</td></tr>
    <tr><td>Sternal wound 紅腫滲液</td><td><span class="danger">Mediastinitis</span></td><td>致命！早發現早處理</td></tr>
  </table>
</section>

<!-- What Would You Do -->
<section data-background-color="#001219">
  <h2>❓ What Would You Do?</h2>
  <ol>
    <li class="fragment">術後 3hr：CT output 1st hr 100mL, 2nd hr 180mL, 3rd hr 280mL。Lab: ACT 125, Plt 85k, Fibrinogen 120<br/><small>→ 趨勢在惡化。Lab 指向什麼？Coagulopathy or surgical bleeding？下一步？</small></li>
    <li class="fragment">術後 Day 2 早上，突然 AF with RVR, HR 155, BP 85/50。K⁺ 3.2, Mg 1.4<br/><small>→ 穩不穩定？先處理什麼？</small></li>
    <li class="fragment">術後 Day 1：CVP 14, UO 0.2 mL/kg/hr × 4hr, Lactate 從 1.8 → 3.5, CI 1.9。病人看起來腫。<br/><small>→ 「病人很腫所以不要給 fluid」— 你同意嗎？</small></li>
  </ol>
</section>
`,
  },

  "cabg": {
    title: "選修 A：CABG — 冠狀動脈繞道手術",
    subtitle: "「每一條 graft 背後都有邏輯」",
    html: `
<section data-background-color="#001219">
  <div class="emoji-big">🔧</div>
  <h1>CABG — 冠狀動脈繞道手術</h1>
  <p class="subtitle">「每一條 graft 背後都有邏輯」</p>
  <p class="author">Wilson Chao — 高醫心臟外科</p>
</section>

<section data-background-color="#001219">
  <p class="hook">💬 60M, DM, HTN, 3VD<br/>LAD proximal 90%, LCx-OM 80%, RCA mid 85%<br/>SYNTAX 32, LVEF 50%<br/><br/>你要幫他選：用什麼血管、接到哪裡。<br/>每一個選擇都影響他未來 20 年。</p>
</section>

<!-- Section 1: Graft Selection Logic -->
<section>
  <section data-background-color="#001219">
    <h2>🩸 Graft 選擇 — 不是背表格，是懂邏輯</h2>
    <p>核心問題：<strong>為什麼 LIMA to LAD 是 gold standard？</strong></p>
  </section>

  <section data-background-color="#001219">
    <h3>LIMA 的生物學優勢</h3>
    <ul>
      <li class="fragment"><strong>IMA 是動脈 graft</strong> — 有完整的 endothelium，會分泌 NO</li>
      <li class="fragment">NO → 抑制血小板黏附 + 抑制平滑肌增生 → <strong>不容易長 atherosclerosis</strong></li>
      <li class="fragment">SVG 是靜脈 → 放在動脈壓力下 → intimal hyperplasia → 10 年 ~40% 塞住</li>
      <li class="fragment">LIMA 10 年 patency <span class="success">~95%</span> vs SVG <span class="danger">~50-65%</span>（依研究不同）</li>
    </ul>
  </section>

  <section data-background-color="#001219">
    <h3>為什麼 LIMA 一定接 LAD？</h3>
    <ul>
      <li class="fragment">LAD 灌左心室前壁 — <strong>最大區域、最重要的血管</strong></li>
      <li class="fragment">用最好的 graft 接最重要的 target — 最大化 survival benefit</li>
      <li class="fragment">研究證實：<strong>LIMA-LAD 是唯一有 survival benefit 的單一 graft 策略</strong></li>
      <li class="fragment">不接 LIMA to LAD 需要很好的理由（如 LIMA 受損、subclavian stenosis）</li>
    </ul>
    <div class="fragment big-number">LIMA → LAD = Survival</div>
  </section>

  <section data-background-color="#001219">
    <h3>其他 Conduit 的角色</h3>
    <table>
      <tr><th>Conduit</th><th>10-yr Patency</th><th>優缺點</th></tr>
      <tr><td><span class="highlight">LIMA</span></td><td>~95%</td><td>Gold standard → LAD 專用</td></tr>
      <tr><td>RIMA</td><td>~90%</td><td>Bilateral IMA → sternal wound risk↑（尤其 DM）</td></tr>
      <tr><td>Radial artery</td><td>~80%</td><td>動脈 graft，但需 Allen test；target 要 ≥70% stenosis</td></tr>
      <tr><td>SVG</td><td>~50-65%</td><td>最常用、取得方便，但長期 patency 差（依研究不同）</td></tr>
    </table>
    <p class="fragment">💡 Radial 為什麼要 target 夠塞？<br/>→ 如果 native artery 只塞 50%，competitive flow → graft 容易萎縮關掉。</p>
  </section>
</section>

<!-- Section 2: Sequential & Composite -->
<section>
  <section data-background-color="#001219">
    <h2>🔗 Sequential Graft & Composite Graft</h2>
    <p>不是一條 graft 只能接一個 target</p>
  </section>

  <section data-background-color="#001219">
    <h3>Sequential Graft</h3>
    <ul>
      <li class="fragment">一條 SVG 依序接 2-3 個 target（side-to-side → end-to-side）</li>
      <li class="fragment">優點：節省 conduit、一條 graft 多個 territory</li>
      <li class="fragment">缺點：近端塞住 → 全部斷流</li>
      <li class="fragment">常見：SVG sequential to Diagonal + OM</li>
    </ul>
  </section>

  <section data-background-color="#001219">
    <h3>Composite Graft (Y-graft / T-graft)</h3>
    <ul>
      <li class="fragment">把 radial artery 或 SVG 接到 LIMA 上（不回 aorta）</li>
      <li class="fragment">血流來源：LIMA → 分支到其他 target</li>
      <li class="fragment">優點：不用在 aorta 上多打 partial clamp（減少 atheroembolism）</li>
      <li class="fragment">常見：LIMA-LAD + LIMA→Radial-Y to OM</li>
    </ul>
  </section>
</section>

<!-- Section 3: On-pump vs Off-pump -->
<section>
  <section data-background-color="#001219">
    <h2>⚖️ On-pump vs Off-pump — Trade-off</h2>
    <p>不是哪個比較好，是哪個比較適合</p>
  </section>

  <section data-background-color="#001219">
    <table>
      <tr><th></th><th>On-pump (CABG)</th><th>Off-pump (OPCAB)</th></tr>
      <tr><td>心臟狀態</td><td>停下來縫</td><td>跳著縫</td></tr>
      <tr><td>視野</td><td>好（心臟不動）</td><td>挑戰（心臟在跳）</td></tr>
      <tr><td>CPB 副作用</td><td>SIRS、coagulopathy、AKI</td><td>避免</td></tr>
      <tr><td>Complete revascularization</td><td>較容易達成</td><td>後壁 target 困難</td></tr>
      <tr><td>技術門檻</td><td>標準</td><td>高（需要專門訓練）</td></tr>
      <tr><td>Long-term patency</td><td>較確定</td><td>部分研究 graft patency 稍低</td></tr>
    </table>
  </section>

  <section data-background-color="#001219">
    <h3>OPCAB 什麼時候考慮？</h3>
    <ul>
      <li class="fragment">Porcelain aorta（鈣化很嚴重不能 clamp）</li>
      <li class="fragment">Severe CKD（想避免 CPB 腎損傷）</li>
      <li class="fragment">高齡 + frail（想減少 SIRS）</li>
      <li class="fragment">⚠️ ROOBY、CORONARY trial：大型 RCT 沒有顯示 OPCAB 有明顯 outcome 優勢</li>
      <li class="fragment"><strong>GOPCABE trial</strong>（elderly ≥75 歲）：OPCAB vs On-pump 在高齡族群也沒有顯著 outcome 差異 → 年紀大不等於一定要 off-pump</li>
      <li class="fragment">→ 目前共識：取決於<strong>外科醫師的專長和病人特性</strong></li>
    </ul>
  </section>
</section>

<!-- Section 4: 術後 Graft Patency -->
<section>
  <section data-background-color="#001219">
    <h2>📋 術後 Graft Patency 追蹤</h2>
    <p>手術結束不是結束 — graft 能撐多久？</p>
  </section>

  <section data-background-color="#001219">
    <h3>💬 Case：術後 Day 1，ECG 出現 V1-V4 ST elevation</h3>
    <ul>
      <li class="fragment"><span class="danger">LAD territory = LIMA graft 可能出問題</span></li>
      <li class="fragment">可能原因：graft kink、thrombosis、technical issue</li>
      <li class="fragment">→ 立即 Echo（wall motion）→ 緊急 Cath → 可能需要 re-explore</li>
    </ul>
  </section>

  <section data-background-color="#001219">
    <h3>Graft failure 的時間軸</h3>
    <ul>
      <li class="fragment"><strong>Early（&lt;30 days）</strong>：Technical issue — kink、thrombosis、competitive flow</li>
      <li class="fragment"><strong>Intermediate（1-12 months）</strong>：Intimal hyperplasia（尤其 SVG）</li>
      <li class="fragment"><strong>Late（&gt;1 year）</strong>：Atherosclerosis in SVG（跟 native vessel 一樣的過程）</li>
    </ul>
  </section>

  <section data-background-color="#001219">
    <h3>長期維護</h3>
    <ul>
      <li class="fragment">Aspirin（lifelong）+ DAPT 6-12 個月（ACS presentation 時）— 保持 graft 通暢</li>
      <li class="fragment">Statin — 降低 SVG atherosclerosis（有 RCT 支持）</li>
      <li class="fragment">Risk factor control — DM、HTN、smoking cessation</li>
      <li class="fragment">追蹤：symptoms → stress test → Cath（不常規做 Cath 追蹤）</li>
    </ul>
  </section>
</section>

<!-- CABG vs PCI: Indication -->
<section>
  <section data-background-color="#001219">
    <h2>⚖️ CABG vs PCI — 什麼時候該開刀？</h2>
    <p>不是「塞了幾條」的問題，是<strong>「這個解剖和這個人，誰適合什麼」</strong></p>
  </section>

  <section data-background-color="#001219">
    <h3>SYNTAX Score 決策門檻</h3>
    <ul>
      <li class="fragment"><span class="highlight">SYNTAX ≤22</span>：解剖單純 → PCI 和 CABG 結果相當 → 可以選 PCI</li>
      <li class="fragment"><span class="highlight">SYNTAX 23-32</span>：中等複雜 → Heart Team 討論，需考慮其他因素（DM、LV function）</li>
      <li class="fragment"><span class="danger">SYNTAX &gt;33</span>：高度複雜 → <strong>CABG 有明顯 survival benefit</strong></li>
      <li class="fragment">SYNTAX Score 量化的是解剖複雜度：病變位置、分叉、鈣化、CTO、血管走向</li>
    </ul>
  </section>

  <section data-background-color="#001219">
    <h3>Left Main Disease</h3>
    <ul>
      <li class="fragment">LM 供應 <strong>2/3 心肌</strong> → 處理策略影響深遠</li>
      <li class="fragment"><strong>EXCEL trial</strong>（5-year）：CABG 在 all-cause death + MI 優於 PCI</li>
      <li class="fragment"><strong>NOBLE trial</strong>：CABG 在長期追蹤優於 PCI（MACCE 更低）</li>
      <li class="fragment">LM + 低 SYNTAX（≤22）→ PCI 是 reasonable alternative</li>
      <li class="fragment">LM + 高 SYNTAX 或合併其他複雜病變 → <span class="highlight">CABG 首選</span></li>
    </ul>
  </section>

  <section data-background-color="#001219">
    <h3>Multivessel CAD + Diabetes</h3>
    <ul>
      <li class="fragment"><strong>FREEDOM trial</strong>：Multivessel CAD + DM → CABG 有 <span class="success">survival benefit</span>（vs PCI with DES）</li>
      <li class="fragment">為什麼 DM 偏向 CABG？</li>
      <li class="fragment">1. DM 的血管是 <span class="danger">diffuse disease</span> → stent 只處理「那個點」，其他地方繼續惡化</li>
      <li class="fragment">2. DM + DES → in-stent restenosis 和 neoatherosclerosis 風險更高</li>
      <li class="fragment">3. CABG 的 bypass 接在病變遠端 → 即使近端繼續惡化，遠端仍有血流供應</li>
    </ul>
  </section>

  <section data-background-color="#001219">
    <h3>📋 Decision Summary</h3>
    <table style="font-size:0.75em;">
      <tr><th>情境</th><th>建議</th><th>Evidence</th></tr>
      <tr><td>1-2 VD, SYNTAX ≤22, no DM</td><td>PCI reasonable</td><td>SYNTAX trial</td></tr>
      <tr><td>3VD, SYNTAX &gt;22</td><td><span class="highlight">CABG preferred</span></td><td>SYNTAX trial</td></tr>
      <tr><td>LM, low SYNTAX</td><td>Either（Heart Team）</td><td>EXCEL/NOBLE</td></tr>
      <tr><td>LM, high SYNTAX</td><td><span class="highlight">CABG</span></td><td>EXCEL/NOBLE</td></tr>
      <tr><td>Multivessel + DM</td><td><span class="highlight">CABG</span></td><td>FREEDOM trial</td></tr>
      <tr><td>LVEF &lt;35% + extensive CAD</td><td><span class="highlight">CABG</span></td><td>STICH trial</td></tr>
    </table>
    <p style="font-size:0.8em; color:#aaa;">⚠️ 所有複雜決策都應經 Heart Team 討論。數字是指引，不是教條。</p>
  </section>
</section>

<!-- What Would You Do -->
<section data-background-color="#001219">
  <h2>❓ What Would You Do?</h2>
  <ol>
    <li class="fragment">55M, DM, 3VD + LM 60%, SYNTAX 35, LVEF 40%。LIMA 取下來發現 flow 不好。<br/><small>→ LIMA 不能用，你的 graft plan 怎麼調整？LAD 用什麼接？</small></li>
    <li class="fragment">70F, severe CKD (Cr 3.5), 3VD, porcelain aorta on CT<br/><small>→ On-pump 有什麼風險？你會建議什麼策略？</small></li>
    <li class="fragment">術後 Day 1, ECG 新的 inferior ST changes, CI 從 2.5 → 1.8, Lactate 升<br/><small>→ 哪條 graft 可能出問題？下一步？</small></li>
  </ol>
</section>
`,
  },

  "valve": {
    title: "選修 B：Valve Surgery",
    subtitle: "「每一個決策都是 trade-off」",
    html: `
<section data-background-color="#001219">
  <div class="emoji-big">🔄</div>
  <h1>Valve Surgery</h1>
  <p class="subtitle">「每一個決策都是 trade-off」</p>
  <p class="author">Wilson Chao — 高醫心臟外科</p>
</section>

<section data-background-color="#001219">
  <p class="hook">💬 兩個病人同時在 conference 討論：<br/>Case A: 50F, severe MR, P2 prolapse, LVEF 62%<br/>Case B: 72M, severe AS, AVA 0.7, syncope, STS 7%<br/><br/>一個要修，一個要換。為什麼不反過來？</p>
</section>

<!-- Section 1: Repair vs Replace Decision -->
<section>
  <section data-background-color="#001219">
    <h2>⚖️ Repair vs Replace — 核心邏輯</h2>
    <p>不是「能修就修」這麼簡單 — 要看<strong>修了之後效果好不好</strong></p>
  </section>

  <section data-background-color="#001219">
    <h3>MV Repair 的適應症邏輯</h3>
    <ul>
      <li class="fragment"><strong>Degenerative MR</strong>（瓣膜本身壞了）→ <span class="success">Repair 首選</span>
        <ul>
          <li>Prolapse、flail leaflet — 結構可以修</li>
          <li>Repair 成功率 &gt;95%（在經驗豐富的中心）</li>
          <li>免 anticoagulation、低 reoperation rate</li>
        </ul>
      </li>
      <li class="fragment"><strong>Functional MR</strong>（心臟擴大拉扯瓣膜）→ <span class="danger">手術 Repair 效果差</span>
        <ul>
          <li>瓣膜本身沒壞，是心臟太大</li>
          <li>修了 → 心臟繼續擴大 → MR 復發</li>
          <li>根本問題要處理心衰，不是瓣膜</li>
          <li class="fragment">💡 <strong>COAPT trial</strong>：Disproportionate MR + GDMT-optimized HFrEF → <span class="success">TEER（MitraClip）有 mortality benefit</span></li>
          <li class="fragment">關鍵：要 GDMT 最佳化後仍有 significant MR，且 LV 不能太大（LVESD ≤70mm）</li>
        </ul>
      </li>
    </ul>
  </section>

  <section data-background-color="#001219">
    <h3>什麼瓣膜幾乎一定是 Replace？</h3>
    <ul>
      <li class="fragment"><strong>AS</strong> — calcified, stenotic → 結構完全改變 → 無法 repair</li>
      <li class="fragment"><strong>Rheumatic valve disease</strong> — leaflet 纖維化 + 鈣化 → repair 困難</li>
      <li class="fragment"><strong>Prosthetic valve IE with destruction</strong> — 整個爛掉 → 換</li>
    </ul>
  </section>
</section>

<!-- Section 2: MV Repair 技術概念 -->
<section>
  <section data-background-color="#001219">
    <h2>🔧 MV Repair 技術概念</h2>
    <p>你不需要會開刀，但要理解邏輯</p>
  </section>

  <section data-background-color="#001219">
    <h3>Annuloplasty Ring — 基礎中的基礎</h3>
    <ul>
      <li class="fragment">MR 的一個重要原因：annulus 擴大 → leaflet 關不緊</li>
      <li class="fragment">放一個 ring → 把 annulus 縮回正常大小 → leaflet 就能 coaptate</li>
      <li class="fragment">幾乎所有 MV repair 都包含 annuloplasty ring — 它是「地基」</li>
    </ul>
  </section>

  <section data-background-color="#001219">
    <h3>Leaflet Repair 技術</h3>
    <ul>
      <li class="fragment"><strong>P2 prolapse</strong>（最經典、最好修的）
        <ul>
          <li>把多餘的 leaflet 切除（triangular or quadrangular resection）</li>
          <li>再縫合 → 加 annuloplasty ring</li>
        </ul>
      </li>
      <li class="fragment"><strong>Neo-chordae</strong> — 用 Gore-Tex 人工腱索取代斷掉的 chordae</li>
      <li class="fragment"><strong>Edge-to-edge repair (Alfieri stitch)</strong> — 把前後 leaflet 縫在一起</li>
      <li class="fragment">💡 MitraClip/TEER 就是 percutaneous 的 edge-to-edge repair</li>
    </ul>
  </section>
</section>

<!-- Section 3: Mechanical vs Bioprosthetic -->
<section>
  <section data-background-color="#001219">
    <h2>⚙️ Mechanical vs Bioprosthetic — 不只是年齡</h2>
    <p>這是一個<strong>lifestyle decision</strong></p>
  </section>

  <section data-background-color="#001219">
    <h3>💬 Case：45M, severe AR, needs AVR</h3>
    <p>「年輕 = mechanical」— 真的嗎？</p>
    <ul>
      <li class="fragment">Mechanical：永久，但<strong>終身 warfarin</strong>（INR 2.5-3.5 for aortic）</li>
      <li class="fragment">Warfarin 意味著：
        <ul>
          <li>每月抽血追蹤 INR</li>
          <li>飲食限制（VitK 食物）</li>
          <li>出血風險（受傷、手術、月經）</li>
          <li>懷孕風險（teratogenic → warfarin embryopathy）</li>
        </ul>
      </li>
      <li class="fragment">Bioprosthetic：不用 warfarin，但 10-15 年後可能要 redo</li>
    </ul>
  </section>

  <section data-background-color="#001219">
    <h3>決策的核心：Trade-off</h3>
    <table>
      <tr><th></th><th>Mechanical</th><th>Bioprosthetic</th></tr>
      <tr><td>耐久性</td><td><span class="success">永久</span></td><td>10-15 年（越年輕退化越快）</td></tr>
      <tr><td>Anticoagulation</td><td><span class="danger">終身 warfarin</span></td><td>不需要</td></tr>
      <tr><td>Reoperation risk</td><td>低</td><td>高（valve-in-valve TAVI 可能解套）</td></tr>
      <tr><td>出血風險</td><td>高</td><td>低</td></tr>
      <tr><td>血栓風險</td><td>中（warfarin 不穩時）</td><td>低</td></tr>
    </table>
    <p class="fragment">→ 不是只看年齡，要問病人的<strong>生活型態和價值觀</strong></p>
  </section>

  <section data-background-color="#001219">
    <h3>現代趨勢：Bioprosthetic + Valve-in-Valve</h3>
    <ul>
      <li class="fragment">Bio valve 退化後 → 不一定要 redo open surgery</li>
      <li class="fragment">可以用 TAVI 在舊的 bio valve 裡面再放一個 → <span class="highlight">Valve-in-Valve</span></li>
      <li class="fragment">這改變了 bio valve 的 long-term calculation</li>
      <li class="fragment">→ 越來越多年輕人選 bio valve（但長期數據仍在累積）</li>
    </ul>
  </section>
</section>

<!-- Section 4: TAVI -->
<section>
  <section data-background-color="#001219">
    <h2>🔀 TAVI — 改變 AS 治療版圖</h2>
    <p>從 2007 年第一例到現在，TAVI 的 indication 不斷擴大</p>
  </section>

  <section data-background-color="#001219">
    <h3>TAVI 的演進</h3>
    <ul>
      <li class="fragment">最初：只給<strong>不能開刀的人</strong>（inoperable）</li>
      <li class="fragment">PARTNER 2 (2016)：intermediate risk 不劣於 SAVR</li>
      <li class="fragment">PARTNER 3 / Evolut Low Risk (2019)：<strong>low risk 也不劣於 SAVR</strong></li>
      <li class="fragment">→ 現在幾乎所有 AS 都可以考慮 TAVI</li>
    </ul>
  </section>

  <section data-background-color="#001219">
    <h3>但 SAVR 還有什麼優勢？</h3>
    <ul>
      <li class="fragment"><strong>耐久性</strong>：SAVR（尤其 mechanical）確定長期可用。TAVI 最長追蹤 ~10 年，數據仍在累積</li>
      <li class="fragment"><strong>Conduction disturbance</strong>：TAVI 有 ~10-20% 需要 pacemaker（壓到 His bundle）</li>
      <li class="fragment"><strong>Bicuspid AV</strong>：TAVI 技術上較困難（不對稱 → deploy 困難）</li>
      <li class="fragment"><strong>Concomitant surgery</strong>：如果同時要做 CABG 或修其他 valve → SAVR</li>
    </ul>
  </section>

  <section data-background-color="#001219">
    <h3>現代決策：不是「能不能開」，是「怎麼開」</h3>
    <ul>
      <li class="fragment">核心考量：<strong>Life expectancy + Surgical risk</strong> 優先於年齡數字</li>
      <li class="fragment">預期壽命長（&gt;15-20 yr）+ low risk → 傾向 <span class="highlight">SAVR</span>（耐久性、less pacemaker）</li>
      <li class="fragment">中等預期壽命 + intermediate risk → <span class="highlight">Heart Team 討論</span>（anatomy、comorbidity、patient preference）</li>
      <li class="fragment">預期壽命較短 or high risk → 傾向 <span class="highlight">TAVI</span></li>
      <li class="fragment">⚠️ 年齡只是參考因子之一 — 80 歲的馬拉松跑者 vs 60 歲的 frail 病人，決策完全不同</li>
      <li class="fragment">⚠️ 共識：AS 的治療已經不是心外的專利 — <strong>Heart Team decision</strong></li>
    </ul>
  </section>
</section>

<!-- Intervention Timing -->
<section>
  <section data-background-color="#001219">
    <h2>⏰ Intervention Timing — Class I Indications</h2>
    <p>什麼時候「一定要開」？不是靠感覺，是有明確 guideline</p>
  </section>

  <section data-background-color="#001219">
    <h3>Aortic Stenosis — Class I Indications for Intervention</h3>
    <ul>
      <li class="fragment"><span class="danger">Symptomatic severe AS</span>（syncope, angina, HF）→ <strong>必須介入</strong></li>
      <li class="fragment">Severe AS + <span class="danger">LVEF &lt;50%</span>（即使 asymptomatic）→ <strong>介入</strong></li>
      <li class="fragment">Severe AS + 需要其他心臟手術（CABG, aortic surgery）→ <strong>同時介入</strong></li>
      <li class="fragment">Severe AS + exercise test 有症狀 → <strong>介入</strong></li>
    </ul>
    <p class="fragment" style="color:#f4a261;">⚠️ Very severe AS（Vmax &gt;5 m/s）即使 asymptomatic 也要密切追蹤、傾向早期介入</p>
  </section>

  <section data-background-color="#001219">
    <h3>Mitral Regurgitation — Class I Indications for Surgery</h3>
    <ul>
      <li class="fragment"><span class="danger">Symptomatic severe primary MR</span>（NYHA II-IV）→ <strong>手術</strong></li>
      <li class="fragment">Severe primary MR + <span class="danger">LVEF ≤60%</span> → <strong>手術</strong>（MR 時 EF 60% 其實已經偏低！）</li>
      <li class="fragment">Severe primary MR + <span class="danger">LVESD ≥40mm</span> → <strong>手術</strong></li>
      <li class="fragment">Severe primary MR + 需要其他心臟手術 → <strong>同時修/換</strong></li>
      <li class="fragment">Severe primary MR + <span class="highlight">repair likelihood &gt;95%</span> at experienced center → 可考慮早期手術（Class IIa）</li>
    </ul>
    <p class="fragment" style="color:#f4a261;">💡 MR 的 LVEF cutoff 是 60% 不是 50%！因為 MR 有 volume unloading 效果，真實的 LV function 比 EF 數字看起來更差</p>
  </section>
</section>

<!-- Tricuspid Valve -->
<section>
  <section data-background-color="#001219">
    <h2>🔺 Tricuspid Valve — 被遺忘的瓣膜</h2>
    <p>Tricuspid regurgitation（TR）是心臟手術最常被「下次再說」的問題</p>
  </section>

  <section data-background-color="#001219">
    <h3>Functional TR — 為什麼重要？</h3>
    <ul>
      <li class="fragment">多數 TR 是 <strong>functional</strong>（瓣膜本身沒壞）→ RV 擴大 + annulus dilatation</li>
      <li class="fragment">常見原因：left-sided valve disease → PHT → RV 擴大 → TR annulus 被拉開</li>
      <li class="fragment">長期 significant TR → RV failure → <span class="danger">肝鬱血、腹水、peripheral edema</span></li>
      <li class="fragment">TR 一旦惡化，RV remodeling 難以逆轉 → <span class="danger">錯過時機就回不去了</span></li>
    </ul>
  </section>

  <section data-background-color="#001219">
    <h3>Concomitant TV Annuloplasty — 何時順便做？</h3>
    <ul>
      <li class="fragment"><span class="highlight">做左側 valve surgery 時</span>，如果有以下情況 → 同時做 TV annuloplasty：</li>
      <li class="fragment">1. Severe TR → <strong>一定要做</strong></li>
      <li class="fragment">2. Moderate TR → <strong>建議做</strong>（不做的話術後可能惡化）</li>
      <li class="fragment">3. Mild TR 但 <span class="danger">annulus ≥40mm（或 &gt;21mm/m²）</span> → <strong>考慮做</strong>（預防性）</li>
      <li class="fragment">邏輯：TV annuloplasty 增加的手術時間和風險很小，但不做 → 術後 TR 惡化 → 再次手術風險很大</li>
    </ul>
    <p class="fragment" style="color:#f4a261;">💡 「第一次手術時順便做 TV annuloplasty」遠比「之後單獨為 TR 再開一次刀」好</p>
  </section>
</section>

<!-- What Would You Do -->
<section data-background-color="#001219">
  <h2>❓ What Would You Do?</h2>
  <ol>
    <li class="fragment">38F, severe MR (P2 flail), LVEF 58%, asymptomatic。她計畫明年懷孕。<br/><small>→ Repair or Replace？如果 replace，mechanical or bio？為什麼懷孕計畫影響你的選擇？</small></li>
    <li class="fragment">72M, severe AS, AVA 0.7, syncope + NYHA III。同時有 3VD, SYNTAX 30, 需要 CABG。<br/><small>→ TAVI or SAVR？為什麼 concomitant CABG need 改變你的選擇？</small></li>
    <li class="fragment">60M, severe MR, LVEF 25%, dilated LV (LVEDD 72mm), 沒有 prolapse。<br/><small>→ 這是 degenerative or functional MR？修瓣膜會改善他的預後嗎？你建議什麼？</small></li>
  </ol>
</section>
`,
  },

  "cpb": {
    title: "選修 C：CPB — 體外循環",
    subtitle: "「為什麼每個元件都在那裡」",
    html: `
<section data-background-color="#001219">
  <div class="emoji-big">❄️</div>
  <h1>CPB — 體外循環</h1>
  <p class="subtitle">「為什麼每個元件都在那裡」</p>
  <p class="author">Wilson Chao — 高醫心臟外科</p>
</section>

<section data-background-color="#001219">
  <p class="hook">💬 你站在手術台旁邊<br/>一台冰箱大小的機器在病人旁邊嗡嗡轉<br/>紅色的管子從病人身體出來，繞一圈再回去<br/><br/>這台機器正在做心臟和肺臟的工作。<br/>每個零件都有「為什麼」。</p>
</section>

<!-- Section 1: Circuit — Why Each Component -->
<section>
  <section data-background-color="#001219">
    <h2>🔧 Circuit — 每個元件為什麼需要</h2>
    <p>CPB 要取代兩個器官：<strong>心臟</strong>（pump）和<strong>肺臟</strong>（gas exchange）</p>
  </section>

  <section data-background-color="#001219">
    <h3>血流路徑</h3>
    <p style="text-align:center; font-size:1.1em;">
      病人 RA/SVC+IVC → <span class="highlight">Venous cannula</span><br/>
      → <span class="highlight">Venous reservoir</span>（收集血液）<br/>
      → <span class="highlight">Pump</span>（取代心臟）<br/>
      → <span class="highlight">Oxygenator</span>（取代肺臟）<br/>
      → <span class="highlight">Heat exchanger</span>（控制溫度）<br/>
      → <span class="highlight">Arterial filter</span>（擋氣泡和碎片）<br/>
      → <span class="highlight">Arterial cannula</span> → 回到 Aorta
    </p>
  </section>

  <section data-background-color="#001219">
    <h3>每個元件的「為什麼」</h3>
    <table>
      <tr><th>元件</th><th>功能</th><th>為什麼需要</th></tr>
      <tr><td>Venous reservoir</td><td>儲存回流血液</td><td>靜脈回流靠重力，需要 buffer 空間</td></tr>
      <tr><td>Roller/Centrifugal pump</td><td>推動血液</td><td>取代心臟的 pump function</td></tr>
      <tr><td>Oxygenator (membrane)</td><td>CO₂/O₂ exchange</td><td>取代肺臟的 gas exchange</td></tr>
      <tr><td>Heat exchanger</td><td>升溫/降溫</td><td>Hypothermia 保護 + rewarming</td></tr>
      <tr><td>Arterial filter</td><td>過濾氣泡/碎片</td><td>防止 air embolism（致命！）</td></tr>
    </table>
  </section>

  <section data-background-color="#001219">
    <h3>Cannulation</h3>
    <ul>
      <li class="fragment"><strong>Arterial</strong>：通常 ascending aorta（有時 femoral — 急 ECMO 或 redo）</li>
      <li class="fragment"><strong>Venous</strong>：
        <ul>
          <li>Single two-stage cannula（RA → IVC）— CABG 夠用</li>
          <li>Bicaval cannulation（SVC + IVC 各一條）— Valve surgery 需要打開心臟，要完全 bypass</li>
        </ul>
      </li>
      <li class="fragment">為什麼 valve surgery 要 bicaval？ → 要打開 RA/LA → 不能有血從 SVC/IVC 流進來</li>
    </ul>
  </section>
</section>

<!-- Section 2: Anticoagulation -->
<section>
  <section data-background-color="#001219">
    <h2>💉 Heparin / ACT / Protamine</h2>
    <p>血碰到人工表面 → <strong>一定會凝</strong></p>
  </section>

  <section data-background-color="#001219">
    <h3>為什麼要 anticoagulate？</h3>
    <ul>
      <li class="fragment">血液在體外管路裡流 → 碰到塑膠表面 → 啟動 contact activation pathway</li>
      <li class="fragment">不抗凝 → 管路裡凝血 → <span class="danger">機器停擺、血栓打回病人身體</span></li>
      <li class="fragment">→ Heparin 300 U/kg IV bolus，目標 <span class="highlight">ACT &gt;480 秒</span></li>
    </ul>
  </section>

  <section data-background-color="#001219">
    <h3>Protamine — 反轉 Heparin</h3>
    <ul>
      <li class="fragment">下 CPB 後 → Protamine 中和 Heparin（1:1 ratio 概估）</li>
      <li class="fragment">⚠️ Protamine 副作用：
        <ul>
          <li><span class="danger">低血壓</span>（histamine release）</li>
          <li><span class="danger">Anaphylaxis</span>（尤其 NPH insulin 使用者；傳統上認為魚過敏者風險較高，但實際關聯性有限）</li>
          <li><span class="danger">Pulmonary hypertension</span>（complement activation）</li>
        </ul>
      </li>
      <li class="fragment">給的時候要慢，麻醉科密切監測</li>
    </ul>
  </section>

  <section data-background-color="#001219">
    <h3>💬 Case：術後出血，ACT 180（正常 &lt;140）</h3>
    <ul>
      <li class="fragment">ACT 還太高 → Heparin 沒完全中和</li>
      <li class="fragment">→ 補 Protamine → 追蹤 ACT</li>
      <li class="fragment">如果 ACT 正常但還在流 → 不是 Heparin 的問題</li>
      <li class="fragment">→ 查 Plt、Fibrinogen → TEG/ROTEM guided 輸血</li>
    </ul>
  </section>
</section>

<!-- Section 3: Cardioplegia -->
<section>
  <section data-background-color="#001219">
    <h2>❄️ Cardioplegia — 讓心臟停下來的學問</h2>
    <p>Cross clamp 夾住 aorta → 心臟沒有血流 → <strong>缺血</strong></p>
    <p>怎麼保護缺血的心臟？</p>
  </section>

  <section data-background-color="#001219">
    <h3>原理：三重保護</h3>
    <ul>
      <li class="fragment"><strong>1. 高鉀 → 心臟停在 diastole</strong>
        <ul><li>K⁺ 20-30 mEq/L → 細胞膜去極化 → 心肌 arrest</li>
        <li>為什麼 diastole？ → diastole 時心肌氧耗最低（不做功 + 冠狀動脈灌流）</li></ul>
      </li>
      <li class="fragment"><strong>2. 降溫 → 降低代謝率</strong>
        <ul><li>每降 10°C → 代謝率降一半（van't Hoff rule）</li>
        <li>4°C cardioplegia → 心肌代謝率降到 &lt;10%</li></ul>
      </li>
      <li class="fragment"><strong>3. 基質 → 提供能量 + buffer</strong>
        <ul><li>Glucose、amino acids、buffers → 維持最低限度的細胞存活</li></ul>
      </li>
    </ul>
  </section>

  <section data-background-color="#001219">
    <h3>給法：Antegrade vs Retrograde</h3>
    <ul>
      <li class="fragment"><strong>Antegrade</strong>（從 aortic root → 冠狀動脈 → 心肌）
        <ul><li>最直覺、分佈最均勻</li>
        <li>但如果冠狀動脈嚴重阻塞 → 分佈不均</li></ul>
      </li>
      <li class="fragment"><strong>Retrograde</strong>（從 coronary sinus → 逆行灌流心肌）
        <ul><li>適合 severe CAD 或 AR（AR 時 aortic root 漏回 LV）</li>
        <li>但 RV 保護較差</li></ul>
      </li>
      <li class="fragment">實務上常 <strong>antegrade + retrograde 合用</strong></li>
      <li class="fragment">每 15-20 分鐘重新給 → 維持心臟保護（「re-dose」）</li>
    </ul>
  </section>

  <section data-background-color="#001219">
    <h3>種類比較</h3>
    <table>
      <tr><th>種類</th><th>特色</th><th>Re-dose interval</th></tr>
      <tr><td>Blood cardioplegia</td><td>最常用，含氧 → 持續提供 O₂</td><td>每 15-20 min</td></tr>
      <tr><td>Crystalloid (HTK/St. Thomas)</td><td>簡單，但無攜氧能力</td><td>單次可撐較久</td></tr>
      <tr><td>del Nido</td><td>一次 dose 撐 60-90 min，小兒首選</td><td>60-90 min</td></tr>
    </table>
    <p class="fragment"><strong>Cross clamp time = 心臟缺血時間</strong> → 越短越好。每多一分鐘，心肌受損風險增加。</p>
  </section>
</section>

<!-- Section 4: Hypothermia -->
<section>
  <section data-background-color="#001219">
    <h2>🌡️ Hypothermia — 不同程度不同用途</h2>
  </section>

  <section data-background-color="#001219">
    <table>
      <tr><th>分級</th><th>溫度</th><th>用途</th><th>代價</th></tr>
      <tr><td>Mild</td><td>32-35°C</td><td>一般 CPB（routine CABG/valve）</td><td>最小</td></tr>
      <tr><td>Moderate</td><td>26-32°C</td><td>較長的手術</td><td>輕度 coagulopathy</td></tr>
      <tr><td>Deep (DHCA)</td><td>18-20°C</td><td>Aortic arch surgery → 需要停循環</td><td>嚴重 coagulopathy、prolonged rewarming</td></tr>
    </table>
    <p class="fragment">原理：<strong>每降 10°C → 代謝率降一半</strong><br/>DHCA 18°C → 腦代謝率降到 ~10-15% → 可以安全停循環 30-40 分鐘</p>
  </section>

  <section data-background-color="#001219">
    <h3>Cerebral Perfusion — 延長安全時間</h3>
    <ul>
      <li class="fragment"><strong>ACP（Antegrade Cerebral Perfusion）</strong>：
        <ul>
          <li>直接從 innominate/carotid 灌腦部</li>
          <li>持續提供腦部氧氣和營養</li>
          <li>可延長安全時間到 <span class="success">60+ 分鐘</span></li>
          <li>是目前最常用的腦保護策略</li>
        </ul>
      </li>
      <li class="fragment"><strong>RCP（Retrograde Cerebral Perfusion）</strong>：
        <ul>
          <li>從 SVC 逆行灌注腦部</li>
          <li>額外提供代謝物沖洗和降溫效果</li>
          <li>但實際腦灌流效果有爭議（多數血液走 shunt 掉了）</li>
        </ul>
      </li>
      <li class="fragment">🔥 <strong>現在趨勢</strong>：Moderate HCA（24-28°C）+ ACP → 減少深低溫的 coagulopathy，同時 ACP 保護腦部</li>
    </ul>
  </section>
</section>

<!-- Section 5: Weaning CPB Troubleshooting -->
<section>
  <section data-background-color="#001219">
    <h2>💓 Weaning CPB — 最緊張的時刻</h2>
    <p>Cross clamp off → 血流回心臟 → 心臟重新跳起來<br/>這個瞬間，整間手術室屏住呼吸。</p>
  </section>

  <section data-background-color="#001219">
    <h3>正常流程</h3>
    <ul>
      <li class="fragment">Cross clamp off → 血流灌心臟 → 心臟開始跳（可能需要 defibrillation）</li>
      <li class="fragment">觀察 rhythm、contractility → TEE 確認 wall motion、valvular function</li>
      <li class="fragment">逐漸減少 CPB flow → 心臟接手工作</li>
      <li class="fragment">完全脫離 CPB → 確認 hemodynamics stable → 開始 Protamine</li>
    </ul>
  </section>

  <section data-background-color="#001219">
    <h3>⚠️ 下機困難：Troubleshooting 思路</h3>
    <p>心臟在跳但 MAP 上不來 / CI 不夠 → 為什麼？</p>
    <ul>
      <li class="fragment"><strong>1. Myocardial stunning</strong> — 缺血再灌流傷害 → 暫時性 dysfunction
        <ul><li>Cross clamp 時間太長？Cardioplegia 保護不夠？</li></ul>
      </li>
      <li class="fragment"><strong>2. Air embolism</strong> — 開心手術時空氣進入冠狀動脈
        <ul><li>TEE 看 LV 有沒有 air → 等它排掉 or 加壓灌冠狀動脈</li></ul>
      </li>
      <li class="fragment"><strong>3. Graft 問題</strong> — kink、thrombosis、technical failure
        <ul><li>TEE 看 new wall motion abnormality → 對應哪條 graft？</li></ul>
      </li>
      <li class="fragment"><strong>4. RV failure</strong> — 被忽略的殺手
        <ul><li>RV 對缺血更敏感 → TEE 看 RV function</li></ul>
      </li>
      <li class="fragment"><strong>5. Vasoplegia</strong> — CPB 引起的 SIRS → SVR 崩塌
        <ul><li>CO 可能正常但 MAP 低 → NE + Vasopressin</li></ul>
      </li>
    </ul>
  </section>

  <section data-background-color="#001219">
    <h3>下機困難的 Escalation</h3>
    <ol>
      <li class="fragment">Optimize：preload、inotrope、rate/rhythm</li>
      <li class="fragment">IABP — 降 afterload，增加 coronary perfusion（⚠️ SHOCK II trial 後，IABP 在 AMI cardiogenic shock 的角色下降，但在 perioperative support 仍常用）</li>
      <li class="fragment">Impella — 直接從 LV 抽血到 aorta，比 IABP 提供更強的 hemodynamic support</li>
      <li class="fragment">VA-ECMO — 如果仍無法維持循環</li>
    </ol>
    <p class="fragment">⚠️ 知道什麼時候放棄嘗試、上 mechanical support = <strong>救命的判斷</strong></p>
  </section>
</section>

<!-- CPB Side Effects -->
<section data-background-color="#001219">
  <h2>⚠️ CPB 對身體做了什麼</h2>
  <ul>
    <li class="fragment"><span class="highlight">SIRS</span> — 血碰人工管路 → complement activation → 全身發炎</li>
    <li class="fragment"><span class="highlight">Coagulopathy</span> — 血小板消耗 + 凝血因子稀釋 + fibrinolysis</li>
    <li class="fragment"><span class="highlight">Hemodilution</span> — 管路 prime 1-2L → Hct 可能掉到 20%</li>
    <li class="fragment"><span class="highlight">End-organ injury</span> — AKI (20-30%)、CNS injury (1-5%)、gut ischemia</li>
    <li class="fragment"><span class="highlight">Capillary leak</span> → 術後腫一圈 → Day 2-3 開始利尿回來</li>
  </ul>
</section>

<!-- TEG -->
<section>
  <section data-background-color="#001219">
    <h2>🧪 TEG 基本判讀 — 指引輸血決策</h2>
    <p>CPB 後 coagulopathy 很複雜 — Lab 太慢，TEG 讓你<strong>即時知道問題在哪</strong></p>
  </section>

  <section data-background-color="#001219">
    <h3>TEG 的核心概念</h3>
    <p>TEG（Thromboelastography）測量的是<strong>血塊從形成到溶解的全過程</strong></p>
    <ul>
      <li class="fragment">不像傳統 lab（PT/aPTT）只看部分凝血路徑</li>
      <li class="fragment">TEG 看全貌：凝血因子 → 血小板 → fibrinogen → 纖溶</li>
      <li class="fragment">心外術後出血時，TEG 幫你在 10-15 分鐘內決定要輸什麼</li>
    </ul>
  </section>

  <section data-background-color="#001219">
    <h3>三個關鍵參數 → 三個治療方向</h3>
    <table>
      <tr><th>TEG 參數</th><th>代表什麼</th><th>異常時怎麼辦</th></tr>
      <tr><td><span class="highlight">R time</span>（Reaction time）</td><td>凝血因子啟動速度</td><td>R 延長 → <span class="danger">FFP</span>（補凝血因子）</td></tr>
      <tr><td><span class="highlight">MA</span>（Maximum Amplitude）</td><td>血塊最大強度<br/><small>（80% 血小板 + 20% fibrinogen）</small></td><td>MA 降低 → <span class="danger">Platelet ± Cryoprecipitate</span></td></tr>
      <tr><td><span class="highlight">LY30</span>（Lysis at 30 min）</td><td>血塊溶解速度</td><td>LY30 &gt;3% → <span class="danger">TXA（Tranexamic acid）</span></td></tr>
    </table>
  </section>

  <section data-background-color="#001219">
    <h3>💬 TEG-Guided 輸血實戰</h3>
    <p>CABG 術後出血 250 mL/hr，TEG 結果：R 12 min（正常 5-10）, MA 42 mm（正常 50-70）, LY30 8%</p>
    <ul>
      <li class="fragment">R 延長 → 凝血因子不足 → <span class="highlight">給 FFP</span></li>
      <li class="fragment">MA 低 → 血塊強度差（血小板 + fibrinogen）→ <span class="highlight">給 Platelet ± Cryo</span></li>
      <li class="fragment">LY30 高 → 纖溶亢進 → <span class="highlight">給 TXA</span></li>
      <li class="fragment">→ 三管齊下！比盲目輸一堆血品更精準、更有效</li>
    </ul>
    <p class="fragment" style="color:#f4a261;">💡 TEG-guided transfusion 可減少約 30% 不必要的血品使用</p>
  </section>
</section>

<!-- What Would You Do -->
<section data-background-color="#001219">
  <h2>❓ What Would You Do?</h2>
  <ol>
    <li class="fragment">CPB time 已經 200 min，cross clamp 150 min。Weaning 時心臟跳但 CI 只有 1.4，TEE 看 global hypokinesis。<br/><small>→ 最可能的原因？下一步？</small></li>
    <li class="fragment">Protamine 打到一半，BP 突然從 120 → 60，PAP 從 25 → 55<br/><small>→ 什麼反應？怎麼處理？</small></li>
    <li class="fragment">術後 ACT 正常、Plt 90k、Fibrinogen 110、INR 1.8，CT output 300 mL/hr<br/><small>→ 你的 TEG 要看什麼？需要什麼血品？</small></li>
  </ol>
</section>
`,
  },

  "mcs": {
    title: "選修 D：MCS — 機械循環支持",
    subtitle: "「理解原理，才知道什麼時候用什麼」",
    html: `
<section data-background-color="#001219">
  <div class="emoji-big">⚡</div>
  <h1>MCS — 機械循環支持</h1>
  <p class="subtitle">「理解原理，才知道什麼時候用什麼」</p>
  <p class="author">Wilson Chao — 高醫心臟外科</p>
</section>

<section data-background-color="#001219">
  <p class="hook">💬 凌晨三點，急診打來：<br/>55M, anterior STEMI, post-PCI<br/>BP 70/40 on Dobutamine 20 + NE 0.5<br/>Lactate 8, CI 1.3, UO 5 mL/hr<br/><br/>Max inotrope 撐不住。下一步是什麼？</p>
</section>

<!-- Section 1: IABP — Counterpulsation 原理 -->
<section>
  <section data-background-color="#001219">
    <h2>🎈 IABP — Counterpulsation 的生理原理</h2>
    <p>不是背「diastole 充氣、systole 放氣」就好<br/>要懂<strong>為什麼這樣做有幫助</strong></p>
  </section>

  <section data-background-color="#001219">
    <h3>核心原理：兩個效果</h3>
    <ul>
      <li class="fragment"><strong>Diastolic augmentation</strong>（diastole 時充氣）
        <ul>
          <li>氣球在 descending aorta 充氣 → 把血往近端推</li>
          <li>→ 增加 aortic root diastolic pressure → <span class="highlight">增加冠狀動脈灌流</span></li>
          <li>冠狀動脈主要在 diastole 灌流 — 這是最有效率的時機</li>
        </ul>
      </li>
      <li class="fragment"><strong>Systolic unloading</strong>（systole 前放氣）
        <ul>
          <li>氣球瞬間放氣 → 在 aorta 製造「空位」</li>
          <li>→ LV 射血遇到的阻力變小 → <span class="highlight">降低 afterload → 降低心肌氧耗</span></li>
        </ul>
      </li>
    </ul>
  </section>

  <section data-background-color="#001219">
    <h3>IABP 的限制</h3>
    <ul>
      <li class="fragment">CO 只增加 ~0.5 L/min — <strong>modest 效果</strong></li>
      <li class="fragment">需要一定的心臟功能才有效（心臟完全不跳 → IABP 無用）</li>
      <li class="fragment"><span class="danger">禁忌</span>：severe AR（augmentation 反而加重 AR）、aortic dissection、severe PVD</li>
      <li class="fragment">併發症：<span class="danger">limb ischemia</span>（femoral artery 放管 → 下游缺血）</li>
      <li class="fragment">→ 每小時檢查<strong>足背脈搏 + 腳趾顏色</strong></li>
    </ul>
  </section>

  <section data-background-color="#001219">
    <h3>💬 Clinical Pearl</h3>
    <p>IABP 在 2012 SHOCK-II trial 後，在 AMI cardiogenic shock 的角色被質疑。<br/>但在<strong>心臟手術 perioperative support</strong>，它仍然是最常見的 first-line MCS。</p>
    <p class="fragment">為什麼？ → 放置快速、併發症可預期、不需要 surgical cut-down</p>
  </section>
</section>

<!-- Section 2: ECMO -->
<section>
  <section data-background-color="#001219">
    <h2>🔴 ECMO — VA vs VV</h2>
    <p>先搞清楚一件事：<strong>VA 和 VV 解決完全不同的問題</strong></p>
  </section>

  <section data-background-color="#001219">
    <h3>VA-ECMO vs VV-ECMO</h3>
    <table>
      <tr><th></th><th>VA-ECMO</th><th>VV-ECMO</th></tr>
      <tr><td>解決什麼</td><td><span class="highlight">心臟衰竭</span>（± 肺）</td><td><span class="highlight">肺衰竭</span>（心臟 OK）</td></tr>
      <tr><td>血流路徑</td><td>Femoral vein (drainage) → Oxygenator → Femoral artery (return)</td><td>Femoral/IJ vein (drainage) → Oxygenator → IJ vein (return to RA)<br/><small>或 Dual-lumen cannula via IJ（Avalon）</small></td></tr>
      <tr><td>提供</td><td>Hemodynamic support + Gas exchange</td><td>Gas exchange only</td></tr>
      <tr><td>適應症</td><td>Cardiogenic shock、cardiac arrest、post-cardiotomy</td><td>Severe ARDS、bridge to lung transplant</td></tr>
    </table>
    <p class="fragment">心外 ICU 幾乎都是 <span class="highlight">VA-ECMO</span> — 因為問題出在心臟</p>
  </section>

  <section data-background-color="#001219">
    <h3>VA-ECMO 的生理陷阱：LV distension</h3>
    <ul>
      <li class="fragment">VA-ECMO 從 femoral artery 把血打回去 → <strong>增加 afterload</strong></li>
      <li class="fragment">如果 LV 太弱打不出去 → 血回不來 + afterload 增加 → <span class="danger">LV 越脹越大</span></li>
      <li class="fragment">LV 脹大 → wall stress↑ → 心肌氧耗↑ → 恢復更困難 → <span class="danger">惡性循環</span></li>
      <li class="fragment">怎麼知道？ → Echo 看 LV size、aortic valve 有沒有在開</li>
    </ul>
  </section>

  <section data-background-color="#001219">
    <h3>LV Venting 策略</h3>
    <ul>
      <li class="fragment"><span class="highlight">IABP + ECMO</span> — IABP 降 afterload，幫 LV 減壓</li>
      <li class="fragment"><span class="highlight">ECpella</span>（Impella + ECMO）— Impella 直接從 LV 抽血出來 → 最有效的 unloading</li>
      <li class="fragment">Surgical vent — LA vent 或 atrial septostomy</li>
      <li class="fragment">原則：<strong>看到 LV distension 就要處理，不能等</strong></li>
    </ul>
  </section>

  <section data-background-color="#001219">
    <h3>ECMO 有沒有效？怎麼知道心臟在恢復？</h3>
    <ul>
      <li class="fragment"><span class="highlight">Pulsatility</span> — A-line 上有 pulse pressure → 心臟在跳在射血</li>
      <li class="fragment"><span class="highlight">Lactate 下降</span> → 組織灌流改善</li>
      <li class="fragment"><span class="highlight">End-organ recovery</span> — UO 增加、意識清楚</li>
      <li class="fragment"><span class="highlight">Echo</span> — LV function 改善、aortic valve 開始開</li>
    </ul>
  </section>
</section>

<!-- Section 2.5: ECMO 併發症 -->
<section>
  <section data-background-color="#001219">
    <h2>⚠️ ECMO 併發症 — 不只是出血和血栓</h2>
    <p>ECMO 是救命工具，但它本身也會帶來問題</p>
  </section>

  <section data-background-color="#001219">
    <h3>VA-ECMO 特有併發症</h3>
    <ul>
      <li class="fragment"><strong>Limb ischemia</strong>（femoral artery cannulation → 下游缺血）
        <ul>
          <li>解法：<span class="highlight">Distal perfusion cannula (DPC)</span> — 從 ECMO circuit 分一條小管到 SFA 遠端</li>
          <li>放 VA-ECMO 時<strong>常規放 DPC</strong>，不要等到缺血才處理</li>
        </ul>
      </li>
      <li class="fragment"><strong>Differential hypoxemia / Harlequin syndrome</strong>
        <ul>
          <li>心臟恢復一點、開始射血 → 但肺還沒好 → 左心射出 deoxygenated blood</li>
          <li>ECMO 從 femoral artery 打上去的是 oxygenated blood → 兩股血在 aorta 交會</li>
          <li>結果：<span class="danger">上半身（冠狀動脈、腦）缺氧，下半身正常</span></li>
          <li>監測：<span class="highlight">右手 SpO₂</span>（代表 native cardiac output 的氧合）</li>
          <li>處理：加 VV-ECMO 或改 central cannulation</li>
        </ul>
      </li>
      <li class="fragment"><strong>Hemolysis</strong>
        <ul>
          <li>血球通過 pump → 機械性破壞 → pfHb↑、LDH↑、haptoglobin↓</li>
          <li>嚴重時 → AKI（free hemoglobin 傷腎）</li>
          <li>處理：降低 pump speed、換 oxygenator、檢查有無 clot</li>
        </ul>
      </li>
    </ul>
  </section>
</section>

<!-- Section 2.7: Impella -->
<section>
  <section data-background-color="#001219">
    <h2>🔧 Impella — 直接 Unload LV</h2>
    <p>如果 IABP 不夠力，但還不需要 ECMO 的全面支持呢？</p>
  </section>

  <section data-background-color="#001219">
    <h3>Impella 原理</h3>
    <ul>
      <li class="fragment">Axial flow pump — 像一個<strong>阿基米德螺旋</strong>（Archimedes screw）</li>
      <li class="fragment">經 femoral artery → retrograde 跨過 aortic valve → pump 頭在 LV 裡面</li>
      <li class="fragment">直接從 LV 抽血 → 打到 ascending aorta → <span class="highlight">真正的 LV unloading</span></li>
      <li class="fragment">效果：降低 LVEDP、降低 wall stress、增加 coronary perfusion pressure</li>
      <li class="fragment">跟 IABP 比：<strong>不依賴心臟自己的收縮力</strong> — 心臟不跳也能支持</li>
    </ul>
  </section>

  <section data-background-color="#001219">
    <h3>Impella 型號</h3>
    <table>
      <tr><th>型號</th><th>置入方式</th><th>Flow</th><th>適用情境</th></tr>
      <tr><td><span class="highlight">Impella CP</span></td><td>Percutaneous（femoral artery）</td><td>~3.5 L/min</td><td>Cath lab 直接放、AMI shock</td></tr>
      <tr><td><span class="highlight">Impella 5.0 / 5.5</span></td><td>Surgical（axillary artery cut-down）</td><td>~5.0-5.5 L/min</td><td>需要更強 support、post-cardiotomy</td></tr>
      <tr><td>Impella RP</td><td>Percutaneous（femoral vein）</td><td>~4 L/min</td><td>RV failure support</td></tr>
    </table>
    <p class="fragment">💬 <strong>ECpella = Impella + VA-ECMO</strong> — ECMO 維持全身灌流，Impella 負責 LV unloading → 目前被認為最好的 LV venting 策略</p>
  </section>

  <section data-background-color="#001219">
    <h3>MCS 比較：IABP vs Impella vs VA-ECMO</h3>
    <table>
      <tr><th></th><th>IABP</th><th>Impella</th><th>VA-ECMO</th></tr>
      <tr><td>Hemodynamic support</td><td>~0.5 L/min</td><td>3.5-5.5 L/min</td><td>4-6 L/min（full support）</td></tr>
      <tr><td>LV unloading</td><td>Modest（降 afterload）</td><td><span class="highlight">Direct unloading</span></td><td><span class="danger">增加 afterload</span></td></tr>
      <tr><td>需要心臟跳動</td><td>是（需要 trigger）</td><td>否</td><td>否</td></tr>
      <tr><td>Oxygenation support</td><td>無</td><td>無</td><td><span class="highlight">有</span></td></tr>
      <tr><td>置入難度</td><td>最簡單</td><td>中等</td><td>中等（但需外科 backup）</td></tr>
      <tr><td>適用 shock 程度</td><td>SCAI B-C</td><td>SCAI C-D</td><td>SCAI D-E</td></tr>
    </table>
  </section>
</section>

<!-- Section 2.8: SCAI Shock Classification -->
<section data-background-color="#001219">
  <h2>📊 SCAI Shock Classification</h2>
  <p>Cardiogenic shock 不是只有「有」或「沒有」— 有分級，才知道用什麼武器</p>
  <table>
    <tr><th>Stage</th><th>名稱</th><th>描述</th><th>MCS 考量</th></tr>
    <tr><td><strong>A</strong></td><td>At Risk</td><td>有大面積 MI/HF，但 hemodynamics 還穩</td><td>觀察、optimize meds</td></tr>
    <tr><td><strong>B</strong></td><td>Beginning</td><td>HR↑、BP 偏低、Lactate 正常或稍高</td><td>考慮 IABP</td></tr>
    <tr><td><strong>C</strong></td><td>Classic</td><td>CI &lt;2.2, SBP &lt;90 or vasopressor, Lactate↑</td><td>IABP / Impella</td></tr>
    <tr><td><strong>D</strong></td><td>Deteriorating</td><td>Max inotrope/vasopressor 仍惡化</td><td><span class="highlight">Impella / VA-ECMO</span></td></tr>
    <tr><td><strong>E</strong></td><td>Extremis</td><td>Cardiac arrest / refractory PEA / VT storm</td><td><span class="danger">VA-ECMO（eCPR）</span></td></tr>
  </table>
  <p class="fragment">💬 記法：<strong>ABCDE</strong> = At risk → Beginning → Classic → Deteriorating → Extremis<br/>越往下越嚴重，MCS 越強</p>
</section>

<!-- Section 3: LVAD -->
<section>
  <section data-background-color="#001219">
    <h2>🫀 LVAD — 長期支持</h2>
    <p>IABP 和 ECMO 是<strong>暫時</strong>的。如果心臟不會恢復呢？</p>
  </section>

  <section data-background-color="#001219">
    <h3>LVAD 的兩個角色</h3>
    <ul>
      <li class="fragment"><strong>Bridge to Transplant (BTT)</strong> — 等心臟移植的過渡</li>
      <li class="fragment"><strong>Destination Therapy (DT)</strong> — 不適合移植的終極方案</li>
      <li class="fragment">差別：<strong>有沒有可能等到心臟？</strong>
        <ul>
          <li>年輕、沒有 contraindication → BTT → 等到心臟就換</li>
          <li>年齡大、有 contraindication（癌症、肝硬化、compliance 差）→ DT → 長期帶著</li>
        </ul>
      </li>
    </ul>
  </section>

  <section data-background-color="#001219">
    <h3>INTERMACS Profile — 誰該裝 LVAD？</h3>
    <p>不是所有 end-stage HF 都直接裝 LVAD — 太早浪費、太晚風險爆增</p>
    <table>
      <tr><th>Profile</th><th>描述</th><th>策略</th></tr>
      <tr><td><strong>1</strong></td><td>Critical cardiogenic shock（crash &amp; burn）</td><td><span class="danger">先 ECMO bridge → 穩定後再評估 LVAD</span></td></tr>
      <tr><td><strong>2</strong></td><td>Progressive decline on inotropes</td><td><span class="highlight">LVAD implant（最佳時機）</span></td></tr>
      <tr><td><strong>3</strong></td><td>Stable but inotrope-dependent</td><td>LVAD implant</td></tr>
      <tr><td><strong>4</strong></td><td>Resting symptoms（frequent HF admission）</td><td>考慮 LVAD（尤其 DT）</td></tr>
    </table>
    <p class="fragment">💬 為什麼 Profile 1 不直接裝 LVAD？<br/>→ 太 sick → 手術死亡率高 + 常合併 MOF → 先用 ECMO 穩住 end-organ，確認 neurologically intact，再決定 LVAD or transplant</p>
  </section>

  <section data-background-color="#001219">
    <h3>LVAD 病人的生活</h3>
    <ul>
      <li class="fragment">可以回家、工作、旅行 — 背一個電池包</li>
      <li class="fragment"><span class="danger">Driveline</span>：皮膚穿出的電線 → 感染入口 → 最大的長期問題</li>
      <li class="fragment"><span class="danger">終身 anticoagulation</span> → 出血 vs 血栓的永恆拉鋸</li>
      <li class="fragment">沒有脈搏（continuous flow）→ 量不到一般血壓 → 用 Doppler MAP</li>
    </ul>
  </section>
</section>

<!-- Section 4: Selection Flowchart -->
<section>
  <section data-background-color="#001219">
    <h2>🗺️ MCS 選擇邏輯</h2>
    <p>Cardiogenic shock → max inotrope 不夠 → 選哪一個？</p>
  </section>

  <section data-background-color="#001219">
    <h3>Decision Flowchart</h3>
    <ul>
      <li class="fragment"><strong>Step 1：心臟還在跳嗎？</strong>
        <ul>
          <li>心跳停止 / 快要停 → <span class="danger">VA-ECMO</span>（最快、最暴力的支持）</li>
          <li>心臟還在跳 → 往下</li>
        </ul>
      </li>
      <li class="fragment"><strong>Step 2：需要多少支持？</strong>
        <ul>
          <li>Modest support（CI 差一點）→ <span class="highlight">IABP</span>（放置快、風險低）</li>
          <li>Significant LV failure → <span class="highlight">Impella</span>（直接 unload LV）</li>
          <li>Biventricular failure → <span class="highlight">VA-ECMO</span></li>
        </ul>
      </li>
      <li class="fragment"><strong>Step 3：ECMO 上了之後 → LV distension？</strong>
        <ul>
          <li>有 → 加 IABP 或升級 <span class="highlight">ECpella</span></li>
        </ul>
      </li>
      <li class="fragment"><strong>Step 4：心臟恢復了嗎？</strong>
        <ul>
          <li>有 → wean</li>
          <li>沒有 → Bridge to VAD or Transplant 討論</li>
        </ul>
      </li>
    </ul>
  </section>
</section>

<!-- Anticoagulation -->
<section data-background-color="#001219">
  <h2>💊 MCS Anticoagulation</h2>
  <ul>
    <li class="fragment">所有 MCS 都需要 anticoagulation — 血碰到人工表面就會凝</li>
    <li class="fragment">ECMO：Heparin drip, aPTT target 1.5-2× baseline（各院 protocol 不同，約 50-80 sec）</li>
    <li class="fragment"><span class="danger">永恆的拉鋸</span>：anticoagulate 太多 → 出血 | 太少 → blood clot</li>
    <li class="fragment">每天監測：ACT/aPTT + Plt + Fibrinogen + Hemolysis markers (LDH, pfHb)</li>
    <li class="fragment">⚠️ ECMO 上太久 → HIT (Heparin-Induced Thrombocytopenia) → 改 Bivalirudin</li>
  </ul>
</section>

<!-- What Would You Do -->
<section data-background-color="#001219">
  <h2>❓ What Would You Do?</h2>
  <ol>
    <li class="fragment">IABP 放了 4 小時，Lactate 從 6 → 9，CI 1.2，BP 65/40 on max inotrope<br/><small>→ IABP 不夠了。你選 Impella or VA-ECMO？為什麼？</small></li>
    <li class="fragment">VA-ECMO Day 3：A-line 完全沒有 pulsatility，Echo 顯示 LV 脹大、aortic valve 不開<br/><small>→ 代表什麼？你的 venting 策略？如果心臟不恢復呢？</small></li>
    <li class="fragment">VA-ECMO Day 5：開始有 pulsatility，Lactate 1.2，UO 恢復，Echo 看 LVEF 30%→40%<br/><small>→ 可以 wean 嗎？怎麼做？什麼情況下不能 wean？</small></li>
  </ol>
</section>
`,
  },

  "aortic": {
    title: "選修 E：Aortic Surgery — 主動脈手術",
    subtitle: "「理解分類背後的邏輯」",
    html: `
<section data-background-color="#001219">
  <div class="emoji-big">🚨</div>
  <h1>Aortic Surgery — 主動脈手術</h1>
  <p class="subtitle">「理解分類背後的邏輯」</p>
  <p class="author">Wilson Chao — 高醫心臟外科</p>
</section>

<section data-background-color="#001219">
  <p class="hook">💬 凌晨兩點，急診打來：<br/>40M, 突發撕裂性胸痛，延伸到背部<br/>BP 右手 180/100, 左手 140/70<br/>CT 顯示 Type A Dissection with pericardial effusion<br/><br/>你有幾個小時？</p>
</section>

<!-- Section 1: Why Classifications Exist -->
<section>
  <section data-background-color="#001219">
    <h2>📋 分類 — 不是背圖，是理解邏輯</h2>
    <p>為什麼要分類？ → <strong>因為治療策略完全不同</strong></p>
  </section>

  <section data-background-color="#001219">
    <h3>Stanford Classification — 簡單但有力</h3>
    <table>
      <tr><th></th><th>Type A</th><th>Type B</th></tr>
      <tr><td>定義</td><td>涉及 <span class="danger">ascending aorta</span></td><td>不涉及 ascending（只有 descending）</td></tr>
      <tr><td>處理</td><td><span class="danger">緊急手術</span></td><td>先 medical → complicated 才 intervene</td></tr>
    </table>
    <p class="fragment">為什麼這樣分？ → 因為 ascending aorta 的解剖位置決定了一切。</p>
  </section>

  <section data-background-color="#001219">
    <h3>Type A = 急診。為什麼？</h3>
    <ul>
      <li class="fragment"><strong>1. Ascending aorta → 心包膜裡面</strong>
        <ul><li>破裂 → 血進心包膜 → <span class="danger">Tamponade → 死</span></li></ul>
      </li>
      <li class="fragment"><strong>2. 靠近 aortic valve</strong>
        <ul><li>Dissection 到 aortic root → AR → <span class="danger">急性心衰</span></li></ul>
      </li>
      <li class="fragment"><strong>3. 靠近 coronary ostia</strong>
        <ul><li>Flap 蓋住 coronary → <span class="danger">MI</span>（ECG 可能看到 ST elevation）</li></ul>
      </li>
      <li class="fragment"><strong>4. 靠近 arch branches</strong>
        <ul><li>Innominate / carotid → <span class="danger">Stroke</span></li></ul>
      </li>
      <li class="fragment">→ <strong>未治療的 Type A，每小時死亡率 1-2%</strong></li>
    </ul>
  </section>

  <section data-background-color="#001219">
    <h3>DeBakey Classification — 更精細</h3>
    <table>
      <tr><th>DeBakey</th><th>範圍</th><th>= Stanford</th></tr>
      <tr><td>Type I</td><td>Ascending → Arch → Descending（最廣）</td><td>Type A</td></tr>
      <tr><td>Type II</td><td>只有 Ascending</td><td>Type A</td></tr>
      <tr><td>Type III</td><td>只有 Descending</td><td>Type B</td></tr>
    </table>
    <p class="fragment">DeBakey 的價值：區分 DeBakey I vs II 影響手術策略<br/>（Type I 可能需要 arch repair；Type II 可能只要 ascending replacement）</p>
  </section>
</section>

<!-- Section 1.5: Acute Aortic Syndrome -->
<section data-background-color="#001219">
  <h2>🩸 Acute Aortic Syndrome — 三兄弟</h2>
  <p>Dissection 不是唯一的急性主動脈事件 — 還有兩個「兄弟」，臨床表現幾乎一樣</p>
  <table>
    <tr><th></th><th>Aortic Dissection</th><th>Intramural Hematoma (IMH)</th><th>Penetrating Aortic Ulcer (PAU)</th></tr>
    <tr><td>病理</td><td>Intimal tear → false lumen 形成</td><td>Vasa vasorum 破裂 → 壁內出血<br/><small>（沒有 intimal tear、沒有 flow in false lumen）</small></td><td>Atherosclerotic ulcer 穿透 intima → 侵入 media</td></tr>
    <tr><td>CT 特徵</td><td>Intimal flap + dual lumen</td><td>Crescent-shaped wall thickening（&gt;5mm）<br/>無 intimal flap</td><td>Focal outpouching + 周圍 wall thickening</td></tr>
    <tr><td>好發</td><td>相對年輕、Marfan/CTD</td><td>老年人、高血壓</td><td>老年人、severe atherosclerosis</td></tr>
    <tr><td>治療</td><td>Type A → 手術 / Type B → 視 complicated</td><td>類似 dissection 原則（Type A → 手術）</td><td>多數 TEVAR 或 medical（視位置和深度）</td></tr>
  </table>
  <p class="fragment">💬 三者都叫 Acute Aortic Syndrome (AAS) — CT 鑑別是關鍵。IMH 可以進展成 dissection，PAU 可以破裂。</p>
</section>

<!-- Section 2: Malperfusion -->
<section>
  <section data-background-color="#001219">
    <h2>⚠️ Malperfusion Syndrome</h2>
    <p>Dissection 不只是主動脈的問題 — <strong>每個 branch 都可能受害</strong></p>
  </section>

  <section data-background-color="#001219">
    <h3>什麼是 Malperfusion？</h3>
    <ul>
      <li class="fragment">Dissection flap 是一片在 aorta 裡面飄的膜</li>
      <li class="fragment">如果 flap 蓋住 branch vessel 的開口 → 下游器官缺血</li>
      <li class="fragment">兩個機制：
        <ul>
          <li><strong>Static</strong>：flap 直接擋住 branch ostium</li>
          <li><strong>Dynamic</strong>：false lumen 壓力 > true lumen → 壓扁 true lumen</li>
        </ul>
      </li>
    </ul>
  </section>

  <section data-background-color="#001219">
    <h3>各器官 Malperfusion 表現</h3>
    <table>
      <tr><th>Branch</th><th>器官</th><th>表現</th><th>怎麼查</th></tr>
      <tr><td>Coronary</td><td>心臟</td><td><span class="danger">MI / cardiogenic shock</span></td><td>ECG, Troponin, Echo</td></tr>
      <tr><td>Carotid</td><td>腦</td><td><span class="danger">Stroke / 意識改變</span></td><td>Neuro exam, CT</td></tr>
      <tr><td>SMA</td><td>腸</td><td><span class="danger">腹痛、Lactate↑↑</span></td><td>CT, Lactate, physical exam</td></tr>
      <tr><td>Renal</td><td>腎</td><td><span class="danger">AKI / anuria</span></td><td>Cr, UO</td></tr>
      <tr><td>Iliac</td><td>下肢</td><td><span class="danger">Limb ischemia</span></td><td>足脈、ABI</td></tr>
      <tr><td>Spinal</td><td>脊髓</td><td><span class="danger">Paraplegia</span></td><td>Neuro exam</td></tr>
    </table>
  </section>

  <section data-background-color="#001219">
    <h3>💬 回到開場的 Case</h3>
    <p>40M, Type A, 右手 BP 180, 左手 BP 140</p>
    <ul>
      <li class="fragment">兩手 BP 差 40 mmHg → 左 subclavian / innominate 受 flap 影響</li>
      <li class="fragment">Pericardial effusion → 主動脈破裂滲血到心包膜 → 隨時可能 tamponade</li>
      <li class="fragment">→ 這是最緊急的情況：<span class="danger">Type A + pericardial effusion = 立即上 OR</span></li>
    </ul>
  </section>
</section>

<!-- Section 3: Surgical Strategy -->
<section>
  <section data-background-color="#001219">
    <h2>🔪 手術策略 — 什麼時候做什麼</h2>
    <p>不是每個 Type A 都做一樣的手術</p>
  </section>

  <section data-background-color="#001219">
    <h3>決策邏輯</h3>
    <ul>
      <li class="fragment"><strong>Ascending replacement only</strong>
        <ul><li>Tear 只在 ascending、root 正常、arch 沒受影響</li>
        <li>最簡單、最快</li></ul>
      </li>
      <li class="fragment"><strong>Bentall procedure</strong>（Root + Valve replacement）
        <ul><li>Root 擴大（如 Marfan）、severe AR from root dilatation</li>
        <li>Composite graft + mechanical valve + reimplant coronaries</li>
        <li>代價：<span class="danger">終身 anticoagulation</span>（mechanical valve）</li></ul>
      </li>
      <li class="fragment"><strong>David procedure</strong>（Valve-sparing root replacement）
        <ul><li>Root 擴大 + AR，但 <span class="highlight">valve leaflets 本身正常</span></li>
        <li>年輕患者 / Marfan → 保留自己的 valve → <strong>不用終身 anticoagulation</strong></li>
        <li>技術：把 native valve reimplant 進 graft 裡面（reimplantation technique）</li>
        <li>適用條件：leaflet 沒有退化、沒有嚴重 calcification</li></ul>
      </li>
      <li class="fragment"><strong>Hemiarch</strong>
        <ul><li>Tear 延伸到 arch 底部</li>
        <li>換掉 ascending + 部分 arch（lesser curvature）</li>
        <li>需要 DHCA（但時間較短）</li></ul>
      </li>
      <li class="fragment"><strong>Total arch replacement</strong>
        <ul><li>Arch 嚴重受累、multiple tears、Marfan</li>
        <li>換掉整個 arch + reimplant 三支 branch vessels</li>
        <li>需要 DHCA + selective cerebral perfusion</li>
        <li>手術時間長、風險最高</li></ul>
      </li>
      <li class="fragment"><strong>Frozen Elephant Trunk (FET)</strong>
        <ul><li>Total arch replacement + 一段 stent graft 延伸進 descending aorta</li>
        <li>適應症：<span class="highlight">DeBakey Type I dissection 延伸到 descending</span> — 一次手術同時處理 arch + 近端 descending</li>
        <li>優勢：避免二次 descending 手術、促進 false lumen thrombosis</li></ul>
      </li>
    </ul>
  </section>

  <section data-background-color="#001219">
    <h3>DHCA — Deep Hypothermic Circulatory Arrest</h3>
    <ul>
      <li class="fragment">Arch surgery 需要停止全身循環 → 怎麼保護腦？</li>
      <li class="fragment"><strong>降溫到 18-20°C（Deep HCA）</strong> → 腦代謝率降到 10-15%</li>
      <li class="fragment">安全時間：DHCA alone ~30 min</li>
      <li class="fragment"><strong>趨勢：Moderate HCA (24-28°C) + ACP</strong> — 不用降那麼低，搭配腦灌流一樣安全，且 coagulopathy 較輕</li>
    </ul>
  </section>

  <section data-background-color="#001219">
    <h3>Cerebral Perfusion 策略：ACP vs RCP</h3>
    <table>
      <tr><th></th><th>ACP（Antegrade Cerebral Perfusion）</th><th>RCP（Retrograde Cerebral Perfusion）</th></tr>
      <tr><td>路徑</td><td>Innominate / R. axillary artery → 順行灌腦</td><td>SVC → 逆行從靜脈端灌</td></tr>
      <tr><td>腦保護效果</td><td><span class="highlight">較好</span>（生理方向）</td><td>較差（逆行，實際灌流量有限）</td></tr>
      <tr><td>安全操作時間</td><td>60-90+ min</td><td>~30 min（額外多撐一些）</td></tr>
      <tr><td>額外好處</td><td>—</td><td>Flush out air &amp; debris</td></tr>
      <tr><td>技術難度</td><td>較高（需 cannulate arch branches）</td><td>較簡單</td></tr>
    </table>
    <p class="fragment">💬 目前趨勢：<span class="highlight">Moderate HCA + ACP</span> 成為主流 — 腦保護更好、rewarming 更快、coagulopathy 更輕</p>
    <ul>
      <li class="fragment">代價：嚴重 coagulopathy（需要大量血品）、prolonged rewarming</li>
    </ul>
  </section>
</section>

<!-- Section 4: Type B -->
<section>
  <section data-background-color="#001219">
    <h2>📌 Type B — 不是都吃藥就好</h2>
    <p>關鍵區分：<strong>Uncomplicated vs Complicated</strong></p>
  </section>

  <section data-background-color="#001219">
    <h3>Uncomplicated Type B</h3>
    <ul>
      <li class="fragment">Medical management：<strong>控制 BP + HR</strong></li>
      <li class="fragment">目標：SBP 100-120, HR &lt;60 bpm</li>
      <li class="fragment">首選 <span class="highlight">IV β-blocker</span>（Esmolol / Labetalol）→ 降 HR 先（降低 dP/dt → 降低 shear stress）</li>
      <li class="fragment">不夠再加 NTG 或 Nicardipine</li>
    </ul>
  </section>

  <section data-background-color="#001219">
    <h3>Complicated Type B → TEVAR</h3>
    <p>什麼叫 complicated？</p>
    <ul>
      <li class="fragment"><span class="danger">Malperfusion</span>（任何器官缺血）</li>
      <li class="fragment"><span class="danger">Rupture / impending rupture</span></li>
      <li class="fragment"><span class="danger">Rapid expansion</span>（&gt;5mm/6months）</li>
      <li class="fragment"><span class="danger">Refractory pain or HTN</span>（max 藥物控制不住）</li>
    </ul>
    <p class="fragment">→ <span class="highlight">TEVAR</span>：經 femoral artery 放 stent graft → 蓋住 entry tear → 促進 false lumen thrombosis</p>
  </section>
</section>

<!-- Post-op -->
<section data-background-color="#001219">
  <h2>🏥 術後特殊照顧</h2>
  <ul>
    <li class="fragment"><span class="danger">Spinal cord ischemia</span> — 下肢無力/癱瘓
      <ul><li>CSF drainage（降低脊髓壓力 → 增加灌流壓）</li>
      <li>MAP 維持 &gt;80（spinal cord perfusion pressure）</li></ul>
    </li>
    <li class="fragment"><span class="danger">Coagulopathy</span> — DHCA 後最嚴重（可能需要 10+ units PRBC）</li>
    <li class="fragment"><span class="highlight">BP 控制</span> — SBP 100-120, HR &lt;80（β-blocker first line）</li>
    <li class="fragment">End-organ monitoring — 腸（lactate、physical exam）、腎（Cr、UO）、四肢（pulses）</li>
  </ul>
</section>

<!-- ER Checklist -->
<section data-background-color="#001219">
  <h2>📋 Suspected Aortic Dissection — ER Protocol</h2>
  <ul>
    <li>□ 兩條 large bore IV</li>
    <li>□ Type & Screen + 備血（至少 10U PRBC + FFP + Plt + Cryo — 大主動脈手術必備 massive transfusion protocol）</li>
    <li>□ ECG（排除 STEMI — 但 dissection 可以造成 STEMI！）</li>
    <li>□ 兩手量 BP + 四肢脈搏</li>
    <li>□ Bedside Echo（pericardial effusion? AR?）</li>
    <li>□ <span class="danger">CT Angiography — STAT</span></li>
    <li>□ Type A → <span class="danger">立即 call OR + 心外團隊</span></li>
    <li>□ 詢問 <strong>Marfan / CTD family history</strong>（家族有無猝死、主動脈手術、身材高瘦、關節過度活動）</li>
    <li>□ BP control：<strong>先降 HR（β-blocker）再降 BP</strong></li>
    <li>□ 為什麼先降 HR？ → 降低 dP/dt → 降低主動脈壁 shear stress → 減緩 dissection propagation</li>
  </ul>
</section>

<!-- What Would You Do -->
<section data-background-color="#001219">
  <h2>❓ What Would You Do?</h2>
  <ol>
    <li class="fragment">CT：Type A dissection，aortic root 擴大到 55mm，severe AR，coronary 沒被 involve<br/><small>→ 需要什麼手術？（提示：root 擴大 + AR → Bentall？但如果 valve leaflet 正常 → 能不能 David？考慮年紀和 anticoagulation 需求）</small></li>
    <li class="fragment">45M, Marfan, Type A。CT 顯示 tear from ascending 延伸到 arch，arch branches 都有 flap<br/><small>→ Ascending replacement 夠嗎？你的手術策略？</small></li>
    <li class="fragment">60M, Type B dissection, 腹痛劇烈, Lactate 8, 右腎功能惡化, 右腳脈搏弱<br/><small>→ Uncomplicated or Complicated？哪些器官 malperfusion？下一步？</small></li>
  </ol>
</section>
`,
  },

  "varicose-vein": {
    title: "Varicose Vein — 靜脈曲張",
    subtitle: "「這條腿為什麼腫起來？」",
    html: `
<!-- Title -->
<section data-background-color="#001219">
  <div class="emoji-big">🦵</div>
  <h1>Varicose Vein — 靜脈曲張</h1>
  <p class="subtitle">「這條腿為什麼腫起來？」</p>
  <p class="author">Wilson Chao — 高醫心臟外科</p>
</section>

<!-- Hook -->
<section data-background-color="#001219">
  <p class="hook">💬 門診來了一位 55 歲女性，久站工作（老師），<br/>左小腿「青筋浮出」好幾年，最近開始痠脹、半夜抽筋。<br/>她問你：「這個要不要處理？」</p>
  <p class="fragment">你怎麼評估？什麼時候該介入？</p>
</section>

<!-- Section 1: Anatomy & Pathophysiology -->
<section>
  <section data-background-color="#001219">
    <h2>🩻 解剖與病理生理</h2>
    <p>要治療靜脈曲張，先搞懂血液怎麼從腳回到心臟</p>
  </section>

  <section data-background-color="#001219">
    <h3>下肢靜脈系統三層結構</h3>
    <ul>
      <li><span class="highlight">Deep veins</span> — femoral, popliteal, tibial（在肌肉內，負責 90% 回流）</li>
      <li class="fragment"><span class="highlight">Superficial veins</span> — GSV、SSV（在皮下筋膜層）</li>
      <li class="fragment"><span class="highlight">Perforating veins</span> — 連接 superficial → deep（單向閥門）</li>
    </ul>
    <p class="fragment">關鍵概念：血液只能 superficial → deep → 心臟，<strong>不能反過來</strong></p>
  </section>

  <section data-background-color="#001219">
    <h3>GSV — Great Saphenous Vein</h3>
    <ul>
      <li>起點：foot medial marginal vein</li>
      <li>走向：<span class="highlight">medial malleolus → medial leg → medial thigh</span></li>
      <li class="fragment">終點：<span class="highlight">Saphenofemoral Junction (SFJ)</span> — 匯入 common femoral vein</li>
      <li class="fragment">SFJ 位置：<span class="highlight">inguinal ligament 下方約 3-4 cm</span>（約 inguinal crease 高度）</li>
      <li class="fragment">⚠️ 最常見的靜脈曲張來源（~80%）</li>
    </ul>
  </section>

  <section data-background-color="#001219">
    <h3>SSV — Small Saphenous Vein</h3>
    <ul>
      <li>起點：foot lateral marginal vein</li>
      <li>走向：<span class="highlight">lateral malleolus → posterior calf</span></li>
      <li class="fragment">終點：<span class="highlight">Saphenopopliteal Junction (SPJ)</span> — 匯入 popliteal vein</li>
      <li class="fragment">SPJ 位置變異大（popliteal fossa 附近，但高度不定）</li>
      <li class="fragment">約 15-20% 的靜脈曲張跟 SSV 有關</li>
    </ul>
  </section>

  <section data-background-color="#001219">
    <h3>瓣膜失能 — 為什麼會靜脈曲張？</h3>
    <ul>
      <li>正常：<span class="success">calf muscle pump 收縮 → 血液往上推 → 瓣膜關閉防止逆流</span></li>
      <li class="fragment">異常：瓣膜關不住 → <span class="danger">血液逆流（reflux）→ 靜脈壓升高</span></li>
      <li class="fragment">慢性靜脈高壓 → 管壁擴張、扭曲 → 更多瓣膜壞掉 → <span class="danger">惡性循環</span></li>
    </ul>
    <p class="fragment">想像一棟大樓的排水管，逆止閥壞掉 → 水往低處倒灌 → 壓力越來越大 → 更多閥壞掉</p>
  </section>

  <section data-background-color="#001219">
    <h3>Perforator 的角色</h3>
    <ul>
      <li>正常：superficial → deep（單向）</li>
      <li class="fragment">perforator 瓣膜失能 → deep system 的高壓灌回 superficial</li>
      <li class="fragment">常見位置：<span class="highlight">Cockett perforators</span>（medial calf, posterior tibial area）</li>
      <li class="fragment">perforator incompetence + superficial reflux = <span class="danger">C5-C6 潰瘍的主因</span></li>
    </ul>
  </section>

  <section data-background-color="#001219">
    <h3>風險因子 — 為什麼是她？</h3>
    <ul>
      <li><span class="highlight">久站職業</span>（老師、護理師、廚師）— 重力持續作用</li>
      <li class="fragment"><span class="highlight">女性 > 男性</span>（~3:1）— 荷爾蒙、懷孕</li>
      <li class="fragment">懷孕：子宮壓迫 IVC + progesterone 使靜脈壁鬆弛</li>
      <li class="fragment">肥胖、家族史、年齡、DVT 病史</li>
    </ul>
  </section>
</section>

<!-- Section 2: Clinical Presentation & CEAP -->
<section>
  <section data-background-color="#001219">
    <h2>👁️ 臨床表現與 CEAP 分級</h2>
    <p>💬 門診來了五個病人都說「腿有問題」—— 嚴重度差很多</p>
  </section>

  <section data-background-color="#001219">
    <h3>症狀：病人怎麼來找你的</h3>
    <ul>
      <li>下肢<span class="highlight">痠脹、沉重感</span> — 越站越嚴重，抬腿會改善</li>
      <li class="fragment">夜間抽筋（nocturnal cramps）</li>
      <li class="fragment">癢、burning sensation</li>
      <li class="fragment">外觀：可見的扭曲靜脈、spider veins</li>
      <li class="fragment">⚠️ 症狀嚴重度不一定跟外觀成正比</li>
    </ul>
  </section>

  <section data-background-color="#001219">
    <h3>CEAP Classification — C 分級</h3>
    <p>CEAP = <span class="highlight">Clinical, Etiologic, Anatomic, Pathophysiologic</span></p>
    <p>臨床最常用的是 C 分級（C0-C6）：</p>
  </section>

  <section data-background-color="#001219">
    <h3>C0 — C2：早期</h3>
    <ul>
      <li><strong>C0</strong>：無可見或可觸及的靜脈疾病<span class="fragment">（但可能有症狀！）</span></li>
      <li class="fragment"><strong>C1</strong>：<span class="highlight">Telangiectasia / reticular veins</span>（蜘蛛絲狀，&lt;3mm）</li>
      <li class="fragment"><strong>C2</strong>：<span class="highlight">Varicose veins</span>（≥3mm，扭曲擴張的表淺靜脈）</li>
      <li class="fragment">C1-C2 是門診最常見的 — 多數人為了「外觀」來</li>
    </ul>
  </section>

  <section data-background-color="#001219">
    <h3>C3 — C4：中期（開始有組織變化）</h3>
    <ul>
      <li><strong>C3</strong>：<span class="highlight">Edema</span>（水腫）— 慢性靜脈高壓的結果</li>
      <li class="fragment"><strong>C4a</strong>：<span class="highlight">Pigmentation / eczema</span>（色素沉澱、濕疹）</li>
      <li class="fragment"><strong>C4b</strong>：<span class="danger">Lipodermatosclerosis / atrophie blanche</span></li>
      <li class="fragment">C4b 很重要 — 皮下纖維化，皮膚硬如木板 → 潰瘍前兆</li>
      <li class="fragment">C4c（2020 更新）：Corona phlebectatica — 足踝周圍的 fan-shaped telangiectasia</li>
    </ul>
  </section>

  <section data-background-color="#001219">
    <h3>C5 — C6：晚期</h3>
    <ul>
      <li><strong>C5</strong>：<span class="danger">Healed venous ulcer</span>（癒合的潰瘍）</li>
      <li class="fragment"><strong>C6</strong>：<span class="danger">Active venous ulcer</span>（正在潰爛的）</li>
      <li class="fragment">典型位置：<span class="highlight">medial malleolus 上方</span>（gaiter area）</li>
      <li class="fragment">為什麼在那裡？→ Cockett perforators 最多、靜水壓最高</li>
      <li class="fragment"><span class="highlight">Compression therapy（multi-layer bandage）是 venous ulcer 癒合的關鍵</span> — 不壓就不會好</li>
      <li class="fragment">先控制 venous hypertension → 再處理 reflux source</li>
    </ul>
  </section>

  <section data-background-color="#001219">
    <h3>CEAP 的 E, A, P</h3>
    <ul>
      <li><strong>E（Etiology）</strong>：Ep（primary）、Es（secondary, 如 post-DVT）、Ec（congenital）</li>
      <li class="fragment"><strong>A（Anatomy）</strong>：As（superficial）、Ad（deep）、Ap（perforator）</li>
      <li class="fragment"><strong>P（Pathophysiology）</strong>：Pr（reflux）、Po（obstruction）、Pr+o</li>
      <li class="fragment">完整寫法範例：<span class="highlight">C4a,s, Ep, As,p, Pr</span></li>
      <li class="fragment">日常溝通：通常只講 C 分級就夠了</li>
    </ul>
  </section>

  <section data-background-color="#001219">
    <h3>VCSS — Venous Clinical Severity Score</h3>
    <p>CEAP 是分類，VCSS 是<span class="highlight">量化嚴重度 + 追蹤治療效果</span>的工具</p>
    <ul>
      <li class="fragment">10 個項目，每項 0-3 分（總分 0-30）</li>
      <li class="fragment">項目：疼痛、varicose veins、水腫、色素沉澱、發炎、induration、潰瘍數量/大小/持續時間、壓力襪使用</li>
      <li class="fragment">用途：<span class="highlight">治療前後比較</span> — 數字下降 = 有效</li>
      <li class="fragment">比 CEAP 更適合追蹤（CEAP 是分類系統，不是計分系統）</li>
      <li class="fragment">臨床研究常用 VCSS 作為 primary outcome</li>
    </ul>
  </section>
</section>

<!-- Section 3: Diagnosis -->
<section>
  <section data-background-color="#001219">
    <h2>🔍 診斷</h2>
    <p>💬 門診那位 55 歲老師，你看到她左腿有明顯的 varicose veins<br/>下一步？</p>
  </section>

  <section data-background-color="#001219">
    <h3>理學檢查 — 站著看！</h3>
    <ul>
      <li><span class="highlight">一定要讓病人站起來</span> — 躺著靜脈會塌掉，什麼都看不到</li>
      <li class="fragment">看：分布（medial = GSV？posterior = SSV？）</li>
      <li class="fragment">摸：皮膚溫度、induration（C4b？）、tenderness</li>
      <li class="fragment">比較兩腳：水腫程度、周長差異</li>
    </ul>
  </section>

  <section data-background-color="#001219">
    <h3>Duplex Ultrasound — Gold Standard</h3>
    <ul>
      <li><span class="highlight">B-mode + Doppler = 看結構 + 看血流方向</span></li>
      <li class="fragment">病人站立，做 Valsalva 或 calf squeeze-release</li>
      <li class="fragment">關鍵指標：<span class="danger">Reflux time &gt; 0.5 秒 = pathological reflux</span></li>
      <li class="fragment">Superficial vein：&gt;0.5s</li>
      <li class="fragment">Deep vein：&gt;1.0s（標準較嚴，因正常可有短暫 reflux）</li>
    </ul>
  </section>

  <section data-background-color="#001219">
    <h3>超音波要回答的問題</h3>
    <ol>
      <li class="fragment">Reflux 在哪裡？GSV？SSV？perforators？</li>
      <li class="fragment">SFJ / SPJ competent 嗎？</li>
      <li class="fragment">Deep system 通暢嗎？（排除 DVT / post-thrombotic syndrome）</li>
      <li class="fragment">GSV 直徑多少？（影響治療選擇）</li>
      <li class="fragment">有沒有 accessory saphenous vein？</li>
    </ol>
    <p class="fragment"><span class="danger">⚠️ 不做超音波就治療 = 盲目治療</span></p>
  </section>

  <section data-background-color="#001219">
    <h3>鑑別診斷 — 不是所有腿腫都是靜脈曲張</h3>
    <ul>
      <li class="fragment"><span class="danger">DVT</span> — 急性、單側、壓痛 → 超音波確認</li>
      <li class="fragment">Lymphedema — 非壓痕性水腫、Stemmer sign</li>
      <li class="fragment">心衰竭、腎病 — 雙側、合併全身症狀</li>
      <li class="fragment">PAD — 別搞混！動脈 vs 靜脈潰瘍完全不同</li>
    </ul>
  </section>

  <section data-background-color="#001219">
    <h3>靜脈 vs 動脈潰瘍 — 必考題</h3>
    <table>
      <tr><th></th><th>Venous Ulcer</th><th>Arterial Ulcer</th></tr>
      <tr><td>位置</td><td>Medial malleolus（gaiter area）</td><td>Toe tips, heel, pressure points</td></tr>
      <tr><td>外觀</td><td>淺、不規則、granulation base</td><td>深、punch-out、pale base</td></tr>
      <tr><td>疼痛</td><td>抬腿改善</td><td>垂腿改善（dangling）</td></tr>
      <tr><td>周圍皮膚</td><td>色素沉澱、lipodermatosclerosis</td><td>蒼白、無毛、指甲變厚</td></tr>
      <tr><td>脈搏</td><td>可摸到</td><td>減弱或消失</td></tr>
    </table>
  </section>
</section>

<!-- Section 4: Treatment -->
<section>
  <section data-background-color="#001219">
    <h2>💊 治療選擇</h2>
    <p>💬 超音波確認 GSV reflux from SFJ to below-knee<br/>直徑 8mm，CEAP C3。<br/>你的治療計畫？</p>
  </section>

  <section data-background-color="#001219">
    <h3>治療原則</h3>
    <ul>
      <li><span class="highlight">消除 reflux source</span> → 降低靜脈壓 → 症狀改善</li>
      <li class="fragment">不是把每條看到的靜脈都拔掉 — 要找到<span class="highlight">源頭</span></li>
      <li class="fragment">治療順序：先處理 truncal reflux（GSV/SSV），再處理 tributaries</li>
    </ul>
  </section>

  <section data-background-color="#001219">
    <h3>保守治療 — 壓力襪</h3>
    <ul>
      <li>機制：外部壓力 → 減少靜脈直徑 → 增加血流速度 → 改善 calf pump 效率</li>
      <li class="fragment"><strong>Class I</strong>：15-20 mmHg — 預防、輕微症狀</li>
      <li class="fragment"><strong>Class II</strong>：20-30 mmHg — <span class="highlight">最常用</span>，中度 CVI</li>
      <li class="fragment"><strong>Class III</strong>：30-40 mmHg — 嚴重 CVI、潰瘍</li>
      <li class="fragment">穿法：<span class="highlight">早上起床前穿</span>（腳還沒腫的時候）</li>
    </ul>
  </section>

  <section data-background-color="#001219">
    <h3>壓力襪的限制</h3>
    <ul>
      <li>不能治癒 — 只是症狀控制</li>
      <li class="fragment">順從性差（熱、不舒服、老人家穿不上去）</li>
      <li class="fragment"><span class="danger">禁忌</span>：ABI &lt;0.5 <strong>絕對禁忌</strong>；ABI 0.5-0.8 <strong>相對禁忌</strong>，需醫師監督下使用</li>
      <li class="fragment">什麼時候用？C2-C3 症狀輕微 / 不想手術 / 等手術期間</li>
    </ul>
  </section>

  <section data-background-color="#001219">
    <h3>手術適應症 — 什麼時候該處理？</h3>
    <ul>
      <li><span class="highlight">有症狀的 C2</span> — 保守治療無效（試過 3-6 個月壓力襪）</li>
      <li class="fragment"><span class="danger">C4b-C6</span> — lipodermatosclerosis / 潰瘍 → 不處理只會更糟</li>
      <li class="fragment"><span class="danger">Superficial thrombophlebitis</span> — 反覆發作</li>
      <li class="fragment"><span class="danger">出血</span> — varicose vein 破裂出血可以很嚇人</li>
      <li class="fragment"><span class="danger">反覆蜂窩性組織炎</span> — 靜脈淤滯 = 細菌溫床</li>
    </ul>
  </section>

  <section data-background-color="#001219">
    <h3>傳統手術：High Ligation + Stripping</h3>
    <ul>
      <li>SFJ 高位結紮 + GSV 抽除（groin to knee）</li>
      <li class="fragment">有效，但：</li>
      <li class="fragment">需要全身 / 脊椎麻醉</li>
      <li class="fragment">傷口較大、術後瘀青多</li>
      <li class="fragment">Saphenous nerve injury risk（below knee stripping 時）</li>
      <li class="fragment"><span class="highlight">復發率 ~20-30% at 5 years</span> — 主因 <span class="danger">neovascularization</span>（SFJ 附近長出新血管）和 <strong>technical failure</strong>（殘留 tributaries、結紮不完全）</li>
      <li class="fragment">現在已逐漸被微創取代，但仍有角色（如 GSV 非常扭曲時）</li>
    </ul>
  </section>

  <section data-background-color="#001219">
    <h3>微創熱消融：RFA & EVLA</h3>
    <ul>
      <li><strong>RFA（Radiofrequency Ablation）</strong>— ClosureFast catheter，120°C 間歇加熱</li>
      <li class="fragment"><strong>EVLA（Endovenous Laser Ablation）</strong>— laser fiber，連續或脈衝加熱</li>
      <li class="fragment">原理：<span class="highlight">熱能 → 血管壁收縮、纖維化 → 靜脈閉合</span></li>
    </ul>
    <div class="fragment">
      <h4>步驟</h4>
      <ol>
        <li>超音波導引下穿刺 GSV（通常在 below-knee）</li>
        <li>Catheter 尖端放在 SFJ 下方 2cm</li>
        <li>Tumescent anesthesia（大量稀釋 lidocaine）— 隔熱 + 壓縮靜脈</li>
        <li>退出時加熱消融</li>
      </ol>
    </div>
  </section>

  <section data-background-color="#001219">
    <h3>RFA vs EVLA vs Stripping</h3>
    <table>
      <tr><th></th><th>Stripping</th><th>RFA</th><th>EVLA</th></tr>
      <tr><td>麻醉</td><td>GA / spinal</td><td>Local + tumescent</td><td>Local + tumescent</td></tr>
      <tr><td>術後疼痛</td><td>較多</td><td><span class="success">較少</span></td><td>中等</td></tr>
      <tr><td>恢復時間</td><td>1-2 週</td><td><span class="success">1-3 天</span></td><td><span class="success">1-3 天</span></td></tr>
      <tr><td>5年閉合率</td><td>—</td><td colspan="2">&gt;90%（兩者相當，文獻 range 88-97%）</td></tr>
      <tr><td>瘀青</td><td>多</td><td>少</td><td>中</td></tr>
    </table>
    <p class="fragment"><span class="highlight">現代 guideline 推薦微創 > stripping</span>（NICE, SVS, ESVS）</p>
  </section>

  <section data-background-color="#001219">
    <h3>Non-thermal：Cyanoacrylate（VenaSeal）</h3>
    <ul>
      <li>原理：<span class="highlight">醫用三秒膠 → 直接黏合血管壁</span></li>
      <li class="fragment">優勢：<span class="success">不需要 tumescent anesthesia</span>（只打一針穿刺處）</li>
      <li class="fragment">不用穿壓力襪（術後）</li>
      <li class="fragment">2年閉合率 ~97%（VeClose trial）</li>
      <li class="fragment">缺點：較貴、少數人對膠過敏（phlebitis-like reaction ~10%）</li>
    </ul>
  </section>

  <section data-background-color="#001219">
    <h3>Sclerotherapy</h3>
    <ul>
      <li>原理：注射硬化劑 → 血管壁發炎 → 纖維化閉合</li>
      <li class="fragment"><strong>Liquid sclerotherapy</strong>：小血管、C1（spider veins）</li>
      <li class="fragment"><strong>Foam sclerotherapy</strong>（Tessari method）：混空氣打成泡沫 → 接觸面積大，可處理較大靜脈</li>
      <li class="fragment">常用藥劑：<span class="highlight">Polidocanol（Aethoxysklerol）</span>或 STS</li>
      <li class="fragment">角色：C1 美容 / tributary 殘餘 / 不適合手術的病人</li>
      <li class="fragment"><span class="danger">⚠️ 風險</span>：skin staining、DVT（foam 跑到 deep system）、visual disturbance（rare）</li>
    </ul>
  </section>

  <section data-background-color="#001219">
    <h3>治療選擇 Decision Tree</h3>
    <ul>
      <li><strong>C1</strong>（spider veins）→ sclerotherapy / laser</li>
      <li class="fragment"><strong>C2 無症狀</strong> → 衛教 + 追蹤</li>
      <li class="fragment"><strong>C2 有症狀 / C3</strong> → 壓力襪 3-6 月 → 無效 → 微創消融</li>
      <li class="fragment"><strong>C4-C6</strong> → <span class="danger">積極處理 reflux</span>（微創 > stripping）+ 傷口照護</li>
      <li class="fragment"><strong>合併 deep vein obstruction</strong> → 先處理 deep system！</li>
    </ul>
  </section>
</section>

<!-- Section 5: Complications & Follow-up -->
<section>
  <section data-background-color="#001219">
    <h2>⚡ 併發症與追蹤</h2>
    <p>💬 你幫病人做了 RFA，術後第三天她打來說「大腿又腫又痛」</p>
  </section>

  <section data-background-color="#001219">
    <h3>術後常見問題</h3>
    <ul>
      <li><span class="highlight">瘀青、硬塊（induration）</span>— 正常，2-4 週消退</li>
      <li class="fragment"><span class="highlight">Phlebitis</span> — 沿消融路徑的發炎反應，NSAID + 壓力襪</li>
      <li class="fragment">Paresthesia — saphenous nerve injury（below-knee 操作時）</li>
      <li class="fragment">Skin burn — tumescent 打不夠 / laser 能量太高</li>
    </ul>
  </section>

  <section data-background-color="#001219">
    <h3>嚴重併發症</h3>
    <ul>
      <li><span class="danger">EHIT（Endovenous Heat-Induced Thrombosis）</span></li>
      <li class="fragment">Class 1：thrombus at SFJ 但未延伸到 deep vein → 追蹤</li>
      <li class="fragment">Class 2：thrombus 延伸到 CFV &lt;50% lumen → 抗凝</li>
      <li class="fragment">Class 3-4：&gt;50% 或完全阻塞 → <span class="danger">等同 DVT 處理</span></li>
      <li class="fragment">發生率 ~1-2%，所以術後 48-72h 超音波追蹤很重要</li>
    </ul>
  </section>

  <section data-background-color="#001219">
    <h3>DVT — 最怕的併發症</h3>
    <ul>
      <li>EHIT 延伸 or 術後制動 → DVT 風險</li>
      <li class="fragment">預防：<span class="success">早期活動（當天走路）、壓力襪、避免長時間不動</span></li>
      <li class="fragment">高風險族群（thrombophilia、BMI &gt;40、DVT 病史）→ 考慮預防性抗凝</li>
    </ul>
  </section>

  <section data-background-color="#001219">
    <h3>復發 — 為什麼會再來？</h3>
    <ul>
      <li><span class="highlight">Neovascularization</span> — SFJ 附近長出新的小血管（stripping 後較常見）</li>
      <li class="fragment">原本沒處理到的 tributary / perforator</li>
      <li class="fragment">疾病進展 — 新的瓣膜失能</li>
      <li class="fragment">5 年復發率：stripping ~25% / 微創 ~10-15%</li>
      <li class="fragment"><span class="success">追蹤：術後 1 週、1 月、6 月、之後每年超音波</span></li>
    </ul>
  </section>
</section>

<!-- Section 6: What Would You Do? -->
<section>
  <section data-background-color="#001219">
    <h2>🧠 What Would You Do?</h2>
    <p>三個臨床情境，測試你的判斷</p>
  </section>

  <section data-background-color="#001219">
    <h3>Case 1：年輕女性，外觀困擾</h3>
    <p>28F，OL，雙腿 spider veins + 幾條小的 varicose veins（3-4mm）<br/>
    主訴：「穿裙子很醜」，偶爾痠。超音波：GSV no reflux。</p>
    <ul>
      <li class="fragment">CEAP？→ <span class="highlight">C1-C2, Ep, As, Pr</span></li>
      <li class="fragment">需要處理 GSV 嗎？→ <span class="success">不需要，沒有 truncal reflux</span></li>
      <li class="fragment">能做什麼？→ <span class="highlight">Sclerotherapy for spider veins + 壓力襪</span></li>
      <li class="fragment">要告訴她：這是美容處理，可能需要多次，健保不給付</li>
    </ul>
  </section>

  <section data-background-color="#001219">
    <h3>Case 2：反覆蜂窩性組織炎</h3>
    <p>62M，DM，左小腿 varicose veins 多年不管<br/>
    最近半年第三次蜂窩性組織炎住院。<br/>
    PE：medial calf pigmentation, lipodermatosclerosis, 2cm ulcer (healed scar)<br/>
    超音波：GSV reflux from SFJ, 直徑 10mm, 2 incompetent perforators</p>
    <ul>
      <li class="fragment">CEAP？→ <span class="danger">C5, Ep, As,p, Pr</span></li>
      <li class="fragment">可以繼續觀察嗎？→ <span class="danger">不行！反覆感染 + C5 = 積極手術適應症</span></li>
      <li class="fragment">治療？→ <span class="highlight">GSV RFA/EVLA + perforator ablation</span></li>
      <li class="fragment">DM 控制好了嗎？HbA1c？→ 術前要先 optimize</li>
      <li class="fragment">⚠️ 先確認 ABI — DM 病人要排除合併 PAD</li>
    </ul>
  </section>

  <section data-background-color="#001219">
    <h3>Case 3：急診出血</h3>
    <p>70F，急診來，左腳踝一個 varicose vein 破裂噴血，<br/>
    血壓 95/60，HR 110，褲管濕透。<br/>
    現場已加壓止血。</p>
    <ul>
      <li class="fragment">第一步？→ <span class="danger">ABC！抬高患肢 + 直接加壓</span></li>
      <li class="fragment">出血控制後？→ 不要急著縫 — <span class="highlight">figure-of-eight suture 在出血點</span></li>
      <li class="fragment">住院嗎？→ 生命徵象穩定後可出院，但必須<span class="danger">安排門診 duplex + 根本治療</span></li>
      <li class="fragment">這個 case 告訴我們：varicose vein 不只是美觀問題 — <span class="danger">會出血、會致命</span></li>
      <li class="fragment">⚠️ 老人家皮薄 + 抗凝藥 → 出血可以很嚴重</li>
    </ul>
  </section>

  <section data-background-color="#001219">
    <h2>Take Home Messages</h2>
    <ul>
      <li class="fragment"><span class="highlight">理解 reflux 的機制</span> — 所有治療都是在消除 reflux source</li>
      <li class="fragment"><span class="highlight">Duplex ultrasound 是必做的</span> — 不做超音波不要治療</li>
      <li class="fragment"><span class="highlight">CEAP ≥ C4b 要積極處理</span> — 不會自己好</li>
      <li class="fragment"><span class="highlight">微創 > 傳統 stripping</span> — 但要知道每種的原理與限制</li>
      <li class="fragment"><span class="danger">排除 DVT 和 PAD</span> — 治療前的安全檢查</li>
    </ul>
  </section>

  <section data-background-color="#001219">
    <div class="emoji-big">🦵</div>
    <h2>Questions?</h2>
    <p>記住：靜脈曲張不只是「青筋浮出」</p>
    <p>它是一個從 C0 到 C6 的疾病光譜</p>
    <p>你的角色是判斷病人在哪個階段，該做什麼</p>
  </section>
</section>
    `,
  },

  "avf-avg": {
    title: "AVF/AVG 評估",
    subtitle: "「摸一下，你就知道它活不活」",
    html: `
<!-- Title -->
<section data-background-color="#001219">
  <div class="emoji-big">💉</div>
  <h1>AVF / AVG 評估</h1>
  <p class="subtitle">透析血管通路 — 理學檢查與臨床決策</p>
  <p class="author">Wilson Chao — 高醫心臟外科</p>
</section>

<!-- Hook -->
<section data-background-color="#001219">
  <p class="hook">💬 腎臟科會診：「65 歲糖尿病患者，eGFR 12，<br/>請幫我做 vascular access。」<br/><br/>你要怎麼評估這個病人？<br/>做完之後又怎麼知道通路好不好？</p>
</section>

<!-- Section 1: Why AVF/AVG? -->
<section>
  <section data-background-color="#001219">
    <h2>🏥 為什麼需要 AVF/AVG？</h2>
    <p>從 CKD 到透析 — timing 決定一切</p>
  </section>

  <section data-background-color="#001219">
    <h3>CKD 分期與透析時機</h3>
    <ul>
      <li>CKD Stage 4（eGFR 15-29）→ <span class="highlight">開始規劃 vascular access</span></li>
      <li class="fragment">CKD Stage 5（eGFR &lt;15）→ 準備透析</li>
      <li class="fragment">KDOQI 2019：<span class="highlight">eGFR &lt;30 或預計 1 年內需透析</span>時就該轉介外科評估</li>
      <li class="fragment">為什麼這麼早？因為 AVF 需要時間成熟</li>
    </ul>
  </section>

  <section data-background-color="#001219">
    <h3>💬 Case：太晚轉介的後果</h3>
    <p>58M，DM + HTN，eGFR 8，尿毒症狀明顯需要緊急透析</p>
    <ul>
      <li class="fragment">沒有 AVF → 只能先放 <span class="danger">temporary CVC → 再換 Perm-Cath</span></li>
      <li class="fragment">Perm-Cath 感染率高、flow 不穩、住院天數↑</li>
      <li class="fragment">如果半年前就轉介，AVF 早就成熟可以用了</li>
    </ul>
  </section>

  <section data-background-color="#001219">
    <h3>台灣現況</h3>
    <ul>
      <li>台灣透析人口密度全球最高（~9萬人）</li>
      <li class="fragment">超過 80% 用血液透析（HD）</li>
      <li class="fragment">每個 HD 患者都需要一個穩定的血管通路</li>
      <li class="fragment">通路問題是 HD 患者<span class="danger">住院最常見的原因之一</span></li>
    </ul>
  </section>
</section>

<!-- Section 2: AVF vs AVG vs Perm-Cath -->
<section>
  <section data-background-color="#001219">
    <h2>⚖️ 三種血管通路比較</h2>
    <p>AVF vs AVG vs Perm-Cath — 怎麼選？</p>
  </section>

  <section data-background-color="#001219">
    <h3>AVF（自體動靜脈瘻管）</h3>
    <ul>
      <li><span class="success">Patency 最好</span> — 5年 primary patency 50-70%</li>
      <li class="fragment"><span class="success">感染率最低</span>（自體組織）</li>
      <li class="fragment"><span class="success">併發症最少</span>、維護成本最低</li>
      <li class="fragment"><span class="danger">缺點</span>：需 4-6 週成熟、maturation failure rate 20-60%</li>
      <li class="fragment">老人、糖尿病、血管細 → failure rate 更高</li>
    </ul>
  </section>

  <section data-background-color="#001219">
    <h3>AVG（人工血管）</h3>
    <ul>
      <li>ePTFE（Gore-Tex）最常見</li>
      <li class="fragment"><span class="success">2-3 週就可以用</span>（甚至有 early cannulation graft）</li>
      <li class="fragment"><span class="success">手術技術上比較容易</span>、適合血管條件差的患者</li>
      <li class="fragment"><span class="danger">Patency 較差</span> — 2年 primary patency ~30-40%</li>
      <li class="fragment"><span class="danger">Stenosis 和 thrombosis 發生率高</span>（尤其是 venous anastomosis）</li>
      <li class="fragment">感染率比 AVF 高，但比 Perm-Cath 低很多</li>
    </ul>
  </section>

  <section data-background-color="#001219">
    <h3>Perm-Cath（Tunneled Cuffed Catheter）</h3>
    <ul>
      <li><span class="success">快速建立</span> — AVF 未成熟或無法做 AVF/AVG 時的選擇</li>
      <li class="fragment"><span class="danger">感染率最高</span>（bacteremia 2-5 per 1000 catheter-days）</li>
      <li class="fragment"><span class="danger">Central vein stenosis</span> — 會毀掉未來做 AVF/AVG 的機會</li>
      <li class="fragment"><span class="danger">Mortality 比 AVF 高 2-3 倍</span></li>
      <li class="fragment">只應該是<span class="highlight">過渡方案</span>，不是長期選擇</li>
      <li class="fragment">⚠️ 跟急診放的 temporary CVC 不同 — Perm-Cath 有 cuff + tunnel，可用數週到數月</li>
    </ul>
  </section>

  <section data-background-color="#001219">
    <h3>「Fistula First」哲學與爭議</h3>
    <ul>
      <li>NKF-KDOQI 2006：<span class="highlight">AVF 應是所有透析患者的首選</span></li>
      <li class="fragment">目標：AVF prevalence &gt;65%</li>
      <li class="fragment">但現實是…</li>
      <li class="fragment"><span class="danger">老年、DM、血管條件差的患者</span> AVF failure rate 很高</li>
      <li class="fragment">KDOQI 2019 更新：不再一味 fistula first，而是 <span class="highlight">"Patient Life Plan"</span></li>
      <li class="fragment">重點：為這個病人選最適合的通路，而非教條式 AVF</li>
    </ul>
  </section>

  <section data-background-color="#001219">
    <h3>✅ Rule of 6s — AVF 成熟標準</h3>
    <p>AVF 做完不是馬上能用，要看它「長大了沒」</p>
    <ul>
      <li class="fragment"><span class="highlight">Flow &gt;600 mL/min</span></li>
      <li class="fragment"><span class="highlight">Diameter &gt;6 mm</span></li>
      <li class="fragment"><span class="highlight">Depth &lt;6 mm</span>（太深扎不到）</li>
      <li class="fragment"><span class="highlight">至少等 6 週</span></li>
      <li class="fragment">記法：6-6-6-6 — 四個六就對了</li>
    </ul>
  </section>

  <section data-background-color="#001219">
    <h3>💬 為什麼要這些數字？</h3>
    <ul>
      <li><span class="highlight">Flow &gt;600</span>：HD 需要 pump speed 300-450 mL/min，加上 recirculation 的空間</li>
      <li class="fragment"><span class="highlight">Diameter &gt;6mm</span>：太細 → 扎不穩、flow 不夠</li>
      <li class="fragment"><span class="highlight">Depth &lt;6mm</span>：太深 → 透析護理師扎不進去、反覆穿刺失敗</li>
      <li class="fragment"><span class="highlight">6 週</span>：血管壁 arterialization 需要時間（smooth muscle hypertrophy + 管壁增厚）</li>
    </ul>
  </section>
</section>

<!-- Section 3: Anatomy -->
<section>
  <section data-background-color="#001219">
    <h2>🦴 解剖選擇</h2>
    <p>「從遠端開始，保留近端的機會」</p>
  </section>

  <section data-background-color="#001219">
    <h3>AVF 位置選擇順序</h3>
    <p>原則：<span class="highlight">越遠端越好</span>（distal → proximal）</p>
    <ul>
      <li class="fragment"><strong>1st choice</strong>：<span class="success">Radiocephalic（Brescia-Cimino）</span> — 手腕</li>
      <li class="fragment"><strong>2nd choice</strong>：<span class="highlight">Brachiocephalic</span> — 肘部</li>
      <li class="fragment"><strong>3rd choice</strong>：Brachiobasilic — 需 transposition（第二次手術翻到淺層）</li>
      <li class="fragment"><strong>最後手段</strong>：AVG（ePTFE loop in forearm 或 upper arm）</li>
    </ul>
  </section>

  <section data-background-color="#001219">
    <h3>💬 為什麼從遠端開始？</h3>
    <ul>
      <li>遠端失敗了，還可以往近端做</li>
      <li class="fragment">反過來不行 — 近端做了會影響遠端灌流</li>
      <li class="fragment">而且近端 AVF（brachiocephalic）→ flow 大 → <span class="danger">steal syndrome 風險高</span></li>
      <li class="fragment">Brachiobasilic 需要兩次手術（第一次做 fistula、等成熟後第二次做 transposition）→ 比較麻煩</li>
    </ul>
  </section>

  <section data-background-color="#001219">
    <h3>術前評估 — 不是畫個線就開刀</h3>
    <ul>
      <li><span class="highlight">Allen Test</span> — 確認手的 dual supply</li>
      <li class="fragment">步驟：先讓病人<strong>反覆握拳</strong>至手掌蒼白 → 壓住 radial + ulnar → 放開 ulnar → 看手掌有沒有紅回來</li>
      <li class="fragment"><span class="success">&lt;7 秒恢復紅潤 = 正常</span>（ulnar arch 足夠供應）</li>
      <li class="fragment">如果沒有紅回來 → 不能犧牲 radial artery</li>
      <li class="fragment"><span class="highlight">Vessel Mapping（超音波）</span></li>
      <li class="fragment">Artery diameter &gt;2mm, Vein diameter &gt;2.5mm</li>
      <li class="fragment">看 cephalic vein 有沒有通、有沒有之前抽血造成的 stenosis</li>
      <li class="fragment">⚠️ DM 患者血管常有鈣化 → 超音波評估更重要</li>
    </ul>
  </section>

  <section data-background-color="#001219">
    <h3>⚠️ 保護血管！</h3>
    <ul>
      <li>CKD Stage 3 以上 → <span class="danger">non-dominant arm 不要抽血、不要打 IV</span></li>
      <li class="fragment">尤其 cephalic vein — 未來可能是做 AVF 的命脈</li>
      <li class="fragment"><span class="danger">避免 subclavian CVC</span> → central vein stenosis 會毀掉同側所有通路</li>
      <li class="fragment">要放 CVC → 優先 <span class="highlight">internal jugular</span></li>
    </ul>
  </section>
</section>

<!-- Section 4: Physical Exam — 重點中的重點 -->
<section>
  <section data-background-color="#001219">
    <h2>🩺 理學檢查</h2>
    <p><span class="highlight">重點中的重點</span> — 一摸就知道通路好不好</p>
  </section>

  <section data-background-color="#001219">
    <h3>💬 Case：透析室打電話來</h3>
    <p>「醫師，32 床今天透析 flow 不好，pump speed 只能開到 200，<br/>你可以來看一下嗎？」</p>
    <ul>
      <li class="fragment">你到床邊，第一件事做什麼？</li>
      <li class="fragment"><span class="highlight">看、摸、聽</span> — Inspection, Palpation, Auscultation</li>
    </ul>
  </section>

  <section data-background-color="#001219">
    <h3>👀 Inspection — 看</h3>
    <ul>
      <li>AVF 的走向和大小 — 有沒有明顯的 <span class="danger">aneurysmal dilatation</span></li>
      <li class="fragment">穿刺點有沒有紅腫、結痂、感染跡象</li>
      <li class="fragment"><span class="danger">手指顏色</span> — 發紫、發白、發黑？→ steal syndrome</li>
      <li class="fragment">手臂有沒有腫脹？→ venous outflow obstruction</li>
      <li class="fragment">皮膚有沒有 shiny、tight → 靜脈高壓的表現</li>
    </ul>
  </section>

  <section data-background-color="#001219">
    <h3>🤚 Palpation — 摸（最重要！）</h3>
    <ul>
      <li><span class="highlight">Thrill</span> — 正常的 AVF 在 anastomosis 附近有持續性的 thrill</li>
      <li class="fragment">Thrill 的特性：<span class="success">柔軟、持續、低頻振動</span></li>
      <li class="fragment">如果 thrill 變成 <span class="danger">pulse（搏動感）</span> → 有問題！</li>
    </ul>
  </section>

  <section data-background-color="#001219">
    <h3>🤚 Pulse Augmentation Test</h3>
    <p>區分 stenosis 位置的關鍵技巧</p>
    <ul>
      <li>在 AVF 上游（近 anastomosis）摸 thrill</li>
      <li class="fragment">另一隻手壓住 AVF 下游（outflow 端）</li>
      <li class="fragment"><span class="highlight">正常</span>：壓住後 thrill 增強（因為壓力升高）</li>
      <li class="fragment"><span class="danger">異常</span>：壓住後 thrill 不變或消失 → 上游有 inflow problem</li>
      <li class="fragment">簡單說：壓下游測上游、壓上游測下游</li>
    </ul>
  </section>

  <section data-background-color="#001219">
    <h3>👂 Auscultation — 聽</h3>
    <ul>
      <li><span class="success">正常</span>：continuous bruit（收縮期 + 舒張期都有）— 低音調、像機器聲</li>
      <li class="fragment"><span class="danger">Stenosis</span>：bruit 變成高音調（high-pitched）、只剩收縮期</li>
      <li class="fragment">為什麼？<span class="highlight">狹窄處流速加快 → 湍流增加 → 音調升高</span></li>
      <li class="fragment">跟心雜音的邏輯一樣 — 有狹窄就有亂流</li>
    </ul>
  </section>

  <section data-background-color="#001219">
    <h3>⚡ Stenosis vs Thrombosis — 怎麼分？</h3>
    <table>
      <tr><th></th><th>Stenosis</th><th>Thrombosis</th></tr>
      <tr><td>Thrill</td><td>減弱、變 pulsatile</td><td><span class="danger">完全消失</span></td></tr>
      <tr><td>Bruit</td><td>高音調、systolic only</td><td><span class="danger">完全消失</span></td></tr>
      <tr><td>AVF 觸感</td><td>還是軟的</td><td><span class="danger">硬、cord-like</span></td></tr>
      <tr><td>發生速度</td><td>漸進式</td><td>突然（常一覺醒來就沒了）</td></tr>
      <tr><td>處理</td><td>Angioplasty</td><td>Thrombectomy ± angioplasty</td></tr>
    </table>
  </section>

  <section data-background-color="#001219">
    <h3>💡 記法：Stenosis → Thrombosis 是一個光譜</h3>
    <ul>
      <li>Stenosis 不處理 → flow 越來越差 → 最後 thrombosis</li>
      <li class="fragment">所以 stenosis 是可以預防的！</li>
      <li class="fragment">透析室護理師的觀察很重要：<br/>「flow 一直在降」「needle 越來越難扎」</li>
      <li class="fragment">早期發現 stenosis → 做 <span class="success">angioplasty</span> → 避免 thrombosis</li>
    </ul>
  </section>
</section>

<!-- Section 5: Complications -->
<section>
  <section data-background-color="#001219">
    <h2>⚠️ 常見併發症</h2>
    <p>知道什麼會壞，才知道怎麼防</p>
  </section>

  <section data-background-color="#001219">
    <h3>💬 Case：透析後手指發紫</h3>
    <p>72F，brachiocephalic AVF 做完兩週，透析後手指冰冷發紫、疼痛</p>
    <ul>
      <li class="fragment">這是 <span class="danger">Steal Syndrome</span></li>
      <li class="fragment">動脈血「被偷走」→ 遠端肢體缺血</li>
    </ul>
  </section>

  <section data-background-color="#001219">
    <h3>Steal Syndrome — 為什麼會發生？</h3>
    <ul>
      <li>AVF 的 low resistance circuit 把血「偷」走了</li>
      <li class="fragment">正常：AVF 只分流一部分，遠端還有足夠灌流</li>
      <li class="fragment"><span class="danger">Risk factors</span>：proximal AVF（brachial）、DM、PVD、老人</li>
      <li class="fragment">分級：Grade 1（冷）→ 2（透析時痛）→ 3（持續痛）→ 4（組織壞死）<br/><small>（⚠️ 此為臨床嚴重度分級，非正式 guideline classification，但臨床很實用）</small></li>
    </ul>
  </section>

  <section data-background-color="#001219">
    <h3>Steal Syndrome — 處理</h3>
    <ul>
      <li>Grade 1-2：觀察、保暖、透析時監測</li>
      <li class="fragment">Grade 3-4：手術介入</li>
      <li class="fragment"><span class="highlight">DRIL（Distal Revascularization Interval Ligation）</span></li>
      <li class="fragment">步驟：在 AVF <strong>遠端</strong>結紮 native artery（阻斷逆流），再從 AVF <strong>近端</strong>的 artery 做 bypass 到遠端 artery，恢復順行灌流</li>
      <li class="fragment">結果：保住 AVF 功能，同時恢復遠端手部灌流</li>
      <li class="fragment">最嚴重時 → <span class="danger">ligation（關掉 AVF）</span>，保命要緊</li>
    </ul>
  </section>

  <section data-background-color="#001219">
    <h3>Aneurysm vs Pseudoaneurysm</h3>
    <table>
      <tr><th></th><th>True Aneurysm</th><th>Pseudoaneurysm</th></tr>
      <tr><td>成因</td><td>血管壁擴張（三層都在）</td><td>穿刺處破裂，血液外漏被組織包住</td></tr>
      <tr><td>觸感</td><td>軟、可壓縮</td><td>有搏動感、tension 高</td></tr>
      <tr><td>風險</td><td>皮膚變薄 → 破裂</td><td><span class="danger">破裂風險更高</span></td></tr>
      <tr><td>處理</td><td>避免穿刺 aneurysm 區域、<br/>太大考慮修補</td><td><span class="danger">手術修補</span>（感染 or 快速增大時）</td></tr>
    </table>
    <p class="fragment">⚠️ 反覆同一個點穿刺（area puncture）→ pseudoaneurysm<br/>
    <span class="success">Rope-ladder technique</span>（輪流穿刺不同位置）可預防</p>
  </section>

  <section data-background-color="#001219">
    <h3>High-Output Heart Failure</h3>
    <ul>
      <li>少見，但要知道</li>
      <li class="fragment">AVF flow 太大（&gt;1500-2000 mL/min）→ 心臟負擔增加</li>
      <li class="fragment">機轉：preload↑ → CO↑ → 長期 → LV dilatation → HF</li>
      <li class="fragment">特別在 <span class="danger">proximal AVF</span>（brachial-based）容易出現</li>
      <li class="fragment">線索：AVF flow 很大 + 新發生的 HF 症狀 + 沒有其他原因</li>
      <li class="fragment">確認：<span class="highlight">Nicoladoni-Branham sign</span> — 壓住 AVF → HR 下降、BP 上升</li>
      <li class="fragment">處理：banding（縮小 anastomosis）或 ligation</li>
    </ul>
  </section>
</section>

<!-- Section 5.5: Infection -->
<section>
  <section data-background-color="#001219">
    <h2>🦠 感染 — Access Infection</h2>
    <p>透析通路感染是常見但可致命的併發症</p>
  </section>

  <section data-background-color="#001219">
    <h3>AVF vs AVG 感染差異</h3>
    <ul>
      <li><strong>AVF 感染率很低</strong>（~2-5%）— 自體組織，抵抗力好</li>
      <li class="fragment"><strong>AVG 感染率較高</strong>（~10-20%）— 人工材料是細菌的溫床</li>
      <li class="fragment">AVG 感染往往更嚴重：biofilm 形成 → <span class="danger">難以根除</span></li>
      <li class="fragment">常見菌種：<span class="highlight">S. aureus</span>（最常見）、coagulase-negative staph、GNB</li>
      <li class="fragment">DM、免疫低下、衛生條件差 → 感染風險更高</li>
    </ul>
  </section>

  <section data-background-color="#001219">
    <h3>感染處理原則</h3>
    <ul>
      <li><strong>經驗性抗生素</strong>：<span class="highlight">Vancomycin</span>（cover MRSA）+ <span class="highlight">Gram-negative coverage</span>（如 ceftazidime 或 gentamicin）</li>
      <li class="fragment">血液培養 × 2 sets（一組從 AVF/AVG 抽）→ 再根據結果調整</li>
      <li class="fragment"><strong>什麼時候需要手術？</strong></li>
      <li class="fragment">→ <span class="danger">Abscess 形成</span>（局部膿瘍需切開引流）</li>
      <li class="fragment">→ <span class="danger">Graft exposure</span>（人工血管外露 → 幾乎一定要移除）</li>
      <li class="fragment">→ <span class="danger">Septic emboli</span>（感染性栓塞 → 全身性感染）</li>
      <li class="fragment">→ 抗生素治療 48-72h 無改善</li>
    </ul>
  </section>

  <section data-background-color="#001219">
    <h3>感染預防 — 無菌穿刺技術</h3>
    <ul>
      <li><span class="success">每次穿刺前</span>：手部消毒 + 穿刺部位充分消毒（chlorhexidine 或 povidone-iodine）</li>
      <li class="fragment">避免在同一位置反覆穿刺（<span class="highlight">rope-ladder technique</span>）</li>
      <li class="fragment">穿刺後妥善覆蓋，保持乾燥</li>
      <li class="fragment">教育病人：透析前洗手 + 清潔 access 部位</li>
      <li class="fragment">有紅腫熱痛 → 立即回診，不要等</li>
    </ul>
  </section>
</section>

<!-- Section 5.6: Maturation Failure -->
<section>
  <section data-background-color="#001219">
    <h2>🔍 Maturation Failure</h2>
    <p>AVF 做了，但它不長大 — 怎麼辦？</p>
  </section>

  <section data-background-color="#001219">
    <h3>什麼時候該擔心？</h3>
    <ul>
      <li><span class="highlight">6 週後</span>未達 Rule of 6s → 需要 <span class="highlight">duplex ultrasound 評估</span></li>
      <li class="fragment">Maturation failure rate：RC-AVF 高達 <span class="danger">20-60%</span>（尤其老人、DM）</li>
    </ul>
    <h4 class="fragment">常見原因</h4>
    <ul>
      <li class="fragment"><span class="danger">Junctional stenosis</span> — anastomosis 附近狹窄（最常見）</li>
      <li class="fragment"><span class="danger">Accessory vein</span> — 分支靜脈「偷走」flow，主幹長不大</li>
      <li class="fragment">動脈 inflow 不足（小 artery、鈣化）</li>
      <li class="fragment">Central vein stenosis（之前 CVC 造成的）</li>
    </ul>
    <h4 class="fragment">處理</h4>
    <ul>
      <li class="fragment"><span class="highlight">Balloon angioplasty</span> — junctional stenosis 的首選</li>
      <li class="fragment"><span class="highlight">Accessory vein ligation</span> — 結紮分支，逼 flow 走主幹</li>
      <li class="fragment">Superficialization — 太深的 AVF 翻淺</li>
      <li class="fragment">以上都失敗 → 放棄此 AVF，往近端做新的</li>
    </ul>
  </section>
</section>

<!-- Section 5.7: Patient Life Plan -->
<section>
  <section data-background-color="#001219">
    <h2>🗺️ Patient Life Plan — 長期規劃</h2>
    <p>不是只做一次 AVF 就好 — 要想這個病人未來 10-20 年的通路</p>
  </section>

  <section data-background-color="#001219">
    <h3>通路的長期序列</h3>
    <p>每失敗一個，就往下一步走：</p>
    <ol>
      <li class="fragment"><span class="success">RC-AVF</span>（Radiocephalic）— 手腕，第一選擇</li>
      <li class="fragment"><span class="success">BC-AVF</span>（Brachiocephalic）— 肘部</li>
      <li class="fragment"><span class="highlight">BB-AVF</span>（Brachiobasilic）— 需 transposition</li>
      <li class="fragment"><span class="highlight">AVG</span>（upper arm loop → forearm loop）</li>
      <li class="fragment"><span class="danger">Lower extremity AVF/AVG</span> — 大腿</li>
      <li class="fragment"><span class="danger">PD（腹膜透析）</span> — 如果血管通路都用完了</li>
    </ol>
    <p class="fragment">⚠️ 這就是為什麼要<strong>從遠端開始</strong> + <strong>保護血管</strong></p>
    <p class="fragment">每一個 CVC、每一次不必要的靜脈穿刺，都在消耗病人未來的選項</p>
  </section>
</section>

<!-- Section 6: Emergency -->
<section>
  <section data-background-color="#001219">
    <h2>🚨 急診情境</h2>
    <p>這兩個情境，你一定會遇到</p>
  </section>

  <section data-background-color="#001219">
    <h3>情境 1：AVF 沒有 thrill 了！</h3>
    <p>「醫師，我今天早上摸 AVF 都沒有震動了，明天要洗腎怎麼辦？」</p>
    <ul>
      <li class="fragment"><span class="danger">Acute thrombosis</span> — 時間很重要</li>
      <li class="fragment">First 24-48 小時內介入 → 成功率最高</li>
    </ul>
  </section>

  <section data-background-color="#001219">
    <h3>AVF Thrombosis 處理流程</h3>
    <ul>
      <li><strong>Step 1</strong>：確認 — 真的沒有 thrill + bruit？</li>
      <li class="fragment"><strong>Step 2</strong>：評估 — 什麼時候開始的？之前有 stenosis 的跡象嗎？</li>
      <li class="fragment"><strong>Step 3</strong>：緊急透析需求？→ 先放 temporary CVC（IJV preferred）</li>
      <li class="fragment"><strong>Step 4</strong>：通知血管外科 / 放射科</li>
      <li class="fragment">→ <span class="highlight">Catheter-directed thrombolysis</span>（urokinase/tPA）</li>
      <li class="fragment">→ <span class="highlight">Percutaneous thrombectomy</span>（AngioJet 等）</li>
      <li class="fragment">→ 找到 underlying stenosis → 同時做 <span class="highlight">angioplasty</span></li>
      <li class="fragment">→ 以上都失敗 → <span class="danger">surgical thrombectomy</span> ± revision</li>
    </ul>
  </section>

  <section data-background-color="#001219">
    <h3>情境 2：AVF 出血壓不住！</h3>
    <p>「透析完拔針，壓了 20 分鐘還在流！」</p>
    <ul>
      <li class="fragment"><strong>Step 1</strong>：<span class="highlight">直接加壓</span> — 兩根手指精準壓在穿刺點上</li>
      <li class="fragment">⚠️ 不要壓整條 AVF — 會造成 thrombosis！</li>
      <li class="fragment"><strong>Step 2</strong>：壓 15-20 分鐘，不要一直掀開看</li>
      <li class="fragment"><strong>Step 3</strong>：還在流 → 考慮縫合（fine suture on puncture site）</li>
      <li class="fragment"><strong>Step 4</strong>：大量出血 / pseudoaneurysm 破裂 → <span class="danger">tourniquet proximal</span> + 手術</li>
    </ul>
  </section>

  <section data-background-color="#001219">
    <h3>⚠️ 急診出血的重點</h3>
    <ul>
      <li><span class="danger">AVF 出血可以致命</span> — 不是小事</li>
      <li class="fragment">Pseudoaneurysm 上的皮膚如果破了 → 噴血</li>
      <li class="fragment">HD 患者通常有 <span class="danger">uremic platelet dysfunction + heparin</span></li>
      <li class="fragment">止血更困難 → 要更積極處理</li>
      <li class="fragment">如果是 <span class="danger">infected pseudoaneurysm 破裂</span> → 手術 + 抗生素</li>
    </ul>
  </section>
</section>

<!-- Section 7: What Would You Do? -->
<section>
  <section data-background-color="#001219">
    <h2>🧠 What Would You Do?</h2>
    <p>三個 case — 你來決定</p>
  </section>

  <section data-background-color="#001219">
    <h3>Case 1</h3>
    <p>55M，DM 20 年、HTN，eGFR 18（CKD 4），腎臟科轉介做 vascular access。<br/>
    理學檢查：Allen test 正常，左手 cephalic vein 看得到、超音波直徑 2.8mm，<br/>
    radial artery 2.2mm。</p>
    <ul>
      <li class="fragment">你選哪個位置？</li>
      <li class="fragment"><span class="success">答：Left radiocephalic AVF</span></li>
      <li class="fragment">為什麼？遠端優先、血管條件 OK（vein &gt;2.5mm, artery &gt;2mm）</li>
      <li class="fragment">DM 患者要注意：failure rate 較高，術後要積極追蹤成熟度</li>
    </ul>
  </section>

  <section data-background-color="#001219">
    <h3>Case 2</h3>
    <p>68F，HD 5 年，left brachiocephalic AVF。<br/>
    透析室反映：最近幾週 pump flow 從 350 降到 250，venous pressure 一直很高。<br/>
    你去看：thrill 在 anastomosis 有，但比以前弱，<br/>
    聽診發現 <span class="danger">high-pitched systolic bruit</span>。</p>
    <ul>
      <li class="fragment">你的診斷？</li>
      <li class="fragment"><span class="highlight">Venous outflow stenosis</span>（最常見的位置）</li>
      <li class="fragment">下一步？<span class="highlight">安排 fistulography + angioplasty</span></li>
      <li class="fragment">不處理會怎樣？→ 進展到 thrombosis → 失去通路</li>
    </ul>
  </section>

  <section data-background-color="#001219">
    <h3>Case 3</h3>
    <p>75M，HD 8 年，left radiocephalic AVF。<br/>
    今天早上起床發現 <span class="danger">AVF 完全沒有 thrill</span>，也聽不到 bruit。<br/>
    觸診：AVF 摸起來像一條硬繩子。<br/>
    明天預定透析日。</p>
    <ul>
      <li class="fragment">你的診斷？<span class="danger">Acute thrombosis</span></li>
      <li class="fragment">立即處理？</li>
      <li class="fragment">1. 先確保明天的透析：放 temporary CVC（right IJV）</li>
      <li class="fragment">2. 聯絡放射科/血管外科：24-48h 內 intervention</li>
      <li class="fragment">3. Percutaneous thrombectomy + angioplasty（處理 underlying stenosis）</li>
      <li class="fragment">4. 如果救不回來 → 重新評估建立新通路</li>
    </ul>
  </section>
</section>

<!-- Summary -->
<section data-background-color="#001219">
  <h2>📌 Take Home Messages</h2>
  <ul>
    <li class="fragment"><span class="highlight">提早轉介</span> — eGFR &lt;30 或預計 1 年內需透析就該開始規劃</li>
    <li class="fragment"><span class="highlight">AVF 優先</span>，但要個人化（Patient Life Plan）</li>
    <li class="fragment"><span class="highlight">Rule of 6s</span> — 成熟標準：6-6-6-6</li>
    <li class="fragment"><span class="highlight">理學檢查是核心技能</span> — 看、摸、聽就能診斷 80% 的問題</li>
    <li class="fragment"><span class="highlight">Stenosis 是可以預防的</span> — 早發現、早 intervention</li>
    <li class="fragment"><span class="danger">Thrombosis 是急症</span> — 24-48h 黃金期</li>
    <li class="fragment"><span class="danger">出血可以致命</span> — 精準加壓、不壓整條</li>
  </ul>
</section>

<!-- End -->
<section data-background-color="#001219">
  <div class="emoji-big">💉</div>
  <h2>AVF/AVG 評估</h2>
  <p>「摸一下，你就知道它活不活」</p>
  <p class="author">Questions?</p>
</section>
`
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
