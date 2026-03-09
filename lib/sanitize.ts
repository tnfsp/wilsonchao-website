import DOMPurify from "isomorphic-dompurify";

/**
 * Sanitize HTML string to prevent XSS attacks.
 * Allows safe HTML tags/attributes used in blog/journal content.
 */
export function sanitizeHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ADD_TAGS: ["iframe"],
    ADD_ATTR: ["allow", "allowfullscreen", "frameborder", "scrolling", "target"],
  });
}
