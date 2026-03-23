"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function TeachingAuth() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(false);

    const res = await fetch("/api/teaching-auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    if (res.ok) {
      router.push("/teaching");
      router.refresh();
    } else {
      setError(true);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#001219] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">🫀</div>
          <h1 className="text-2xl font-bold text-white">心臟外科教學</h1>
          <p className="text-gray-500 text-sm mt-2">請輸入密碼</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(false); }}
            placeholder="密碼"
            autoFocus
            className={`w-full px-4 py-3 rounded-lg bg-white/5 border text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition ${
              error ? "border-red-500" : "border-white/10"
            }`}
          />
          {error && (
            <p className="text-red-400 text-sm text-center">密碼錯誤</p>
          )}
          <button
            type="submit"
            disabled={loading || !password}
            className="w-full py-3 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "驗證中..." : "進入"}
          </button>
        </form>
      </div>
    </div>
  );
}
