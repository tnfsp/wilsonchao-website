"use client";

import { useState } from "react";

/**
 * 「丟一張紙條」的表單——訪客出題（開合由抽屜控制，這裡只管表單）。
 * 寫下想問 Wilson 的一題，進題庫排隊；Owl 之後可能撈來問他。
 */
export function DrawerQuestion({ onCancel }: { onCancel: () => void }) {
  const [question, setQuestion] = useState("");
  const [from, setFrom] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">(
    "idle"
  );
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;
    setStatus("loading");
    setError("");
    try {
      const res = await fetch("/api/drawer-question", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, from, honeypot }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setStatus("error");
        setError(data.error || "出了點問題，再試一次？");
      } else {
        setStatus("done");
        setQuestion("");
        setFrom("");
      }
    } catch {
      setStatus("error");
      setError("紙條沒丟進去，再試一次？");
    }
  };

  if (status === "done") {
    return (
      <p className="rounded-lg bg-[var(--surface-strong)] px-4 py-3 text-sm text-[var(--muted)]">
        紙條收到了，謝謝你出題！我或 Owl 之後可能會抽來回答。
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <p className="text-sm text-[var(--muted)] leading-relaxed">
        想問我什麼？寫下來丟進抽屜——我（或 Owl）之後可能會抽來回答。
      </p>

      {/* honeypot */}
      <input
        type="text"
        tabIndex={-1}
        autoComplete="off"
        value={honeypot}
        onChange={(e) => setHoneypot(e.target.value)}
        aria-hidden="true"
        className="absolute left-[-9999px] h-0 w-0 opacity-0"
      />

      <input
        type="text"
        value={from}
        onChange={(e) => setFrom(e.target.value)}
        placeholder="你的名字（可留空）"
        maxLength={50}
        className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none"
      />

      <textarea
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        placeholder="想問我的一題…"
        required
        rows={2}
        maxLength={500}
        className="w-full resize-y rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none"
      />

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={status === "loading" || !question.trim()}
          className="rounded-lg bg-[var(--accent-strong)] px-4 py-2 text-sm font-medium text-[var(--on-accent)] transition-colors hover:bg-[var(--accent-contrast)] disabled:opacity-50"
        >
          {status === "loading" ? "丟進去…" : "丟進抽屜"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="text-xs text-[var(--muted)] hover:text-[var(--foreground)]"
        >
          取消
        </button>
        {status === "error" ? (
          <p className="text-sm text-[var(--accent-contrast)]">{error}</p>
        ) : null}
      </div>
    </form>
  );
}
