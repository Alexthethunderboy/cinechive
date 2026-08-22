import { watch } from 'node:fs';
import { access, readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { classifyMediaPaths, isMediaFile } from './lib/icloud-media-classifier.mjs';

const LINK_FILE_NAMES = ['.cinechive-link', 'icloud-link.txt'];
const MEDIA_LINK_SUFFIX = '.icloud-link';
const IGNORE_MARKER = '.cinechive-ignore';
const COLLECTION_MARKER = '.cinechive-collection';
const TITLE_OVERRIDE_FILE = '.cinechive-title';
const dryRun = process.argv.includes('--dry-run');
const watchMode = process.argv.includes('--watch');
const WATCH_DEBOUNCE_MS = 5_000;

function requireSetting(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required`);
  return value;
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

async function discoverInbox(inboxPath) {
  const queue = [{ absolutePath: inboxPath, relativePath: '' }];
  const directories = [];
  const mediaPaths = [];
  const collectionDirectories = [];
  const titleOverrides = [];
  let queueIndex = 0;

  while (queueIndex < queue.length) {
    const current = queue[queueIndex];
    queueIndex += 1;
    const entries = await readdir(current.absolutePath, { withFileTypes: true });
    if (entries.some((entry) => entry.isFile() && entry.name === IGNORE_MARKER)) continue;

    directories.push(current.absolutePath);
    if (current.relativePath && entries.some((entry) => entry.isFile() && entry.name === COLLECTION_MARKER)) {
      collectionDirectories.push(current.relativePath);
    }

    const titleEntry = entries.find((entry) => entry.isFile() && entry.name === TITLE_OVERRIDE_FILE);
    if (titleEntry && current.relativePath) {
      const title = (await readFile(path.join(current.absolutePath, titleEntry.name), 'utf8')).trim();
      if (title && title.length <= 200) titleOverrides.push([current.relativePath, title]);
    }

    for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
      if (entry.name.startsWith('.') || entry.isSymbolicLink()) continue;
      const absolutePath = path.join(current.absolutePath, entry.name);
      const relativePath = current.relativePath
        ? path.join(current.relativePath, entry.name)
        : entry.name;
      if (entry.isFile() && isMediaFile(entry.name)) mediaPaths.push(relativePath);
      else if (entry.isDirectory()) queue.push({ absolutePath, relativePath });
    }
  }

  return { directories, mediaPaths, collectionDirectories, titleOverrides };
}

async function findItemLink(inboxPath, item) {
  if (item.media_type === 'movie') {
    // A loose movie needs a filename-matched sidecar because a generic link
    // in Inbox would incorrectly point every card at the same destination.
    const mediaPath = path.join(inboxPath, item.source_name);
    const mediaSidecar = `${mediaPath.slice(0, -path.extname(mediaPath).length)}${MEDIA_LINK_SUFFIX}`;
    try {
      const link = parseIcloudLink(await readFile(mediaSidecar, 'utf8'));
      if (link) return link;
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
  }

  if (item.linkDirectorySegments.length === 0) return null;
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

  const discovery = await discoverInbox(inboxPath);
  const classification = classifyMediaPaths(discovery.mediaPaths, {
    collectionDirectories: discovery.collectionDirectories,
    titleOverrides: discovery.titleOverrides,
  });
  const items = [];
  for (const classifiedItem of classification.items) {
    const itemLink = await findItemLink(inboxPath, classifiedItem);
    items.push({
      query: classifiedItem.query,
      media_type: classifiedItem.media_type,
      season_number: classifiedItem.season_number,
      year: classifiedItem.year,
      source_key: classifiedItem.source_key,
      source_name: classifiedItem.source_name,
      icloud_link: itemLink ?? fallbackIcloudLink,
      link_scope: itemLink ? 'item' : 'library',
      replaces_source_keys: classifiedItem.replaces_source_keys,
    });
  }
  return { items, skipped: classification.skipped, directories: discovery.directories };
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

  const scan = await scanInbox(root, fallbackIcloudLink);
  const { items } = scan;
  if (dryRun) {
    // Keep share URLs out of terminal logs while showing every inferred match.
    const preview = items.map((item) => {
      const safeItem = { ...item };
      delete safeItem.icloud_link;
      return safeItem;
    });
    console.log(JSON.stringify({
      inbox: path.join(root, 'Inbox'),
      media_items: items.length,
      skipped_bundles: scan.skipped,
      items: preview,
    }, null, 2));
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
    const discovery = await discoverInbox(inboxPath);
    const directories = new Set(discovery.directories);
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
