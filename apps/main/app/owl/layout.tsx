/**
 * /owl nested layout — scopes the two serif typefaces to the entire /owl/* tree.
 *
 * Noto Serif TC  → CJK body text (--font-owl-serif-zh)
 * Newsreader     → Latin headings, pull-quotes, bylines (--font-owl-serif-en)
 *
 * Both CSS variables are injected on the `.owl-page` wrapper div so they never
 * reach the root <body>, leaving the site-wide Geist / Noto Sans TC untouched.
 */

import { Noto_Serif_TC, Newsreader } from "next/font/google";

// CJK serif — body text, flowing prose
const notoSerifTC = Noto_Serif_TC({
  variable: "--font-owl-serif-zh",
  weight: ["400", "600", "700"],
  subsets: ["latin"],
  // CJK subsets are loaded on demand via unicode-range; preload off to avoid
  // downloading the entire CJK font on every page load.
  preload: false,
});

// Latin serif — headings, pull-quotes, byline accents
const newsreader = Newsreader({
  variable: "--font-owl-serif-en",
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  subsets: ["latin"],
  display: "swap",
});

export default function OwlLayout({ children }: { children: React.ReactNode }) {
  return (
    // The two font CSS variables are attached here; .owl-page applies the paper
    // background + ink text color that define the /owl visual identity.
    <div className={`owl-page ${notoSerifTC.variable} ${newsreader.variable}`}>
      {children}
    </div>
  );
}
