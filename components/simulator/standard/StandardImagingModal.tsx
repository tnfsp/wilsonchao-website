"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { useProGameStore } from "@/lib/simulator/store";

// ── Imaging findings per pathology ────────────────────────────────────────────

interface ImagingFinding {
  key: string;
  label: string;
  isAbnormal: boolean;
  teachingNote: string;
}

interface ImagingOption {
  id: "cxr" | "pocus";
  icon: string;
  name: string;
  subtitle: string;
  findings: Record<string, ImagingFinding[]>;
}

// Pathology → CXR findings
const CXR_FINDINGS: Record<string, ImagingFinding[]> = {
  cardiac_tamponade: [
    {
      key: "heart_size",
      label: "心影擴大（Cardiothoracic ratio > 0.5）",
      isAbnormal: true,
      teachingNote:
        "心包積液 → 心影外輪廓擴大，呈「水瓶心」（water-bottle heart）形狀。急性 tamponade 可能 CT ratio 仍正常（積液量快速，心包尚未撐開）。",
    },
    {
      key: "lungs",
      label: "肺野清晰（無肺水腫）",
      isAbnormal: false,
      teachingNote:
        "Tamponade 初期肺野通常清晰。若出現肺水腫，需考慮合併 LCOS 或 pulmonary edema 成分。",
    },
    {
      key: "mediastinum",
      label: "縱膈腔無明顯增寬",
      isAbnormal: false,
      teachingNote: "排除 aortic dissection（縱膈腔增寬 > 8 cm）是鑑別診斷重點。Tamponade 縱膈腔通常不寬。",
    },
  ],
  tamponade: [
    {
      key: "heart_size",
      label: "心影擴大（Cardiothoracic ratio > 0.5）",
      isAbnormal: true,
      teachingNote:
        "心包積液 → 心影外輪廓擴大，呈「水瓶心」形狀。急性積液可能 CXR 尚未反映。",
    },
    {
      key: "lungs",
      label: "肺野清晰",
      isAbnormal: false,
      teachingNote: "Tamponade 初期肺野清晰，這與 LHF（左心衰）導致的雙側浸潤不同。",
    },
  ],
  surgical_bleeding: [
    {
      key: "hemothorax",
      label: "右側/左側胸腔陰影（Hemothorax 疑慮）",
      isAbnormal: true,
      teachingNote:
        "術後出血可積聚在胸腔（尤其在引流不通暢時）→ 胸部 X 光可見患側不透明。大量積血可見縱膈腔偏移。",
    },
    {
      key: "tubes",
      label: "各導管位置正常（氣管插管、中央靜脈、胸管）",
      isAbnormal: false,
      teachingNote: "術後常規確認管路位置：氣管插管末端在隆突上 3-5 cm，中央靜脈在上腔靜脈，胸管走向正確。",
    },
    {
      key: "lungs",
      label: "雙肺輕度浸潤（術後常見）",
      isAbnormal: false,
      teachingNote: "術後早期雙側輕度浸潤常見（atelectasis、肺水腫）。若快速惡化，考慮 ARDS 或吸入性肺炎。",
    },
  ],
  lcos: [
    {
      key: "cardiomegaly",
      label: "心影擴大（Cardiomegaly）",
      isAbnormal: true,
      teachingNote: "心室擴大（LCOS 成因之一）→ CXR 上心影增大。CTR > 0.5 定義為心臟擴大。",
    },
    {
      key: "pulmonary_edema",
      label: "雙側浸潤（Pulmonary Edema）",
      isAbnormal: true,
      teachingNote:
        "左心輸出量下降 → LVEDP 上升 → 肺靜脈壓升高 → 肺水腫。Kerley B lines + bilateral infiltrates 是典型表現。",
    },
    {
      key: "pleural_effusion",
      label: "雙側肋膜積液（Pleural Effusion）",
      isAbnormal: true,
      teachingNote: "心衰 → 肋膜液積聚，尤其右側。雙側積液常見於 CCF（充血性心衰）。",
    },
  ],
  vasoplegia: [
    {
      key: "lungs",
      label: "肺野相對清晰",
      isAbnormal: false,
      teachingNote: "Vasoplegia 早期肺野通常無大量積液。若合併過量補液，可能出現肺水腫。",
    },
    {
      key: "heart_size",
      label: "心影正常大小",
      isAbnormal: false,
      teachingNote: "Vasoplegia 以低阻力為主，心臟本身可能功能正常。CXR 主要用於排除其他病因。",
    },
  ],
  septic_shock: [
    {
      key: "infiltrates",
      label: "雙側瀰漫性浸潤（ARDS 早期表現）",
      isAbnormal: true,
      teachingNote:
        "Sepsis-induced ARDS：系統性炎症 → 肺微血管通透性增加 → 雙側浸潤。Berlin definition：PaO₂/FiO₂ < 300。",
    },
    {
      key: "pleural_effusion",
      label: "可能有胸腔積液（感染性）",
      isAbnormal: true,
      teachingNote: "Sepsis 可伴隨肋膜積液（sympathetic effusion 或膿胸）。需鑑別 transudates vs exudates。",
    },
  ],
  tension_pneumothorax: [
    {
      key: "ptx",
      label: "患側肺塌陷、無肺紋（Pneumothorax）",
      isAbnormal: true,
      teachingNote:
        "Tension PTX 的 CXR 特徵：患側無肺紋 + 肺邊界清晰 + 氣管向對側偏移 + 患側橫膈下壓。但 Tension PTX 是臨床診斷，不應等 CXR！",
    },
    {
      key: "trachea",
      label: "氣管向對側偏移",
      isAbnormal: true,
      teachingNote: "縱膈腔被高壓推向對側 → 氣管偏移。這是 Tension PTX 的危急表現，需立即針刺減壓。",
    },
  ],
  postop_af: [
    {
      key: "heart_size",
      label: "心影輕度擴大",
      isAbnormal: true,
      teachingNote: "AF 患者常有心房擴大，CXR 上心影可能偏大。原發性 POAF 通常 CXR 無急性變化。",
    },
    {
      key: "lungs",
      label: "肺野無急性變化",
      isAbnormal: false,
      teachingNote: "單純 POAF 肺野通常清晰。若有肺水腫，代表 AF 合併血流動力學惡化需積極處置。",
    },
  ],
  default: [
    {
      key: "lungs",
      label: "雙側肺野輕度浸潤（術後 atelectasis）",
      isAbnormal: true,
      teachingNote: "術後 atelectasis 極常見，尤其下葉。鼓勵深呼吸、物理治療可改善。",
    },
    {
      key: "tubes",
      label: "管路位置正常",
      isAbnormal: false,
      teachingNote: "術後常規確認所有管路位置。",
    },
  ],
};

// Pathology → POCUS findings
const POCUS_FINDINGS: Record<string, ImagingFinding[]> = {
  cardiac_tamponade: [
    {
      key: "pericardial_effusion",
      label: "心包積液（Pericardial Effusion）",
      isAbnormal: true,
      teachingNote:
        "超音波可見心臟周圍無回音區（anechoic space）。積液量評估：< 1 cm 輕度，1-2 cm 中度，> 2 cm 大量。",
    },
    {
      key: "rv_collapse",
      label: "右房/右室舒張期塌陷（RA/RV Diastolic Collapse）",
      isAbnormal: true,
      teachingNote:
        "心包壓力超過右心腔壓力 → 右房、右室在舒張期出現塌陷（collapse）。這是心包填塞的特異性超音波徵象。",
    },
    {
      key: "ivc",
      label: "IVC 擴張無塌陷（IVC Plethora）",
      isAbnormal: true,
      teachingNote:
        "靜脈回流受阻 → IVC 擴張 > 2.1 cm 且呼吸變化 < 50%。代表 CVP 升高、靜脈淤鬱。",
    },
    {
      key: "swinging_heart",
      label: "心臟搖擺（Swinging Heart）",
      isAbnormal: true,
      teachingNote:
        "大量積液時，心臟在心包內「搖擺」。ECG 電交替（electrical alternans）的超音波對應表現。",
    },
  ],
  tamponade: [
    {
      key: "pericardial_effusion",
      label: "心包積液可見",
      isAbnormal: true,
      teachingNote: "超音波是 tamponade 最重要的診斷工具。積液位置、量、RA/RV collapse 是關鍵評估。",
    },
    {
      key: "rv_collapse",
      label: "右室舒張期塌陷",
      isAbnormal: true,
      teachingNote: "RV diastolic collapse 是 tamponade 最敏感的超音波徵象。",
    },
    {
      key: "ivc",
      label: "IVC 擴張無塌陷",
      isAbnormal: true,
      teachingNote: "CVP 升高 → IVC plethora。呼吸變化 < 50% 代表靜脈壓高。",
    },
  ],
  surgical_bleeding: [
    {
      key: "cardiac",
      label: "心臟收縮正常（EF 尚可）",
      isAbnormal: false,
      teachingNote: "出血性休克初期心功能可正常（代償期）。若 EF 下降，需考慮合併心肌缺血。",
    },
    {
      key: "ivc",
      label: "IVC 塌陷（IVC Collapse > 50%）",
      isAbnormal: true,
      teachingNote:
        "低血容（hypovolemia）→ IVC 細小、呼吸變化大（> 50%）。是補液反應（fluid responsiveness）的預測因子。",
    },
    {
      key: "hemothorax",
      label: "胸腔積液（Hemothorax）",
      isAbnormal: true,
      teachingNote: "超音波可偵測到胸腔積血（非常敏感）。FAST exam 的一部分。",
    },
  ],
  lcos: [
    {
      key: "ef",
      label: "左心室收縮功能下降（EF < 40%）",
      isAbnormal: true,
      teachingNote:
        "LCOS 的超音波表現：LV 功能受損 → EF 下降（< 40% 為中度、< 30% 為重度）。術後 LCOS 常見於 EF 術前已低的患者。",
    },
    {
      key: "lv_dilation",
      label: "左心室擴大（LV Dilation）",
      isAbnormal: true,
      teachingNote: "慢性或急性心衰 → LV 擴大 → 球形化（spherical remodeling）。LVEDV 增加。",
    },
    {
      key: "ivc",
      label: "IVC 擴張（CVP 高）",
      isAbnormal: true,
      teachingNote: "心衰 → 靜脈回流受阻 → IVC 擴張。右心壓力升高的表現。",
    },
  ],
  vasoplegia: [
    {
      key: "ef",
      label: "左心室收縮良好（Hyperdynamic）",
      isAbnormal: false,
      teachingNote:
        "Vasoplegia 的超音波特徵：心臟超動態收縮（hyperdynamic，EF > 70%）。低 SVR 導致大量心搏出量，但血壓仍低（因阻力太低）。",
    },
    {
      key: "ivc",
      label: "IVC 偏小、塌陷明顯",
      isAbnormal: true,
      teachingNote: "SVR 極低 → 血液分布在末梢 → 有效循環血量相對不足 → IVC 偏細。",
    },
  ],
  septic_shock: [
    {
      key: "ef",
      label: "心功能可能下降（Septic Cardiomyopathy）",
      isAbnormal: true,
      teachingNote:
        "Sepsis-induced cardiomyopathy：約 40% septic shock 有 LV 功能下降。通常可逆，治療原發感染後多可恢復。",
    },
    {
      key: "ivc",
      label: "IVC 評估：早期塌陷（低血容）→ 後期擴張（液體過量）",
      isAbnormal: true,
      teachingNote:
        "Septic shock 液體治療：IVC 塌陷代表仍需補液（fluid responsive）；IVC 擴張則需小心避免過量。動態評估更重要。",
    },
  ],
  tension_pneumothorax: [
    {
      key: "lung_sliding",
      label: "患側肺滑動消失（No Lung Sliding）",
      isAbnormal: true,
      teachingNote:
        "正常肺滑動（lung sliding）在超音波下可見。PTX → 胸壁與臟層肋膜分離 → 肺滑動消失。M-mode：沙灘徵消失（stratosphere sign）。",
    },
    {
      key: "b_lines",
      label: "患側無 B-lines",
      isAbnormal: true,
      teachingNote:
        "B-lines（彗星尾 comet tail artifacts）代表肺與胸壁接觸正常。PTX 時 B-lines 消失。對側通常有正常 B-lines。",
    },
  ],
  postop_af: [
    {
      key: "ef",
      label: "心室收縮功能中等",
      isAbnormal: false,
      teachingNote: "POAF 通常無急性 EF 下降。評估心室功能以排除 LCOS 合併症。",
    },
    {
      key: "ivc",
      label: "IVC 輕度擴張",
      isAbnormal: true,
      teachingNote: "AF → 心輸出量下降約 20-30% → 靜脈稍微淤鬱 → IVC 輕度擴張。",
    },
  ],
  default: [
    {
      key: "cardiac",
      label: "心室收縮尚可（EF 保留）",
      isAbnormal: false,
      teachingNote: "基礎評估：估算 EF、左右心腔大小、室壁運動。",
    },
    {
      key: "ivc",
      label: "IVC 正常（1.5-2.1 cm，呼吸變化 20-50%）",
      isAbnormal: false,
      teachingNote: "正常 IVC 大小 1.5-2.1 cm，吸氣時塌陷 20-50%，代表 CVP 約 8-10 mmHg。",
    },
  ],
};

const IMAGING_OPTIONS: ImagingOption[] = [
  {
    id: "cxr",
    icon: "🩻",
    name: "Portable CXR",
    subtitle: "床邊胸部 X 光",
    findings: CXR_FINDINGS,
  },
  {
    id: "pocus",
    icon: "📱",
    name: "POCUS",
    subtitle: "床邊即時超音波（心臟 A4C + IVC）",
    findings: POCUS_FINDINGS,
  },
];

// ── Real image/video assets per pathology ─────────────────────────────────────

const CXR_IMAGES: Record<string, { src: string; alt: string; attribution: string }> = {
  cardiac_tamponade: {
    src: "/assets/cxr/cardiac-tamponade/water-bottle-sign.png",
    alt: "Water-bottle sign — 心包積液典型 CXR",
    attribution: "Wikimedia Commons, CC-BY-SA 4.0",
  },
  tamponade: {
    src: "/assets/cxr/cardiac-tamponade/water-bottle-sign.png",
    alt: "Water-bottle sign — 心包積液典型 CXR",
    attribution: "Wikimedia Commons, CC-BY-SA 4.0",
  },
  lcos: {
    src: "/assets/cxr/cardiogenic-shock/pulmonary-edema.png",
    alt: "Pulmonary edema — 心因性肺水腫 CXR",
    attribution: "Wikimedia Commons, CC-BY-SA 3.0",
  },
  septic_shock: {
    src: "/assets/cxr/cardiogenic-shock/pulmonary-edema.png",
    alt: "Bilateral infiltrates — ARDS/Sepsis 相關肺浸潤",
    attribution: "Wikimedia Commons, CC-BY-SA 3.0",
  },
};

interface EchoClip {
  src: string;
  label: string;
}

const ECHO_VIDEOS: Record<string, EchoClip[]> = {
  cardiac_tamponade: [
    { src: "/assets/echo/cardiac-tamponade/a4c.mp4", label: "A4C — 心包積液" },
    { src: "/assets/echo/cardiac-tamponade/plax.mp4", label: "PLAX — 心包積液" },
    { src: "/assets/echo/cardiac-tamponade/psax.mp4", label: "PSAX" },
    { src: "/assets/echo/cardiac-tamponade/subcostal.mp4", label: "Subcostal" },
    { src: "/assets/echo/cardiac-tamponade/ivc.mp4", label: "IVC — 擴張無塌陷" },
    { src: "/assets/echo/cardiac-tamponade/posterior.mp4", label: "Posterior effusion" },
  ],
  tamponade: [
    { src: "/assets/echo/cardiac-tamponade/a4c.mp4", label: "A4C — 心包積液" },
    { src: "/assets/echo/cardiac-tamponade/subcostal.mp4", label: "Subcostal" },
    { src: "/assets/echo/cardiac-tamponade/ivc.mp4", label: "IVC — 擴張無塌陷" },
  ],
  surgical_bleeding: [
    { src: "/assets/echo/hypovolemia/ivc-long.mp4", label: "IVC Long Axis — 塌陷（低血容）" },
    { src: "/assets/echo/hypovolemia/ivc-trans.mp4", label: "IVC Trans — 呼吸變化明顯" },
  ],
  septic_shock: [
    { src: "/assets/echo/lung-b-lines/b-lines.mp4", label: "Lung B-lines — 肺水腫/ARDS" },
    { src: "/assets/echo/lung-b-lines/confluent-b-lines.mp4", label: "Confluent B-lines — 嚴重肺浸潤" },
  ],
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function StandardImagingModal() {
  const activeModal = useProGameStore((s) => s.activeModal);
  const closeModal = useProGameStore((s) => s.closeModal);
  const scenario = useProGameStore((s) => s.scenario);

  // For each imaging type: null = not ordered, "pending" = loading, "revealed" = showing
  const [imagingState, setImagingState] = useState<
    Record<string, "idle" | "pending" | "revealed">
  >({});
  const [revealedFindings, setRevealedFindings] = useState<
    Record<string, Set<number>>
  >({});

  if (activeModal !== "imaging") return null;

  const pathology = scenario?.pathology ?? "default";

  function handleOrder(id: string) {
    if (imagingState[id] && imagingState[id] !== "idle") return;
    setImagingState((prev) => ({ ...prev, [id]: "pending" }));
    setTimeout(() => {
      setImagingState((prev) => ({ ...prev, [id]: "revealed" }));
      setRevealedFindings((prev) => ({ ...prev, [id]: new Set() }));
    }, 600);
  }

  function handleToggleFinding(imagingId: string, idx: number) {
    setRevealedFindings((prev) => {
      const existing = new Set(prev[imagingId] ?? []);
      existing.has(idx) ? existing.delete(idx) : existing.add(idx);
      return { ...prev, [imagingId]: existing };
    });
  }

  function getFindingsForOption(opt: ImagingOption): ImagingFinding[] {
    return opt.findings[pathology] ?? opt.findings["default"] ?? [];
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0"
        style={{ backgroundColor: "rgba(0,0,0,0.72)" }}
        onClick={closeModal}
      />
      <div
        className="relative w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[85vh] sm:max-h-[90vh]"
        style={{ backgroundColor: "#0a1929" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🩻</span>
            <div>
              <h2 className="text-white font-bold text-base leading-tight">
                影像檢查
              </h2>
              <p className="text-gray-400 text-xs mt-0.5">
                選擇影像 → 查看結果
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {IMAGING_OPTIONS.map((opt) => {
            const state = imagingState[opt.id] ?? "idle";
            const findings = getFindingsForOption(opt);
            const revealed = revealedFindings[opt.id] ?? new Set<number>();

            return (
              <div
                key={opt.id}
                className="rounded-xl border border-white/8 overflow-hidden"
                style={{ backgroundColor: "rgba(255,255,255,0.02)" }}
              >
                {/* Option header */}
                <div className="flex items-center gap-3 px-4 py-3 border-b border-white/8">
                  <span className="text-2xl">{opt.icon}</span>
                  <div className="flex-1">
                    <p className="text-white font-semibold text-sm">{opt.name}</p>
                    <p className="text-gray-500 text-xs">{opt.subtitle}</p>
                  </div>
                  {state === "idle" && (
                    <button
                      onClick={() => handleOrder(opt.id)}
                      className="text-xs px-3 py-1.5 rounded-lg bg-amber-600/80 hover:bg-amber-500 text-white font-medium transition-colors flex-shrink-0"
                    >
                      開單
                    </button>
                  )}
                  {state === "pending" && (
                    <span className="text-xs text-amber-400/70 animate-pulse flex-shrink-0">
                      ⏳ 處理中...
                    </span>
                  )}
                  {state === "revealed" && (
                    <span className="text-xs text-green-400/80 flex-shrink-0">
                      ✓ 結果已回
                    </span>
                  )}
                </div>

                {/* Findings */}
                {state === "revealed" && (
                  <div className="px-4 py-3 space-y-2">
                    {/* Real CXR image */}
                    {opt.id === "cxr" && CXR_IMAGES[pathology] && (
                      <div className="mb-3 rounded-lg overflow-hidden border border-white/10">
                        <Image
                          src={CXR_IMAGES[pathology].src}
                          alt={CXR_IMAGES[pathology].alt}
                          width={400}
                          height={400}
                          className="w-full h-auto"
                          style={{ filter: "brightness(1.1)" }}
                        />
                        <p className="text-gray-600 text-[10px] px-2 py-1 bg-black/40">
                          📷 {CXR_IMAGES[pathology].attribution}
                        </p>
                      </div>
                    )}

                    {/* Real Echo videos */}
                    {opt.id === "pocus" && ECHO_VIDEOS[pathology] && (
                      <div className="mb-3 space-y-2">
                        {ECHO_VIDEOS[pathology].map((clip, ci) => (
                          <div key={ci} className="rounded-lg overflow-hidden border border-white/10">
                            <video
                              src={clip.src}
                              autoPlay
                              loop
                              muted
                              playsInline
                              className="w-full h-auto"
                            />
                            <p className="text-gray-400 text-xs px-2 py-1 bg-black/40">
                              🎬 {clip.label}
                            </p>
                          </div>
                        ))}
                        <p className="text-gray-600 text-[10px]">
                          📷 LITFL ECG Library, CC-BY-NC-SA 4.0
                        </p>
                      </div>
                    )}

                    <p className="text-gray-500 text-xs uppercase tracking-widest mb-2">
                      點擊項目查看詳細
                    </p>
                    {findings.map((finding, idx) => {
                      const isRevealed = revealed.has(idx);
                      return (
                        <button
                          key={idx}
                          onClick={() => handleToggleFinding(opt.id, idx)}
                          className="w-full text-left rounded-lg border px-3 py-2.5 transition-all focus:outline-none"
                          style={{
                            backgroundColor: isRevealed
                              ? finding.isAbnormal
                                ? "rgba(239,68,68,0.07)"
                                : "rgba(34,197,94,0.07)"
                              : "rgba(255,255,255,0.03)",
                            borderColor: isRevealed
                              ? finding.isAbnormal
                                ? "rgba(239,68,68,0.30)"
                                : "rgba(34,197,94,0.30)"
                              : "rgba(255,255,255,0.07)",
                          }}
                        >
                          <div className="flex items-start gap-2">
                            <span
                              className={`text-xs mt-0.5 flex-shrink-0 ${
                                finding.isAbnormal
                                  ? "text-red-400"
                                  : "text-green-400"
                              }`}
                            >
                              {finding.isAbnormal ? "⚠" : "✓"}
                            </span>
                            <p
                              className={`text-sm font-medium flex-1 leading-snug ${
                                isRevealed
                                  ? finding.isAbnormal
                                    ? "text-red-300"
                                    : "text-green-300"
                                  : "text-gray-300"
                              }`}
                            >
                              {finding.label}
                            </p>
                            <span className="text-gray-600 text-xs flex-shrink-0">
                              {isRevealed ? "▾" : "▸"}
                            </span>
                          </div>

                          {/* Teaching note */}
                          {isRevealed && (
                            <div
                              className="mt-2 rounded-lg px-3 py-2 border border-white/5"
                              style={{ backgroundColor: "rgba(255,255,255,0.04)" }}
                            >
                              <p className="text-xs text-yellow-400/80 font-semibold mb-0.5">
                                💡 教學筆記
                              </p>
                              <p className="text-gray-400 text-xs leading-relaxed">
                                {finding.teachingNote}
                              </p>
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Idle prompt */}
                {state === "idle" && (
                  <div className="px-4 py-3">
                    <p className="text-gray-600 text-xs">
                      點擊「開單」查看影像結果與教學注解。
                    </p>
                  </div>
                )}
              </div>
            );
          })}

          {/* General teaching note */}
          <div
            className="rounded-xl border border-white/6 px-4 py-3"
            style={{ backgroundColor: "rgba(255,255,255,0.02)" }}
          >
            <p className="text-gray-600 text-xs leading-relaxed">
              💡 <strong className="text-gray-500">影像檢查提示：</strong>
              POCUS 是急性血流動力學評估最快速的工具（即時）。
              Portable CXR 提供全面肺部評估，但結果較慢。
              兩者互補，而非取代臨床判斷。
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-white/10 px-5 py-3 flex items-center justify-between">
          <span className="text-gray-600 text-xs">
            {Object.values(imagingState).filter((s) => s === "revealed").length} /{" "}
            {IMAGING_OPTIONS.length} 項已完成
          </span>
          <button
            onClick={closeModal}
            className="text-amber-400 hover:text-amber-300 text-xs font-medium transition-colors"
          >
            關閉 →
          </button>
        </div>
      </div>
    </div>
  );
}
