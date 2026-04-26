import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { scenarios } from "@/lib/simulator/scenarios";
import { proScenarios, proScenarioList } from "@/lib/simulator/scenarios/pro";
import ModeSelector from "./ModeSelector";
import DifficultySelect from "./DifficultySelect";

export function generateStaticParams() {
  const classicIds = Object.keys(scenarios).map((id) => ({ id }));
  const proIds = proScenarioList.map((s) => ({ id: s.id }));
  return [...classicIds, ...proIds];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;

  const proScenario = proScenarios[id];
  if (proScenario) {
    const displayTitle = proScenario.hiddenTitle ?? proScenario.title;
    return {
      title: `${displayTitle} | ICU Simulator`,
      description: proScenario.hiddenSubtitle ?? proScenario.subtitle,
    };
  }

  const classicScenario = scenarios[id];
  if (classicScenario) {
    return {
      title: `${classicScenario.title} | ICU Simulator`,
      description: classicScenario.subtitle,
    };
  }

  return { title: "Not Found | ICU Simulator" };
}

export default async function SimulatorCasePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Pro scenario → DifficultySelect
  const proScenario = proScenarios[id];
  if (proScenario) {
    return (
      <DifficultySelect
        scenarioId={id}
        title={proScenario.hiddenTitle ?? proScenario.title}
        subtitle={proScenario.hiddenSubtitle ?? proScenario.subtitle}
      />
    );
  }

  // Classic scenario → ModeSelector (legacy)
  const classicScenario = scenarios[id];
  if (classicScenario) {
    return <ModeSelector scenario={classicScenario} />;
  }

  notFound();
}
