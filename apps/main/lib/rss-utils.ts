/**
 * RSS utility helpers.
 *
 * Kept separate from lib/rss.ts so that feed routes can import only what they need
 * without pulling in Next.js server dependencies into shared utilities.
 */

/**
 * Replace relative image `src` attributes in HTML with absolute URLs.
 *
 * Blog content stores images as root-relative paths (e.g. `/content/blog/slug/image.jpg`).
 * RSS readers need fully qualified URLs to display images correctly.
 *
 * Only rewrites `src` values that start with `/` (root-relative).
 * Leaves `http://`, `https://`, and `data:` URLs untouched.
 *
 * @param html    Raw HTML string from contentHtml field
 * @param baseUrl Site origin, e.g. "https://wilsonchao.com" (no trailing slash)
 * @returns       HTML with all root-relative src attributes replaced by absolute URLs
 */
export function makeAbsoluteImageUrls(html: string, baseUrl: string): string {
  // Match src="..." and src='...' where the value starts with /
  return html.replace(
    /(<img[^>]*\ssrc=)(["'])(\/[^"']*)\2/gi,
    (_match, prefix, quote, path) => `${prefix}${quote}${baseUrl}${path}${quote}`
  );
}
