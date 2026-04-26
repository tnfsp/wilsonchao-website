"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useProGameStore } from "@/lib/simulator/store";

/** Format game minutes + startHour → "02:35 AM" */
function formatGameTime(gameMinutes: number, startHour: number): string {
  const totalMinutes = startHour * 60 + gameMinutes;
  const hours24 = Math.floor(totalMinutes / 60) % 24;
  const mins = totalMinutes % 60;
  const ampm = hours24 < 12 ? "AM" : "PM";
  const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
  return `${String(hours12).padStart(2, "0")}:${String(mins).padStart(2, "0")} ${ampm}`;
}

function formatNet(net: number): string {
  if (net >= 0) return `+${net}`;
  return `${net}`;
}

export default function IOBalanceBar() {
  const router = useRouter();
  const scenario = useProGameStore((s) => s.scenario);
  const clock = useProGameStore((s) => s.clock);
  const ioBalance = useProGameStore((s) => s.patient?.ioBalance);
  const [showPopover, setShowPopover] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  const gameTime = formatGameTime(clock.currentTime, clock.startHour);
  const totalInput = ioBalance?.totalInput ?? 0;
  const totalOutput = ioBalance?.totalOutput ?? 0;
  const net = ioBalance?.netBalance ?? 0;
  const netColor = net >= 0 ? "text-green-400" : "text-red-400";
  const breakdown = ioBalance?.breakdown;

  // Close popover on outside click
  useEffect(() => {
    if (!showPopover) return;
    function handleClick(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setShowPopover(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showPopover]);

  return (
    <div
      className="flex items-center justify-between px-4 py-2 bg-[#00202e] border-b border-white/10"
      style={{ minHeight: "48px" }}
    >
      {/* Left: Back + scenario name */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1 text-gray-400 hover:text-white transition-colors text-sm flex-shrink-0"
        >
          <span>←</span>
          <span className="hidden sm:inline">返回</span>
        </button>
        <span className="text-white font-semibold text-sm truncate max-w-[160px] sm:max-w-xs">
          {scenario?.hiddenTitle ?? scenario?.title ?? "ICU 模擬器"}
        </span>
        {scenario?.difficulty && (
          <span
            className={`hidden sm:inline text-[10px] px-2 py-0.5 rounded-full font-medium ${
              scenario.difficulty === "beginner"
                ? "bg-green-900/60 text-green-400"
                : scenario.difficulty === "intermediate"
                  ? "bg-yellow-900/60 text-yellow-400"
                  : "bg-red-900/60 text-red-400"
            }`}
          >
            {scenario.difficulty}
          </span>
        )}
      </div>

      {/* Center: Sim time + elapsed */}
      <div className="flex items-center gap-1.5 text-white">
        <span className="text-yellow-400">⏰</span>
        <span className="font-mono font-bold text-base tracking-wider">
          {gameTime}
        </span>
        <span className="text-gray-500 text-xs font-mono ml-0.5">
          ({clock.currentTime} min elapsed)
        </span>
      </div>

      {/* Right: I/O balance */}
      <div className="relative" ref={popoverRef}>
        {/* Desktop: full breakdown inline */}
        <div className="hidden sm:flex items-center gap-1.5 text-sm font-mono">
          <span className="text-green-400">+{totalInput}</span>
          <span className="text-gray-500">/</span>
          <span className="text-red-400">-{totalOutput}</span>
          <span className="text-gray-500">=</span>
          <span className={`font-bold ${netColor}`}>
            I/O {formatNet(net)}
          </span>
          <span className="text-gray-500 text-xs">mL</span>
        </div>

        {/* Mobile: compact net only, tappable */}
        <button
          onClick={() => setShowPopover((v) => !v)}
          className="sm:hidden flex items-center gap-1 text-sm font-mono"
        >
          <span className={`font-bold ${netColor}`}>
            I/O {formatNet(net)}
          </span>
          <span className="text-gray-500 text-xs">mL</span>
        </button>

        {/* Popover with full I/O details */}
        {showPopover && (
          <div
            className="absolute right-0 top-full mt-2 z-[60] w-56 rounded-lg border border-white/10 bg-[#001a25] shadow-xl p-3 text-xs font-mono"
          >
            <p className="text-gray-500 uppercase tracking-widest text-[9px] mb-2">I/O Breakdown</p>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-400">IV</span>
                <span className="text-green-400">+{breakdown?.input.iv ?? 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Blood</span>
                <span className="text-green-400">+{breakdown?.input.blood ?? 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Oral</span>
                <span className="text-green-400">+{breakdown?.input.oral ?? 0}</span>
              </div>
              <div className="border-t border-white/8 my-1.5" />
              <div className="flex justify-between">
                <span className="text-gray-400">Chest Tube</span>
                <span className="text-red-400">-{breakdown?.output.chestTube ?? 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Urine</span>
                <span className="text-red-400">-{breakdown?.output.urine ?? 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">NGO</span>
                <span className="text-red-400">-{breakdown?.output.ngo ?? 0}</span>
              </div>
              <div className="border-t border-white/8 my-1.5" />
              <div className="flex justify-between font-bold">
                <span className="text-gray-300">Net</span>
                <span className={netColor}>{formatNet(net)} mL</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
