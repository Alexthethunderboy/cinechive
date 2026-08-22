import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import {
  AlertTriangle,
  ArrowUpRight,
  Cloud,
  Film,
  FolderOpen,
  Play,
  Sparkles,
  Tv,
} from 'lucide-react';
import { readSharedMedia, type SharedMedia } from '@/lib/shared-media-store';
import MediaDetailsDialog from './media-details-dialog';

export const metadata: Metadata = {
  title: 'Shared Library',
  description: 'A family library of movies and TV shared through iCloud.',
  robots: { index: false, follow: false },
};

// Production reads Private Vercel Blob; local development uses the JSON file.
export const dynamic = 'force-dynamic';

interface SharedMediaGroup {
  key: string;
  items: SharedMedia[];
  primary: SharedMedia;
}

function groupSharedMedia(items: SharedMedia[]): SharedMediaGroup[] {
  const groups = new Map<string, SharedMedia[]>();

  for (const item of items) {
    const key = `${item.media_type}:${item.tmdb_id}`;
    const group = groups.get(key);
    if (group) group.push(item);
    else groups.set(key, [item]);
  }

  return [...groups.entries()].map(([key, groupedItems]) => {
    // Keep season links in viewing order and choose the richest record for the
    // title-level artwork and descriptive metadata.
    const itemsBySeason = [...groupedItems].sort((a, b) =>
      (a.season_number ?? Number.MAX_SAFE_INTEGER) - (b.season_number ?? Number.MAX_SAFE_INTEGER),
    );
    const primary = groupedItems.find((item) => item.poster_url && item.overview) ?? groupedItems[0];
    return { key, items: itemsBySeason, primary };
  });
}

function MediaCard({ group }: { group: SharedMediaGroup }) {
  const { items, primary: item } = group;
  const mediaLabel = item.media_type === 'movie' ? 'Movie' : 'TV series';
  const Icon = item.media_type === 'movie' ? Film : Tv;
  const allDirect = items.every((entry) => entry.link_scope === 'item');
  const uniqueTargets = [...new Map(items.map((entry) => [entry.icloud_link, entry])).values()];
  const hasSingleTarget = uniqueTargets.length === 1;
  const seasons = [...new Set(items.flatMap((entry) =>
    entry.season_number === null ? [] : [entry.season_number],
  ))];
  const trailerUrl = items.find((entry) => entry.trailer_url)?.trailer_url;
  const needsReview = items.some((entry) => entry.match_status === 'review');
  const seasonLabel = seasons.length > 1
    ? `${seasons.length} seasons`
    : seasons.length === 1 ? `Season ${seasons[0]}` : null;
  const openLabel = allDirect ? 'Open in iCloud' : 'Open shared folder';

  return (
    <article className="group flex min-w-0 flex-col overflow-hidden rounded-[1.35rem] border border-white/10 bg-zinc-950 shadow-[0_18px_60px_rgba(0,0,0,0.28)] transition duration-300 hover:-translate-y-1 hover:border-white/20 hover:shadow-[0_24px_70px_rgba(0,0,0,0.48)] motion-reduce:transform-none">
      <div className="relative aspect-[2/3] overflow-hidden bg-zinc-900">
        {item.poster_url ? (
          <Image
            src={item.poster_url}
            alt={`${item.title} poster`}
            fill
            sizes="(max-width: 639px) 50vw, (max-width: 1023px) 33vw, (max-width: 1535px) 25vw, 20vw"
            className="object-cover transition duration-500 group-hover:scale-[1.035] motion-reduce:transform-none"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[radial-gradient(circle_at_top,#27272a,#09090b_65%)] text-zinc-600">
            <Icon aria-hidden="true" className="size-10 sm:size-12" />
            <span className="px-3 text-center text-[9px] font-black uppercase tracking-[0.2em]">Poster unavailable</span>
          </div>
        )}
        <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-black/20" />

        <div className="absolute left-3 top-3 z-10 inline-flex min-h-8 items-center gap-1.5 rounded-full border border-white/15 bg-black/60 px-2.5 text-[9px] font-black uppercase tracking-[0.16em] text-white backdrop-blur-xl sm:px-3">
          <Icon aria-hidden="true" className="size-3" />
          <span className="hidden sm:inline">{mediaLabel}</span>
        </div>

        <MediaDetailsDialog
          dialogId={`details-${group.key.replace(/[^a-z0-9]/gi, '-').toLowerCase()}`}
          title={item.title}
          overview={item.overview}
          mediaLabel={mediaLabel}
          releaseYear={item.release_year}
          runtimeMinutes={item.runtime_minutes}
          seasonLabel={seasonLabel}
          genres={item.genres}
        />

        {trailerUrl && (
          <a
            href={trailerUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Watch ${item.title} trailer`}
            className="absolute bottom-3 right-3 z-10 inline-flex size-11 touch-manipulation items-center justify-center rounded-full bg-white text-black shadow-xl transition hover:scale-105 hover:bg-zinc-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white active:scale-95 motion-reduce:transform-none"
          >
            <Play aria-hidden="true" className="ml-0.5 size-4 fill-current" />
          </a>
        )}
        {needsReview && (
          <div className="absolute bottom-3 left-3 z-10 inline-flex min-h-8 items-center gap-1.5 rounded-full border border-amber-200/20 bg-amber-950/75 px-2.5 text-[9px] font-black uppercase tracking-[0.12em] text-amber-100 backdrop-blur-xl">
            <AlertTriangle aria-hidden="true" className="size-3" />
            <span className="hidden sm:inline">Check match</span>
          </div>
        )}
      </div>

      <div className="flex min-h-[12.25rem] flex-1 flex-col p-3 sm:min-h-[12.5rem] sm:p-4">
        <p className="truncate text-[9px] font-black uppercase tracking-[0.16em] text-zinc-500 sm:text-[10px]">
          {[item.release_year, seasonLabel, item.runtime_minutes ? `${item.runtime_minutes} min` : null].filter(Boolean).join(' · ') || mediaLabel}
        </p>
        <h2 className="mt-2 line-clamp-3 min-h-[3.75rem] font-heading text-base uppercase leading-5 text-white sm:line-clamp-2 sm:min-h-12 sm:text-xl sm:leading-6">
          {item.title}
        </h2>
        <p className="mt-2 truncate text-[11px] font-medium text-zinc-500 sm:text-xs">
          {item.genres.slice(0, 2).join(' · ') || 'Uncategorised'}
        </p>
        <div className="mt-auto pt-4">
          {hasSingleTarget ? (
            <a
              href={uniqueTargets[0].icloud_link}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${openLabel} for ${item.title}`}
              className="inline-flex min-h-11 w-full touch-manipulation items-center justify-center gap-2 rounded-xl bg-white px-2.5 py-2 text-xs font-black text-black transition hover:bg-zinc-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white active:scale-[0.98] sm:px-3 sm:text-sm"
            >
              <span>{allDirect ? 'Open iCloud' : 'Open folder'}</span>
              <ArrowUpRight aria-hidden="true" className="size-3.5 shrink-0" />
            </a>
          ) : (
            <div className="flex gap-1.5 overflow-x-auto pb-1" aria-label={`Open a season of ${item.title} in iCloud`}>
              {uniqueTargets.map((target, targetIndex) => (
                <a
                  key={`${target.icloud_link}:${target.season_number ?? targetIndex}`}
                  href={target.icloud_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Open ${target.season_number !== null ? `season ${target.season_number}` : `copy ${targetIndex + 1}`} of ${item.title} in iCloud`}
                  className="inline-flex size-11 shrink-0 touch-manipulation items-center justify-center rounded-xl bg-white text-xs font-black text-black transition hover:bg-zinc-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white active:scale-[0.98]"
                >
                  {target.season_number !== null ? `S${target.season_number}` : `${targetIndex + 1}`}
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

interface SharedPageProps {
  searchParams: Promise<{ type?: string; genre?: string }>;
}

function filterHref(type?: string, genre?: string) {
  const params = new URLSearchParams();
  if (type && type !== 'all') params.set('type', type);
  if (genre) params.set('genre', genre);
  const query = params.toString();
  return query ? `/shared?${query}` : '/shared';
}

export default async function SharedPage({ searchParams }: SharedPageProps) {
  let data: SharedMedia[] = [];
  let loadFailed = false;
  const params = await searchParams;
  const typeFilter = ['movie', 'tv', 'review'].includes(params.type ?? '') ? params.type : 'all';
  const genreFilter = params.genre?.trim() || null;

  try {
    data = await readSharedMedia();
  } catch (error) {
    loadFailed = true;
    console.error('Shared catalog read failed:', error instanceof Error ? error.message : 'Unknown error');
  }

  const groupedData = groupSharedMedia(data);
  const genres = [...new Set(data.flatMap((item) => item.genres))].sort((a, b) => a.localeCompare(b));
  const directLinkCount = groupedData.filter((group) => group.items.every((item) => item.link_scope === 'item')).length;
  const fallbackTitleCount = groupedData.filter((group) => group.items.some((item) => item.link_scope === 'library')).length;
  const filteredData = groupedData.filter((group) => {
    const { items, primary } = group;
    const matchesType = typeFilter === 'all' ||
      primary.media_type === typeFilter ||
      (typeFilter === 'review' && items.some((item) => item.match_status === 'review'));
    return matchesType && (!genreFilter || items.some((item) => item.genres.includes(genreFilter)));
  });

  return (
    <div className="relative mx-auto min-h-full w-full max-w-[1600px] overflow-hidden px-4 pb-32 pt-6 sm:px-6 sm:pb-20 sm:pt-9 lg:px-10 lg:pt-12">
      <div aria-hidden="true" className="pointer-events-none absolute -left-32 top-0 size-[24rem] rounded-full bg-violet-600/10 blur-[120px]" />
      <div aria-hidden="true" className="pointer-events-none absolute right-0 top-24 size-[20rem] rounded-full bg-cyan-400/8 blur-[120px]" />

      <header className="relative mb-6 border-b border-white/10 pb-7 sm:mb-8 sm:pb-9">
        <div className="grid gap-7 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] text-violet-300">
              <Sparkles aria-hidden="true" className="size-3.5 text-violet-300" />
              CineChive cloud library
            </div>
            <h1 className="max-w-4xl font-heading text-4xl uppercase leading-[0.9] text-white sm:text-6xl lg:text-7xl">Shared with you.</h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-zinc-400 sm:text-base sm:leading-7">
              Browse the posters, check the details, then open your pick in iCloud.
            </p>
          </div>
          <dl className="flex w-fit divide-x divide-white/10 rounded-2xl border border-white/10 bg-white/[0.035] text-left">
            <div className="min-w-24 px-4 py-3 sm:min-w-28 sm:px-5 sm:py-4">
              <dt className="text-[8px] font-black uppercase tracking-[0.2em] text-zinc-500">Titles</dt>
              <dd className="mt-1 font-heading text-2xl text-white sm:text-3xl">{groupedData.length}</dd>
            </div>
            <div className="min-w-24 px-4 py-3 sm:min-w-28 sm:px-5 sm:py-4">
              <dt className="text-[8px] font-black uppercase tracking-[0.2em] text-zinc-500">Direct</dt>
              <dd className="mt-1 font-heading text-2xl text-emerald-300 sm:text-3xl">{directLinkCount}</dd>
            </div>
          </dl>
        </div>
      </header>

      {!loadFailed && fallbackTitleCount > 0 && (
        <aside className="relative mb-5 flex items-start gap-3 rounded-2xl border border-amber-200/10 bg-amber-200/[0.045] px-4 py-3.5 text-amber-50 sm:mb-6 sm:items-center sm:px-5" aria-label="iCloud link information">
          <Cloud aria-hidden="true" className="mt-0.5 size-4.5 shrink-0 text-amber-200 sm:mt-0" />
          <p className="text-xs leading-5 text-amber-50/70 sm:text-sm">
            <strong className="font-bold text-amber-50">{fallbackTitleCount} {fallbackTitleCount === 1 ? 'title opens' : 'titles open'} the shared iCloud folder.</strong>{' '}
            Exact movie and season links will appear here whenever the scanner has a direct destination.
          </p>
        </aside>
      )}

      {!loadFailed && data.length > 0 && (
        <nav aria-label="Catalog filters" className="relative mb-6 space-y-3 rounded-2xl border border-white/8 bg-white/[0.025] p-2.5 sm:mb-8 sm:p-3">
          <div className="flex gap-2 overflow-x-auto pb-0.5">
            {[
              { value: 'all', label: 'All media', icon: FolderOpen },
              { value: 'movie', label: 'Movies', icon: Film },
              { value: 'tv', label: 'TV series', icon: Tv },
              { value: 'review', label: 'Needs review', icon: AlertTriangle },
            ].map(({ value, label, icon: Icon }) => (
              <Link
                key={value}
                href={filterHref(value, genreFilter ?? undefined)}
                aria-current={typeFilter === value ? 'page' : undefined}
                className={`inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:px-4 sm:text-sm ${
                  typeFilter === value
                    ? 'border-white bg-white text-black'
                    : 'border-white/8 bg-black/20 text-zinc-400 hover:border-white/20 hover:bg-white/8 hover:text-white'
                }`}
              >
                <Icon aria-hidden="true" className="size-4" />
                {label}
              </Link>
            ))}
          </div>
          {genres.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-1" aria-label="Filter by genre">
              <Link
                href={filterHref(typeFilter)}
                aria-current={!genreFilter ? 'page' : undefined}
                className={`shrink-0 rounded-full px-3 py-1.5 text-[11px] font-bold ${!genreFilter ? 'bg-zinc-700 text-white' : 'bg-white/5 text-zinc-500 hover:text-zinc-300'}`}
              >
                All genres
              </Link>
              {genres.map((genre) => (
                <Link
                  key={genre}
                  href={filterHref(typeFilter, genre)}
                  aria-current={genreFilter === genre ? 'page' : undefined}
                  className={`shrink-0 rounded-full px-3 py-1.5 text-[11px] font-bold ${genreFilter === genre ? 'bg-zinc-700 text-white' : 'bg-white/5 text-zinc-500 hover:text-zinc-300'}`}
                >
                  {genre}
                </Link>
              ))}
            </div>
          )}
        </nav>
      )}

      {loadFailed ? (
        <section className="rounded-2xl border border-red-400/20 bg-red-400/5 p-6" role="alert">
          <h2 className="text-lg font-bold text-white">The shared library could not be loaded.</h2>
          <p className="mt-2 text-sm text-zinc-400">Refresh the page or try again in a moment.</p>
        </section>
      ) : data.length === 0 ? (
        <section className="flex min-h-72 flex-col items-center justify-center rounded-2xl border border-dashed border-white/15 bg-white/[0.025] p-8 text-center">
          <Film aria-hidden="true" className="size-10 text-zinc-500" />
          <h2 className="mt-4 text-xl font-bold text-white">Nothing shared yet</h2>
          <p className="mt-2 max-w-md text-sm leading-6 text-zinc-400">
            Movies added to the watched iCloud folder will appear here after the next sync.
          </p>
        </section>
      ) : filteredData.length === 0 ? (
        <section className="rounded-2xl border border-dashed border-white/15 bg-white/[0.025] p-8 text-center">
          <h2 className="text-xl font-bold text-white">No titles match these filters</h2>
          <Link href="/shared" className="mt-3 inline-block text-sm font-semibold text-zinc-300 underline underline-offset-4">
            Clear filters
          </Link>
        </section>
      ) : (
        <section aria-label="Shared media" className="relative grid grid-cols-2 items-stretch gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:gap-5 2xl:grid-cols-5">
          {filteredData.map((group) => <MediaCard key={group.key} group={group} />)}
        </section>
      )}
    </div>
  );
}
