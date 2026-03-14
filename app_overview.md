# CineChive App Overview

**Subtitle:** Technical & Non-Technical Documentation
**Version:** 0.1.1 (Post-Auth Audit)
**Target Audience:** Engineering, Product, and Design enthusiasts.

---

## 1. Non-Technical & Feature Overview

### Core Concept
CineChive V2 is an editorial-grade library and curation platform meticulously designed for the dedicated cinephile. Instead of functioning merely as a dry database, CineChive provides high-fidelity "Collections," "Release Radars," and "Registries" steeped in a rich, cinematic tone. It shifts the paradigm of discovery from strict, traditional genres (Action, Drama) toward an emotive, aesthetic-driven classification system (e.g., "Visceral", "Noir", "Ethereal").

### Key Features & Sections

#### Cinematic Discovery Mode (The Home Page)
A dynamic, immersive hub that lets users toggle between three core perspectives seamlessly:
- **New & Trending (Broadcast):** An up-to-the-minute feed of popular media, presented in a visually arresting layout.
- **Cinematic Selections (Registries):** Curated grids of movies and TV shows matching specific aesthetic classifications.
- **Release Radar:** A forward-looking tracking system for upcoming movies (spanning the next year and beyond), featuring an anticipation meter to gauge hype.

#### Global Deep Search (The "Cinema Graph")
- **The "Everything Bar":** A robust, unified search interface linking movies, TV shows, actors, and composers.
- **Advanced Filtering:** Capabilities like "Mood Filtering" (search by classification rather than just title) and a "Hidden Gems" toggle (surfacing media with high ratings but low popularity).
- **Relational Traversal:** The ability to navigate the interwoven "Cinema Graph," allowing users to jump from a film seamlessly to the works of its original composer.

#### Deep Media Details
When inspecting a specific title, users are presented with enriched data views far beyond a standard synopsis:
- **Technical Lab:** Showcases the specialized cinematic formats of the production (e.g., Camera types like ARRI or Panavision, 70mm/35mm/IMAX formats, and Sound Mixes like Dolby Atmos).
- **Deep Dive / Trivia:** Surrounds the media with behind-the-scenes production context, casting history, and easter eggs.
- **Reviews:** Dedicated blocks for robust critical and user reviews.

#### Classifications Registry
A visual index dedicated to the application's unique mood-based system. It sits alongside traditional TMDB genres, offering visually distinct cards that act as clickable portals to newly curated search results.

#### Interactive User Ecosystem
- **Profile & Dashboard:** Spaces for tracking personal cinematic logs, creating favorite lists, and reviewing personal archives.
- **Pulse Feed:** A lively stream of recent activities, logs, or trending shifts within the CineChive community.
- **Unified Auth Notices:** Interaction-level gatekeeping. Actions like "Saving to Library" or "Setting Reminders" now trigger elegant "Authentication required" toasts via `sonner` if performed by a guest.

---

## 2. Technical Overview

### Core Architecture & Stack
- **Framework:** Next.js 15+ (utilizing the App Router paradigm).
- **Core Language:** TypeScript 5+.
- **Library Base:** React 19 / React DOM 19.
- **Styling:** Vanilla CSS for precise design control, alongside utility processors where needed.
- **Animations:** Framer Motion (v12), powering sophisticated fluid shared-element poster transitions and auth-flow entry animations.

### Authentication & Security (Audit V1)
CineChive implements a "Privacy First" username-based authentication system backed by **Supabase**.
- **Internal Mapping:** To allow username-only login while maintaining Supabase compatibility, usernames are mapped to a secure internal format: `u.username@enterarchive.com`. 
- **Auto-Login Flow:** New curators are automatically logged in and redirected to the home page immediately after a successful signup.
- **Route Protection:** Handled via `middleware.ts`, which enforces auth requirements for all sensitive routes while allowing guest access to discovery and search.
- **Error Handling:** Robust `try/catch/finally` patterns in server actions handle Next.js `redirect()` markers correctly, preventing UI state freezes.

### Backend, Database, & State Management
- **Primary Backend-as-a-Service:** Supabase.
  - Utilizes `@supabase/ssr` for secure server-side session management.
  - Roles: Handles robust JWT-based authentication and profile management via database triggers (preventing race conditions).
- **Data Fetching & State:** `@tanstack/react-query` ensures intelligent client-side caching and background re-fetching.
- **Notifications:** Integrated `sonner` for high-fidelity toast notifications across the entire app.

### Directory Structure & Application Logic

#### `/src/app` (Application Routing & Server Context)
- `/(auth)`: Isolated layout for auth pages, removing main navigation to focus on entry.
- `/media/[type]/[id]`: Dynamic routes handling individual detail pages.
- `/auth/actions.ts`: Centralized, secure authentication logic (Signup, Login, SignOut).
- `/lib/actions.ts` & `/app/actions/radar-actions.ts`: Mutative actions (Archive, Reminders) with built-in auth verification and informative return signatures.

#### `/src/components` (UI Architecture)
- Organized granularly by feature: 
  - `/home` & `/cinema`: The entry-point feeds (Discovery, Trending, Radar).
  - `/media`: Detail-intensive views including the Technical Lab, Deep Dive trivia, and Review sections.
  - `/animation` & `/audio`: Specialized modules for exploring animation-specific metadata and high-fidelity audio specs (Dolby, DTS) respectively.
  - `/ui`: Foundations (GlassPanel, custom typography primitives, cinematic loaders).
  - `/pulse`: Real-time social activity components.

#### `/src/lib` (Core Logic & Services)
- `SearchService.ts`: Powering the "Cinema Graph." It doesn't just return titles; it manages relational traversal between directors, composers, and performers across different media types.
- `DeepDataService.ts`: A hybrid service that extracts IMAX/70mm technical metadata and production trivia. It leverages a Supabase-backed persistence layer to minimize external API hits.
- `design-tokens.ts`: The bridge between design and code, defining the aesthetic tokens (vibrant but curated HSL colors, custom bezier curves for motion).

### Integrations & External Services
- **TMDB API:** The backbone pipeline for media metadata, strictly routed via server actions for security.
- **Spotify API:** Targeted integration to connect film composers directly to their discographies, closing the loop in the "Cinema Graph."
- **OMDB API:** Used as a secondary data source for production technicals and ratings reconciliation.

---

## 3. Design Philosophy & Aesthetics
- **Cinematic Fidelity:** The app targets the "curator" persona, opting for a dark, high-contrast, atmospheric palette rather than a utilitarian grid.
- **Motion as Narrative:** Transitions aren't just decorative; they guide the user's eye from a global search into a focused media detail view using shared-element layout transitions.
- **Glassmorphism:** A signature look utilizing background blurs and border highlights to create depth without clutter.
- **Micro-Interaction System:** Every tap triggers a subtle, physics-based reaction (scaling, haptic-style micro-vibrations in the UI) to provide a premium, tactile feel.
