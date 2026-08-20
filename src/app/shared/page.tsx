import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { AlertTriangle, Cloud, Film, FolderOpen, Play, Tv } from 'lucide-react';
import { readSharedMedia, type SharedMedia } from '@/lib/shared-media-store';

export const metadata: Metadata = {
  title: 'Shared Library',
  description: 'A family library of movies and TV shared through iCloud.',
  robots: { index: false, follow: false },
};

// Production reads Private Vercel Blob; local development uses the JSON file.
export const dynamic = 'force-dynamic';

function MediaCard({ item }: { item: SharedMedia }) {
  const mediaLabel = item.media_type === 'movie' ? 'Movie' : 'TV series';
  const Icon = item.media_type === 'movie' ? Film : Tv;

  return (
    <article className="group flex min-w-0 flex-col overflow-hidden rounded-2xl border border-white/10 bg-zinc-950/80 shadow-2xl shadow-black/20">
      <div className="relative aspect-[2/3] overflow-hidden bg-zinc-900">
        {item.poster_url ? (
          <Image
            src={item.poster_url}
            alt={`${item.title} poster`}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1280px) 33vw, 25vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-3 px-4 text-center text-zinc-500">
            <Icon aria-hidden="true" className="size-10" />
            <span className="text-xs font-semibold uppercase tracking-[0.18em]">Poster unavailable</span>
          </div>
        )}

        <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full border border-white/10 bg-black/75 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-white backdrop-blur-md">
          <Icon aria-hidden="true" className="size-3.5" />
          <span>{mediaLabel}</span>
          {item.season_number !== null && <span>· S{item.season_number}</span>}
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <h2 className="text-lg font-bold leading-tight tracking-tight text-white sm:text-xl">
          {item.title}
          {item.season_number !== null && (
            <span className="ml-2 text-sm font-medium text-zinc-400">Season {item.season_number}</span>
          )}
        </h2>
        <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-medium text-zinc-500">
          {item.release_year && <span>{item.release_year}</span>}
          {item.genres.slice(0, 2).map((genre) => <span key={genre}>· {genre}</span>)}
          {item.match_status === 'review' && (
            <span className="inline-flex items-center gap-1 text-amber-300">
              <AlertTriangle aria-hidden="true" className="size-3.5" /> Review match
            </span>
          )}
        </div>
        <p className="mt-3 line-clamp-3 text-sm leading-6 text-zinc-400">
          {item.overview || 'No overview is available for this title.'}
        </p>

        <div className="mt-auto grid gap-2 pt-5">
          {item.trailer_url ? (
            <a
              href={item.trailer_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/15 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              <Play aria-hidden="true" className="size-4 fill-current" />
              Watch trailer
            </a>
          ) : (
            <p className="flex min-h-11 items-center justify-center text-xs font-medium text-zinc-500">
              Trailer unavailable
            </p>
          )}

          <a
            href={item.icloud_link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-13 touch-manipulation items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-base font-bold text-black shadow-lg shadow-white/10 transition-colors hover:bg-zinc-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white active:bg-zinc-300"
          >
            <Cloud aria-hidden="true" className="size-5 fill-current" />
            Open in iCloud
          </a>
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
  const filteredData = data.filter((item) => {
    const matchesType = typeFilter === 'all' ||
      item.media_type === typeFilter ||
      (typeFilter === 'review' && item.match_status === 'review');
    return matchesType && (!genreFilter || item.genres.includes(genreFilter));
  });

  return (
    <div className="mx-auto min-h-full w-full max-w-[1600px] px-4 pb-10 pt-8 sm:px-6 sm:pt-12 lg:px-10">
      <header className="mb-8 max-w-3xl sm:mb-10">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-300">
          <Cloud aria-hidden="true" className="size-4" />
          Family iCloud library
        </div>
        <h1 className="font-heading text-4xl text-white sm:text-5xl lg:text-6xl">Shared with you.</h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-zinc-400 sm:text-lg">
          Open a title in iCloud, save it to Files, then play it in VLC or cast from your device.
        </p>
      </header>

      {!loadFailed && data.length > 0 && (
        <nav aria-label="Catalog filters" className="mb-8 space-y-3">
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
                    ? 'border-white bg-white text-black'
                    : 'border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10'
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
        <section aria-label="Shared media" className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
          {filteredData.map((item) => <MediaCard key={item.id} item={item} />)}
        </section>
      )}
    </div>
  );
}
