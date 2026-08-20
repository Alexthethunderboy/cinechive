import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import {
  AlertTriangle,
  ArrowUpRight,
  Clock3,
  Cloud,
  Film,
  FolderOpen,
  Play,
  Sparkles,
  Tv,
} from 'lucide-react';
import { readSharedMedia, type SharedMedia } from '@/lib/shared-media-store';

export const metadata: Metadata = {
  title: 'Shared Library',
  description: 'A family library of movies and TV shared through iCloud.',
  robots: { index: false, follow: false },
};

// Production reads Private Vercel Blob; local development uses the JSON file.
export const dynamic = 'force-dynamic';

const CARD_PALETTES = [
  { glow: 'from-violet-500/35 via-fuchsia-400/10', line: 'bg-violet-300' },
  { glow: 'from-cyan-400/30 via-blue-500/10', line: 'bg-cyan-300' },
  { glow: 'from-amber-300/25 via-orange-500/10', line: 'bg-amber-200' },
] as const;

function MediaCard({ item, index, featured }: { item: SharedMedia; index: number; featured: boolean }) {
  const mediaLabel = item.media_type === 'movie' ? 'Movie' : 'TV series';
  const Icon = item.media_type === 'movie' ? Film : Tv;
  const palette = CARD_PALETTES[index % CARD_PALETTES.length];
  const hasDirectLink = item.link_scope === 'item';
  const openLabel = hasDirectLink
    ? item.media_type === 'tv' ? 'Open season' : 'Open movie'
    : 'Open shared folder';

  return (
    <article className={`group relative isolate min-h-[38rem] overflow-hidden rounded-[1.75rem] border bg-zinc-950 shadow-[0_32px_100px_rgba(0,0,0,0.45)] transition-[transform,border-color,box-shadow] duration-500 hover:-translate-y-1 hover:border-white/30 hover:shadow-[0_40px_120px_rgba(0,0,0,0.65)] ${
      hasDirectLink ? 'border-emerald-300/20' : 'border-white/10'
    } ${featured ? 'sm:col-span-2 2xl:col-span-6 2xl:min-h-[40rem]' : '2xl:col-span-3 2xl:min-h-[40rem]'}`}>
      {item.poster_url ? (
        <Image
          src={item.poster_url}
          alt=""
          fill
          sizes={featured
            ? '(max-width: 640px) 100vw, (max-width: 1536px) 100vw, 50vw'
            : '(max-width: 640px) 100vw, (max-width: 1536px) 50vw, 25vw'}
          className="object-cover transition duration-700 group-hover:scale-[1.045] group-hover:saturate-125"
        />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-zinc-900 text-zinc-600">
          <Icon aria-hidden="true" className="size-16" />
          <span className="text-xs font-bold uppercase tracking-[0.24em]">Poster unavailable</span>
        </div>
      )}

      <div aria-hidden="true" className={`absolute inset-0 bg-gradient-to-br ${palette.glow} to-transparent opacity-70 mix-blend-screen`} />
      <div aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.08)_0%,rgba(0,0,0,0.1)_30%,rgba(0,0,0,0.96)_88%)]" />
      <div aria-hidden="true" className="absolute inset-0 opacity-25 [background-image:radial-gradient(rgba(255,255,255,0.2)_0.7px,transparent_0.7px)] [background-size:5px_5px]" />
      <div aria-hidden="true" className={`absolute inset-x-0 top-0 h-1 ${palette.line}`} />

      <a
        href={item.icloud_link}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`${openLabel} for ${item.title} in iCloud`}
        className="absolute inset-0 z-10 rounded-[1.75rem] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
      />

      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-start justify-between gap-3 p-5 sm:p-6">
        <div className="flex items-center gap-2 rounded-full border border-white/15 bg-black/45 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-white backdrop-blur-xl">
          <Icon aria-hidden="true" className="size-3.5" />
          {mediaLabel}{item.season_number !== null ? ` · S${item.season_number}` : ''}
        </div>
        <div className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] backdrop-blur-xl ${
          hasDirectLink
            ? 'border-emerald-300/25 bg-emerald-950/60 text-emerald-200'
            : 'border-amber-200/20 bg-amber-950/60 text-amber-100'
        }`}>
          <span className={`size-1.5 rounded-full ${hasDirectLink ? 'bg-emerald-300' : 'bg-amber-200'}`} />
          {hasDirectLink ? 'Direct link' : 'Shared folder'}
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 p-5 sm:p-6 lg:p-7">
        <div className="mb-3 flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-white/55">
          <span>{String(index + 1).padStart(2, '0')}</span>
          {item.release_year && <><span className="size-1 rounded-full bg-white/35" /><span>{item.release_year}</span></>}
          {item.runtime_minutes && <><span className="size-1 rounded-full bg-white/35" /><Clock3 aria-hidden="true" className="size-3" /><span>{item.runtime_minutes} min</span></>}
          {item.genres.slice(0, featured ? 3 : 2).map((genre) => <span key={genre} className="rounded-full border border-white/10 px-2 py-1 text-white/70">{genre}</span>)}
        </div>

        <h2 className={`max-w-3xl font-heading uppercase text-white drop-shadow-2xl ${featured ? 'text-4xl sm:text-6xl' : 'text-3xl sm:text-4xl'}`}>
          {item.title}
        </h2>
        {item.season_number !== null && <p className="mt-2 text-sm font-bold uppercase tracking-[0.18em] text-white/55">Season {item.season_number}</p>}
        <p className={`mt-4 max-w-2xl text-sm leading-6 text-white/68 ${featured ? 'line-clamp-3 sm:text-base sm:leading-7' : 'line-clamp-2'}`}>
          {item.overview || 'No overview is available for this title.'}
        </p>

        {item.match_status === 'review' && (
          <p className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-amber-200">
            <AlertTriangle aria-hidden="true" className="size-3.5" /> Metadata match needs review
          </p>
        )}

        <div className="pointer-events-auto mt-5 flex flex-col gap-2 sm:flex-row">
          <a
            href={item.icloud_link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-12 flex-1 touch-manipulation items-center justify-between gap-3 rounded-2xl bg-white px-4 py-3 text-sm font-black text-black shadow-[0_16px_40px_rgba(255,255,255,0.15)] transition hover:bg-zinc-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white active:scale-[0.98]"
          >
            <span className="inline-flex items-center gap-2"><Cloud aria-hidden="true" className="size-5 fill-current" />{openLabel}</span>
            <ArrowUpRight aria-hidden="true" className="size-4" />
          </a>
          {item.trailer_url && (
            <a
              href={item.trailer_url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Watch ${item.title} trailer`}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-white/15 bg-black/50 px-4 py-3 text-sm font-bold text-white backdrop-blur-xl transition hover:bg-white/15 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white active:scale-[0.98]"
            >
              <Play aria-hidden="true" className="size-4 fill-current" /> Trailer
            </a>
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

  const genres = [...new Set(data.flatMap((item) => item.genres))].sort((a, b) => a.localeCompare(b));
  const directLinkCount = data.filter((item) => item.link_scope === 'item').length;
  const filteredData = data.filter((item) => {
    const matchesType = typeFilter === 'all' ||
      item.media_type === typeFilter ||
      (typeFilter === 'review' && item.match_status === 'review');
    return matchesType && (!genreFilter || item.genres.includes(genreFilter));
  });

  return (
    <div className="relative mx-auto min-h-full w-full max-w-[1700px] overflow-hidden px-4 pb-12 pt-8 sm:px-6 sm:pt-12 lg:px-10">
      <div aria-hidden="true" className="pointer-events-none absolute -left-40 top-0 size-[30rem] rounded-full bg-violet-600/10 blur-[120px]" />
      <div aria-hidden="true" className="pointer-events-none absolute right-0 top-40 size-[26rem] rounded-full bg-cyan-400/10 blur-[120px]" />

      <header className="relative mb-8 overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.035] p-6 shadow-[0_30px_100px_rgba(0,0,0,0.35)] backdrop-blur-xl sm:mb-10 sm:p-9 lg:p-12">
        <div aria-hidden="true" className="absolute -right-16 -top-24 font-heading text-[11rem] leading-none text-white/[0.025] sm:text-[16rem]">CC</div>
        <div className="relative grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/30 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.22em] text-zinc-300">
              <Sparkles aria-hidden="true" className="size-3.5 text-violet-300" />
              CineChive · Cloud edition
            </div>
            <h1 className="max-w-4xl font-heading text-5xl uppercase text-white sm:text-7xl lg:text-[6.5rem]">Shared with you.</h1>
            <p className="mt-5 max-w-2xl text-sm leading-7 text-zinc-400 sm:text-base">
              Tap any poster to jump into iCloud. Direct links open the exact movie or season; folder links open the shared library.
            </p>
          </div>
          <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 text-center">
            <div className="min-w-28 bg-zinc-950/85 px-5 py-4">
              <dt className="text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-500">Titles</dt>
              <dd className="mt-1 font-heading text-3xl text-white">{data.length}</dd>
            </div>
            <div className="min-w-28 bg-zinc-950/85 px-5 py-4">
              <dt className="text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-500">Direct</dt>
              <dd className="mt-1 font-heading text-3xl text-emerald-300">{directLinkCount}</dd>
            </div>
          </dl>
        </div>
      </header>

      {!loadFailed && data.length > 0 && (
        <nav aria-label="Catalog filters" className="relative mb-8 space-y-3 rounded-2xl border border-white/8 bg-black/25 p-3 backdrop-blur-xl sm:p-4">
          <div className="flex flex-wrap gap-2">
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
                className={`inline-flex min-h-11 items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${
                  typeFilter === value
                    ? 'border-white bg-white text-black shadow-lg shadow-white/10'
                    : 'border-white/10 bg-transparent text-zinc-400 hover:border-white/20 hover:bg-white/8 hover:text-white'
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
                className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold ${!genreFilter ? 'bg-zinc-700 text-white' : 'bg-white/5 text-zinc-400'}`}
              >
                All genres
              </Link>
              {genres.map((genre) => (
                <Link
                  key={genre}
                  href={filterHref(typeFilter, genre)}
                  aria-current={genreFilter === genre ? 'page' : undefined}
                  className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold ${genreFilter === genre ? 'bg-zinc-700 text-white' : 'bg-white/5 text-zinc-400'}`}
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
        <section aria-label="Shared media" className="relative grid grid-cols-1 gap-5 sm:grid-cols-2 2xl:grid-cols-12">
          {filteredData.map((item, index) => <MediaCard key={item.id} item={item} index={index} featured={index === 0} />)}
        </section>
      )}
    </div>
  );
}
