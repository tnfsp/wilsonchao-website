"use client";

import dynamic from "next/dynamic";
import { useParams } from "next/navigation";

const GameLayout = dynamic(
  () =>
    import("@/components/simulator/GameLayout").then((mod) => mod.GameLayout),
  { ssr: false }
);

export default function SimulatorPage() {
  const params = useParams();
  const id = params.id as string;

  return <GameLayout scenarioId={id} />;
}
