"use client";

import { useState } from "react";

type SubscribeFormProps = {
  source?: string;
};

export function SubscribeForm({ source = "unknown" }: SubscribeFormProps) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "already" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setStatus("loading");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source }),
      });

      const data = await res.json();

      if (data.alreadySubscribed) {
        setStatus("already");
        setMessage("You're already subscribed!");
      } else if (data.success) {
        setStatus("success");
        setMessage("Thanks for subscribing!");
        setEmail("");
      } else {
        setStatus("error");
        setMessage(data.error || "Something went wrong");
      }
    } catch {
      setStatus("error");
      setMessage("Failed to subscribe. Please try again.");
    }
  };

  if (status === "success" || status === "already") {
    return (
      <div className="rounded-lg border border-[var(--accent)] bg-[var(--highlight)]/60 px-4 py-3 text-sm text-[var(--foreground)]">
        {status === "success" ? "感謝訂閱！" : "你已經訂閱過了"}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="your@email.com"
        required
        className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none"
      />
      <button
        type="submit"
        disabled={status === "loading"}
        className="rounded-lg bg-[var(--accent-strong)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--accent-contrast)] disabled:opacity-50"
      >
        {status === "loading" ? "訂閱中..." : "訂閱"}
      </button>
      {status === "error" && (
        <p className="text-sm text-red-500">{message}</p>
      )}
    </form>
  );
}
