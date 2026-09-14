# CineChive iCloud catalogue

## Architecture

The Mac scanner watches the locally synced iCloud `Inbox` and sends only
inferred names, types, seasons, years, and the configured share URL to
CineChive's authenticated ingestion API when Finder/iCloud reports a change.
It never reads or uploads video bytes.

Production metadata is stored as one private JSON value in **Upstash Redis**.
The Mac sends the complete classification in one authenticated request; the API
reads the catalogue once and writes once only when its contents change. Local
development falls back to the ignored `data/shared-media.json` file. Vercel
deployments deliberately fail instead of writing to temporary function storage
when neither Upstash nor the legacy Blob rollback store is configured.

Create an Upstash Redis database, then copy its REST URL and REST token into the
CineChive project's server-only environment variables. The app uses the legacy
Vercel Blob store only when the Upstash variables are absent, so the paused store
remains available as a rollback source without affecting normal operation.

## Inbox convention

Everything can be dropped into one folder:

```text
CineChive Share/
└── Inbox/
    ├── Inception.2010.1080p.BluRay.mkv
    ├── Heat (1995)/
    │   └── Heat.2160p.mkv
    └── The.Wire/
        └── Season 1/
            ├── The.Wire.S01E01.mkv
            └── The.Wire.S01E02.mkv
```

The scanner recognizes TV patterns including `S01E01`, `1x01`, `Season 1`, and
`S1`. Other supported video files are treated as movies. Files from the same TV
show and season become one catalogue card.

The app organizes titles virtually by media type and TMDB genres. It does not
move iCloud files. This avoids sync churn and lets one title appear under
several genres without duplicating it.

## Sharing

Share `CineChive Share` once with your brother using **View Only**. Every card
uses `ICLOUD_SHARED_FOLDER_URL` as a fallback. iCloud does not expose the public
share URL for a child item through its local filesystem path, so opening the
exact movie or season requires one small sidecar containing its copied iCloud
link.

For a loose movie file, create a text file with the same base name and the
suffix `.icloud-link`:

```text
Inbox/
├── Inception.2010.mkv
└── Inception.2010.icloud-link
```

For a movie folder or TV season folder, place `.cinechive-link` or
`icloud-link.txt` inside that folder:

```text
Inbox/
└── The Wire/
    └── Season 1/
        ├── .cinechive-link
        ├── The.Wire.S01E01.mkv
        └── The.Wire.S01E02.mkv
```

The text file contains only an exact `https://www.icloud.com/...` URL. Apple
does not let you independently share a child item that is already inside a
shared folder, so this direct-link option requires the movie or season folder
to be shared as its own item (outside the shared parent) or an exact URL supplied
by another workflow. The watcher detects the sidecar, updates the existing card,
and marks it as a direct link. Without a sidecar, the card is labelled **Shared
folder** and opens the parent folder instead.

The videos may remain cloud-only with macOS **Optimize Mac Storage** enabled.
The scanner reads filenames and directory metadata only, so it does not trigger
video downloads. iCloud Drive must still be signed in and allowed to synchronize
the folder listing while the Mac is awake.

## Naming and folder detection

The scanner visits every non-hidden directory below `Inbox`; organizational
folders such as `Movies`, `Feature Films`, `TV Shows`, `Animation`, `Anime`, and
`Documentaries` are treated as collections and never become catalog titles.

Preferred movie layout:

```text
Inbox/
└── Animation/
    └── Song of the Sea (2014)/
        └── Song of the Sea (2014).mp4
```

Preferred series layout:

```text
Inbox/
└── Anime/
    └── Dr. Stone (2019)/
        ├── Season 01/
        │   └── Dr. Stone - S01E01.mkv
        └── Season 02/
            └── Dr. Stone - S02E01.mkv
```

Torrent-style names remain supported. Episode patterns such as `S01E01` and
`1x01` take priority over folder hints, and episodes are grouped into one card
per season. Small trilogy folders can contain several movies; each distinct
movie filename becomes its own card. Large non-episodic bundles are skipped to
avoid mistaking courses or archives for films.

Optional marker files provide deterministic overrides:

- `.cinechive-ignore` skips the directory and its entire subtree.
- `.cinechive-collection` makes that directory organizational, so each child
  is scanned as a separate media bundle.
- `.cinechive-title` contains a manual TMDB search title for a difficult movie
  or show folder.

`Extras`, `Samples`, `Featurettes`, `Trailers`, and common sample/opening/ending
filenames are ignored automatically. Symbolic links and hidden directories are
not traversed.

## Local scanner configuration

```env
ICLOUD_MEDIA_FOLDER="/Users/thunderboy/Library/Mobile Documents/com~apple~CloudDocs/CineChive Share"
ICLOUD_SHARED_FOLDER_URL=https://www.icloud.com/iclouddrive/...
CINECHIVE_INGEST_URL=https://cinechive.vercel.app/api/ingest
INGEST_API_SECRET=
```

`INGEST_API_SECRET` must exactly match the server-only value configured in the
Vercel project's Production environment.

Preview classifications without sending anything:

```bash
node --env-file=.env.local scripts/sync-icloud-media.mjs --dry-run
```

Run one production sync:

```bash
npm run sync:icloud
```

## Required Vercel environment variables

```env
TMDB_API_KEY=
INGEST_API_SECRET=
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

Both Upstash values are server-only and must never use the `NEXT_PUBLIC_`
prefix. `BLOB_READ_WRITE_TOKEN` or the OIDC Blob variables remain supported for
rollback, but Upstash takes precedence whenever both REST values are present.

Redeploy CineChive after adding or changing environment variables.

## Exact-title notifications

New catalogue records can trigger an iPhone Web Push alert and an optional
Resend email. Notifications run only after the catalogue write succeeds, and a
provider outage never removes or rolls back a title. Updates and unchanged
rescans do not notify.

Generate one VAPID key pair:

```bash
npx web-push generate-vapid-keys
```

Add these server-side Vercel Production variables:

```env
MEDIA_NOTIFICATIONS_ENABLED=true
CINECHIVE_SITE_URL=https://cinechive.vercel.app
WEB_PUSH_VAPID_PUBLIC_KEY=
WEB_PUSH_VAPID_PRIVATE_KEY=
WEB_PUSH_VAPID_SUBJECT=mailto:your-address@example.com
MEDIA_NOTIFICATION_SETUP_CODE=
```

`MEDIA_NOTIFICATION_SETUP_CODE` is a private pairing code for subscribing a
device; it does not protect or password-lock the catalogue. Share the code only
with the intended recipient.

For email fallback, verify a sender domain in Resend and add:

```env
RESEND_API_KEY=
MEDIA_NOTIFICATION_EMAIL=brother@example.com
MEDIA_NOTIFICATION_FROM=CineChive <notifications@your-domain.example>
```

Before enabling subscriptions, import an existing library without alerts:

```bash
node --env-file=.env.local scripts/sync-icloud-media.mjs --mute-notifications
```

On an iPhone, open CineChive in Safari, use **Share → Add to Home Screen**,
launch it from the new Home Screen icon, select **Get new-title alerts**, enter
the family notification code, and allow notifications. Each later alert opens
the exact CineChive title page; its primary button opens the corresponding
iCloud item or shared-folder fallback.

Web Push delivery still follows the recipient's iOS notification and Focus
settings. Email is the independent fallback when configured.

## Sync request budget

The scanner sends one bulk request per changed filesystem snapshot instead of
one request per title. During that request, existing records reuse their TMDB
metadata. The API performs one catalogue read and no write when the resulting
records are unchanged; a changed catalogue produces one write. While the watch
process remains alive, repeated Finder events with an identical snapshot are
discarded locally before any network request.

## Update when files change

Replace the absolute-path placeholders in
`scripts/com.cinechive.icloud-sync.plist.example`. The Node executable on this
Mac is `/opt/homebrew/bin/node`. Then copy the completed file to
`~/Library/LaunchAgents/com.cinechive.icloud-sync.plist` and load it:

```bash
launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/com.cinechive.icloud-sync.plist
```

The launch agent performs one reconciliation at login, then waits for macOS
filesystem events. Changes are debounced for five seconds so a single iCloud
operation produces one sync. Launchd restarts the watcher after failures.

## Mac performance

The watcher remains idle until macOS reports a change, using a small amount of
memory and effectively no CPU while waiting. Each triggered scan recursively
reads directory entries to a maximum depth of six. It does not download, hash,
decode, copy, or open video files. TMDB requests run on Vercel, and ingestion
requests are sequential.
