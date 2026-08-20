import { watch } from 'node:fs';
import { access, readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const MEDIA_EXTENSIONS = new Set([
  '.avi', '.m4v', '.mkv', '.mov', '.mp4', '.mpeg', '.mpg', '.ts', '.webm',
]);
const LINK_FILE_NAMES = ['.cinechive-link', 'icloud-link.txt'];
const MAX_SCAN_DEPTH = 6;
const dryRun = process.argv.includes('--dry-run');
const watchMode = process.argv.includes('--watch');
const WATCH_DEBOUNCE_MS = 5_000;

function requireSetting(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required`);
  return value;
}

function isMediaFile(name) {
  return MEDIA_EXTENSIONS.has(path.extname(name).toLowerCase());
}

function parseIcloudLink(value) {
  try {
    const url = new URL(value.trim());
    const isIcloudHost = url.hostname === 'icloud.com' || url.hostname.endsWith('.icloud.com');
    return url.protocol === 'https:' && isIcloudHost ? url.toString() : null;
  } catch {
    return null;
  }
}

function cleanTitle(value) {
  return value
    .replace(path.extname(value), '')
    .replace(/[._]+/g, ' ')
    .replace(/[\[(](?:2160p|1080p|720p|480p|uhd|bluray|blu-ray|webrip|web-dl|x26[45]|hevc)[^\])]*[\])]/gi, ' ')
    .replace(/\s+(?:2160p|1080p|720p|480p|uhd|bluray|blu-ray|webrip|web-dl|hdr|dv|x26[45]|hevc|aac|dts).*$/i, '')
    .replace(/\s+/g, ' ')
    .replace(/^[-\s]+|[-\s]+$/g, '')
    .trim();
}

function normalizeKey(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function extractYear(value) {
  const match = value.match(/(?:^|[^0-9])((?:19|20)\d{2})(?:[^0-9]|$)/);
  return match ? Number(match[1]) : null;
}

function stripYear(value, year) {
  return year
    ? value.replace(new RegExp(`\\s*[\\[(]?${year}[\\])]?(?:\\s|$)`), ' ').replace(/\s+/g, ' ').trim()
    : value;
}

async function collectMediaFiles(directory, relativeRoot = '', depth = 0) {
  if (depth > MAX_SCAN_DEPTH) return [];
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    if (entry.name.startsWith('.') || entry.isSymbolicLink()) continue;
    const absolutePath = path.join(directory, entry.name);
    const relativePath = path.join(relativeRoot, entry.name);
    if (entry.isFile() && isMediaFile(entry.name)) {
      files.push({ absolutePath, relativePath });
    } else if (entry.isDirectory()) {
      files.push(...await collectMediaFiles(absolutePath, relativePath, depth + 1));
    }
  }
  return files;
}

async function collectDirectories(directory, depth = 0) {
  if (depth > MAX_SCAN_DEPTH) return [];
  const entries = await readdir(directory, { withFileTypes: true });
  const directories = [directory];

  for (const entry of entries) {
    if (entry.name.startsWith('.') || entry.isSymbolicLink() || !entry.isDirectory()) continue;
    directories.push(...await collectDirectories(path.join(directory, entry.name), depth + 1));
  }
  return directories;
}

function classifyFile(relativePath) {
  const segments = relativePath.split(path.sep);
  const fileName = segments.at(-1) ?? relativePath;
  const stem = fileName.slice(0, -path.extname(fileName).length);
  const episodeMatch = stem.match(/^(.*?)(?:[. _-]+)s(\d{1,3})e\d{1,3}(?:[. _-]|$)/i)
    ?? stem.match(/^(.*?)(?:[. _-]+)(\d{1,3})x\d{1,3}(?:[. _-]|$)/i);
  const seasonSegmentIndex = segments.findIndex((segment) => /^(?:season\s*|s)(\d{1,3})$/i.test(segment));

  if (episodeMatch || seasonSegmentIndex > 0) {
    const seasonFromPath = seasonSegmentIndex > 0
      ? Number(segments[seasonSegmentIndex].match(/\d+/)?.[0])
      : null;
    const seasonNumber = seasonFromPath ?? Number(episodeMatch?.[2] ?? 0);
    const rawShowTitle = seasonSegmentIndex > 0
      ? segments[seasonSegmentIndex - 1]
      : episodeMatch?.[1] ?? stem;
    const year = extractYear(rawShowTitle);
    const query = stripYear(cleanTitle(rawShowTitle), year);
    return {
      query,
      media_type: 'tv',
      season_number: seasonNumber,
      year,
      source_key: `tv:${normalizeKey(query)}:${year ?? 'unknown'}:season:${seasonNumber}`,
      source_name: relativePath,
      linkDirectorySegments: seasonSegmentIndex > 0 ? segments.slice(0, seasonSegmentIndex + 1) : segments.slice(0, -1),
    };
  }

  // A top-level folder is treated as the movie identity; otherwise the file
  // name is used. This supports both Inbox/Heat.mkv and Inbox/Heat/Heat.mkv.
  const rawMovieTitle = segments.length > 1 ? segments[0] : stem;
  const year = extractYear(rawMovieTitle);
  const query = stripYear(cleanTitle(rawMovieTitle), year);
  return {
    query,
    media_type: 'movie',
    season_number: null,
    year,
    source_key: `movie:${normalizeKey(query)}:${year ?? 'unknown'}`,
    source_name: relativePath,
    linkDirectorySegments: segments.slice(0, -1),
  };
}

async function findItemLink(inboxPath, item) {
  const directory = path.join(inboxPath, ...item.linkDirectorySegments);
  for (const name of LINK_FILE_NAMES) {
    try {
      const link = parseIcloudLink(await readFile(path.join(directory, name), 'utf8'));
      if (link) return link;
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
  }
  return null;
}

async function scanInbox(root, fallbackIcloudLink) {
  const inboxPath = path.join(root, 'Inbox');
  try {
    await access(inboxPath);
  } catch {
    throw new Error(`Inbox folder is missing at ${inboxPath}`);
  }

  const files = await collectMediaFiles(inboxPath);
  const grouped = new Map();
  for (const file of files) {
    const classification = classifyFile(file.relativePath);
    if (!classification.query || grouped.has(classification.source_key)) continue;
    const itemLink = await findItemLink(inboxPath, classification);
    grouped.set(classification.source_key, {
      query: classification.query,
      media_type: classification.media_type,
      season_number: classification.season_number,
      year: classification.year,
      source_key: classification.source_key,
      source_name: classification.source_name,
      icloud_link: itemLink ?? fallbackIcloudLink,
    });
  }
  return [...grouped.values()];
}

async function ingest(item, ingestUrl, secret) {
  const response = await fetch(ingestUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secret}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(item),
    signal: AbortSignal.timeout(20_000),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`${item.source_key}: ${result.error ?? `HTTP ${response.status}`}`);
  return result;
}

async function syncOnce() {
  const root = requireSetting('ICLOUD_MEDIA_FOLDER');
  const configuredFallback = requireSetting('ICLOUD_SHARED_FOLDER_URL');
  const fallbackIcloudLink = parseIcloudLink(configuredFallback);
  if (!fallbackIcloudLink) throw new Error('ICLOUD_SHARED_FOLDER_URL must be a valid HTTPS iCloud URL');

  const items = await scanInbox(root, fallbackIcloudLink);
  if (dryRun) {
    // Keep share URLs out of terminal logs while showing every inferred match.
    const preview = items.map((item) => {
      const safeItem = { ...item };
      delete safeItem.icloud_link;
      return safeItem;
    });
    console.log(JSON.stringify({ inbox: path.join(root, 'Inbox'), items: preview }, null, 2));
    return;
  }

  const ingestUrl = process.env.CINECHIVE_INGEST_URL?.trim() || 'https://cinechive.vercel.app/api/ingest';
  const secret = requireSetting('INGEST_API_SECRET');
  let created = 0;
  let existing = 0;
  const failures = [];

  // Only names and tiny link files are inspected. Video bytes are never read.
  // Requests stay sequential to minimize CPU/network use on older Macs.
  for (const item of items) {
    try {
      const result = await ingest(item, ingestUrl, secret);
      if (result.created) created += 1;
      else existing += 1;
    } catch (error) {
      failures.push(error instanceof Error ? error.message : String(error));
    }
  }

  console.log(`iCloud sync complete: ${created} added, ${existing} unchanged, ${failures.length} failed.`);
  failures.forEach((failure) => console.error(failure));
  return failures.length;
}

async function watchInbox() {
  const inboxPath = path.join(requireSetting('ICLOUD_MEDIA_FOLDER'), 'Inbox');
  await access(inboxPath);

  let debounceTimer;
  let syncRunning = false;
  let syncQueued = false;
  const watchers = new Map();

  const runSync = async () => {
    if (syncRunning) {
      syncQueued = true;
      return;
    }

    syncRunning = true;
    try {
      await syncOnce();
    } catch (error) {
      // A temporary network or metadata failure should not stop future events.
      console.error(`iCloud sync failed: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      syncRunning = false;
      if (syncQueued) {
        syncQueued = false;
        await runSync();
      }
    }
  };

  const scheduleSync = () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(async () => {
      await refreshWatchers();
      await runSync();
    }, WATCH_DEBOUNCE_MS);
  };

  const refreshWatchers = async () => {
    const directories = new Set(await collectDirectories(inboxPath));
    for (const [directory, watcher] of watchers) {
      if (!directories.has(directory)) {
        watcher.close();
        watchers.delete(directory);
      }
    }

    for (const directory of directories) {
      if (watchers.has(directory)) continue;
      const directoryWatcher = watch(directory, scheduleSync);
      directoryWatcher.on('error', (error) => {
        console.error(`iCloud watcher failed for ${directory}: ${error.message}`);
        process.exitCode = 1;
        directoryWatcher.close();
      });
      watchers.set(directory, directoryWatcher);
    }
  };

  await runSync();
  // Watch only existing directories rather than using recursive fs.watch,
  // which can exhaust descriptors in large iCloud trees on some macOS builds.
  await refreshWatchers();

  const shutdown = () => {
    clearTimeout(debounceTimer);
    watchers.forEach((watcher) => watcher.close());
  };
  process.once('SIGINT', shutdown);
  process.once('SIGTERM', shutdown);

  console.log(`Watching ${inboxPath} for iCloud changes.`);
}

const operation = watchMode ? watchInbox() : syncOnce().then((failures) => {
  if (failures > 0) process.exitCode = 1;
});

operation.catch((error) => {
  console.error(`iCloud sync failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
