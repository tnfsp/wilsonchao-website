"use client";

import dynamic from "next/dynamic";

const RevealSlides = dynamic(
  () => import("@/components/teaching/RevealSlides"),
  { ssr: false }
);

export default function SlidePageClient({ slidesHtml }: { slidesHtml: string }) {
  return <RevealSlides slidesHtml={slidesHtml} />;
}
