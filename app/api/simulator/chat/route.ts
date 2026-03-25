import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import type { NurseChatResponse, NurseAction } from "@/lib/simulator/engine/nurse-action-types";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// ── Simple in-memory rate limiter (per IP, 20 requests per 10 minutes) ──────

const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const RATE_LIMIT_MAX = 20;

const rateLimitMap = new Map<string, { count: number; windowStart: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    rateLimitMap.set(ip, { count: 1, windowStart: now });
    return true;
  }
  if (entry.count >= RATE_LIMIT_MAX) return false;
  entry.count++;
  return true;
}

// Dangerous orders that should be blocked based on active pathology
const DANGEROUS_ORDERS: Record<string, Set<string>> = {
  surgical_bleeding: new Set(["heparin", "tpa", "warfarin", "aspirin", "clopidogrel"]),
  coagulopathy: new Set(["heparin", "tpa", "warfarin", "aspirin", "clopidogrel"]),
  cardiac_tamponade: new Set(["nitroglycerin", "morphine", "metoprolol", "labetalol", "furosemide", "heparin"]),
  septic_shock: new Set(["metoprolol", "labetalol", "propofol"]),
};

// Server-side allowlist of valid medication IDs (must match IDs defined in system prompt)
const VALID_MEDICATION_IDS = new Set([
  // Medications
  "norepinephrine", "epinephrine", "vasopressin", "dopamine", "dobutamine", "milrinone",
  "protamine", "txa", "aminocaproic_acid", "ddavp", "vitamin_k",
  "ns", "lr", "albumin_5", "calcium_gluconate", "calcium_chloride", "kcl_iv", "mgso4",
  "furosemide", "ceftriaxone", "piptazo", "vancomycin",
  "propofol", "fentanyl", "midazolam",
  "epinephrine-ivp", "atropine", "amiodarone-ivp", "nicardipine", "labetalol", "nitroglycerin",
  "heparin", "tpa", "aspirin", "clopidogrel", "hydrocortisone",
  // Labs
  "cbc", "bcs", "coag", "abg", "lactate", "ica", "act", "troponin", "blood_culture", "teg", "rotem",
  // Transfusions
  "prbc_1u", "prbc_2u", "prbc_4u", "ffp_2u", "ffp_4u", "platelet_1dose", "platelet_2dose", "cryo_6u", "cryo_10u",
]);

function filterDangerousActions(
  actions: NurseAction[],
  pathology?: string
): NurseAction[] {
  // Step 1: Only allow actions with valid medication IDs (prevents prompt injection)
  const validActions = actions.filter((a) => {
    if (a.type !== "place_order" && a.type !== "confirm_order") return true;
    const medId = (a.medicationId ?? "").toLowerCase();
    return VALID_MEDICATION_IDS.has(medId);
  });
  // Step 2: Filter pathology-specific dangerous orders
  if (!pathology || !DANGEROUS_ORDERS[pathology]) return validActions;
  const blocked = DANGEROUS_ORDERS[pathology];
  return validActions.filter((a) => {
    const drugId = (a.medicationId ?? "").toLowerCase();
    return !blocked.has(drugId);
  });
}

export async function POST(request: NextRequest) {
  // Rate limit check
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { reply: "林姐：學長，你問太快了啦，讓我喘一口氣。", actions: [] },
      { status: 429 }
    );
  }

  try {
    const body = await request.json();
    const { message, gameState, conversationHistory } = body;

    // Input validation
    if (!message || typeof message !== "string" || message.length > 1000) {
      return NextResponse.json(
        { reply: "（訊息格式不正確）", actions: [] },
        { status: 400 }
      );
    }

    const { vitals, chestTube, clock, labs, orders, timeline } = gameState ?? {};

    // Build context strings
    const vitalsContext = vitals
      ? `HR: ${vitals.hr} bpm | BP: ${vitals.sbp}/${vitals.dbp} mmHg (MAP ${vitals.map ?? Math.round(vitals.dbp + (vitals.sbp - vitals.dbp) / 3)}) | SpO₂: ${vitals.spo2}% | CVP: ${vitals.cvp} mmHg | Temp: ${vitals.temperature}°C | RR: ${vitals.rr}/min`
      : "Vitals 未知";

    const ctContext = chestTube
      ? `CT output: ${chestTube.currentRate} cc/hr，累計 ${chestTube.totalOutput} cc，顏色：${chestTube.color}，有血塊：${chestTube.hasClots ? "是" : "否"}，通暢：${chestTube.isPatent ? "是" : "否"}`
      : "CT 狀態未知";

    const clockContext = clock
      ? `遊戲時間 +${clock.currentTime} 分鐘（約 ${Math.floor(clock.currentTime / 60).toString().padStart(2, "0")}:${(clock.currentTime % 60).toString().padStart(2, "0")} 後半夜）`
      : "";

    const labsContext =
      labs && labs.length > 0
        ? `已有報告：${labs.map((l: { name: string; result?: string }) => l.name + (l.result ? ": " + l.result : "（待結果）")).join(", ")}`
        : "目前無 lab 報告";

    const ordersContext =
      orders && orders.length > 0
        ? `已開 orders：${orders.map((o: { name: string; dose?: string }) => o.name + (o.dose ? " " + o.dose : "")).join(", ")}`
        : "目前無 active orders";

    const recentTimeline =
      timeline && timeline.length > 0
        ? timeline
            .slice(-5)
            .map((t: { type: string; content: string }) => `[${t.type}] ${t.content}`)
            .join("\n")
        : "（無近期事件）";

    const systemPrompt = `你是心臟外科 ICU 的資深護理師林姐，在心臟外科 ICU 有 15 年經驗。
你正在值班，負責這位術後病人，並且學長（住院醫師）正在跟你溝通。

## 你的身份
- 你是護理師，不是醫生
- 你不說「我覺得應該開 XX 藥」或「建議使用 XX 治療」
- 你只報告你能觀察到的：生命徵象、外觀、CT 引流量和顏色、病人行為、水分平衡
- 你專業、有愛心、數字準確
- 你會委婉暗示，但不做醫療決策
  例如：「學長，這個量...我覺得要不要通知一下 VS？」
  例如：「血壓還是有點低，學長你看一下？」
- 如果 lab 還沒抽，你說「還沒抽欸，要不要開？」
- 如果有什麼值得注意，你會簡短提到，但讓學長決定

## 目前病人狀態
${vitalsContext}
${ctContext}
${clockContext}

## Labs 狀況
${labsContext}

## Active Orders
${ordersContext}

## 近期 Timeline
${recentTimeline}

## 可用藥物 ID 清單（Order 執行時使用）

Medications（升壓、止血、輸液、利尿、抗生素、鎮靜、急救、抗凝）:
norepinephrine, epinephrine, vasopressin, dopamine, dobutamine, milrinone,
protamine, txa, aminocaproic_acid, ddavp, vitamin_k,
ns, lr, albumin_5, calcium_gluconate, calcium_chloride, kcl_iv, mgso4,
furosemide, ceftriaxone, piptazo, vancomycin,
propofol, fentanyl, midazolam,
epinephrine-ivp, atropine, amiodarone-ivp, nicardipine, labetalol, nitroglycerin,
heparin, tpa, aspirin, clopidogrel, hydrocortisone

Labs（檢驗）:
cbc, bcs, coag, abg, lactate, ica, act, troponin, blood_culture, teg, rotem

Transfusions（輸血）:
prbc_1u, prbc_2u, prbc_4u, ffp_2u, ffp_4u, platelet_1dose, platelet_2dose, cryo_6u, cryo_10u

## 常見別名對照
- Levo / Levophed / Norepi / Norepinephrine → norepinephrine
- Epi / Epinephrine / Adrenaline → epinephrine（drip 用 epinephrine，IVP 急救用 epinephrine-ivp）
- Vaso / Vasopressin / ADH → vasopressin
- Dopa / Dopamine → dopamine
- Dobu / Dobutamine → dobutamine
- Milrinone → milrinone
- TXA → txa
- Aminocaproic → aminocaproic_acid
- DDAVP / Desmopressin → ddavp
- Vit K → vitamin_k
- Protamine → protamine
- NS / Normal Saline / 生理食鹽水 → ns
- LR / Lactated Ringer / 乳酸林格 → lr
- Albumin / Alb → albumin_5
- Ca Gluconate / Calcium → calcium_gluconate
- Ca Chloride → calcium_chloride
- KCl → kcl_iv
- MgSO4 / Mag → mgso4
- Lasix / Furosemide → furosemide
- Ceftriaxone / Rocephin → ceftriaxone
- Pip-Tazo / Zosyn → piptazo
- Vanco / Vancomycin → vancomycin
- Propofol / Diprivan → propofol
- Fentanyl → fentanyl
- Midazolam / Versed → midazolam
- Atropine → atropine
- Amiodarone IVP → amiodarone-ivp
- Nicardipine / Cardene → nicardipine
- Labetalol → labetalol
- NTG / Nitroglycerin → nitroglycerin
- Heparin → heparin
- tPA / Alteplase → tpa
- Aspirin / ASA → aspirin
- Plavix / Clopidogrel → clopidogrel
- Solumedrol / Hydrocortisone / 類固醇 → hydrocortisone
- CBC / 血球 → cbc
- BCS / Chem / 生化 → bcs
- Coag / PT/PTT / 凝血 → coag
- ABG / 血氣 → abg
- Lactate / 乳酸 → lactate
- iCa / Ionized Ca → ica
- ACT → act
- Troponin / 心肌酶 → troponin
- Blood culture / 血培養 → blood_culture
- TEG → teg
- ROTEM → rotem
- pRBC 1U → prbc_1u
- pRBC 2U → prbc_2u
- pRBC 4U → prbc_4u
- FFP 2U → ffp_2u
- FFP 4U → ffp_4u
- Platelet 1 dose → platelet_1dose
- Platelet 2 doses → platelet_2dose
- Cryo 6U → cryo_6u
- Cryo 10U → cryo_10u

## 常見預設劑量（confirm_order 時填入 dose）
- norepinephrine: "0.05" (unit: mcg/kg/min)
- epinephrine: "0.05" (unit: mcg/kg/min)
- vasopressin: "0.04" (unit: units/min)
- dopamine: "5" (unit: mcg/kg/min)
- dobutamine: "5" (unit: mcg/kg/min)
- milrinone: "0.375" (unit: mcg/kg/min)
- propofol: "5" (unit: mcg/kg/min)
- fentanyl: "25" (unit: mcg/hr)
- midazolam: "2" (unit: mg/hr)
- furosemide: "20" (unit: mg)
- nicardipine: "5" (unit: mg/hr)
- labetalol: "20" (unit: mg)
- nitroglycerin: "10" (unit: mcg/min)
- heparin: "500" (unit: units/hr)
- ns: "500" (unit: mL)
- lr: "500" (unit: mL)
- albumin_5: "250" (unit: mL)
- cbc/bcs/coag/abg/lactate/ica/act/troponin/blood_culture/teg/rotem: "1" (unit: panel)
- 輸血 prbc_1u/prbc_2u etc.: 用 defaultDose 即可，dose = 對應 unit 數量字串

## 回答規則

**你必須永遠回傳 JSON 格式**，格式如下：
{
  "reply": "護理師說的話（1-3句，口語，繁體中文）",
  "actions": []  // 或含有 NurseAction 物件的陣列
}

### Actions 規則
- 玩家給了明確藥名 + 劑量 → 用 type: "place_order"，附上 dose（字串，只含數字）
- 玩家只說藥名沒有劑量 → 用 type: "confirm_order"，dose 填上方預設劑量
- 玩家說不相關的事 → actions: []
- 一則訊息可以包含多個 actions（例如同時開多個 order）

### Reply 規則
- place_order：「好，學長，XX 我幫你開了。」
- confirm_order：「學長，XX [default dose + unit] continuous 對嗎？」
- 純對話：正常護理師口吻
- 不要超過 3 句話
- 不要提建議用什麼藥或治療方案

### Frequency 規則
- Drip（持續滴注）：frequency = "Continuous"
- 單次給藥（Bolus）：frequency = "Once"
- Lab：frequency = "STAT"
- 輸血：frequency = "Over 2hr"（默認）`;

    // Build multi-turn messages: include recent conversation history for context
    const messages: Array<{ role: "user" | "assistant"; content: string }> = [];
    if (Array.isArray(conversationHistory)) {
      // Include last 5 exchanges (10 messages max) for context
      const recent = conversationHistory.slice(-10);
      for (const entry of recent) {
        if (entry.role === "user" || entry.role === "assistant") {
          messages.push({ role: entry.role, content: String(entry.content).slice(0, 500) });
        }
      }
    }
    // Always end with the current user message
    messages.push({ role: "user", content: message });

    const response = await client.messages.create(
      {
        model: "claude-sonnet-4-20250514",
        max_tokens: 500,
        system: systemPrompt,
        messages,
      },
      { timeout: 30_000 },
    );

    const responseText =
      response.content[0].type === "text" ? response.content[0].text : "";

    // Parse JSON response; fallback to plain reply on failure
    let parsed: NurseChatResponse;
    try {
      // Strip markdown code fences if present
      const cleaned = responseText
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/\s*```\s*$/, "")
        .trim();
      parsed = JSON.parse(cleaned);
      // Ensure required fields exist
      if (typeof parsed.reply !== "string") throw new Error("missing reply");
      if (!Array.isArray(parsed.actions)) parsed.actions = [];
    } catch (e) {
      console.warn("[NurseAI] JSON parse failed, falling back to plain reply. Raw:", responseText?.slice(0, 200), e);
      // Graceful fallback: treat response as plain nurse reply
      parsed = { reply: responseText || "（林姐暫時沒有回應）", actions: [] };
    }

    // Validate medication IDs against allowlist + filter pathology-specific dangerous orders
    const pathology = gameState?.pathology as string | undefined;
    if (parsed.actions && parsed.actions.length > 0) {
      parsed.actions = filterDangerousActions(parsed.actions, pathology);
    }

    return NextResponse.json(parsed);
  } catch (error) {
    console.error("Simulator chat error:", error);
    return NextResponse.json(
      { reply: "林姐：學長，系統好像有點問題，你稍等一下。", actions: [], error: true },
      { status: 500 }
    );
  }
}
