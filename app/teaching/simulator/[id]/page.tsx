import { notFound } from "next/navigation";
import { scenarios } from "@/lib/simulator/scenarios";
import CasePlayer from "@/components/simulator/CasePlayer";

export function generateStaticParams() {
  return Object.keys(scenarios).map((id) => ({ id }));
}

export default async function SimulatorCasePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const scenario = scenarios[id];
  if (!scenario) notFound();

  return <CasePlayer scenario={scenario} />;
}
