import { Scenario } from "../types";

export const bleedingVsTamponade: Scenario = {
  id: "bleeding-vs-tamponade",
  title: "術後低血壓",
  subtitle: "「學長，血壓在掉！」",
  difficulty: "beginner",
  duration: "10-15 min",
  tags: ["術後出血", "Tamponade", "ICU", "鑑別診斷"],
  patient: {
    age: 68,
    sex: "M",
    surgery: "AVR (bioprosthetic) + CABG ×1 (SVG → RCA)",
    postOpDay: "Day 0 (術後 4 小時)",
    history: "HTN, DM, CKD stage 3, Aspirin 術前有停",
    allergies: "NKDA",
  },
  startNode: "handoff",
  nodes: {
    // ═══════════════════════════════════════
    // ACT 1: 交班
    // ═══════════════════════════════════════
    handoff: {
      act: "Act 1：交班",
      vitals: {
        hr: 88,
        bpSys: 112,
        bpDia: 68,
        spo2: 99,
        cvp: 8,
        temp: 36.2,
        chestTube: 80,
        uo: 45,
      },
      narrative: `護理師交班：「68 歲男性，今天下午做 AVR + CABG，四個小時前從 OR 回來。目前 intubated，sedation 已經在退了。術中 bypass time 110 分鐘，過程順利。Chest tube ×2（anterior + posterior），目前 output 都還 OK。」`,
      teachingNote: "讓 clerk 先看 monitor，問「你覺得目前穩不穩？」",
      prompt: "你接手這個病人。看一下 monitor，目前狀況如何？",
      choices: [
        {
          id: "stable",
          label: "目前 stable",
          emoji: "✅",
          description: "Vital signs 看起來都在正常範圍",
          nextNode: "stable-good",
        },
        {
          id: "concerned",
          label: "有點擔心",
          emoji: "🤔",
          description: "某些數字我不太確定正不正常",
          nextNode: "stable-good",
        },
      ],
    },

    "stable-good": {
      narrative: `沒錯，目前算穩定。HR 88 不快不慢、BP 112/68 灌流壓夠、CVP 8 不高不低、SpO2 99% 氧合很好。Chest tube 80 cc/hr 在術後前幾小時可以接受。\n\n你決定繼續觀察，準備寫個 note。\n\n⏱ 一小時後⋯⋯`,
      teachingNote: "術後前 4-6 小時 chest tube 100-150 cc/hr 內都還行。注意趨勢比單一數字重要。",
      autoAdvance: "one-hour-later",
    },

    // ═══════════════════════════════════════
    // ACT 2: 事情發生了
    // ═══════════════════════════════════════
    "one-hour-later": {
      act: "Act 2：情況變化",
      vitals: {
        hr: 108,
        bpSys: 92,
        bpDia: 58,
        spo2: 97,
        cvp: 6,
        temp: 36.0,
        chestTube: 250,
        uo: 20,
      },
      narrative: `⚠️ 護理師叫你：「學長，血壓在掉！而且 chest tube 這一個小時出了 250cc。」`,
      nurseNote: "Chest tube 顏色偏鮮紅，有看到一些 clot。",
      prompt: "血壓掉了、chest tube 量大增。你第一步要做什麼？",
      choices: [
        {
          id: "fluid",
          label: "先給 Fluid",
          emoji: "💧",
          description: "給 500cc crystalloid 衝一下 volume",
          nextNode: "gave-fluid",
        },
        {
          id: "check-labs",
          label: "先抽血看",
          emoji: "🧪",
          description: "Stat CBC + coag，搞清楚出血原因",
          nextNode: "checked-labs",
        },
        {
          id: "call-senior",
          label: "先通知學長",
          emoji: "📞",
          description: "這個我處理不了，先 call help",
          nextNode: "called-senior",
        },
        {
          id: "vasopressor",
          label: "給升壓藥",
          emoji: "💉",
          description: "先把血壓拉上來",
          nextNode: "gave-vasopressor",
        },
      ],
    },

    "gave-fluid": {
      vitals: {
        hr: 104,
        bpSys: 98,
        bpDia: 62,
        cvp: 7,
        chestTube: 260,
      },
      narrative: `你給了 500cc Normal Saline。血壓有微微回升（98/62），但 chest tube 還在出⋯⋯而且似乎更多了。\n\n這是對的第一步 — 低血壓先補 volume 沒有錯。但根本問題還沒解決。`,
      teachingNote: "先 volume 是合理的，但不能只給 fluid 不找原因。",
      prompt: "Fluid 給了，血壓暫時撐住。下一步？",
      choices: [
        {
          id: "labs-now",
          label: "抽血 + 叫學長",
          emoji: "🧪",
          nextNode: "comprehensive-workup",
        },
        {
          id: "more-fluid",
          label: "再給 fluid",
          emoji: "💧",
          nextNode: "too-much-fluid",
        },
      ],
    },

    "too-much-fluid": {
      vitals: {
        hr: 112,
        bpSys: 88,
        bpDia: 52,
        cvp: 5,
        chestTube: 300,
      },
      narrative: `你又給了 500cc，但血壓反而更低了。Chest tube 持續大量 output。\n\n⚠️ 護理師看起來很緊張：「學長，是不是要 call 主治醫師？」\n\n繼續 volume resuscitation 而不處理出血源是危險的 — 你在稀釋凝血因子，可能讓出血更嚴重。`,
      prompt: "血壓繼續掉。現在必須做更多了。",
      choices: [
        {
          id: "workup-now",
          label: "抽血 + 叫學長 + 備血",
          emoji: "🚨",
          nextNode: "comprehensive-workup",
        },
      ],
    },

    "checked-labs": {
      narrative: `你下了 stat CBC, PT/aPTT, fibrinogen。護理師抽了，15 分鐘後結果回來。\n\n但⋯⋯在等 lab 的時候，有沒有其他事該同時做？`,
      teachingNote: "抽血很好，但不要「只」抽血然後等。血壓在掉的時候要同時處理。",
      prompt: "Lab 送出去了。等結果的同時？",
      choices: [
        {
          id: "fluid-and-call",
          label: "同時給 fluid + 通知學長",
          emoji: "✅",
          nextNode: "comprehensive-workup",
        },
        {
          id: "just-wait",
          label: "等 lab 結果再決定",
          emoji: "⏳",
          nextNode: "waited-too-long",
        },
      ],
    },

    "waited-too-long": {
      vitals: {
        hr: 118,
        bpSys: 82,
        bpDia: 48,
        cvp: 4,
        chestTube: 320,
      },
      narrative: `等了 15 分鐘，血壓掉到 82/48，chest tube 已經出了 320cc/hr。\n\n護理師自己 call 了學長。學長跑進來第一句話：「為什麼現在才叫我？」\n\n— 在 ICU，等 lab 的同時一定要先處理 hemodynamics。不能什麼都等。`,
      teachingNote: "經典錯誤：做了「對的檢查」但忘了同時做「對的處置」。在 ICU 是 parallel processing，不是 sequential。",
      prompt: "學長到了。現在怎麼辦？",
      choices: [
        {
          id: "catch-up",
          label: "補 fluid + 備血 + 看 lab",
          emoji: "🚨",
          nextNode: "comprehensive-workup",
        },
      ],
    },

    "called-senior": {
      narrative: `你打給學長。他問：「病人現在 vital signs 怎樣？chest tube 多少？你有先給 fluid 嗎？」\n\n他希望你已經先開始處理了。Call help 很好，但不是打完電話就等學長來 — 要邊打邊做。`,
      teachingNote: "叫 help 永遠沒錯，但學長期待你同時在處理。先報 vital signs、chest tube output、你做了什麼。",
      prompt: "學長在路上了。你同時在做什麼？",
      choices: [
        {
          id: "fluid-labs",
          label: "給 fluid + 抽血 + 備血",
          emoji: "✅",
          nextNode: "comprehensive-workup",
        },
      ],
    },

    "gave-vasopressor": {
      vitals: {
        hr: 100,
        bpSys: 105,
        bpDia: 65,
        cvp: 5,
        chestTube: 280,
      },
      narrative: `你開了 Norepinephrine。血壓數字上來了，但⋯⋯\n\n仔細想：這個病人是在出血。升壓藥會讓血壓「看起來」好一點，但沒有解決根本問題 — 而且可能讓你產生錯誤的安全感。\n\n⚠️ 出血性低血壓的治療是止血 + 補血，不是升壓藥。`,
      teachingNote: "重要觀念：升壓藥不是萬能的。出血 + vasopressor = 數字好看但 perfusion 更差（vasoconstriction + 血管內容積不足）",
      prompt: "血壓數字回來了，但 chest tube 還在出。根本問題是什麼？",
      choices: [
        {
          id: "realize",
          label: "要處理出血，不是拉血壓",
          emoji: "💡",
          nextNode: "comprehensive-workup",
        },
      ],
    },

    // ═══════════════════════════════════════
    // CONVERGENCE: 全面評估
    // ═══════════════════════════════════════
    "comprehensive-workup": {
      vitals: {
        hr: 112,
        bpSys: 90,
        bpDia: 55,
        cvp: 5,
        chestTube: 280,
        uo: 10,
      },
      narrative: `學長到了，你們一起看：\n\n📋 **Lab 回來了：**`,
      labData: {
        Hb: "8.2 g/dL（術後 baseline 10.5）",
        Plt: "98K（術後偏低但還行）",
        INR: "1.6",
        aPTT: "42 sec",
        Fibrinogen: "180 mg/dL",
        Lactate: "3.2 mmol/L",
      },
      teachingNote: "Hb 掉了 2g 在幾小時內 = 明確在出血。INR 1.6 + fibrinogen 偏低 = coagulopathy。但現在更重要的是：是 surgical bleeding 還是 coagulopathy？",
      prompt: "Lab 出來了。你們討論下一步。現在最關鍵的問題是什麼？",
      choices: [
        {
          id: "surgical-vs-coag",
          label: "分辨 Surgical bleeding vs Coagulopathy",
          emoji: "🤔",
          description: "處理方式完全不同",
          nextNode: "key-question",
        },
        {
          id: "transfuse",
          label: "先輸血再說",
          emoji: "🩸",
          description: "Hb 在掉，先補上來",
          nextNode: "transfuse-first",
        },
      ],
    },

    "transfuse-first": {
      narrative: `輸血是對的 — 你下了 2U pRBC + 2U FFP。但學長追問：\n\n「好，血品在跑了。但你覺得這個出血，是凝血因子的問題，還是有一條血管在噴？因為如果是 surgical bleeding，你補再多血品也止不住。」`,
      prompt: "怎麼區分 surgical bleeding 和 coagulopathy？",
      choices: [
        {
          id: "think",
          label: "看 chest tube 的特徵",
          emoji: "🔍",
          nextNode: "key-question",
        },
      ],
    },

    "key-question": {
      narrative: `學長教你一個判斷法：\n\n🔴 **Surgical bleeding 的線索：**\n- Chest tube output 持續高量且不減\n- 顏色鮮紅（新鮮血）\n- 給了 FFP/Plt/Cryo 後 output 還是不減\n- 凝血數據矯正了但還在出\n\n🟡 **Coagulopathy 的線索：**\n- Output 是暗紅色、oozing 型\n- INR 高、fibrinogen 低、plt 低\n- 給了血品後 output 有改善\n- 多個 drain 都在出（不是只有一邊）\n\n「我們的病人：鮮紅色、量大、anterior drain 出比較多⋯⋯」`,
      prompt: "根據這些線索，你覺得這個病人比較像哪個？",
      choices: [
        {
          id: "surgical",
          label: "Surgical bleeding",
          emoji: "🔴",
          description: "鮮紅色 + 持續大量 + 單側多",
          nextNode: "surgical-path",
        },
        {
          id: "coagulopathy",
          label: "Coagulopathy",
          emoji: "🟡",
          description: "先試 FFP/Cryo 矯正看看",
          nextNode: "coag-path",
        },
      ],
    },

    "surgical-path": {
      vitals: {
        hr: 118,
        bpSys: 85,
        bpDia: 50,
        cvp: 4,
        chestTube: 320,
        uo: 5,
      },
      narrative: `「你的判斷是對的。」學長說。\n\n他打給主治醫師，報告：Chest tube output 過去 3 小時 > 800cc total，鮮紅色，給了 FFP 還是沒改善。\n\n主治醫師：「準備回 OR re-explore。通知刀房、備 4U pRBC、call 麻醉。」`,
      teachingNote: "Re-explore criteria: >400ml/1hr, >200ml/hr×2-4hr, >1000ml/4-6hr 或 sudden massive output。這個病人超過了。",
      prompt: "決定回 OR re-explore。但等等 — 在推去開刀之前，有一件事一定要排除。",
      choices: [
        {
          id: "tamponade",
          label: "Tamponade",
          emoji: "⚠️",
          description: "確認不是 tamponade 偽裝成出血",
          nextNode: "rule-out-tamponade",
        },
        {
          id: "ready-or",
          label: "直接準備推 OR",
          emoji: "🏃",
          description: "時間很趕，趕快去",
          nextNode: "missed-tamponade-check",
        },
      ],
    },

    "coag-path": {
      vitals: {
        hr: 115,
        bpSys: 88,
        bpDia: 52,
        chestTube: 290,
      },
      narrative: `你先給了 4U FFP + 10U Cryo（矯正 INR 和 fibrinogen）。\n\n⏱ 30 分鐘後⋯⋯ chest tube output 還是 290cc/hr，沒有改善。\n\n學長說：「好，coag 試過了，沒效。那答案就出來了 — 」`,
      prompt: "血品給了但 output 沒改善。這代表什麼？",
      choices: [
        {
          id: "its-surgical",
          label: "是 Surgical bleeding，要回 OR",
          emoji: "🔴",
          nextNode: "surgical-path",
        },
      ],
    },

    "rule-out-tamponade": {
      narrative: `「Tamponade 是對的。」學長點頭。\n\n⚠️ 關鍵鑑別：\n\n| | Bleeding | Tamponade |\n|---|---|---|\n| Chest tube output | 大量 | 突然減少或停止 |\n| CVP | 低（volume 不夠） | 高（血回不了心臟） |\n| BP | 漸進式掉 | 突然掉 |\n| Heart size (CXR) | 正常 | 可能增大 |\n| Beck's triad | 無 | JVD + muffled heart + hypotension |\n\n你們的病人 CVP 低、chest tube 量大 — 比較像 bleeding，不像 tamponade。\n\n但⋯⋯如果 chest tube 被血塊堵住了呢？`,
      teachingNote: "重要！Chest tube output「突然減少」不一定是改善 — 可能是堵住了。堵住 + 持續出血 = 隱藏的 tamponade。這是最危險的假象。",
      prompt: "你怎麼確認 chest tube 沒有被堵住？",
      choices: [
        {
          id: "strip-tube",
          label: "Milk/strip the chest tube",
          emoji: "👐",
          description: "擠一擠看有沒有血塊出來",
          nextNode: "ending-good",
        },
        {
          id: "echo",
          label: "做 bedside echo",
          emoji: "📱",
          description: "直接看有沒有 pericardial effusion",
          nextNode: "ending-good",
        },
      ],
    },

    "missed-tamponade-check": {
      narrative: `你準備推 OR 了。學長攔住你：\n\n「等一下。你有確認不是 tamponade 嗎？如果 chest tube 堵住了，外面看到的 output 在減少，但裡面血其實在累積壓迫心臟 — 你推去 OR 路上可能就 arrest 了。」\n\n這是一個重要的教訓：急歸急，但鑑別診斷不能跳過。`,
      prompt: "怎麼快速 rule out tamponade？",
      choices: [
        {
          id: "echo-stat",
          label: "Bedside echo + 檢查 chest tube 通暢",
          emoji: "📱",
          nextNode: "ending-good",
        },
      ],
    },

    // ═══════════════════════════════════════
    // ACT 3: 結局 + Debrief
    // ═══════════════════════════════════════
    "ending-good": {
      act: "Act 3：結局",
      vitals: {
        hr: 105,
        bpSys: 95,
        bpDia: 60,
        cvp: 6,
        chestTube: 300,
        uo: 15,
      },
      narrative: `Echo 沒有明顯 pericardial effusion，chest tube 通暢。確認是 surgical bleeding。\n\n🏥 病人推回 OR，主治醫師 re-explore 發現一條 sternal branch 在出血，電燒止血。術後 chest tube output 明顯改善，血壓回穩。\n\n病人後續恢復順利。`,
      isEnding: true,
      endingType: "good",
      debrief: [
        {
          title: "術後出血的思考流程",
          content:
            "低血壓 + chest tube 量大 → ① 先穩 hemodynamics（fluid + 血品）→ ② 判斷 surgical vs coagulopathy → ③ 血品無效 = surgical → re-explore → ④ 推 OR 前 rule out tamponade",
          type: "key-point",
        },
        {
          title: "最危險的假象",
          content:
            "Chest tube output 突然「減少」不一定是改善。可能是堵住了 → 血在裡面累積 → 隱藏的 tamponade。一定要確認 tube 通暢。",
          type: "pitfall",
        },
        {
          title: "Re-explore Criteria",
          content:
            ">400 mL 第一小時、>200 mL/hr × 連續 2-4 hr、>1000 mL / 4-6hr。但不要只看數字 — 趨勢和臨床表現更重要。",
          type: "guideline",
        },
        {
          title: "討論：升壓藥在出血中的角色？",
          content:
            "出血性低血壓先補 volume + 止血，不是升壓。升壓藥會讓 BP 數字好看但 perfusion 更差。例外：bridge to OR 時短暫使用維持灌流壓。",
          type: "discussion",
        },
        {
          title: "討論：什麼時候叫 help？",
          content:
            "永遠沒有太早叫的問題。但叫的同時要自己在做事（fluid、抽血、備血）。學長期待你邊報邊做，不是打完電話站著等。",
          type: "discussion",
        },
      ],
    },
  },
};
