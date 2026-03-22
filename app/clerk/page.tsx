import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Clerk Orientation — 高醫心臟血管外科",
  description: "高雄醫學大學附設醫院心臟血管外科 Clerk 見習指南",
};

function Section({ title, children, emoji }: { title: string; children: React.ReactNode; emoji: string }) {
  return (
    <section className="mb-12">
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        <span className="text-2xl">{emoji}</span>
        {title}
      </h2>
      {children}
    </section>
  );
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 p-5 ${className}`}>
      {children}
    </div>
  );
}

function PersonBadge({ name, role }: { name: string; role: string }) {
  return (
    <div className="flex items-center gap-3 py-2">
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
        {name[0]}
      </div>
      <div>
        <div className="font-semibold text-gray-900 dark:text-white">{name}</div>
        <div className="text-sm text-gray-500 dark:text-gray-400">{role}</div>
      </div>
    </div>
  );
}

export default function ClerkOrientation() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Hero */}
      <header className="bg-gradient-to-br from-[#001219] via-[#005f73] to-[#0a9396] text-white">
        <div className="max-w-3xl mx-auto px-6 py-16">
          <p className="text-cyan-300 text-sm font-medium mb-2 tracking-wider uppercase">KMUH Cardiovascular Surgery</p>
          <h1 className="text-4xl font-bold mb-3">Clerk 見習指南</h1>
          <p className="text-lg text-cyan-100 mb-1">高雄醫學大學附設醫院 心臟血管外科</p>
          <p className="text-cyan-200/70 text-sm mt-4">歡迎！接下來兩週，你會看到心臟停下來再跳起來。</p>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12">

        {/* 團隊 */}
        <Section title="我們的團隊" emoji="👥">
          <div className="grid sm:grid-cols-2 gap-4">
            <Card>
              <PersonBadge name="潘俊彥" role="科主任" />
              <PersonBadge name="曾政哲" role="科導師" />
            </Card>
            <Card>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">主治醫師群</p>
              <div className="flex flex-wrap gap-2">
                {["謝炯昭", "黃建偉", "曾政哲", "吳柏俞", "潘俊彥", "羅時逸"].map((name) => (
                  <span
                    key={name}
                    className="inline-block px-3 py-1 rounded-full bg-cyan-50 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300 text-sm font-medium"
                  >
                    {name}
                  </span>
                ))}
              </div>
            </Card>
          </div>
          <Card className="mt-4">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">課程負責</p>
            <div className="grid sm:grid-cols-3 gap-3">
              <div className="text-center p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                <div className="text-sm text-gray-500 dark:text-gray-400">教學住診</div>
                <div className="font-semibold text-gray-900 dark:text-white">邱肇基 副教授</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                <div className="text-sm text-gray-500 dark:text-gray-400">文獻研討</div>
                <div className="font-semibold text-gray-900 dark:text-white">陳英富 教授</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                <div className="text-sm text-gray-500 dark:text-gray-400">核心課程（小兒心臟）</div>
                <div className="font-semibold text-gray-900 dark:text-white">羅時逸 醫師</div>
              </div>
            </div>
          </Card>
        </Section>

        {/* 見習重點 */}
        <Section title="兩週你要帶走的東西" emoji="🎯">
          <Card>
            <ul className="space-y-3">
              {[
                { text: "看懂術後 monitor 上的數字 — 哪些要緊、哪些可以等", priority: "high" },
                { text: "至少跟 2-3 台開心手術，知道大步驟在幹什麼", priority: "high" },
                { text: "照顧 1-3 個病人，寫得出 Admission Note 和 Progress Note", priority: "high" },
                { text: "報一次完整的 case，讓主治醫師聽得懂你在講什麼", priority: "medium" },
                { text: "看懂 Echo/Cath 報告的 surgical indication", priority: "medium" },
              ].map((item) => (
                <li key={item.text} className="flex items-start gap-3">
                  <span className={`mt-1 w-2 h-2 rounded-full shrink-0 ${item.priority === "high" ? "bg-red-500" : "bg-yellow-500"}`} />
                  <span className="text-gray-700 dark:text-gray-300">{item.text}</span>
                </li>
              ))}
            </ul>
          </Card>
        </Section>

        {/* 學習優先順序 */}
        <Section title="學習優先順序" emoji="📋">
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { num: "1", label: "核心課程", desc: "上課 > 一切", color: "bg-red-500" },
              { num: "2", label: "門診跟診", desc: "有門診就去", color: "bg-yellow-500" },
              { num: "3", label: "跟刀", desc: "沒課就進刀房", color: "bg-green-500" },
            ].map((item) => (
              <Card key={item.num}>
                <div className="flex items-center gap-3 mb-2">
                  <span className={`w-7 h-7 rounded-full ${item.color} text-white flex items-center justify-center text-sm font-bold`}>
                    {item.num}
                  </span>
                  <span className="font-semibold text-gray-900 dark:text-white">{item.label}</span>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{item.desc}</p>
              </Card>
            ))}
          </div>
          <div className="mt-4 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
            <p className="text-amber-800 dark:text-amber-300 font-medium text-sm">⚠️ 每天必須看 primary care 病人 — 這是你的病人，不是住院醫師的。</p>
          </div>
        </Section>

        {/* 每日流程 */}
        <Section title="一天的節奏" emoji="⏰">
          <Card>
            <div className="space-y-4">
              {[
                { time: "07:00–07:30", activity: "Pre-round", detail: "先看你的病人。看不完就提早來。" },
                { time: "07:30", activity: "晨會", detail: "週四：心外晨報會 + 文獻研討（10ES 討論室）\n週五：大外科晨會（6F 講堂）" },
                { time: "08:30–", activity: "跟刀 / 上課", detail: "依當天排程。沒課就進刀房。" },
                { time: "16:00", activity: "週四", detail: "心臟內外科聯合討論會" },
                { time: "下班前", activity: "寫 Note", detail: "Progress Note 當天完成。隔天交不算準時。" },
              ].map((item) => (
                <div key={item.time + item.activity} className="flex gap-4">
                  <div className="w-28 shrink-0 text-right">
                    <span className="text-sm font-mono text-cyan-600 dark:text-cyan-400">{item.time}</span>
                  </div>
                  <div className="border-l-2 border-cyan-200 dark:border-cyan-800 pl-4">
                    <div className="font-semibold text-gray-900 dark:text-white">{item.activity}</div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 whitespace-pre-line">{item.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </Section>

        {/* 行事曆 */}
        <Section title="兩週行事曆" emoji="📅">
          <Card>
            <h3 className="font-semibold mb-3 text-gray-900 dark:text-white">第一週</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="py-2 px-3 text-left text-gray-500 dark:text-gray-400">時間</th>
                    <th className="py-2 px-3 text-center">一</th>
                    <th className="py-2 px-3 text-center">二</th>
                    <th className="py-2 px-3 text-center">三</th>
                    <th className="py-2 px-3 text-center">四</th>
                    <th className="py-2 px-3 text-center">五</th>
                  </tr>
                </thead>
                <tbody className="text-gray-700 dark:text-gray-300">
                  <tr className="border-b border-gray-100 dark:border-gray-800">
                    <td className="py-2 px-3 text-gray-500 dark:text-gray-400 font-mono text-xs">07:30</td>
                    <td className="py-2 px-3 text-center"></td>
                    <td className="py-2 px-3 text-center"></td>
                    <td className="py-2 px-3 text-center"></td>
                    <td className="py-2 px-3 text-center"><span className="inline-block px-2 py-1 rounded bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-xs">晨會 + 文獻研討</span></td>
                    <td className="py-2 px-3 text-center"></td>
                  </tr>
                  <tr className="border-b border-gray-100 dark:border-gray-800">
                    <td className="py-2 px-3 text-gray-500 dark:text-gray-400 font-mono text-xs">08:30</td>
                    <td className="py-2 px-3 text-center"><span className="inline-block px-2 py-1 rounded bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 text-xs">Orientation</span></td>
                    <td className="py-2 px-3 text-center"></td>
                    <td className="py-2 px-3 text-center"></td>
                    <td className="py-2 px-3 text-center"></td>
                    <td className="py-2 px-3 text-center"></td>
                  </tr>
                  <tr className="border-b border-gray-100 dark:border-gray-800">
                    <td className="py-2 px-3 text-gray-500 dark:text-gray-400 font-mono text-xs">09:00</td>
                    <td className="py-2 px-3 text-center"></td>
                    <td className="py-2 px-3 text-center"><span className="inline-block px-2 py-1 rounded bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 text-xs">教學住診</span></td>
                    <td className="py-2 px-3 text-center"></td>
                    <td className="py-2 px-3 text-center"></td>
                    <td className="py-2 px-3 text-center"></td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 text-gray-500 dark:text-gray-400 font-mono text-xs">16:00</td>
                    <td className="py-2 px-3 text-center"></td>
                    <td className="py-2 px-3 text-center"></td>
                    <td className="py-2 px-3 text-center"></td>
                    <td className="py-2 px-3 text-center"><span className="inline-block px-2 py-1 rounded bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300 text-xs">心內外聯合討論</span></td>
                    <td className="py-2 px-3 text-center"></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>

          <Card className="mt-4">
            <h3 className="font-semibold mb-3 text-gray-900 dark:text-white">第二週</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="py-2 px-3 text-left text-gray-500 dark:text-gray-400">時間</th>
                    <th className="py-2 px-3 text-center">一</th>
                    <th className="py-2 px-3 text-center">二</th>
                    <th className="py-2 px-3 text-center">三</th>
                    <th className="py-2 px-3 text-center">四</th>
                    <th className="py-2 px-3 text-center">五</th>
                  </tr>
                </thead>
                <tbody className="text-gray-700 dark:text-gray-300">
                  <tr className="border-b border-gray-100 dark:border-gray-800">
                    <td className="py-2 px-3 text-gray-500 dark:text-gray-400 font-mono text-xs">07:30</td>
                    <td className="py-2 px-3 text-center"></td>
                    <td className="py-2 px-3 text-center"></td>
                    <td className="py-2 px-3 text-center"></td>
                    <td className="py-2 px-3 text-center"><span className="inline-block px-2 py-1 rounded bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-xs">晨會 + 文獻研討</span></td>
                    <td className="py-2 px-3 text-center"></td>
                  </tr>
                  <tr className="border-b border-gray-100 dark:border-gray-800">
                    <td className="py-2 px-3 text-gray-500 dark:text-gray-400 font-mono text-xs">08:30</td>
                    <td className="py-2 px-3 text-center"><span className="inline-block px-2 py-1 rounded bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 text-xs">核心課程（小兒心臟）</span></td>
                    <td className="py-2 px-3 text-center"></td>
                    <td className="py-2 px-3 text-center"></td>
                    <td className="py-2 px-3 text-center"></td>
                    <td className="py-2 px-3 text-center"></td>
                  </tr>
                  <tr className="border-b border-gray-100 dark:border-gray-800">
                    <td className="py-2 px-3 text-gray-500 dark:text-gray-400 font-mono text-xs">09:00</td>
                    <td className="py-2 px-3 text-center"></td>
                    <td className="py-2 px-3 text-center"><span className="inline-block px-2 py-1 rounded bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 text-xs">教學住診 (ICU)</span></td>
                    <td className="py-2 px-3 text-center"></td>
                    <td className="py-2 px-3 text-center"><span className="inline-block px-2 py-1 rounded bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-xs">文獻研討</span></td>
                    <td className="py-2 px-3 text-center"></td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 text-gray-500 dark:text-gray-400 font-mono text-xs">15:00</td>
                    <td className="py-2 px-3 text-center"></td>
                    <td className="py-2 px-3 text-center"></td>
                    <td className="py-2 px-3 text-center"></td>
                    <td className="py-2 px-3 text-center"></td>
                    <td className="py-2 px-3 text-center"><span className="inline-block px-2 py-1 rounded bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 text-xs">Feedback</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>
        </Section>

        {/* Survival Guide */}
        <Section title="Survival Guide" emoji="🧭">
          <div className="space-y-4">
            <Card>
              <h3 className="font-semibold mb-2 text-gray-900 dark:text-white">🩺 病人照護</h3>
              <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                <li>• 分配 1-3 名病人，出院後重新分配</li>
                <li>• 每天 pre-round 看你的病人：<strong>Vital signs → 管路 → 傷口 → 病人主觀感受</strong></li>
                <li>• 住院病歷（Admission Note）24 小時內完成</li>
                <li>• Progress Note 每天寫，SOAP 格式</li>
              </ul>
            </Card>

            <Card>
              <h3 className="font-semibold mb-2 text-gray-900 dark:text-white">🔪 跟刀</h3>
              <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                <li>• 兩週至少看 <strong>2-3 台開心手術</strong></li>
                <li>• 沒課的時候就進刀房</li>
                <li>• 你跟的主治沒有開心手術 → 去看其他主治的</li>
                <li>• 刷手前先問：「可以上台嗎？」</li>
              </ul>
            </Card>

            <Card>
              <h3 className="font-semibold mb-2 text-gray-900 dark:text-white">📝 記錄與回饋</h3>
              <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                <li>• 見習結束：<strong>準時上網填寫教學單張</strong></li>
                <li>• 上課、開會紀錄 → 教學管理系統詳填，<strong>隔天交出</strong></li>
                <li>• Feedback：第二週週五 15:00-16:00（趙玴祥醫師）</li>
              </ul>
            </Card>

            <Card>
              <h3 className="font-semibold mb-2 text-gray-900 dark:text-white">💡 Pro Tips</h3>
              <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                <li>• <strong>主動聯繫老師</strong> — 不要等人來找你，主動問課程時間</li>
                <li>• <strong>隨時準備 5 分鐘 case report</strong> — 你的病人，你最清楚</li>
                <li>• <strong>Lab data 背起來</strong> — 被問的時候不要翻手機</li>
                <li>• <strong>問問題</strong> — 我們喜歡問問題的 clerk，不喜歡沉默的</li>
              </ul>
            </Card>
          </div>
        </Section>

        {/* 教學資源 */}
        <Section title="教學資源" emoji="📚">
          <Link
            href="/teaching"
            className="group block rounded-xl border-2 border-dashed border-cyan-300 dark:border-cyan-700 p-6 text-center hover:border-cyan-500 dark:hover:border-cyan-500 hover:bg-cyan-50 dark:hover:bg-cyan-900/20 transition-all"
          >
            <div className="text-3xl mb-2">🫀</div>
            <div className="font-semibold text-lg text-gray-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-400">
              心臟外科教學投影片
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              4 個必修 Module + 5 個選修主題 — 互動式 Presentation
            </p>
          </Link>
        </Section>

        {/* Footer */}
        <footer className="text-center text-gray-400 dark:text-gray-600 text-sm pt-8 pb-12 border-t border-gray-200 dark:border-gray-800">
          <p>有問題隨時找趙玴祥醫師 👋</p>
          <p className="mt-1">
            <Link href="/" className="text-cyan-600 dark:text-cyan-400 hover:underline">
              wilsonchao.com
            </Link>
          </p>
        </footer>
      </main>
    </div>
  );
}
