# Enterarchive (CineChive)

A cinematic archive and social discovery app built with Next.js App Router. It currently defaults to a local-first browser archive; Supabase can be re-enabled later for synced accounts and social data.

## Tech Stack

- Next.js 16 + React 19 + TypeScript
- Supabase (Auth, Postgres, RLS, Realtime)
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
   - `cp .env.local.example .env.local`
3. Fill required variables in `.env.local`:
   - `TMDB_API_KEY` for movies, television, search, and most discovery pages
   - No Supabase variables are required for the default local archive mode
   - `NEXT_PUBLIC_SUPABASE_ENABLED=true`, `NEXT_PUBLIC_SUPABASE_URL`, and `NEXT_PUBLIC_SUPABASE_ANON_KEY` to deliberately restore synced accounts and social features
   - `NEXT_PUBLIC_SUPABASE_DISABLED=true` always overrides the enable flag
4. Start dev server:
   - `npm run dev`

## Database Migrations

Run SQL files in `supabase/migrations` in timestamp order.

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
| Cross-device sync, account recovery, email/push notifications | No | Requires a backend and delivery service |
| Durable public collection links | No | Requires server storage; local mode supports text sharing and JSON export |

Local data is private to a browser profile and is removed if that site storage is cleared. Use Profile → Settings → Export archive for backups. To restore Supabase later, set `NEXT_PUBLIC_SUPABASE_ENABLED=true` with valid credentials and run the existing migrations. Leaving `NEXT_PUBLIC_SUPABASE_DISABLED=true` keeps local mode active even when credentials are present.

## Self-hosted iCloud catalog

The private `/shared` catalog can run without Supabase using Private Vercel Blob
in production and an ignored JSON file during local development. A macOS launch
agent scans a locally synced iCloud `Inbox` every ten minutes and submits smart
movie/TV classifications for TMDB enrichment. See
[docs/icloud-catalog.md](docs/icloud-catalog.md) for the folder convention,
security settings, and launch-agent setup.

## Notes

- Shared collections are resolved through the `get_shared_collection` RPC.
- Auth and route access are enforced in `src/proxy.ts`.
- Community features (follow/reaction/comment notifications) rely on RLS policies in Supabase.
