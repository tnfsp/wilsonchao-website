"use client";

import { useState, useRef, useEffect } from "react";
import { Scenario, VitalSigns } from "@/lib/simulator/types";
import VitalsPanel from "./VitalsPanel";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function SelfStudyPlayer({
  scenario,
}: {
  scenario: Scenario;
}) {
  const startVitals: VitalSigns = {
    hr: 80,
    bpSys: 120,
    bpDia: 70,
    spo2: 99,
    cvp: 8,
    temp: 36.5,
    chestTube: 50,
    uo: 50,
    ...scenario.nodes[scenario.startNode].vitals,
  };

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [vitals, setVitals] = useState<VitalSigns>(startVitals);
  const [prevVitals, setPrevVitals] = useState<VitalSigns | undefined>();
  const [started, setStarted] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const scenarioContext = `病人：${scenario.patient.age}歲${scenario.patient.sex === "M" ? "男" : "女"}性
手術：${scenario.patient.surgery}
時間：${scenario.patient.postOpDay}
病史：${scenario.patient.history}
教學重點：${scenario.tags.join("、")}
目標：讓 clerk 學會鑑別 ${scenario.title} 的相關概念`;

  const sendMessage = async (text: string, allMessages?: Message[]) => {
    const userMsg: Message = { role: "user", content: text };
    const updatedMessages = [...(allMessages || messages), userMsg];
    setMessages(updatedMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/simulator/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedMessages,
          scenario: scenarioContext,
          vitals,
        }),
      });

      if (!res.ok) throw new Error("API error");

      const data = await res.json();
      const assistantMsg: Message = {
        role: "assistant",
        content: data.message,
      };

      setMessages([...updatedMessages, assistantMsg]);

      if (data.vitals) {
        setPrevVitals(vitals);
        setVitals((v) => ({ ...v, ...data.vitals }));
      }
    } catch {
      setMessages([
        ...updatedMessages,
        {
          role: "assistant",
          content: "⚠️ 連線有問題，請稍後再試。",
        },
      ]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleStart = () => {
    setStarted(true);
    sendMessage("（我是 clerk，剛到 ICU 準備接班。請開始交班給我。）", []);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    sendMessage(input.trim());
  };

  const restart = () => {
    setMessages([]);
    setVitals(startVitals);
    setPrevVitals(undefined);
    setStarted(false);
  };

  if (!started) {
    return (
      <div className="min-h-screen bg-[#001219] text-white flex items-center justify-center px-4">
        <div className="max-w-lg text-center">
          <div className="text-5xl mb-4">🏥</div>
          <h1 className="text-2xl font-bold mb-2">{scenario.title}</h1>
          <p className="text-gray-400 mb-2">{scenario.subtitle}</p>
          <div className="text-sm text-gray-500 mb-6">
            {scenario.patient.age}{scenario.patient.sex} · {scenario.patient.surgery} · {scenario.patient.postOpDay}
          </div>

          <div className="bg-white/[0.03] border border-white/10 rounded-xl p-5 mb-6 text-left">
            <p className="text-gray-300 text-sm leading-relaxed">
              你是值班的住院醫師。一個學長會帶你處理這個 ICU 病人。
            </p>
            <p className="text-gray-400 text-sm mt-3">
              💡 這是練習，不是考試。答錯沒關係 — 犯錯才是最好的學習。
            </p>
            <p className="text-gray-500 text-xs mt-3">
              ⏱ 約 10-15 分鐘 · 用打字跟學長對話 · Vital signs 會根據你的決策變化
            </p>
          </div>

          <button
            onClick={handleStart}
            className="w-full bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl py-3 font-medium transition"
          >
            開始接班 →
          </button>

          <a
            href="/teaching/simulator"
            className="block mt-4 text-gray-500 hover:text-white text-sm transition"
          >
            ← 返回情境列表
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#001219] text-white flex flex-col">
      {/* Top bar */}
      <div className="sticky top-0 z-10 bg-[#001219]/95 backdrop-blur border-b border-white/5">
        <div className="max-w-3xl mx-auto px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a
              href="/teaching/simulator"
              className="text-gray-500 hover:text-white transition text-sm"
            >
              ← 返回
            </a>
            <span className="text-gray-600">|</span>
            <span className="text-sm text-gray-400">{scenario.title}</span>
            <span className="text-xs bg-green-500/10 text-green-400 px-2 py-0.5 rounded-full">
              🎒 自學模式
            </span>
          </div>
          <button
            onClick={restart}
            className="text-xs text-gray-500 hover:text-white transition"
          >
            🔄 重來
          </button>
        </div>
      </div>

      {/* Vitals - collapsible on mobile */}
      <div className="max-w-3xl mx-auto w-full px-4 py-3">
        <VitalsPanel vitals={vitals} prevVitals={prevVitals} />
      </div>

      {/* Chat area */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        <div className="max-w-3xl mx-auto space-y-4">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                  msg.role === "user"
                    ? "bg-cyan-600/20 text-cyan-100"
                    : "bg-white/[0.05] text-gray-200"
                }`}
              >
                {msg.role === "assistant" && (
                  <div className="text-xs text-amber-400/70 mb-1">
                    👨‍⚕️ 學長
                  </div>
                )}
                <div className="text-sm leading-relaxed whitespace-pre-wrap">
                  {msg.content}
                </div>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-white/[0.05] rounded-2xl px-4 py-3">
                <div className="text-xs text-amber-400/70 mb-1">👨‍⚕️ 學長</div>
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" />
                  <span
                    className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"
                    style={{ animationDelay: "0.1s" }}
                  />
                  <span
                    className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"
                    style={{ animationDelay: "0.2s" }}
                  />
                </div>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="sticky bottom-0 bg-[#001219]/95 backdrop-blur border-t border-white/5 px-4 py-3">
        <form
          onSubmit={handleSubmit}
          className="max-w-3xl mx-auto flex gap-2"
        >
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="跟學長說你的想法⋯⋯"
            disabled={loading}
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent disabled:opacity-50 text-sm"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="bg-cyan-600 hover:bg-cyan-500 disabled:bg-gray-700 text-white rounded-xl px-5 py-3 font-medium transition disabled:cursor-not-allowed text-sm"
          >
            送出
          </button>
        </form>
      </div>
    </div>
  );
}
