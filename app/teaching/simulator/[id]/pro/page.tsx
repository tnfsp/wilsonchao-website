import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { proScenarios, proScenarioList } from "@/lib/simulator/scenarios/pro";
import ProPageClient from "./ProPageClient";

// ─── Static params ─────────────────────────────────────────────────────────────

export function generateStaticParams() {
  return proScenarioList.map((s) => ({ id: s.id }));
}

// ─── Metadata ─────────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const scenario = proScenarios[id];

  if (!scenario) {
    return { title: "找不到情境 | ICU 模擬器 Pro" };
  }

  const difficultyLabel = {
    beginner: "初階",
    intermediate: "中階",
    advanced: "高階",
  }[scenario.difficulty];

  return {
    title: `${scenario.title} | ICU 模擬器 Pro`,
    description: `${scenario.subtitle}。難度：${difficultyLabel}，時長 ${scenario.duration}。${scenario.tags.slice(0, 4).join("・")}`,
    openGraph: {
      title: `${scenario.title} — ICU 模擬器 Pro`,
      description: scenario.subtitle,
      type: "website",
    },
  };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function ProModePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Verify scenario exists (show 404 for unknown IDs at build/request time)
  const scenario = proScenarios[id];
  if (!scenario) notFound();

  return (
    <ProPageClient
      id={id}
      scenarioMeta={{
        title: scenario.title,
        subtitle: scenario.subtitle,
        difficulty: scenario.difficulty,
        duration: scenario.duration,
        tags: scenario.tags,
      }}
    />
  );
}
