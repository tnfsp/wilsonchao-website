import type { Metadata } from "next";
import SimulatorListClient from "./SimulatorListClient";

export const metadata: Metadata = {
  title: "ICU Case Simulator | 互動式值班模擬",
  description:
    "互動式 ICU 值班模擬器 — 真實值班情境，真實臨床決策。練習術後出血、心包填塞、敗血性休克等場景。",
  openGraph: {
    title: "ICU Case Simulator",
    description: "互動式 ICU 值班模擬器 — 真實值班情境，真實臨床決策。",
    type: "website",
  },
};

export default function SimulatorPage() {
  return <SimulatorListClient />;
}
