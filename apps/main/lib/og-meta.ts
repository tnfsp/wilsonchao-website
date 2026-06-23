import type { BlogEntry } from "@/lib/content";

/**
 * Layered metadata fallback chain for OG cards.
 *
 * This is the *logic* borrowed from 林協霆's og-img-gen (the tool itself is not
 * imported): resolve the best available descriptive line for a post by walking
 * ordered layers and degrading gracefully, instead of trusting any single field.
 *
 * og-img-gen's chain resolves academic *citation* metadata via Crossref. Wilson's
 * blog posts carry no DOI (they're essays/weekly/diary), so the citation layer is
 * intentionally omitted here — its real payoff is the research/citation pipeline,
 * not the essay blog. If a post ever declares a `doi`, add a Crossref layer at the
 * top of `resolveOgMeta` (see `crossrefSubtitle` note below).
 *
 * Layers, most-specific first:
 *   1. excerpt        — hand/owl-written summary
 *   2. description    — SEO meta description
 *   3. content lead   — first real paragraph of the markdown body
 *   4. html lead      — first paragraph of rendered HTML (tags stripped)
 *   5. site tagline   — last-resort brand line
 */

const SITE_TAGLINE = "心臟外科醫師・對世界好奇的人";

function clean(s: string | undefined | null): string {
  if (!s) return "";
  return s.replace(/\s+/g, " ").trim();
}

function firstParagraph(markdown: string | undefined): string {
  if (!markdown) return "";
  const para = markdown
    .split(/\n{2,}/)
    .map((p) => p.trim())
    // skip headings, images, code fences, blockquotes, list markers
    .find((p) => p && !/^(#{1,6}\s|!\[|```|>\s|[-*]\s)/.test(p));
  return clean(para ?? "");
}

function stripHtmlLead(html: string | undefined): string {
  if (!html) return "";
  const match = html.match(/<p[^>]*>([\s\S]*?)<\/p>/i)?.[1] ?? html;
  return clean(match.replace(/<[^>]*>/g, ""));
}

/**
 * Resolve the subtitle/description line for a post's OG card.
 * Returns "" only if every layer is empty (caller may then hide the line).
 */
export function resolveOgMeta(entry: BlogEntry | null | undefined): string {
  if (!entry) return SITE_TAGLINE;

  const layers: Array<() => string> = [
    () => clean(entry.excerpt),
    () => clean(entry.description),
    () => firstParagraph(entry.content),
    () => stripHtmlLead(entry.contentHtml),
    () => SITE_TAGLINE,
  ];

  for (const layer of layers) {
    const value = layer();
    if (value) return value;
  }
  return SITE_TAGLINE;
}
