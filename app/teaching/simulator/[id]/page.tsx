import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { scenarios } from "@/lib/simulator/scenarios";
import ModeSelector from "./ModeSelector";

export function generateStaticParams() {
  return Object.keys(scenarios).map((id) => ({ id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const scenario = scenarios[id];
  if (!scenario) {
    return { title: "找不到情境 | ICU 模擬器" };
  }
  return {
    title: `${scenario.title} | ICU 模擬器`,
    description: scenario.subtitle,
    openGraph: {
      title: `${scenario.title} — ICU 模擬器`,
      description: scenario.subtitle,
      type: "website",
    },
  };
}

export default async function SimulatorCasePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const scenario = scenarios[id];
  if (!scenario) notFound();

  return <ModeSelector scenario={scenario} />;
}
