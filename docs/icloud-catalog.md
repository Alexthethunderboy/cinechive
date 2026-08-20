# CineChive iCloud catalogue

## Architecture

The Mac scanner watches the locally synced iCloud `Inbox` and sends only
inferred names, types, seasons, years, and the configured share URL to
CineChive's authenticated ingestion API when Finder/iCloud reports a change.
It never reads or uploads video bytes.

Production metadata is stored in a **Private Vercel Blob** named
`cinechive/shared-media.json`. Local development falls back to the ignored
`data/shared-media.json` file. Vercel deployments deliberately fail instead of
writing to their temporary function filesystem when Blob is not configured.

Create a Private Blob store from the CineChive project under **Vercel → Storage
→ Create Database → Blob → Private**. Vercel injects the required credentials
into the project. See [Vercel Private Blob setup](https://vercel.com/docs/vercel-blob/private-storage).

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
uses `ICLOUD_SHARED_FOLDER_URL` by default. An optional `.cinechive-link` text
file beside a title can override the parent URL if a stable item-specific link
is available.

The videos may remain cloud-only with macOS **Optimize Mac Storage** enabled.
The scanner reads filenames and directory metadata only, so it does not trigger
video downloads. iCloud Drive must still be signed in and allowed to synchronize
the folder listing while the Mac is awake.

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
```

The connected Private Blob store supplies `BLOB_STORE_ID`; the Vercel SDK
obtains a short-lived OIDC token at runtime. A manually configured
`BLOB_READ_WRITE_TOKEN` remains supported for local or non-Vercel runtimes.

Redeploy CineChive after adding or changing environment variables.

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
