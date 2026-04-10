# Enterarchive (CineChive)

A cinematic archive and social discovery app built with Next.js App Router and Supabase.

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
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `TMDB_API_KEY`
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

## Notes

- Shared collections are resolved through the `get_shared_collection` RPC.
- Auth and route access are enforced in `src/middleware.ts`.
- Community features (follow/reaction/comment notifications) rely on RLS policies in Supabase.
