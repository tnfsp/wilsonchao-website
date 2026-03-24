import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { proScenarios, proScenarioList } from "@/lib/simulator/scenarios/pro";
import StandardPageClient from "./StandardPageClient";

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
    title: `${displayTitle} | Standard Mode`,
    description: `${scenario.hiddenSubtitle ?? scenario.subtitle} — Standard teaching mode.`,
  };
}

export default async function StandardModePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const scenario = proScenarios[id];
  if (!scenario) notFound();

  return <StandardPageClient id={id} />;
}
