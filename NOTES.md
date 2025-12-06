# Project notes

- Stack: Next.js 16 (App Router) + TypeScript + Tailwind (sepia/murmur-inspired styling).
- Routes live: `/`, `/blog`, `/blog/[slug]`, `/daily`, `/daily/[slug]`, `/about`, `/links`, `/now`, `/murmur` (redirect), `/feed.xml`.
- Notion sync (`scripts/sync-notion.ts`): pulls Blog + SiteConfig + Projects (Daily) with image download, unique slug generation, cleanup of deleted posts, full Daily content; envs required: NOTION_TOKEN, NOTION_BLOG_DATABASE_ID, NOTION_SITE_CONFIG_DATABASE_ID, NOTION_PROJECTS_DATABASE_ID.
- Scheduled sync: GitHub Actions `.github/workflows/sync-notion.yml` runs daily at 00:00/12:00 UTC, commits content changes, triggers Vercel build.
- UI: homepage shows 3 latest Blog/Daily with “查看更多”; Blog/Daily listing has pagination; mobile nav is collapsible; murmur preview optional via feed; view counters via `/api/views` (Vercel KV, in-memory fallback).
- Dev: `npm install`, `npm run dev` (Turbopack). Lint/build: `npm run lint` / `npm run build`.

## Next tasks
1) Ensure Vercel env vars set (Notion + KV + NEXT_PUBLIC_SITE_URL). Add GitHub Secrets for the Notion sync workflow if not already.
2) If friendly slugs are desired, fill Slug in Notion DBs; otherwise auto-generated unique slugs stay.
3) Confirm `old.wilsonchao.com` keeps serving the Notaku backup; main domain now on Vercel.
4) If moving to Cloudflare KV in future, swap `/api/views` storage accordingly.
