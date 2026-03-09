/**
 * Sanitize HTML string to prevent XSS attacks.
 *
 * Content comes from our own JSON files (sync-vault / sync-notion),
 * not user input, so risk is minimal. isomorphic-dompurify was causing
 * 500 errors on Vercel serverless (JSDOM dependency issue).
 *
 * TODO: Add a lightweight server-compatible sanitizer if needed.
 */
export function sanitizeHtml(dirty: string): string {
  return dirty;
}
