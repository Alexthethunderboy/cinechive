# CineChive

A cinematic archive and social discovery app built with Next.js App Router. It currently defaults to a local-first browser archive; Supabase can be re-enabled later for synced accounts and social data.

[Try CineChive](https://cinechive.vercel.app)

![cinechive — existing portfolio capture](https://raw.githubusercontent.com/Alexthethunderboy/Portfolio/b4c8f605bdb311f2be00d14855b4914a3d662cf9/public/projects/previews/cinechive.webp)

Existing portfolio capture, verified 8 October 2026; not evidence of current uptime or completed validation.

**Walkthrough:** discover a title → save it → add a journal entry → export your archive from Profile → Settings.

## Tech Stack

- Next.js 16 + React 19 + TypeScript
- Optional Supabase backend for shared identity and social features; disabled by default
- TanStack React Query
- Tailwind CSS v4 + Framer Motion

## Project Structure

- `src/app`: App Router pages and route handlers
- `src/components`: UI and feature components
- `src/lib`: server actions, API adapters, and domain services
- `supabase/schema.sql`: base schema reference
- `supabase/migrations`: canonical SQL migrations

## Local Setup

1. Install dependencies:
   - `npm install`
2. Create local env file:
   - `cp .env.example .env.local`
3. Fill required variables in `.env.local`:
   - `TMDB_API_KEY` for movies, television, search, and most discovery pages
   - No Supabase variables are required for the default local archive mode
   - `NEXT_PUBLIC_SUPABASE_ENABLED=true`, `NEXT_PUBLIC_SUPABASE_URL`, and `NEXT_PUBLIC_SUPABASE_ANON_KEY` to deliberately restore synced accounts and social features
   - `NEXT_PUBLIC_SUPABASE_DISABLED=true` always overrides the enable flag
4. Start dev server:
   - `npm run dev`

## Database Migrations

Optional backend only. The migration sequence has not been verified as a fresh-database bootstrap in this documentation work. Review the schema, migration dependencies and authorization policies in an isolated development database before enabling shared accounts. Do not run migrations against a hosted database merely to preview the default local archive.

Recent contract-hardening migration:
- `supabase/migrations/20260408_contract_hardening.sql`

It includes:
- notifications insert policy alignment
- reactions activity type constraint alignment
- dispatches `updated_at` support
- collections policy cleanup
- shared collection token RPC (`get_shared_collection`)

## Scripts

- `npm run dev`: start local app
- `npm run build`: production build
- `npm run start`: run production build
- `npm run lint`: lint workspace
- `npm run test:scanner`: iCloud filename classifier unit tests
- `npx playwright test`: existing home journeys on Chromium and Mobile Chrome; install dependencies and Playwright browsers first and configure catalogue access. The Playwright config starts the dev server with Supabase disabled by default. These checks were not run for this documentation change.

## Local archive mode

Supabase is opt-in. Unless `NEXT_PUBLIC_SUPABASE_ENABLED=true` is set, CineChive creates a private curator identity and stores personal records in a versioned browser archive. Public catalogue routes bypass Supabase entirely. If a re-enabled Supabase backend stops responding, the client falls back to the local archive after a bounded health check.

| Area | Works without Supabase? | Dependency |
| --- | --- | --- |
| Home trending feeds (movies, TV, anime, animation, documentaries) | Yes | TMDB and/or AniList |
| Release Radar and future releases | Yes | TMDB and AniList |
| Search, Discover, styles, genres, and selections | Yes | TMDB and/or AniList |
| Public media and person detail pages | Yes | TMDB/AniList; optional Watchmode/OMDb enrichment |
| Trailers, cast/crew, seasons, and external watch links | Yes, when supplied by the catalogue APIs | External catalogue APIs |
| Local curator identity, profile, and avatar | Yes, on one browser | Browser storage; uploaded avatars are resized before storage |
| Library, journal, collections, likes/dislikes, reminders, and personal reviews | Yes, on one browser | Browser storage |
| Local reminder activity and journal history | Yes | Calculated from the browser archive |
| Backup and manual transfer | Yes | JSON export/import in Profile → Settings |
| Community, follows, comments, reposts, and reactions between people | No | Requires a shared database and trusted identity |
| Cross-device sync and account recovery | No | Requires a shared identity backend |
| New-title alerts for the `/shared` family catalogue | Yes | Upstash, Web Push; optional Resend fallback |
| Durable public collection links | No | Requires server storage; local mode supports text sharing and JSON export |

Local data is private to a browser profile and is removed if that site storage is cleared. Use Profile → Settings → Export archive for backups. To restore Supabase later, set `NEXT_PUBLIC_SUPABASE_ENABLED=true` with valid credentials and run the existing migrations. Leaving `NEXT_PUBLIC_SUPABASE_DISABLED=true` keeps local mode active even when credentials are present.

## Self-hosted iCloud catalog

The public, no-login `/shared` catalog can run without Supabase using Upstash
Redis in production and an ignored JSON file during local development. A macOS
launch agent watches a locally synced iCloud `Inbox` and submits one bulk set of
smart movie/TV classifications for TMDB enrichment when files change. See
[docs/icloud-catalog.md](docs/icloud-catalog.md) for the folder convention,
security settings, launch-agent setup, and exact-title notification flow.

## Notes

- Shared collections are resolved through the `get_shared_collection` RPC.
- Auth and route access are enforced in `src/proxy.ts`.
- Community features (follow/reaction/comment notifications) rely on RLS policies in Supabase.

---

Built by [Thunderboy](https://thunderboy.vercel.app).
