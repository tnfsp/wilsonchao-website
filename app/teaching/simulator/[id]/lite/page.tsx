import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { proScenarios, proScenarioList } from "@/lib/simulator/scenarios/pro";
import Link from "next/link";

export function generateStaticParams() {
  return proScenarioList.map((s) => ({ id: s.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const scenario = proScenarios[id];
  if (!scenario) return { title: "Not Found | ICU Simulator" };
  const displayTitle = scenario.hiddenTitle ?? scenario.title;
  return {
    title: `${displayTitle} | Lite Mode`,
    description: `${scenario.hiddenSubtitle ?? scenario.subtitle} — Interactive story mode.`,
  };
}

export default async function LiteModePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const scenario = proScenarios[id];
  if (!scenario) notFound();

  return (
    <div className="min-h-screen bg-[#001219] text-white flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="text-5xl mb-6">{"\uD83D\uDC65"}</div>
        <h1 className="text-2xl font-bold mb-2">Lite Mode</h1>
        <p className="text-emerald-400 font-medium mb-2">{"\u4E92\u52D5\u6545\u4E8B"}</p>
        <p className="text-gray-400 mb-8">
          {"5 \u5206\u9418\u4E92\u52D5\u9AD4\u9A57\uFF0C\u9078\u64C7\u5F71\u97FF\u7D50\u5C40\u3002\u958B\u767C\u4E2D\uFF0C\u656C\u8ACB\u671F\u5F85\u3002"}
        </p>
        <Link
          href={`/teaching/simulator/${id}`}
          className="inline-block px-6 py-3 bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 hover:border-white/20 rounded-xl text-white transition"
        >
          &larr; {"\u8FD4\u56DE\u9078\u64C7"}
        </Link>
      </div>
    </div>
  );
}
