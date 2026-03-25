"use client";

import { useState } from "react";
import { useProGameStore } from "@/lib/simulator/store";

// ── Teaching PE items per scenario pathology ─────────────────────────────────

interface PEItem {
  area: string;
  emoji: string;
  finding: string;
  isAbnormal: boolean;
  teachingNote: string;
}

type PathologyKey =
  | "cardiac_tamponade"
  | "tamponade"
  | "surgical_bleeding"
  | "lcos"
  | "vasoplegia"
  | "septic_shock"
  | "tension_pneumothorax"
  | "postop_af"
  | "coagulopathy"
  | "default";

const PE_ITEMS_BY_PATHOLOGY: Record<PathologyKey, PEItem[]> = {
  cardiac_tamponade: [
    {
      area: "心音",
      emoji: "🫀",
      finding: "心音低沉（Muffled Heart Sounds）",
      isAbnormal: true,
      teachingNote:
        "心包積液包圍心臟，聲音傳導受阻 → 聽診時心音遠、悶。是 Beck's Triad 三項之一。",
    },
    {
      area: "頸靜脈",
      emoji: "🩺",
      finding: "頸靜脈怒張（JVD）",
      isAbnormal: true,
      teachingNote:
        "心包壓力升高 → 靜脈血無法回流右心 → CVP 上升 → JVD。是 Beck's Triad 第二項：提示右心後負荷過大。",
    },
    {
      area: "四肢",
      emoji: "🦵",
      finding: "四肢冰冷、皮膚濕黏（Cold Clammy Extremities）",
      isAbnormal: true,
      teachingNote:
        "心輸出量下降 → 周邊血管收縮 → 四肢末梢灌流不足。顏色蒼白或花斑（mottling）代表休克正在進展。",
    },
    {
      area: "血壓",
      emoji: "📉",
      finding: "低血壓（BP 下降）+ 脈壓差縮小",
      isAbnormal: true,
      teachingNote:
        "心包填塞壓縮心室充填 → 心搏出量驟降 → 低血壓。脈壓差縮小（PP < 30 mmHg）是心輸出量嚴重下降的早期信號。",
    },
  ],
  tamponade: [
    {
      area: "心音",
      emoji: "🫀",
      finding: "心音低沉（Muffled Heart Sounds）",
      isAbnormal: true,
      teachingNote:
        "心包積液包圍心臟，聲音傳導受阻 → 聽診時心音遠、悶。是 Beck's Triad 三項之一。",
    },
    {
      area: "頸靜脈",
      emoji: "🩺",
      finding: "頸靜脈怒張（JVD）",
      isAbnormal: true,
      teachingNote:
        "心包壓力升高 → 靜脈血無法回流右心 → CVP 上升 → JVD。Beck's Triad 第二項。",
    },
    {
      area: "四肢",
      emoji: "🦵",
      finding: "四肢冰冷濕黏",
      isAbnormal: true,
      teachingNote:
        "低心輸出量 → 周邊血管收縮代償 → 四肢末梢灌流差。",
    },
    {
      area: "血壓",
      emoji: "📉",
      finding: "低血壓、脈壓差縮小",
      isAbnormal: true,
      teachingNote: "心包填塞壓縮心室充填 → 心搏出量驟降 → 低血壓。",
    },
  ],
  surgical_bleeding: [
    {
      area: "傷口",
      emoji: "🩹",
      finding: "胸管引流鮮紅色血液增多（> 200 cc/hr）",
      isAbnormal: true,
      teachingNote:
        "術後出血警示：> 200 cc/hr 連續 2 小時，或一次性 > 500 cc，需考慮再探查（re-exploration）。",
    },
    {
      area: "四肢",
      emoji: "🦵",
      finding: "四肢末梢冰冷、皮膚蒼白",
      isAbnormal: true,
      teachingNote:
        "出血性休克 → 代償性周邊血管收縮 → 末梢灌流差。若膚色花斑（mottling）出現，代表休克進入失代償期。",
    },
    {
      area: "腹部",
      emoji: "🩺",
      finding: "腹部無壓痛（Soft Abdomen）",
      isAbnormal: false,
      teachingNote: "術後出血通常局限在胸腔，腹部 exam 正常。若腹部有壓痛，需考慮腸道缺血等併發症。",
    },
    {
      area: "心音",
      emoji: "🫀",
      finding: "心音正常、心搏有力",
      isAbnormal: false,
      teachingNote: "單純出血性休克早期心音仍可正常。若出現 muffled，需排除 tamponade。",
    },
  ],
  lcos: [
    {
      area: "四肢",
      emoji: "🦵",
      finding: "四肢末梢冰冷、花斑（Mottling）",
      isAbnormal: true,
      teachingNote:
        "低心輸出量症候群（LCOS）: CO < 2.2 L/min/m² → 周邊組織灌流不足 → 花斑、末梢冰冷、尿量下降。",
    },
    {
      area: "頸靜脈",
      emoji: "🩺",
      finding: "頸靜脈稍怒張（CVP 偏高）",
      isAbnormal: true,
      teachingNote: "心收縮力下降 → 靜脈血積鬱 → CVP 上升。是後負荷增加或心衰的標誌。",
    },
    {
      area: "心音",
      emoji: "🫀",
      finding: "可能有 S3 奔馬律",
      isAbnormal: true,
      teachingNote: "S3 = 心室充填音，出現於心室擴大/心衰時。術後心功能受損的提示。",
    },
    {
      area: "肺部",
      emoji: "🫁",
      finding: "雙下肺 Rales（濕囉音）",
      isAbnormal: true,
      teachingNote: "心衰 → 肺靜脈壓上升 → 肺水腫 → 聽診有濕囉音。若合併低氧，代表肺水腫正在進展。",
    },
  ],
  vasoplegia: [
    {
      area: "四肢",
      emoji: "🦵",
      finding: "四肢溫熱、皮膚潮紅（Warm Extremities）",
      isAbnormal: true,
      teachingNote:
        "血管麻痺症候群（Vasoplegia）: 周邊血管阻力極低 → 血液分布異常 → 四肢反而溫熱發紅，但血壓低。",
    },
    {
      area: "血壓",
      emoji: "📉",
      finding: "低血壓（MAP < 65）、脈壓差可能增大",
      isAbnormal: true,
      teachingNote:
        "SVR 下降 → 舒張壓低 → MAP 低，但收縮壓可能仍在正常範圍。脈壓差增大是低阻力的特徵。",
    },
    {
      area: "心音",
      emoji: "🫀",
      finding: "心音有力、心跳快",
      isAbnormal: true,
      teachingNote: "Vasoplegia 通常心功能尚可 → 代償性心跳加速。與 LCOS 的區別：四肢溫熱 vs 冰冷。",
    },
    {
      area: "皮膚",
      emoji: "🌡️",
      finding: "皮膚溫熱、無花斑",
      isAbnormal: false,
      teachingNote: "不同於出血性休克或 LCOS。Vasoplegia 是「溫休克」，需要升壓藥（NE）而非補液。",
    },
  ],
  septic_shock: [
    {
      area: "體溫",
      emoji: "🌡️",
      finding: "高燒（38.5°C 以上）或低體溫（< 36°C）",
      isAbnormal: true,
      teachingNote:
        "Sepsis 的體溫反應：可高燒或低體溫（免疫力差者）。低體溫 + sepsis 預後更差。",
    },
    {
      area: "四肢",
      emoji: "🦵",
      finding: "早期溫熱（warm septic shock）→ 後期花斑",
      isAbnormal: true,
      teachingNote:
        "早期 septic shock 因 SVR 下降呈「溫熱」；晚期微循環崩潰則花斑出現，代表器官灌流不足。",
    },
    {
      area: "傷口",
      emoji: "🩹",
      finding: "切口紅腫、滲液（可能感染跡象）",
      isAbnormal: true,
      teachingNote: "術後傷口感染是 sepsis 的潛在來源。需同時評估其他感染源（縱膈腔、肺炎、UTI）。",
    },
    {
      area: "腹部",
      emoji: "🩺",
      finding: "腹部軟、無明顯壓痛",
      isAbnormal: false,
      teachingNote: "排除腸道缺血（gut ischemia）是 septic shock 處置的一部分。",
    },
  ],
  tension_pneumothorax: [
    {
      area: "氣管",
      emoji: "🩺",
      finding: "氣管偏移（向對側）",
      isAbnormal: true,
      teachingNote: "Tension PTX → 同側肺塌陷 + 縱膈腔受壓 → 氣管偏向對側。緊急處置：立即針刺減壓。",
    },
    {
      area: "肺部",
      emoji: "🫁",
      finding: "單側呼吸音消失",
      isAbnormal: true,
      teachingNote: "受影響側無呼吸音。Tension PTX 的臨床診斷：不需等 CXR，立即臨床判斷處置。",
    },
    {
      area: "頸靜脈",
      emoji: "🩺",
      finding: "頸靜脈怒張（JVD）",
      isAbnormal: true,
      teachingNote: "縱膈腔偏移壓迫上腔靜脈 → 靜脈回流受阻 → JVD。與 tamponade 鑑別：呼吸音消失 vs 心音低沉。",
    },
    {
      area: "血壓",
      emoji: "📉",
      finding: "低血壓、心跳過速",
      isAbnormal: true,
      teachingNote: "Obstructive shock：靜脈回流受阻 → 前負荷下降 → CO 降低 → 低血壓。",
    },
  ],
  postop_af: [
    {
      area: "心律",
      emoji: "🫀",
      finding: "心跳不規律（心房顫動）",
      isAbnormal: true,
      teachingNote:
        "術後 AF（POAF）最常見於術後 2-3 天。觸發因素：電解質不平衡（K⁺、Mg²⁺）、交感神經亢奮、手術刺激。",
    },
    {
      area: "血壓",
      emoji: "📉",
      finding: "血壓偏低或波動大",
      isAbnormal: true,
      teachingNote: "AF 失去心房收縮 → 心輸出量下降約 20-30%。若原本心功能差，影響更大。",
    },
    {
      area: "四肢",
      emoji: "🦵",
      finding: "四肢末梢灌流尚可",
      isAbnormal: false,
      teachingNote: "POAF 通常不立即導致嚴重灌流不足，但需監測。若合併低血壓則需積極處置。",
    },
    {
      area: "肺部",
      emoji: "🫁",
      finding: "呼吸音清（或輕微濕囉音）",
      isAbnormal: false,
      teachingNote: "評估肺水腫跡象：若合併 LCOS，則可能有 rales。單純 POAF 肺部通常清。",
    },
  ],
  coagulopathy: [
    {
      area: "傷口",
      emoji: "🩹",
      finding: "胸管引流血色持續、不易止血",
      isAbnormal: true,
      teachingNote:
        "Coagulopathy：凝血因子不足 → 無法有效止血。看 CT 引流顏色（鮮紅 = arterial，暗紅 = venous）+ 量。",
    },
    {
      area: "皮膚",
      emoji: "🌡️",
      finding: "可能有瘀斑（Ecchymosis）或穿刺點滲血",
      isAbnormal: true,
      teachingNote: "Coagulopathy 的全身表現：穿刺點、靜脈留置針周圍滲血。Lethal Triad: 低體溫+酸中毒+凝血障礙。",
    },
    {
      area: "體溫",
      emoji: "🌡️",
      finding: "體溫偏低（< 36°C）",
      isAbnormal: true,
      teachingNote: "低體溫抑制凝血酶活性 → 加重凝血障礙。Lethal Triad 之一，積極復溫是治療重點。",
    },
    {
      area: "四肢",
      emoji: "🦵",
      finding: "末梢冰冷（低體溫 + 低血容）",
      isAbnormal: true,
      teachingNote: "低體溫 + 低血容 → 末梢血管收縮 → 四肢冰冷。需要積極補充血品 + 復溫。",
    },
  ],
  default: [
    {
      area: "整體外觀",
      emoji: "🧍",
      finding: "病人清醒、稍微焦躁",
      isAbnormal: false,
      teachingNote: "術後病人焦躁可能代表疼痛、缺氧、或血流動力學不穩定。需要系統性評估 ABC。",
    },
    {
      area: "四肢",
      emoji: "🦵",
      finding: "末梢灌流可，微溫",
      isAbnormal: false,
      teachingNote: "末梢灌流評估：CRT（毛細管充血時間）< 2 秒為正常。溫度、顏色、脈搏是基本評估三項。",
    },
    {
      area: "胸部",
      emoji: "🫁",
      finding: "雙側呼吸音清、對稱",
      isAbnormal: false,
      teachingNote: "對稱性呼吸音是基礎。不對稱 → 考慮 pneumothorax、pleural effusion、endobronchial intubation。",
    },
    {
      area: "傷口",
      emoji: "🩹",
      finding: "胸管引流量正常（< 50 cc/hr）、顏色偏暗",
      isAbnormal: false,
      teachingNote: "術後早期引流量偏多屬正常，需注意顏色（鮮紅 = 動脈出血）和趨勢（是否越來越多）。",
    },
  ],
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function getItemsForPathology(pathology: string | undefined): PEItem[] {
  if (!pathology) return PE_ITEMS_BY_PATHOLOGY.default;
  const key = pathology as PathologyKey;
  return PE_ITEMS_BY_PATHOLOGY[key] ?? PE_ITEMS_BY_PATHOLOGY.default;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function StandardPEModal() {
  const activeModal = useProGameStore((s) => s.activeModal);
  const closeModal = useProGameStore((s) => s.closeModal);
  const scenario = useProGameStore((s) => s.scenario);

  const [revealed, setRevealed] = useState<Set<number>>(new Set());

  if (activeModal !== "pe") return null;

  const items = getItemsForPathology(scenario?.pathology);

  function handleReveal(idx: number) {
    setRevealed((prev) => {
      const next = new Set(prev);
      next.has(idx) ? next.delete(idx) : next.add(idx);
      return next;
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0"
        style={{ backgroundColor: "rgba(0,0,0,0.72)" }}
        onClick={closeModal}
      />
      <div
        className="relative w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        style={{ backgroundColor: "#0a1929" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🩺</span>
            <div>
              <h2 className="text-white font-bold text-base leading-tight">
                理學檢查
              </h2>
              <p className="text-gray-400 text-xs mt-0.5">
                點擊卡片查看 finding
              </p>
            </div>
          </div>
          <button
            onClick={closeModal}
            className="text-gray-500 hover:text-white transition-colors text-xl leading-none"
            aria-label="關閉"
          >
            ✕
          </button>
        </div>

        {/* PE cards */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {items.map((item, idx) => {
            const isRevealed = revealed.has(idx);
            return (
              <button
                key={idx}
                onClick={() => handleReveal(idx)}
                className="w-full text-left rounded-xl border transition-all focus:outline-none"
                style={{
                  backgroundColor: isRevealed
                    ? item.isAbnormal
                      ? "rgba(239,68,68,0.08)"
                      : "rgba(34,197,94,0.08)"
                    : "rgba(255,255,255,0.03)",
                  borderColor: isRevealed
                    ? item.isAbnormal
                      ? "rgba(239,68,68,0.35)"
                      : "rgba(34,197,94,0.35)"
                    : "rgba(255,255,255,0.08)",
                }}
              >
                {/* Card top row */}
                <div className="flex items-center gap-3 px-4 py-3">
                  <span className="text-2xl flex-shrink-0">{item.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-300 text-sm font-semibold">
                      {item.area}
                    </p>
                    {!isRevealed && (
                      <p className="text-gray-600 text-xs mt-0.5">
                        點擊檢查
                      </p>
                    )}
                  </div>
                  {isRevealed ? (
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${
                        item.isAbnormal
                          ? "bg-red-900/40 text-red-400 border border-red-700/40"
                          : "bg-green-900/40 text-green-400 border border-green-700/40"
                      }`}
                    >
                      {item.isAbnormal ? "異常" : "正常"}
                    </span>
                  ) : (
                    <span className="text-gray-600 text-sm">▸</span>
                  )}
                </div>

                {/* Revealed content */}
                {isRevealed && (
                  <div className="px-4 pb-4 space-y-2 border-t border-white/5 pt-3">
                    {/* Finding */}
                    <p
                      className={`text-sm font-medium leading-snug ${
                        item.isAbnormal ? "text-red-300" : "text-green-300"
                      }`}
                    >
                      {item.finding}
                    </p>
                    {/* Teaching note */}
                    <div
                      className="rounded-lg px-3 py-2"
                      style={{ backgroundColor: "rgba(255,255,255,0.04)" }}
                    >
                      <p className="text-xs text-yellow-400/80 font-semibold mb-0.5">
                        💡 教學筆記
                      </p>
                      <p className="text-gray-400 text-xs leading-relaxed">
                        {item.teachingNote}
                      </p>
                    </div>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="border-t border-white/10 px-5 py-3 flex items-center justify-between">
          <span className="text-gray-600 text-xs">
            {revealed.size} / {items.length} 已檢查
          </span>
          <button
            onClick={closeModal}
            className="text-amber-400 hover:text-amber-300 text-xs font-medium transition-colors"
          >
            完成 →
          </button>
        </div>
      </div>
    </div>
  );
}
