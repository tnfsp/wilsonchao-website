"use client";

import { useState } from "react";

/**
 * 抽屜簽到本——私密版表單。
 * 訪客留個話給 Wilson，只有他看得到（不公開、不顯示在站上）。
 */
export function DrawerNote() {
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [honeypot, setHoneypot] = useState(""); // bots 才會填
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">(
    "idle"
  );
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setStatus("loading");
    setError("");
    try {
      const res = await fetch("/api/drawer-note", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, message, honeypot }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setStatus("error");
        setError(data.error || "出了點問題，再試一次？");
      } else {
        setStatus("success");
        setName("");
        setMessage("");
      }
    } catch {
      setStatus("error");
      setError("留言沒送出去，再試一次？");
    }
  };

  if (status === "success") {
    return (
      <div className="surface-card px-6 py-5">
        <p className="text-[var(--foreground)]">收到了，謝謝你來我的網站坐坐。</p>
        <p className="mt-1 text-sm text-[var(--muted)]">
          這則話只會進到我這裡，不會出現在站上。
        </p>
      </div>
    );
  }

  return (
    <section className="surface-card px-6 py-5 space-y-4">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold text-[var(--foreground)]">
          留個話
        </h2>
        <p className="text-sm text-[var(--muted)] leading-relaxed">
          想跟我說點什麼都可以。這裡是私密的——你的留言只有我看得到，不會公開顯示。
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        {/* honeypot：視覺隱藏，給 bot 填的 */}
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
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="你的名字（可留空）"
          maxLength={50}
          className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none"
        />

        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="想說的話…"
          required
          rows={3}
          maxLength={2000}
          className="w-full resize-y rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none"
        />

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={status === "loading" || !message.trim()}
            className="rounded-lg bg-[var(--accent-strong)] px-4 py-2 text-sm font-medium text-[var(--on-accent)] transition-colors hover:bg-[var(--accent-contrast)] disabled:opacity-50"
          >
            {status === "loading" ? "送出中…" : "悄悄說給我聽"}
          </button>
          {status === "error" ? (
            <p className="text-sm text-[var(--accent-contrast)]">{error}</p>
          ) : null}
        </div>
      </form>
    </section>
  );
}
