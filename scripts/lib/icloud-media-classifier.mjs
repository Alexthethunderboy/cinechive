import path from 'node:path';

export const MEDIA_EXTENSIONS = new Set([
  '.avi', '.m4v', '.mkv', '.mov', '.mp4', '.mpeg', '.mpg', '.ts', '.webm',
]);

const COLLECTION_NAMES = new Set([
  'anime',
  'animation',
  'documentaries',
  'documentary',
  'feature films',
  'films',
  'movies',
  'tv',
  'tv series',
  'tv shows',
]);

const SUPPLEMENTAL_DIRECTORIES = new Set([
  'bonus',
  'extras',
  'featurettes',
  'samples',
  'special features',
  'trailers',
]);

const GENERIC_FILE_TITLES = new Set([
  'etrg',
  'movie',
  'sample',
  'title',
  'video',
]);

const SUPPLEMENTAL_FILE_PATTERN = /(?:^|[\s._-])(?:featurette|nced|ncop|preview|sample|trailer)(?:[\s._-]|$)/i;
const COURSE_PATTERN = /(?:^|[\s._-])(?:course|masterclass|tutorial|udemy)(?:[\s._-]|$)/i;
const EPISODE_PATTERN = /^(.*?)(?:[. _-]+)(?:s(\d{1,3})e(\d{1,4})|(\d{1,3})x(\d{1,4}))(?:v\d+)?(?:[. _-]|$)/i;

function normalizedDirectoryName(value) {
  return value.toLowerCase().replace(/[._-]+/g, ' ').replace(/\s+/g, ' ').trim();
}

export function isMediaFile(name) {
  return MEDIA_EXTENSIONS.has(path.extname(name).toLowerCase());
}

export function normalizeKey(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export function extractYear(value) {
  const match = value.match(/(?:^|[^0-9])((?:19|20)\d{2})(?:[^0-9]|$)/);
  return match ? Number(match[1]) : null;
}

export function stripYear(value, year) {
  return year
    ? value.replace(new RegExp(`\\s*[\\[(]?${year}[\\])]?(?:\\s|$)`), ' ').replace(/\s+/g, ' ').trim()
    : value;
}

// This receives a filename stem or directory name. It deliberately does not
// call path.extname(): dotted titles such as “True.Detective” are not files.
export function cleanTitle(value) {
  return value
    .replace(/^\s*(?:\[[^\]]+\]\s*)+/, '')
    .replace(/[._]+/g, ' ')
    .replace(/\[(?:[^\]]*?(?:2160p|1080p|720p|480p|uhd|bluray|blu-ray|webrip|web-dl|x26[45]|hevc|multi-subs|dual-audio)[^\]]*)\]/gi, ' ')
    .replace(/\((?:[^)]*?(?:2160p|1080p|720p|480p|uhd|bluray|blu-ray|webrip|web-dl|x26[45]|hevc)[^)]*)\)/gi, ' ')
    .replace(/(?:^|\s)(?:2160p|1080p|720p|480p|uhd|bluray|blu-ray|webrip|web-dl|web|hdr|dv|x26[45]|hevc|aac|ddp?\d(?:\.\d)?|dts|atmos)\b.*$/i, ' ')
    .replace(/\b(?:extended|japanese|repack|remastered)\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .replace(/^[-\s]+|[-\s]+$/g, '')
    .trim();
}

function parseEpisode(relativePath) {
  const fileName = relativePath.split(path.sep).at(-1) ?? relativePath;
  const stem = fileName.slice(0, -path.extname(fileName).length);
  const match = stem.match(EPISODE_PATTERN);
  if (!match) return null;

  const seasonNumber = Number(match[2] ?? match[4]);
  const rawTitle = match[1];
  const year = extractYear(rawTitle);
  const query = stripYear(cleanTitle(rawTitle), year);
  if (!query || !Number.isInteger(seasonNumber)) return null;
  return { query, seasonNumber, year };
}

function parseSeasonNumber(value) {
  const normalized = value.replace(/[._-]+/g, ' ');
  const match = normalized.match(/(?:^|\s)(?:season\s*|s)(\d{1,3})(?:\s|$)/i);
  return match ? Number(match[1]) : null;
}

function removeSeasonDescriptor(value) {
  return value
    .replace(/\bseasons?\s*\d+(?:\s*[-–]\s*\d+)?\b.*$/i, '')
    .replace(/\bs\d{1,3}\b.*$/i, '')
    .replace(/\bcomplete\b.*$/i, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function isSupplemental(relativePath) {
  const segments = relativePath.split(path.sep);
  const directorySegments = segments.slice(0, -1).map(normalizedDirectoryName);
  const fileName = segments.at(-1) ?? relativePath;
  return directorySegments.some((segment) => SUPPLEMENTAL_DIRECTORIES.has(segment)) ||
    SUPPLEMENTAL_FILE_PATTERN.test(fileName);
}

function isGenericTitle(value) {
  const normalized = normalizeKey(value);
  return !normalized || GENERIC_FILE_TITLES.has(normalized) || /^\d+$/.test(normalized);
}

function findBundleContext(relativePath, collectionDirectories) {
  const segments = relativePath.split(path.sep);
  let deepestCollectionIndex = -1;

  for (let index = 0; index < segments.length - 1; index += 1) {
    const directoryPath = segments.slice(0, index + 1).join(path.sep);
    if (
      COLLECTION_NAMES.has(normalizedDirectoryName(segments[index])) ||
      collectionDirectories.has(directoryPath)
    ) {
      deepestCollectionIndex = index;
    }
  }

  const bundleIndex = deepestCollectionIndex + 1;
  const bundleIsFile = bundleIndex === segments.length - 1;
  const bundlePath = bundleIsFile
    ? relativePath
    : segments.slice(0, bundleIndex + 1).join(path.sep);
  const bundleName = bundleIsFile
    ? (segments.at(-1) ?? relativePath).slice(0, -path.extname(segments.at(-1) ?? relativePath).length)
    : segments[bundleIndex];
  const section = deepestCollectionIndex >= 0 ? segments[deepestCollectionIndex] : null;

  return { bundlePath, bundleName, bundleIsFile, section };
}

function titleFrequency(entries) {
  const frequencies = new Map();
  for (const entry of entries) {
    const key = normalizeKey(entry.query);
    if (!key) continue;
    const current = frequencies.get(key);
    if (current) current.count += 1;
    else frequencies.set(key, { query: entry.query, count: 1 });
  }
  return [...frequencies.values()].sort((a, b) => b.count - a.count || b.query.length - a.query.length)[0]?.query ?? null;
}

function yearFromPaths(paths, preferredTitle) {
  const preferred = paths.find((relativePath) => {
    const stem = path.basename(relativePath, path.extname(relativePath));
    return normalizeKey(stem).startsWith(normalizeKey(preferredTitle));
  });
  const candidates = preferred ? [preferred, ...paths] : paths;
  for (const candidate of candidates) {
    const year = extractYear(candidate);
    if (year) return year;
  }
  return null;
}

function movieCandidate(relativePath) {
  const stem = path.basename(relativePath, path.extname(relativePath));
  const year = extractYear(stem);
  const query = stripYear(cleanTitle(stem), year);
  return isGenericTitle(query) ? null : { query, year, relativePath };
}

function bundleAlias(bundleName) {
  const parentheticals = [...bundleName.matchAll(/\(([^)]+)\)/g)].map((match) => cleanTitle(match[1]));
  return parentheticals.find((candidate) => (
    candidate &&
    !extractYear(candidate) &&
    parseSeasonNumber(candidate) === null &&
    !/\bseasons?\s*\d/i.test(candidate) &&
    !/^(?:multi subs|dual audio|complete)$/i.test(candidate)
  )) ?? null;
}

function linkDirectoryFor(relativePath, seasonNumber, bundlePath, bundleIsFile) {
  const segments = relativePath.split(path.sep);
  if (seasonNumber !== null) {
    const seasonIndex = segments.findIndex((segment) => parseSeasonNumber(segment) === seasonNumber);
    if (seasonIndex >= 0) return segments.slice(0, seasonIndex + 1);
  }
  return bundleIsFile ? segments.slice(0, -1) : bundlePath.split(path.sep);
}

// Reproduces the previous source-key behavior so a successful corrected ingest
// can atomically replace malformed records that are already in the catalog.
function legacySourceKey(relativePath) {
  const segments = relativePath.split(path.sep);
  const fileName = segments.at(-1) ?? relativePath;
  const stem = fileName.slice(0, -path.extname(fileName).length);
  const episodeMatch = stem.match(/^(.*?)(?:[. _-]+)s(\d{1,3})e\d{1,3}(?:[. _-]|$)/i)
    ?? stem.match(/^(.*?)(?:[. _-]+)(\d{1,3})x\d{1,3}(?:[. _-]|$)/i);
  const seasonSegmentIndex = segments.findIndex((segment) => /^(?:season\s*|s)(\d{1,3})$/i.test(segment));
  const legacyClean = (value) => value
    .replace(path.extname(value), '')
    .replace(/[._]+/g, ' ')
    .replace(/[\[(](?:2160p|1080p|720p|480p|uhd|bluray|blu-ray|webrip|web-dl|x26[45]|hevc)[^\])]*[\])]/gi, ' ')
    .replace(/\s+(?:2160p|1080p|720p|480p|uhd|bluray|blu-ray|webrip|web-dl|hdr|dv|x26[45]|hevc|aac|dts).*$/i, '')
    .replace(/\s+/g, ' ')
    .replace(/^[-\s]+|[-\s]+$/g, '')
    .trim();

  if (episodeMatch || seasonSegmentIndex > 0) {
    const seasonFromPath = seasonSegmentIndex > 0
      ? Number(segments[seasonSegmentIndex].match(/\d+/)?.[0])
      : null;
    const seasonNumber = seasonFromPath ?? Number(episodeMatch?.[2] ?? 0);
    const rawShowTitle = seasonSegmentIndex > 0
      ? segments[seasonSegmentIndex - 1]
      : episodeMatch?.[1] ?? stem;
    const year = extractYear(rawShowTitle);
    const query = stripYear(legacyClean(rawShowTitle), year);
    return `tv:${normalizeKey(query)}:${year ?? 'unknown'}:season:${seasonNumber}`;
  }

  const rawMovieTitle = segments.length > 1 ? segments[0] : stem;
  const year = extractYear(rawMovieTitle);
  const query = stripYear(legacyClean(rawMovieTitle), year);
  return `movie:${normalizeKey(query)}:${year ?? 'unknown'}`;
}

function mergeDuplicateItems(items) {
  const merged = new Map();
  for (const item of items) {
    const existing = merged.get(item.source_key);
    if (!existing) {
      merged.set(item.source_key, item);
      continue;
    }
    existing.replaces_source_keys = [...new Set([
      ...existing.replaces_source_keys,
      ...item.replaces_source_keys,
    ])];
    if (item.source_name.localeCompare(existing.source_name) < 0) {
      existing.source_name = item.source_name;
      existing.linkDirectorySegments = item.linkDirectorySegments;
    }
  }
  return [...merged.values()];
}

export function classifyMediaPaths(relativePaths, options = {}) {
  const collectionDirectories = new Set(options.collectionDirectories ?? []);
  const titleOverrides = new Map(options.titleOverrides ?? []);
  const bundles = new Map();
  const skipped = [];

  for (const relativePath of [...relativePaths].sort()) {
    if (!isMediaFile(relativePath) || isSupplemental(relativePath)) continue;
    const context = findBundleContext(relativePath, collectionDirectories);
    const bundle = bundles.get(context.bundlePath) ?? { ...context, paths: [] };
    bundle.paths.push(relativePath);
    bundles.set(context.bundlePath, bundle);
  }

  const items = [];
  for (const bundle of bundles.values()) {
    const override = titleOverrides.get(bundle.bundlePath)?.trim() || null;
    const episodeEntries = bundle.paths
      .map((relativePath) => ({ relativePath, episode: parseEpisode(relativePath) }))
      .filter((entry) => entry.episode !== null);

    if (episodeEntries.length > 0) {
      const seasons = new Map();
      for (const entry of episodeEntries) {
        const seasonNumber = entry.episode.seasonNumber;
        const season = seasons.get(seasonNumber) ?? [];
        season.push(entry);
        seasons.set(seasonNumber, season);
      }

      for (const [seasonNumber, seasonEntries] of seasons) {
        const query = override ?? bundleAlias(bundle.bundleName) ?? titleFrequency(seasonEntries.map((entry) => entry.episode));
        if (!query) continue;
        const seasonPaths = seasonEntries.map((entry) => entry.relativePath).sort();
        const year = seasonEntries.find((entry) => entry.episode.year)?.episode.year
          ?? yearFromPaths([bundle.bundlePath, ...seasonPaths], query);
        const sourceName = seasonPaths[0];
        items.push({
          query,
          media_type: 'tv',
          season_number: seasonNumber,
          year,
          source_key: `tv:${normalizeKey(query)}:${year ?? 'unknown'}:season:${seasonNumber}`,
          source_name: sourceName,
          linkDirectorySegments: linkDirectoryFor(
            sourceName,
            seasonNumber,
            bundle.bundlePath,
            bundle.bundleIsFile,
          ),
          replaces_source_keys: [...new Set(seasonPaths.map(legacySourceKey))],
        });
      }
      continue;
    }

    const sectionIsTv = bundle.section && ['tv', 'tv series', 'tv shows'].includes(normalizedDirectoryName(bundle.section));
    const fallbackSeason = parseSeasonNumber(bundle.bundleName);
    if (sectionIsTv && fallbackSeason !== null) {
      const year = extractYear(bundle.bundleName);
      const query = override ?? stripYear(removeSeasonDescriptor(cleanTitle(bundle.bundleName)), year);
      if (query) {
        const sourceName = bundle.paths[0];
        items.push({
          query,
          media_type: 'tv',
          season_number: fallbackSeason,
          year,
          source_key: `tv:${normalizeKey(query)}:${year ?? 'unknown'}:season:${fallbackSeason}`,
          source_name: sourceName,
          linkDirectorySegments: linkDirectoryFor(
            sourceName,
            fallbackSeason,
            bundle.bundlePath,
            bundle.bundleIsFile,
          ),
          replaces_source_keys: [...new Set(bundle.paths.map(legacySourceKey))],
        });
        continue;
      }
    }

    if (bundle.paths.length > 5 || COURSE_PATTERN.test(bundle.bundleName)) {
      skipped.push({ bundle: bundle.bundlePath, reason: 'ambiguous-non-episodic-bundle', media_files: bundle.paths.length });
      continue;
    }

    const candidates = bundle.paths.map(movieCandidate).filter(Boolean);
    const bundleYear = extractYear(bundle.bundleName);
    const bundleFallback = stripYear(cleanTitle(bundle.bundleName), bundleYear);
    if (override) {
      const sourceName = candidates[0]?.relativePath ?? bundle.paths[0];
      const year = extractYear(sourceName) ?? bundleYear ?? yearFromPaths(bundle.paths, override);
      items.push({
        query: override,
        media_type: 'movie',
        season_number: null,
        year,
        source_key: `movie:${normalizeKey(override)}:${year ?? 'unknown'}`,
        source_name: sourceName,
        linkDirectorySegments: linkDirectoryFor(sourceName, null, bundle.bundlePath, bundle.bundleIsFile),
        replaces_source_keys: [...new Set(bundle.paths.map(legacySourceKey))],
      });
      continue;
    }

    const distinctCandidates = new Map();
    for (const candidate of candidates) {
      const candidateKey = `${normalizeKey(candidate.query)}:${candidate.year ?? 'unknown'}`;
      if (!distinctCandidates.has(candidateKey)) distinctCandidates.set(candidateKey, candidate);
    }
    if (distinctCandidates.size === 0 && !isGenericTitle(bundleFallback)) {
      distinctCandidates.set(`${normalizeKey(bundleFallback)}:${bundleYear ?? 'unknown'}`, {
        query: bundleFallback,
        year: bundleYear,
        relativePath: bundle.paths[0],
      });
    }
    if (distinctCandidates.size === 0) {
      skipped.push({ bundle: bundle.bundlePath, reason: 'no-usable-title', media_files: bundle.paths.length });
      continue;
    }

    for (const candidate of distinctCandidates.values()) {
      const year = candidate.year ?? bundleYear ?? yearFromPaths(bundle.paths, candidate.query);
      const sourceName = candidate.relativePath;
      items.push({
        query: candidate.query,
        media_type: 'movie',
        season_number: null,
        year,
        source_key: `movie:${normalizeKey(candidate.query)}:${year ?? 'unknown'}`,
        source_name: sourceName,
        linkDirectorySegments: linkDirectoryFor(sourceName, null, bundle.bundlePath, bundle.bundleIsFile),
        replaces_source_keys: [legacySourceKey(sourceName)],
      });
    }
  }

  return { items: mergeDuplicateItems(items), skipped };
}
