"use client";

import { useState, useRef, KeyboardEvent } from "react";
import { useProGameStore } from "@/lib/simulator/store";

export default function MessageInput() {
  const sendMessage = useProGameStore((s) => s.sendMessage);
  const phase = useProGameStore((s) => s.phase);

  const [text, setText] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const isPlaying = phase === "playing";
  const canSend = isPlaying && text.trim().length > 0;

  const handleSend = () => {
    if (!canSend) return;
    sendMessage(text.trim());
    setText("");
    // Refocus after send
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div
      className="w-full px-3 py-2.5 border-t border-slate-700/60 flex items-center gap-2"
      style={{ background: "#0d1f3c" }}
    >
      {/* Input */}
      <input
        ref={inputRef}
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={isPlaying ? "跟護理師說話..." : "等待情境開始..."}
        disabled={!isPlaying}
        maxLength={300}
        className={[
          "flex-1 rounded-xl px-4 py-2.5 text-sm outline-none transition-colors",
          "bg-slate-800/80 border text-slate-100 placeholder-slate-500",
          isPlaying
            ? "border-slate-600 focus:border-cyan-500/70 focus:bg-slate-800"
            : "border-slate-700 text-slate-500 cursor-not-allowed opacity-60",
        ].join(" ")}
        autoComplete="off"
        spellCheck={false}
      />

      {/* Send Button */}
      <button
        onClick={handleSend}
        disabled={!canSend}
        className={[
          "shrink-0 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all active:scale-95",
          canSend
            ? "bg-cyan-600 hover:bg-cyan-500 text-white cursor-pointer"
            : "bg-slate-700/60 text-slate-500 cursor-not-allowed opacity-60",
        ].join(" ")}
        title="送出 (Enter)"
      >
        送出
      </button>
    </div>
  );
}
