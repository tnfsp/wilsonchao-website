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
      <div className="flex flex-1 overflow-hidden">
        {/*
         * Left column
         * Desktop: fixed 380px wide, scrollable
         * Mobile: full width, push right panel below
         */}
        <div
          className={[
            "flex-shrink-0",
            // Desktop
            "lg:w-[380px] lg:flex lg:flex-col lg:overflow-y-auto lg:border-r lg:border-white/8",
            // Mobile: full width, scrollable horizontally or collapsible
            "w-full lg:max-w-none",
            "max-h-[50vh] lg:max-h-none overflow-y-auto",
            "lg:h-full",
          ].join(" ")}
          style={{ scrollbarWidth: "thin", scrollbarColor: "#ffffff1a transparent" }}
        >
          <div className="p-3 space-y-3">{leftPanel}</div>
        </div>

        {/*
         * Right column
         * Desktop: flex 1, full height, flex column
         * Mobile: flex 1 remaining height
         */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          <div className="flex-1 overflow-hidden">{rightPanel}</div>
        </div>
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
