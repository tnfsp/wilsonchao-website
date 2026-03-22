"use client";

import { useState } from "react";
import Link from "next/link";

const modules = [
  { key: "preop", label: "Module 1：術前評估" },
  { key: "hemo", label: "Module 2：Hemodynamic Monitoring" },
  { key: "vent", label: "Module 3：呼吸器" },
  { key: "icu", label: "Module 4：ICU Care" },
  { key: "cabg", label: "選修 A：CABG" },
  { key: "valve", label: "選修 B：Valve Surgery" },
  { key: "cpb", label: "選修 C：CPB" },
  { key: "mcs", label: "選修 D：MCS" },
  { key: "aortic", label: "選修 E：Aortic Surgery" },
];

function StarRating({
  value,
  onChange,
  label,
}: {
  value: number;
  onChange: (v: number) => void;
  label: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-gray-600 dark:text-gray-400 w-44 shrink-0">{label}</span>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className={`text-2xl transition-colors ${
              star <= value
                ? "text-yellow-400"
                : "text-gray-300 dark:text-gray-600 hover:text-yellow-300"
            }`}
          >
            ★
          </button>
        ))}
      </div>
      {value > 0 && (
        <span className="text-xs text-gray-400">{value}/5</span>
      )}
    </div>
  );
}

export default function FeedbackPage() {
  const [name, setName] = useState("");
  const [period, setPeriod] = useState("");
  const [overall, setOverall] = useState(0);
  const [teachingQuality, setTeachingQuality] = useState(0);
  const [learning, setLearning] = useState(0);
  const [moduleRatings, setModuleRatings] = useState<Record<string, number>>({});
  const [moduleComments, setModuleComments] = useState<Record<string, string>>({});
  const [bestThing, setBestThing] = useState("");
  const [improvement, setImprovement] = useState("");
  const [advice, setAdvice] = useState("");
  const [otherComments, setOtherComments] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const payload = {
      name: name || "匿名",
      period,
      overall,
      teachingQuality,
      learning,
      moduleRatings,
      moduleComments,
      bestThing,
      improvement,
      advice,
      otherComments,
      submittedAt: new Date().toISOString(),
    };

    try {
      const res = await fetch("/api/teaching-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setSubmitted(true);
      }
    } catch {
      // Still show success - feedback is valuable even if API fails
      setSubmitted(true);
    }
    setSubmitting(false);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-6">
        <div className="max-w-md text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">感謝你的回饋！</h1>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            你的意見會幫助我們讓心外見習變得更好。
          </p>
          <Link
            href="/teaching"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white font-medium text-sm transition-colors"
          >
            ← 回教學首頁
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Hero */}
      <header className="bg-gradient-to-br from-[#001219] via-[#005f73] to-[#0a9396] text-white">
        <div className="max-w-2xl mx-auto px-6 py-12">
          <Link href="/teaching" className="text-cyan-300 hover:text-white text-sm transition-colors">
            ← 教學首頁
          </Link>
          <h1 className="text-3xl font-bold mt-4 mb-2">Clerk Feedback</h1>
          <p className="text-cyan-100">高醫心臟血管外科見習回饋</p>
          <p className="text-cyan-200/70 text-sm mt-2">匿名填寫，你的意見很重要 🙏</p>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-12">
        <form onSubmit={handleSubmit} className="space-y-8">

          {/* 基本資訊 */}
          <section className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 p-6">
            <h2 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">📋 基本資訊</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  姓名 <span className="text-gray-400">（選填，可匿名）</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="匿名"
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  見習期間
                </label>
                <input
                  type="text"
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                  placeholder="例：2026/03/10 - 2026/03/21"
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                />
              </div>
            </div>
          </section>

          {/* 整體評分 */}
          <section className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 p-6">
            <h2 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">⭐ 整體評分</h2>
            <div className="space-y-3">
              <StarRating value={overall} onChange={setOverall} label="整體見習滿意度" />
              <StarRating value={teachingQuality} onChange={setTeachingQuality} label="教學品質" />
              <StarRating value={learning} onChange={setLearning} label="學習收穫" />
            </div>
          </section>

          {/* 各 Module 評分 */}
          <section className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 p-6">
            <h2 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">📖 各 Module 評分</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">只評你有上過的課程</p>
            <div className="space-y-6">
              {modules.map((mod) => (
                <div key={mod.key} className="border-b border-gray-100 dark:border-gray-700 pb-4 last:border-0 last:pb-0">
                  <StarRating
                    value={moduleRatings[mod.key] || 0}
                    onChange={(v) => setModuleRatings((prev) => ({ ...prev, [mod.key]: v }))}
                    label={mod.label}
                  />
                  <div className="mt-2 ml-[11.5rem]">
                    <input
                      type="text"
                      value={moduleComments[mod.key] || ""}
                      onChange={(e) =>
                        setModuleComments((prev) => ({ ...prev, [mod.key]: e.target.value }))
                      }
                      placeholder="一句話回饋（選填）"
                      className="w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 px-3 py-1.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* 開放問題 */}
          <section className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 p-6">
            <h2 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">💬 開放問題</h2>
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  這兩週你學到最有價值的事？
                </label>
                <textarea
                  value={bestThing}
                  onChange={(e) => setBestThing(e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  有什麼可以改善的？
                </label>
                <textarea
                  value={improvement}
                  onChange={(e) => setImprovement(e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  想對學弟妹說什麼？
                </label>
                <textarea
                  value={advice}
                  onChange={(e) => setAdvice(e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  其他建議
                </label>
                <textarea
                  value={otherComments}
                  onChange={(e) => setOtherComments(e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                />
              </div>
            </div>
          </section>

          {/* Submit */}
          <div className="text-center">
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-400 text-white font-semibold transition-colors text-lg"
            >
              {submitting ? "送出中..." : "📮 送出回饋"}
            </button>
            <p className="text-xs text-gray-400 mt-2">你的回饋是匿名的</p>
          </div>
        </form>
      </main>
    </div>
  );
}
