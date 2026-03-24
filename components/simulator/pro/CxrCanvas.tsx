"use client";

/**
 * CxrCanvas — Schematic-style Chest X-Ray Canvas Renderer
 *
 * Teaching/illustration style (NOT photo-realistic).
 * Dark background matching ICU simulator teal-on-dark theme.
 *
 * Draws:
 * - Thorax outline (ribcage)
 * - Heart silhouette (CT ratio adjustable)
 * - Lung fields (clear / opacified)
 * - Mediastinum (widened for tamponade)
 * - Costophrenic angles (sharp vs blunted)
 * - Diaphragm domes (with subtle breathing animation)
 * - Sternotomy wires (postop)
 * - ET tube (if intubated)
 * - Mediastinal drain (postop)
 * - Annotations for key findings
 */

import { useRef, useEffect, useCallback } from "react";
import type { CXRType } from "@/lib/simulator/engine/cxr-selector";

// ── Types ─────────────────────────────────────────────────────

export interface CxrCanvasProps {
  cxrType: CXRType;
  severity?: number;           // 0-1, affects how dramatic the finding looks
  width?: number;
  height?: number;
  animated?: boolean;
  affectedSide?: "left" | "right" | "bilateral";
  isIntubated?: boolean;       // show ET tube
  isPostop?: boolean;          // show sternotomy wires + drain
  showAnnotations?: boolean;   // show key finding labels
}

// ── Color palette ─────────────────────────────────────────────

const COLORS = {
  bg: "#001219",
  bgAlt: "#001a27",
  bone: "rgba(200, 220, 235, 0.85)",
  boneDim: "rgba(160, 185, 210, 0.55)",
  boneFaint: "rgba(140, 170, 200, 0.30)",
  lung: "rgba(20, 60, 80, 0.60)",
  lungClear: "rgba(10, 40, 60, 0.70)",
  heart: "rgba(180, 210, 230, 0.55)",
  heartBorder: "rgba(200, 225, 240, 0.70)",
  opacity: "rgba(200, 210, 220, 0.75)",  // opacified region (white-out)
  fluid: "rgba(150, 180, 210, 0.60)",
  infiltrate: "rgba(170, 200, 220, 0.45)",
  tube: "rgba(240, 240, 200, 0.80)",
  wire: "rgba(255, 240, 180, 0.75)",
  drain: "rgba(180, 220, 200, 0.60)",
  annotation: "rgba(100, 230, 200, 0.90)",
  annotationDim: "rgba(80, 200, 170, 0.60)",
  trachea: "rgba(180, 210, 230, 0.65)",
  diaphragm: "rgba(190, 215, 230, 0.70)",
  rib: "rgba(160, 195, 220, 0.40)",
  ribHighlight: "rgba(200, 225, 240, 0.25)",
};

// ── Helper ────────────────────────────────────────────────────

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * Math.max(0, Math.min(1, t));
}

// ── Main drawing function ─────────────────────────────────────

function drawCXR(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  props: Required<CxrCanvasProps> & { time: number }
) {
  const {
    cxrType,
    severity,
    affectedSide,
    isIntubated,
    isPostop,
    showAnnotations,
    time,
  } = props;

  // ── Layout constants ────────────────────────────────────────
  const cx = W / 2;
  const topY = H * 0.06;     // top of thorax (shoulders)
  const botY = H * 0.88;     // bottom (costophrenic angle / diaphragm)
  const thoraxW = W * 0.80;  // thorax width
  const midX = cx;

  // Lung field boundaries
  const lLungX = cx - thoraxW * 0.07;  // right edge of left lung (mediastinal side)
  const rLungX = cx + thoraxW * 0.07;  // left edge of right lung
  const lLungOuter = cx - thoraxW * 0.47;
  const rLungOuter = cx + thoraxW * 0.47;
  const lungTop = H * 0.12;
  const lungBot = H * 0.78;

  // Diaphragm baseline (breathing animation)
  const breathAmp = 4;
  const breathPhase = Math.sin(time * 1.4);
  const diagY = lungBot + breathAmp * breathPhase;
  const lDiagPeak = diagY - H * 0.04;
  const rDiagPeak = diagY - H * 0.035;  // right slightly higher (liver)

  // Heart dimensions (affected by cxrType)
  let ctRatio = 0.45;  // default cardiothoracic ratio
  let mediasWidth = thoraxW * 0.14; // mediastinum width
  if (cxrType === "widened_mediastinum") {
    ctRatio = lerp(0.45, 0.65, severity);
    mediasWidth = thoraxW * lerp(0.14, 0.28, severity);
  }
  const heartW = thoraxW * ctRatio;
  const heartH = H * 0.35;
  const heartTop = H * 0.20;
  const heartBot = heartTop + heartH;
  const heartCx = cx + thoraxW * 0.02; // slightly right of center

  // ── 1. Background ────────────────────────────────────────────
  ctx.fillStyle = COLORS.bg;
  ctx.fillRect(0, 0, W, H);

  // Subtle vignette
  const vig = ctx.createRadialGradient(cx, H * 0.5, H * 0.1, cx, H * 0.5, H * 0.75);
  vig.addColorStop(0, "rgba(0,0,0,0)");
  vig.addColorStop(1, "rgba(0,0,0,0.45)");
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, W, H);

  // ── 2. Lung fields ───────────────────────────────────────────
  drawLungFields(ctx, {
    cxrType, severity, affectedSide, time,
    lLungX, lLungOuter, rLungX, rLungOuter, lungTop, lungBot,
    diagY, lDiagPeak, rDiagPeak, W, H, midX,
  });

  // ── 3. Ribcage ──────────────────────────────────────────────
  drawRibcage(ctx, W, H, thoraxW, cx, topY, botY, lungTop, lungBot);

  // ── 4. Diaphragm domes ───────────────────────────────────────
  drawDiaphragm(ctx, {
    lLungOuter, rLungOuter, lLungX, rLungX,
    diagY, lDiagPeak, rDiagPeak, W, H,
  });

  // ── 5. Mediastinum / Trachea ─────────────────────────────────
  drawMediastinum(ctx, cx, topY, heartTop, mediasWidth, H, cxrType, severity, affectedSide);

  // ── 6. Heart silhouette ──────────────────────────────────────
  drawHeart(ctx, heartCx, heartTop, heartBot, heartW, cxrType, severity);

  // ── 7. Costophrenic angles ───────────────────────────────────
  drawCostophrenicAngles(ctx, {
    cxrType, severity, affectedSide,
    lLungOuter, rLungOuter, lLungX, rLungX,
    diagY, lDiagPeak, rDiagPeak, H,
  });

  // ── 8. Sternotomy wires ──────────────────────────────────────
  if (isPostop) {
    drawSternotomyWires(ctx, cx, heartTop, heartBot, thoraxW);
  }

  // ── 9. Mediastinal drain ─────────────────────────────────────
  if (isPostop) {
    drawMediastinalDrain(ctx, cx, heartBot, diagY);
  }

  // ── 10. ET tube ─────────────────────────────────────────────
  if (isIntubated) {
    drawETTube(ctx, cx, topY, heartTop, cxrType, mediasWidth);
  }

  // ── 11. Annotations ─────────────────────────────────────────
  if (showAnnotations) {
    drawAnnotations(ctx, {
      cxrType, severity, affectedSide, isIntubated, isPostop,
      lLungX, lLungOuter, rLungX, rLungOuter,
      lDiagPeak, rDiagPeak, diagY,
      heartCx, heartW, heartTop, heartBot,
      cx, W, H,
    });
  }

  // ── 12. CXR type label ───────────────────────────────────────
  drawTypeLabel(ctx, cxrType, W, H);
}

// ── Sub-drawers ───────────────────────────────────────────────

interface LungFieldParams {
  cxrType: CXRType;
  severity: number;
  affectedSide: "left" | "right" | "bilateral";
  time: number;
  lLungX: number;
  lLungOuter: number;
  rLungX: number;
  rLungOuter: number;
  lungTop: number;
  lungBot: number;
  diagY: number;
  lDiagPeak: number;
  rDiagPeak: number;
  W: number;
  H: number;
  midX: number;
}

function drawLungFields(ctx: CanvasRenderingContext2D, p: LungFieldParams) {
  const {
    cxrType, severity, affectedSide, time,
    lLungX, lLungOuter, rLungX, rLungOuter,
    lungTop, lungBot, diagY, lDiagPeak, rDiagPeak, W, H,
  } = p;

  const isLeftAffected = affectedSide === "left" || affectedSide === "bilateral";
  const isRightAffected = affectedSide === "right" || affectedSide === "bilateral";

  // ── Helper: draw one lung as a rounded path ──────────────────
  function lungPath(
    outerX: number, innerX: number,
    topY: number, botY: number,
    apexPeakY: number, isLeft: boolean
  ) {
    ctx.beginPath();
    if (isLeft) {
      // Left lung: right side is mediastinal
      ctx.moveTo(innerX, topY + (botY - topY) * 0.08);
      ctx.bezierCurveTo(
        innerX, topY,
        outerX + (innerX - outerX) * 0.3, apexPeakY,
        outerX + (innerX - outerX) * 0.1, apexPeakY
      );
      ctx.bezierCurveTo(
        outerX, apexPeakY,
        outerX, topY + (botY - topY) * 0.5,
        outerX, botY
      );
      ctx.lineTo(innerX, botY);
      ctx.closePath();
    } else {
      // Right lung: left side is mediastinal
      ctx.moveTo(innerX, topY + (botY - topY) * 0.08);
      ctx.bezierCurveTo(
        innerX, topY,
        outerX - (outerX - innerX) * 0.3, apexPeakY,
        outerX - (outerX - innerX) * 0.1, apexPeakY
      );
      ctx.bezierCurveTo(
        outerX, apexPeakY,
        outerX, topY + (botY - topY) * 0.5,
        outerX, botY
      );
      ctx.lineTo(innerX, botY);
      ctx.closePath();
    }
  }

  // ── Base lung fill (dark — "air") ─────────────────────────
  // Left lung
  ctx.save();
  lungPath(lLungOuter, lLungX, lungTop, lDiagPeak, lungTop - H * 0.01, true);
  ctx.fillStyle = COLORS.lungClear;
  ctx.fill();
  ctx.restore();

  // Right lung
  ctx.save();
  lungPath(rLungOuter, rLungX, lungTop, rDiagPeak, lungTop - H * 0.01, false);
  ctx.fillStyle = COLORS.lungClear;
  ctx.fill();
  ctx.restore();

  // ── Type-specific lung modifications ─────────────────────────

  switch (cxrType) {
    case "hemothorax": {
      const side = isLeftAffected ? "left" : "right";
      const sideOuter = side === "left" ? lLungOuter : rLungOuter;
      const sideInner = side === "left" ? lLungX : rLungX;
      const diagPeak = side === "left" ? lDiagPeak : rDiagPeak;
      const fluidTop = diagPeak - (diagPeak - lungTop) * Math.min(0.9, severity * 1.2);
      // Fluid layer from bottom up
      const grad = ctx.createLinearGradient(0, fluidTop, 0, diagPeak);
      grad.addColorStop(0, `rgba(180, 200, 220, ${0.1 + severity * 0.3})`);
      grad.addColorStop(0.6, `rgba(190, 210, 225, ${0.5 + severity * 0.3})`);
      grad.addColorStop(1, `rgba(200, 215, 230, ${0.7 + severity * 0.25})`);
      ctx.save();
      lungPath(sideOuter, sideInner, fluidTop, diagPeak, lungTop - H * 0.01, side === "left");
      ctx.fillStyle = grad;
      ctx.fill();
      // Meniscus line
      ctx.strokeStyle = `rgba(220, 235, 245, ${0.5 + severity * 0.4})`;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([]);
      ctx.beginPath();
      const mY = fluidTop + (diagPeak - fluidTop) * 0.1;
      if (side === "left") {
        ctx.moveTo(sideInner, mY + 5);
        ctx.bezierCurveTo(sideOuter * 0.4 + sideInner * 0.6, mY - 8, sideOuter * 0.7 + sideInner * 0.3, mY - 4, sideOuter, mY + 3);
      } else {
        ctx.moveTo(sideInner, mY + 5);
        ctx.bezierCurveTo(sideInner * 0.7 + sideOuter * 0.3, mY - 4, sideInner * 0.4 + sideOuter * 0.6, mY - 8, sideOuter, mY + 3);
      }
      ctx.stroke();
      ctx.restore();
      break;
    }

    case "pulmonary_edema": {
      // Bilateral perihilar "butterfly" — haziness emanating from hila
      const hCx = lLungX + (lLungOuter - lLungX) * 0.5;
      const hCy = lungTop + (lDiagPeak - lungTop) * 0.45;
      const rHCx = rLungX + (rLungOuter - rLungX) * 0.5;
      const rHCy = lungTop + (rDiagPeak - lungTop) * 0.45;

      const lGrad = ctx.createRadialGradient(hCx, hCy, 0, hCx, hCy, (lLungOuter - lLungX) * 0.9);
      lGrad.addColorStop(0, `rgba(200, 220, 235, ${0.55 + severity * 0.35})`);
      lGrad.addColorStop(0.5, `rgba(170, 200, 220, ${0.3 + severity * 0.2})`);
      lGrad.addColorStop(1, `rgba(140, 180, 210, ${0.05 + severity * 0.1})`);

      const rGrad = ctx.createRadialGradient(rHCx, rHCy, 0, rHCx, rHCy, (rLungOuter - rLungX) * 0.9);
      rGrad.addColorStop(0, `rgba(200, 220, 235, ${0.55 + severity * 0.35})`);
      rGrad.addColorStop(0.5, `rgba(170, 200, 220, ${0.3 + severity * 0.2})`);
      rGrad.addColorStop(1, `rgba(140, 180, 210, ${0.05 + severity * 0.1})`);

      ctx.save();
      // Left infiltrate
      lungPath(lLungOuter, lLungX, lungTop, lDiagPeak, lungTop - H * 0.01, true);
      ctx.clip();
      ctx.fillStyle = lGrad;
      ctx.fillRect(lLungOuter, lungTop, lLungX - lLungOuter, lDiagPeak - lungTop);
      ctx.restore();

      ctx.save();
      // Right infiltrate
      lungPath(rLungOuter, rLungX, lungTop, rDiagPeak, lungTop - H * 0.01, false);
      ctx.clip();
      ctx.fillStyle = rGrad;
      ctx.fillRect(rLungX, lungTop, rLungOuter - rLungX, rDiagPeak - lungTop);
      ctx.restore();

      // Upper lobe cephalization lines (horizontal streaks)
      if (severity > 0.4) {
        ctx.save();
        ctx.strokeStyle = `rgba(180, 210, 230, ${0.15 + severity * 0.15})`;
        ctx.lineWidth = 1;
        for (let i = 0; i < 4; i++) {
          const y = lungTop + (lDiagPeak - lungTop) * (0.15 + i * 0.07);
          ctx.beginPath();
          ctx.moveTo(lLungX - 5, y);
          ctx.lineTo(lLungOuter + 15, y + 3);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(rLungX + 5, y);
          ctx.lineTo(rLungOuter - 15, y + 3);
          ctx.stroke();
        }
        ctx.restore();
      }
      break;
    }

    case "tension_ptx": {
      // Affected side: completely dark (hyperexpanded) — push contralateral mediastinum
      const ptxSide = affectedSide === "right" ? "right" : "left";
      const ptxOuter = ptxSide === "left" ? lLungOuter : rLungOuter;
      const ptxInner = ptxSide === "left" ? lLungX : rLungX;
      const ptxDiag = ptxSide === "left" ? lDiagPeak : rDiagPeak;

      // Hyperexpanded side — very dark (no markings = air)
      ctx.save();
      lungPath(ptxOuter, ptxInner, lungTop - H * 0.05, ptxDiag + H * 0.03, lungTop - H * 0.06, ptxSide === "left");
      ctx.fillStyle = "rgba(5, 20, 30, 0.90)";
      ctx.fill();
      ctx.restore();

      // Compressed contralateral lung
      const compSide = ptxSide === "left" ? "right" : "left";
      const compOuter = compSide === "left" ? lLungOuter : rLungOuter;
      const compInner = compSide === "left" ? lLungX : rLungX;
      const compDiag = compSide === "left" ? lDiagPeak : rDiagPeak;
      const compFactor = lerp(1, 0.45, severity);

      ctx.save();
      ctx.translate(compSide === "left" ? compOuter * (1 - compFactor) : 0, 0);
      ctx.scale(compFactor, 1);
      lungPath(compOuter / compFactor, compInner / compFactor, lungTop, compDiag, lungTop - H * 0.01, compSide === "left");
      ctx.fillStyle = "rgba(30, 70, 90, 0.70)";
      ctx.fill();
      ctx.restore();

      // Sparse lung marking lines on ptx side (just a few faint ones at edge)
      ctx.save();
      ctx.strokeStyle = "rgba(40, 70, 90, 0.0)"; // no markings
      ctx.restore();
      break;
    }

    case "pleural_effusion": {
      const side = isLeftAffected ? "left" : "right";
      const sideOuter = side === "left" ? lLungOuter : rLungOuter;
      const sideInner = side === "left" ? lLungX : rLungX;
      const diagPeak = side === "left" ? lDiagPeak : rDiagPeak;
      const fluidTop = diagPeak - (diagPeak - lungTop) * Math.min(0.4, severity * 0.6);

      const grad = ctx.createLinearGradient(0, fluidTop, 0, diagPeak);
      grad.addColorStop(0, `rgba(160, 190, 215, ${0.1 + severity * 0.25})`);
      grad.addColorStop(1, `rgba(185, 210, 228, ${0.55 + severity * 0.25})`);
      ctx.save();
      lungPath(sideOuter, sideInner, fluidTop, diagPeak, lungTop - H * 0.01, side === "left");
      ctx.fillStyle = grad;
      ctx.fill();
      // Meniscus
      ctx.strokeStyle = `rgba(200, 225, 240, ${0.4 + severity * 0.35})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      const mY2 = fluidTop + (diagPeak - fluidTop) * 0.12;
      if (side === "left") {
        ctx.moveTo(sideInner, mY2 + 3);
        ctx.bezierCurveTo(sideOuter * 0.3 + sideInner * 0.7, mY2 - 6, sideOuter * 0.7 + sideInner * 0.3, mY2 - 3, sideOuter, mY2 + 2);
      } else {
        ctx.moveTo(sideInner, mY2 + 3);
        ctx.bezierCurveTo(sideInner * 0.7 + sideOuter * 0.3, mY2 - 3, sideInner * 0.3 + sideOuter * 0.7, mY2 - 6, sideOuter, mY2 + 2);
      }
      ctx.stroke();
      ctx.restore();
      break;
    }

    default:
      // normal / normal_postop — subtle lung vascular markings
      drawLungMarkings(ctx, lLungX, lLungOuter, rLungX, rLungOuter, lungTop, lDiagPeak, rDiagPeak);
      break;
  }

  // Lung markings for non-affected side in unilateral findings
  if (
    cxrType === "hemothorax" ||
    cxrType === "pleural_effusion" ||
    cxrType === "tension_ptx"
  ) {
    if (!isLeftAffected) {
      drawLungMarkings(ctx, lLungX, lLungOuter, undefined, undefined, lungTop, lDiagPeak, undefined);
    } else {
      drawLungMarkings(ctx, undefined, undefined, rLungX, rLungOuter, lungTop, undefined, rDiagPeak);
    }
  }
}

function drawLungMarkings(
  ctx: CanvasRenderingContext2D,
  lX?: number, lOuter?: number,
  rX?: number, rOuter?: number,
  topY?: number,
  lBot?: number, rBot?: number
) {
  ctx.save();
  ctx.strokeStyle = "rgba(120, 165, 195, 0.18)";
  ctx.lineWidth = 0.8;
  // Left lung vascular markings (branching pattern)
  if (lX !== undefined && lOuter !== undefined && topY !== undefined && lBot !== undefined) {
    const lMidX = (lX + lOuter) / 2;
    const lHilumY = topY + (lBot - topY) * 0.42;
    for (let i = 0; i < 8; i++) {
      const angle = (-0.5 + i * 0.15) * Math.PI;
      const len = 20 + i * 8;
      ctx.beginPath();
      ctx.moveTo(lMidX, lHilumY);
      ctx.lineTo(lMidX + Math.cos(angle) * len, lHilumY + Math.sin(angle) * len);
      ctx.stroke();
    }
  }
  // Right lung
  if (rX !== undefined && rOuter !== undefined && topY !== undefined && rBot !== undefined) {
    const rMidX = (rX + rOuter) / 2;
    const rHilumY = topY + (rBot - topY) * 0.42;
    for (let i = 0; i < 8; i++) {
      const angle = (-0.5 + i * 0.15) * Math.PI;
      const len = 20 + i * 8;
      ctx.beginPath();
      ctx.moveTo(rMidX, rHilumY);
      ctx.lineTo(rMidX + Math.cos(angle) * len, rHilumY + Math.sin(angle) * len);
      ctx.stroke();
    }
  }
  ctx.restore();
}

function drawRibcage(
  ctx: CanvasRenderingContext2D,
  W: number, H: number, thoraxW: number,
  cx: number, topY: number, botY: number,
  lungTop: number, lungBot: number
) {
  ctx.save();
  // Outer thorax outline
  ctx.strokeStyle = COLORS.bone;
  ctx.lineWidth = 2;
  ctx.beginPath();
  // Left side
  const lEdge = cx - thoraxW / 2;
  const rEdge = cx + thoraxW / 2;
  ctx.moveTo(cx - thoraxW * 0.25, topY);
  ctx.bezierCurveTo(
    lEdge + thoraxW * 0.05, topY + H * 0.04,
    lEdge, topY + H * 0.20,
    lEdge, topY + H * 0.55
  );
  ctx.bezierCurveTo(
    lEdge, botY - H * 0.04,
    cx - thoraxW * 0.10, botY,
    cx, botY
  );
  ctx.bezierCurveTo(
    cx + thoraxW * 0.10, botY,
    rEdge, botY - H * 0.04,
    rEdge, topY + H * 0.55
  );
  ctx.bezierCurveTo(
    rEdge, topY + H * 0.20,
    rEdge - thoraxW * 0.05, topY + H * 0.04,
    cx + thoraxW * 0.25, topY
  );
  ctx.stroke();

  // Ribs (6 pairs, simplified as curved arcs)
  ctx.strokeStyle = COLORS.rib;
  ctx.lineWidth = 1.5;
  const ribCount = 7;
  for (let i = 0; i < ribCount; i++) {
    const t = (i + 0.5) / ribCount;
    const ribY = lungTop + (lungBot - lungTop) * (t * 0.9);
    const ribW = thoraxW * (0.85 - t * 0.10);
    const ribH = H * (0.025 + t * 0.01);
    // Left rib
    ctx.beginPath();
    ctx.ellipse(cx, ribY, ribW / 2, ribH, 0, Math.PI * 0.05, Math.PI * 0.95);
    ctx.stroke();
  }
  ctx.restore();
}

function drawDiaphragm(
  ctx: CanvasRenderingContext2D,
  p: {
    lLungOuter: number; rLungOuter: number;
    lLungX: number; rLungX: number;
    diagY: number; lDiagPeak: number; rDiagPeak: number;
    W: number; H: number;
  }
) {
  const { lLungOuter, rLungOuter, lLungX, rLungX, diagY, lDiagPeak, rDiagPeak } = p;
  ctx.save();
  ctx.strokeStyle = COLORS.diaphragm;
  ctx.lineWidth = 2.5;

  // Left hemidiaphragm
  ctx.beginPath();
  ctx.moveTo(lLungX - 5, diagY);
  ctx.bezierCurveTo(
    lLungX + (lLungOuter - lLungX) * 0.3, lDiagPeak,
    lLungX + (lLungOuter - lLungX) * 0.7, lDiagPeak,
    lLungOuter, diagY + 5
  );
  ctx.stroke();

  // Right hemidiaphragm (slightly higher)
  ctx.beginPath();
  ctx.moveTo(rLungX + 5, diagY);
  ctx.bezierCurveTo(
    rLungX + (rLungOuter - rLungX) * 0.3, rDiagPeak - 3,
    rLungX + (rLungOuter - rLungX) * 0.7, rDiagPeak - 3,
    rLungOuter, diagY + 5
  );
  ctx.stroke();
  ctx.restore();
}

function drawMediastinum(
  ctx: CanvasRenderingContext2D,
  cx: number, topY: number, heartTop: number,
  mediasWidth: number, H: number,
  cxrType: CXRType, severity: number,
  affectedSide: "left" | "right" | "bilateral"
) {
  ctx.save();
  // Trachea (midline, from top to carina)
  const tracheaWidth = 8;
  const carinaY = heartTop + H * 0.03;
  let tracheaX = cx;

  // Mediastinal shift for tension PTX
  if (cxrType === "tension_ptx") {
    const shiftDir = affectedSide === "left" ? 1 : -1;
    tracheaX = cx + shiftDir * lerp(0, H * 0.055, severity);
  }

  ctx.strokeStyle = COLORS.trachea;
  ctx.lineWidth = 1.5;
  // Trachea outline (two parallel lines)
  ctx.beginPath();
  ctx.moveTo(tracheaX - tracheaWidth / 2, topY + H * 0.02);
  ctx.lineTo(tracheaX - tracheaWidth / 2, carinaY);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(tracheaX + tracheaWidth / 2, topY + H * 0.02);
  ctx.lineTo(tracheaX + tracheaWidth / 2, carinaY);
  ctx.stroke();
  // Carina
  ctx.beginPath();
  ctx.moveTo(tracheaX - tracheaWidth / 2, carinaY);
  ctx.bezierCurveTo(
    tracheaX - tracheaWidth * 2, carinaY + H * 0.02,
    tracheaX - tracheaWidth * 4, carinaY + H * 0.03,
    tracheaX - tracheaWidth * 5, carinaY + H * 0.04
  );
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(tracheaX + tracheaWidth / 2, carinaY);
  ctx.bezierCurveTo(
    tracheaX + tracheaWidth * 2, carinaY + H * 0.02,
    tracheaX + tracheaWidth * 4, carinaY + H * 0.03,
    tracheaX + tracheaWidth * 5, carinaY + H * 0.04
  );
  ctx.stroke();

  ctx.restore();
}

function drawHeart(
  ctx: CanvasRenderingContext2D,
  heartCx: number, heartTop: number, heartBot: number,
  heartW: number,
  cxrType: CXRType, severity: number
) {
  ctx.save();
  const heartH = heartBot - heartTop;

  // Heart silhouette as an irregular quadrilateral
  ctx.beginPath();
  // Right border (ascending aorta + right atrium)
  ctx.moveTo(heartCx - heartW * 0.1, heartTop);
  ctx.bezierCurveTo(
    heartCx + heartW * 0.35, heartTop,
    heartCx + heartW * 0.5, heartTop + heartH * 0.3,
    heartCx + heartW * 0.5, heartTop + heartH * 0.6
  );
  // Right heart border → apex
  ctx.bezierCurveTo(
    heartCx + heartW * 0.5, heartTop + heartH * 0.9,
    heartCx + heartW * 0.3, heartBot,
    heartCx, heartBot
  );
  // Apex → left heart border
  ctx.bezierCurveTo(
    heartCx - heartW * 0.3, heartBot,
    heartCx - heartW * 0.5, heartTop + heartH * 0.8,
    heartCx - heartW * 0.5, heartTop + heartH * 0.55
  );
  // Left heart border → aortic knuckle
  ctx.bezierCurveTo(
    heartCx - heartW * 0.5, heartTop + heartH * 0.2,
    heartCx - heartW * 0.2, heartTop,
    heartCx - heartW * 0.1, heartTop
  );
  ctx.closePath();

  // Fill
  ctx.fillStyle = cxrType === "widened_mediastinum"
    ? `rgba(190, 215, 235, ${0.35 + severity * 0.2})`
    : COLORS.heart;
  ctx.fill();

  // Border
  ctx.strokeStyle = COLORS.heartBorder;
  ctx.lineWidth = 2;
  ctx.stroke();

  // Aortic knuckle (small bump on left upper)
  ctx.beginPath();
  ctx.arc(heartCx - heartW * 0.38, heartTop + heartH * 0.08, heartW * 0.05, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(185, 215, 232, 0.5)";
  ctx.fill();

  ctx.restore();
}

function drawCostophrenicAngles(
  ctx: CanvasRenderingContext2D,
  p: {
    cxrType: CXRType; severity: number;
    affectedSide: "left" | "right" | "bilateral";
    lLungOuter: number; rLungOuter: number;
    lLungX: number; rLungX: number;
    diagY: number; lDiagPeak: number; rDiagPeak: number;
    H: number;
  }
) {
  const { cxrType, severity, affectedSide, lLungOuter, rLungOuter, diagY, lDiagPeak, rDiagPeak, H } = p;

  const isLeftAffected = affectedSide === "left" || affectedSide === "bilateral";
  const isRightAffected = affectedSide === "right" || affectedSide === "bilateral";

  function drawAngle(x: number, diagPeak: number, blunted: boolean, bluntSeverity: number) {
    ctx.save();
    const isLeft = x < 0; // determine side by x relative check omitted — always pass side
    ctx.strokeStyle = COLORS.bone;
    ctx.lineWidth = 2;

    if (blunted) {
      // Blunted angle — fluid fills the angle
      const bluntRadius = 12 + bluntSeverity * 20;
      const cornerY = diagY + 3;
      const cornerX = x;
      ctx.beginPath();
      ctx.arc(cornerX, cornerY - bluntRadius, bluntRadius, 0, Math.PI * 0.5);
      ctx.stroke();
      // Fluid opacity fill
      ctx.fillStyle = `rgba(185, 210, 228, ${0.3 + bluntSeverity * 0.35})`;
      ctx.beginPath();
      ctx.arc(cornerX, cornerY - bluntRadius, bluntRadius, 0, Math.PI * 0.5);
      ctx.lineTo(cornerX, cornerY - bluntRadius);
      ctx.closePath();
      ctx.fill();
    } else {
      // Sharp angle
      ctx.beginPath();
      ctx.moveTo(x, diagPeak);
      ctx.lineTo(x, diagY + H * 0.025);
      ctx.stroke();
    }
    ctx.restore();
  }

  const leftBlunted =
    isLeftAffected &&
    (cxrType === "hemothorax" || cxrType === "pleural_effusion" || cxrType === "pulmonary_edema");
  const rightBlunted =
    isRightAffected &&
    (cxrType === "hemothorax" || cxrType === "pleural_effusion" || cxrType === "pulmonary_edema");

  drawAngle(lLungOuter, lDiagPeak, leftBlunted, leftBlunted ? severity : 0);
  drawAngle(rLungOuter, rDiagPeak, rightBlunted, rightBlunted ? severity : 0);
}

function drawSternotomyWires(
  ctx: CanvasRenderingContext2D,
  cx: number, heartTop: number, heartBot: number, thoraxW: number
) {
  ctx.save();
  ctx.strokeStyle = COLORS.wire;
  ctx.lineWidth = 1.5;
  ctx.setLineDash([]);

  const numWires = 6;
  const spread = thoraxW * 0.055;

  for (let i = 0; i < numWires; i++) {
    const y = heartTop + (heartBot - heartTop) * ((i + 0.5) / numWires) * 0.85;
    // Sternal wire: horizontal segment with small loops at ends
    const loopR = 3;
    // Left side
    ctx.beginPath();
    ctx.moveTo(cx - spread, y);
    ctx.lineTo(cx - loopR, y);
    ctx.arc(cx - loopR, y, loopR, 0, Math.PI * 2);
    ctx.moveTo(cx + loopR, y);
    ctx.lineTo(cx + spread, y);
    ctx.arc(cx + spread, y, loopR, 0, Math.PI * 2);
    ctx.stroke();
    // Central cross-wire
    ctx.beginPath();
    ctx.moveTo(cx - loopR, y - 1);
    ctx.lineTo(cx + loopR, y - 1);
    ctx.stroke();
  }
  ctx.restore();
}

function drawMediastinalDrain(
  ctx: CanvasRenderingContext2D,
  cx: number, heartBot: number, diagY: number
) {
  ctx.save();
  ctx.strokeStyle = COLORS.drain;
  ctx.lineWidth = 2;
  ctx.setLineDash([4, 3]);
  // Drain: vertical line slightly left of center, from below heart to below diaphragm
  const drainX = cx + 8;
  ctx.beginPath();
  ctx.moveTo(drainX, heartBot - 10);
  ctx.lineTo(drainX, diagY + 15);
  ctx.stroke();
  // Drain tip (small horizontal cross)
  ctx.setLineDash([]);
  ctx.strokeStyle = COLORS.drain;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(drainX - 5, diagY + 12);
  ctx.lineTo(drainX + 5, diagY + 12);
  ctx.stroke();
  ctx.restore();
}

function drawETTube(
  ctx: CanvasRenderingContext2D,
  cx: number, topY: number, heartTop: number,
  cxrType: CXRType, mediasWidth: number
) {
  ctx.save();
  const tubeX = cx + 2; // slightly right of midline
  const tubeTop = topY + 5;
  const tubeBot = heartTop + (heartTop - topY) * 0.15; // tip above carina

  ctx.strokeStyle = COLORS.tube;
  ctx.lineWidth = 3;
  ctx.lineCap = "round";
  // ET tube outline (two parallel lines)
  ctx.beginPath();
  ctx.moveTo(tubeX - 3, tubeTop);
  ctx.lineTo(tubeX - 3, tubeBot);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(tubeX + 3, tubeTop);
  ctx.lineTo(tubeX + 3, tubeBot);
  ctx.stroke();
  // Tip markings (distance markers)
  ctx.strokeStyle = COLORS.tube;
  ctx.lineWidth = 1;
  ctx.setLineDash([2, 4]);
  for (let i = 1; i <= 4; i++) {
    const y = tubeTop + (tubeBot - tubeTop) * (i / 5);
    ctx.beginPath();
    ctx.moveTo(tubeX - 5, y);
    ctx.lineTo(tubeX + 5, y);
    ctx.stroke();
  }
  ctx.setLineDash([]);
  // Cuff (small oval near bottom)
  ctx.strokeStyle = `rgba(240, 235, 190, 0.55)`;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.ellipse(tubeX, tubeBot - 6, 5, 3, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

// ── Annotations ───────────────────────────────────────────────

interface AnnotationParams {
  cxrType: CXRType;
  severity: number;
  affectedSide: "left" | "right" | "bilateral";
  isIntubated: boolean;
  isPostop: boolean;
  lLungX: number; lLungOuter: number;
  rLungX: number; rLungOuter: number;
  lDiagPeak: number; rDiagPeak: number;
  diagY: number;
  heartCx: number; heartW: number;
  heartTop: number; heartBot: number;
  cx: number; W: number; H: number;
}

function drawAnnotations(ctx: CanvasRenderingContext2D, p: AnnotationParams) {
  const { cxrType, severity, affectedSide, lLungOuter, rLungOuter, lLungX, rLungX, lDiagPeak, rDiagPeak, heartCx, heartW, heartTop, heartBot, cx, W, H } = p;

  ctx.save();
  ctx.font = "bold 9px monospace";
  ctx.textAlign = "left";

  function label(text: string, x: number, y: number, color = COLORS.annotation) {
    ctx.fillStyle = "rgba(0,18,25,0.65)";
    const m = ctx.measureText(text);
    ctx.fillRect(x - 2, y - 10, m.width + 4, 13);
    ctx.fillStyle = color;
    ctx.fillText(text, x, y);
  }

  switch (cxrType) {
    case "widened_mediastinum":
      label("WIDENED MEDIASTINUM", heartCx - heartW / 2, heartTop - 8);
      label(`CT ratio ${(0.45 + severity * 0.2).toFixed(2)}`, heartCx + heartW * 0.55, heartTop + (heartBot - heartTop) * 0.3);
      break;

    case "hemothorax": {
      const side = affectedSide === "left" || affectedSide === "bilateral" ? "left" : "right";
      const annoX = side === "left" ? lLungOuter + 8 : rLungX + 8;
      const annoY = lDiagPeak - (lDiagPeak - (side === "left" ? lDiagPeak : rDiagPeak)) * 0.5;
      label(`${side.toUpperCase()} HEMOTHORAX`, annoX, (lDiagPeak + rDiagPeak) / 2 - 15);
      label("MENISCUS SIGN", annoX, (lDiagPeak + rDiagPeak) / 2 + 5);
      break;
    }

    case "pulmonary_edema":
      label("PERIHILAR INFILTRATE", lLungOuter + 8, lDiagPeak - (lDiagPeak - H * 0.12) * 0.45);
      label("KERLEY B LINES", rLungX + 8, rDiagPeak - 20);
      label("CEPHALIZATION", lLungOuter + 8, H * 0.18);
      break;

    case "tension_ptx": {
      const ptxSide = affectedSide === "right" ? "right" : "left";
      const annoX = ptxSide === "left" ? lLungOuter + 8 : rLungX + 8;
      label("ABSENT LUNG MARKINGS", annoX, H * 0.25);
      label("HYPEREXPANSION", annoX, H * 0.35);
      label("MEDIASTINAL SHIFT →", cx - 45, H * 0.42, "rgba(255, 120, 120, 0.9)");
      break;
    }

    case "pleural_effusion": {
      const side = affectedSide === "left" || affectedSide === "bilateral" ? "left" : "right";
      const annoX = side === "left" ? lLungOuter + 8 : rLungX + 8;
      label("BLUNTED CP ANGLE", annoX, rDiagPeak - 10);
      break;
    }

    case "normal_postop":
      label("STERNOTOMY WIRES", cx + 12, heartTop + (heartBot - heartTop) * 0.3);
      label("MEDIASTINAL DRAIN", cx + 12, heartBot + 12);
      if (p.isIntubated) label("ET TUBE", cx + 12, H * 0.10);
      break;

    default:
      break;
  }

  ctx.restore();
}

// ── Type label ────────────────────────────────────────────────

const TYPE_LABELS: Record<CXRType, string> = {
  normal_postop: "POST-OP CXR",
  hemothorax: "HEMOTHORAX",
  widened_mediastinum: "WIDENED MEDIASTINUM",
  pulmonary_edema: "PULMONARY EDEMA",
  tension_ptx: "TENSION PTX",
  pleural_effusion: "PLEURAL EFFUSION",
  et_malposition: "ET MALPOSITION",
  normal: "NORMAL CXR",
};

function drawTypeLabel(ctx: CanvasRenderingContext2D, cxrType: CXRType, W: number, H: number) {
  ctx.save();
  ctx.font = "bold 10px monospace";
  ctx.textAlign = "right";
  const label = TYPE_LABELS[cxrType] ?? cxrType.toUpperCase();
  const labelColor =
    cxrType === "tension_ptx"
      ? "rgba(255, 110, 110, 0.85)"
      : cxrType === "normal" || cxrType === "normal_postop"
      ? "rgba(80, 200, 170, 0.70)"
      : "rgba(255, 200, 100, 0.80)";
  const m = ctx.measureText(label);
  ctx.fillStyle = "rgba(0,0,0,0.55)";
  ctx.fillRect(W - m.width - 14, H - 22, m.width + 10, 16);
  ctx.fillStyle = labelColor;
  ctx.fillText(label, W - 8, H - 10);
  // "PORTABLE AP" label top-left
  ctx.textAlign = "left";
  ctx.fillStyle = "rgba(80, 180, 160, 0.45)";
  ctx.font = "9px monospace";
  ctx.fillText("PORTABLE AP", 8, 16);
  ctx.restore();
}

// ── React Component ───────────────────────────────────────────

export function CxrCanvas({
  cxrType,
  severity = 0.6,
  width = 400,
  height = 480,
  animated = true,
  affectedSide = "left",
  isIntubated = true,
  isPostop = true,
  showAnnotations = true,
}: CxrCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const startTimeRef = useRef<number>(Date.now());

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    const time = (Date.now() - startTimeRef.current) / 1000;

    drawCXR(ctx, W, H, {
      cxrType,
      severity,
      width: W,
      height: H,
      animated,
      affectedSide,
      isIntubated,
      isPostop,
      showAnnotations,
      time,
    });
  }, [cxrType, severity, animated, affectedSide, isIntubated, isPostop, showAnnotations]);

  useEffect(() => {
    startTimeRef.current = Date.now();

    if (!animated) {
      draw();
      return;
    }

    let running = true;
    function loop() {
      if (!running) return;
      draw();
      rafRef.current = requestAnimationFrame(loop);
    }
    rafRef.current = requestAnimationFrame(loop);
    return () => {
      running = false;
      cancelAnimationFrame(rafRef.current);
    };
  }, [draw, animated]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      style={{
        width: "100%",
        height: "auto",
        display: "block",
        borderRadius: "8px",
        imageRendering: "crisp-edges",
      }}
      aria-label={`CXR: ${TYPE_LABELS[cxrType]}`}
    />
  );
}

export default CxrCanvas;
