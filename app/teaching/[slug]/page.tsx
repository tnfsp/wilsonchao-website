import { notFound } from "next/navigation";
import { slides } from "@/lib/teaching-slides";
import SlidePageClient from "./SlidePageClient";

export function generateStaticParams() {
  return Object.keys(slides).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const slide = slides[slug];
  if (!slide) return {};
  return {
    title: `${slide.title} — Teaching | Wilson Chao`,
    description: slide.subtitle,
  };
}

export default async function TeachingSlide({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const slide = slides[slug];
  if (!slide) notFound();

  return <SlidePageClient slidesHtml={slide.html} />;
}
