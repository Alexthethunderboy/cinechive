# CineChive product overview

CineChive defaults to a local-first browser archive. Catalogue discovery uses external media APIs, while personal library records, journal entries, collections and reviews remain in the browser. Discover → save → journal → export is the core personal workflow. Clearing site storage can remove that archive; JSON export/import provides manual backup and transfer.

## Operating modes

- Default local mode: no Supabase account or shared database is required for personal records. Catalogue API configuration is still needed for relevant discovery routes.
- Optional Supabase mode: shared accounts, community, follows, comments, reactions and durable public links depend on a configured backend and reviewed authorization policies. They are not default local-mode capabilities.
- Separate `/shared` catalogue: Upstash/Web Push and optional email services support the self-hosted iCloud catalogue workflow; see [its guide](docs/icloud-catalog.md).

The earlier Supabase/social overview described a broader backend-oriented direction. It should not be read as a claim that every feature is available in local mode. See the [README](README.md) for the current feature matrix, environment configuration, data-loss limits and existing verification commands. No validation run is reported here.
