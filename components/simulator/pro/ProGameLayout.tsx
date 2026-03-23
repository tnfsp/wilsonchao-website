"use client";

import React from "react";
import IOBalanceBar from "./IOBalanceBar";

interface ProGameLayoutProps {
  /** 左欄 — vitals, CT panel, active orders（以外的可選 slot） */
  leftPanel: React.ReactNode;
  /** 右欄 — chat timeline + 輸入框 */
  rightPanel: React.ReactNode;
  /** 底部 action bar（action buttons 由外部填入） */
  actionBar?: React.ReactNode;
}

/**
 * ProGameLayout — ICU 模擬器 Pro 主畫面框架
 *
 * 桌面：左右分欄（左 1/3 右 2/3）
 * 手機：上下堆疊（vitals/CT 可收合）
 *
 * 使用 `"use client"` 因為會包含互動式 children。
 */
export default function ProGameLayout({
  leftPanel,
  rightPanel,
  actionBar,
}: ProGameLayoutProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex flex-col overflow-hidden"
      style={{ background: "#001219" }}
    >
      {/* ── Top bar ────────────────────────────────────────────── */}
      <IOBalanceBar />

      {/* ── Main content area ──────────────────────────────────── */}
      {/* Desktop: side-by-side columns */}
      <div className="hidden lg:flex flex-1 overflow-hidden">
        <div
          className="w-[380px] flex-shrink-0 overflow-y-auto border-r border-white/8"
          style={{ scrollbarWidth: "thin", scrollbarColor: "#ffffff1a transparent" }}
        >
          <div className="p-3 space-y-3">{leftPanel}</div>
        </div>
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          <div className="flex-1 overflow-hidden">{rightPanel}</div>
        </div>
      </div>

      {/* Mobile: single scrollable column */}
      <div className="lg:hidden flex-1 overflow-y-auto" style={{ scrollbarWidth: "thin", scrollbarColor: "#ffffff1a transparent" }}>
        <div className="p-3 space-y-3">{leftPanel}</div>
        <div className="min-h-[40vh]">{rightPanel}</div>
      </div>

      {/* ── Bottom Action Bar ───────────────────────────────────── */}
      {actionBar && (
        <div className="flex-shrink-0 border-t border-white/8 bg-[#00202e]">
          {actionBar}
        </div>
      )}
    </div>
  );
}
