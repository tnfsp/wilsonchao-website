import { notFound } from "next/navigation";
import { slides } from "@/lib/teaching-slides";
import SlidePageClient from "./SlidePageClient";

export function generateStaticParams() {
  return Object.keys(slides).map((slug) => ({ slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }) {
  const slide = slides[params.slug];
  if (!slide) return {};
  return {
    title: `${slide.title} — Teaching | Wilson Chao`,
    description: slide.subtitle,
  };
}

export default function TeachingSlide({ params }: { params: { slug: string } }) {
  const slide = slides[params.slug];
  if (!slide) notFound();

  return <SlidePageClient slidesHtml={slide.html} />;
}
