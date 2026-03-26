# Vercel Deployment Guide

## Architecture Overview

```
Browser
  |
  |--- Static pages / SSR ---> Vercel (Serverless)
  |--- /api/simulator/chat ---> Vercel Function ---> Anthropic API
  |--- /api/simulator/debrief -> Vercel Function ---> Anthropic API
  |--- WebSocket (BioGears) ---> wss://tailscale-funnel ---> Mac Mini :8770
```

- **Frontend + API routes**: Deploy to Vercel as a standard Next.js app.
- **BioGears physics server**: Runs on a Mac Mini at home, exposed to the internet via Tailscale Funnel on port 8770. The browser connects directly to the Funnel URL over WebSocket.
- **Anthropic API**: Called server-side from `/api/simulator/chat` and `/api/simulator/debrief` route handlers.

## Environment Variables

Set these in **Vercel Dashboard > Project > Settings > Environment Variables**.

### Required for ICU Simulator

| Variable | Example | Description |
|----------|---------|-------------|
| `ANTHROPIC_API_KEY` | `sk-ant-api03-...` | Anthropic API key for Claude nurse dialogue and debrief generation. Used by `/api/simulator/chat` and `/api/simulator/debrief`. |
| `NEXT_PUBLIC_BIOGEARS_WS_URL` | `wss://zhaoyixiangdemac-mini.tail1416ee.ts.net` | BioGears WebSocket URL. In production, point to the Tailscale Funnel endpoint. If omitted, the client auto-resolves: `ws://localhost:8770` for local dev, Tailscale Funnel URL for remote. |

### Required for Vercel KV (Views, Likes, Subscribe)

| Variable | Example | Description |
|----------|---------|-------------|
| `KV_REST_API_URL` | `https://xyz.kv.vercel-storage.com` | Vercel KV REST endpoint. Auto-set when you link a KV store in the Vercel dashboard. |
| `KV_REST_API_TOKEN` | `AaXX...` | Vercel KV auth token. Auto-set alongside `KV_REST_API_URL`. |

Without KV, the views/likes APIs fall back to in-memory counters (reset on each cold start). Subscribe (`/api/subscribe`) requires KV.

### Optional

| Variable | Default | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_SITE_URL` | `https://wilsonchao.com` | Canonical site URL used in RSS feeds, OG tags, sitemaps. |
| `NEXT_PUBLIC_UMAMI_WEBSITE_ID` | *(none)* | Umami analytics website ID. Omit to disable analytics. |
| `NEXT_PUBLIC_BUTTONDOWN_URL` | *(none)* | Buttondown newsletter subscribe URL shown in UI. |
| `RESEND_API_KEY` | *(none)* | Resend API key for sending welcome emails on subscribe. Omit to skip welcome emails. |
| `TEACHING_PASSWORD` | `840401` | Password for the teaching section auth gate. |
| `NEXT_PUBLIC_GISCUS_REPO` | `tnfsp/new_website` | GitHub repo for Giscus comments. |
| `NEXT_PUBLIC_GISCUS_REPO_ID` | *(none)* | Giscus repo ID. |
| `NEXT_PUBLIC_GISCUS_CATEGORY` | `Announcements` | Giscus discussion category. |
| `NEXT_PUBLIC_GISCUS_CATEGORY_ID` | *(none)* | Giscus category ID. |
| `NEXT_PUBLIC_GISCUS_THEME` | `preferred_color_scheme` | Giscus color theme. |
| `NEXT_PUBLIC_GISCUS_LANG` | `zh-TW` | Giscus UI language. |
| `NEXT_PUBLIC_GISCUS_STRICT` | `0` | Giscus strict title matching (`1` = strict). |
| `NEXT_PUBLIC_GISCUS_MAPPING` | `pathname` | Giscus discussion mapping strategy. |

## BioGears Server Requirements

The BioGears C++ physics server must be running on the Mac Mini for the ICU simulator to function.

### Setup

1. BioGears server listens on `0.0.0.0:8770` (WebSocket).
2. Expose via Tailscale Funnel:
   ```bash
   tailscale funnel --bg 8770
   ```
3. The Funnel URL (e.g. `wss://zhaoyixiangdemac-mini.tail1416ee.ts.net`) is what the browser connects to in production.

### How the URL resolves

The client-side logic in `biogears-engine.ts` resolves the WebSocket URL in this order:

1. If `NEXT_PUBLIC_BIOGEARS_WS_URL` is set, use it directly.
2. If running on `localhost` / `127.0.0.1` / `*.local`, use `ws://localhost:8770`.
3. Otherwise (Vercel, any remote host), use the hardcoded Tailscale Funnel URL.

For production on Vercel, you can either:
- Set `NEXT_PUBLIC_BIOGEARS_WS_URL` explicitly, or
- Rely on the automatic fallback to the Tailscale Funnel URL.

### Important notes

- BioGears init takes approximately 15-20 seconds. The simulator UI shows a loading state during this time.
- If the Mac Mini is off or Tailscale Funnel is not running, the simulator will fail to connect. The UI handles this with an error message.
- The WebSocket connection is browser-to-server (not proxied through Vercel), so Vercel function timeouts do not apply to it.

## Function Timeouts

Configured in `vercel.json`:

| Route | Timeout | Reason |
|-------|---------|--------|
| `/api/simulator/chat` | 60s | Claude API response can be slow under load. The SDK timeout is 30s, plus network overhead. |
| `/api/simulator/debrief` | 60s | Debrief generation uses `max_tokens: 2000` with a detailed system prompt; can take 10-30s. |
| All other routes | 10s | Vercel default for Hobby plan (60s for Pro). |

## Vercel KV Setup

1. In Vercel Dashboard, go to **Storage** > **Create** > **KV**.
2. Link the KV store to your project.
3. `KV_REST_API_URL` and `KV_REST_API_TOKEN` are auto-injected.
4. Used by: `/api/views`, `/api/likes`, `/api/subscribe`.

## Deploy Checklist

1. Push to the connected Git branch (or use `vercel deploy`).
2. Verify environment variables are set in Vercel dashboard.
3. Confirm BioGears server is running and Tailscale Funnel is active.
4. Test the simulator at `/simulator` -- check WebSocket connection and nurse chat.
5. Test blog views/likes (check KV is connected).
6. Test RSS feeds at `/feed.xml`, `/blog/feed.xml`, `/stream/feed.xml`.
