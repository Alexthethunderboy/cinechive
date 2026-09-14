import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { cache } from 'react';
import { ArrowLeft, ArrowUpRight, Cloud, Film, Play, Tv } from 'lucide-react';
import { notFound } from 'next/navigation';
import { readSharedMedia } from '@/lib/shared-media-store';

export const dynamic = 'force-dynamic';

interface SharedMediaPageProps {
  params: Promise<{ id: string }>;
}

const findMedia = cache(async (id: string) => {
  const items = await readSharedMedia();
  return items.find((item) => item.id === id) ?? null;
});

export async function generateMetadata({ params }: SharedMediaPageProps): Promise<Metadata> {
  const { id } = await params;
  const item = await findMedia(id);
  return {
    title: item ? `${item.title} · Shared Library` : 'Title not found',
    description: item?.overview ?? 'A title in the CineChive shared family library.',
    robots: { index: false, follow: false },
  };
}

export default async function SharedMediaPage({ params }: SharedMediaPageProps) {
  const { id } = await params;
  const item = await findMedia(id);
  if (!item) notFound();

  const MediaIcon = item.media_type === 'movie' ? Film : Tv;
  const mediaLabel = item.media_type === 'movie'
    ? 'Movie'
    : item.season_number === null ? 'TV series' : `TV series · Season ${item.season_number}`;

  return (
    <main className="relative mx-auto min-h-full w-full max-w-6xl overflow-hidden px-4 pb-28 pt-6 sm:px-6 sm:pt-10 lg:px-10 lg:pt-14">
      <div aria-hidden="true" className="pointer-events-none absolute left-1/3 top-0 size-[28rem] rounded-full bg-violet-600/10 blur-[130px]" />
      <Link
        href="/shared"
        className="relative inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 text-sm font-bold text-zinc-200 transition hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
      >
        <ArrowLeft aria-hidden="true" className="size-4" /> Back to the library
      </Link>

      <article className="relative mt-6 overflow-hidden rounded-[2rem] border border-white/10 bg-zinc-950 shadow-[0_30px_100px_rgba(0,0,0,0.4)] sm:mt-8 lg:grid lg:grid-cols-[minmax(18rem,0.72fr)_1.28fr]">
        <div className="relative aspect-[2/3] overflow-hidden bg-zinc-900 lg:min-h-[42rem] lg:aspect-auto">
          {item.poster_url ? (
            <Image
              src={item.poster_url}
              alt={`${item.title} poster`}
              fill
              priority
              sizes="(max-width: 1023px) 100vw, 42vw"
              className="object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-[radial-gradient(circle_at_top,#27272a,#09090b_70%)]">
              <MediaIcon aria-hidden="true" className="size-16 text-zinc-700" />
            </div>
          )}
          <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-black/10" />
        </div>

        <div className="flex flex-col px-5 py-7 sm:px-8 sm:py-9 lg:px-12 lg:py-14">
          <div className="flex flex-wrap gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-violet-300">
            <span>{mediaLabel}</span>
            {item.release_year && <span>· {item.release_year}</span>}
            {item.runtime_minutes && <span>· {item.runtime_minutes} min</span>}
          </div>
          <h1 className="mt-4 font-heading text-4xl uppercase leading-[0.92] text-white sm:text-6xl">{item.title}</h1>
          {item.genres.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-2">
              {item.genres.map((genre) => (
                <span key={genre} className="rounded-full bg-white/7 px-3 py-1.5 text-xs font-bold text-zinc-300">{genre}</span>
              ))}
            </div>
          )}
          <p className="mt-7 text-sm leading-7 text-zinc-300 sm:text-base sm:leading-8">
            {item.overview || 'No overview is available for this title.'}
          </p>

          <div className="mt-9 grid gap-3 sm:grid-cols-2 lg:mt-auto lg:pt-10">
            <a
              href={item.icloud_link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-14 touch-manipulation items-center justify-center gap-2 rounded-2xl bg-white px-5 text-sm font-black text-black transition hover:bg-zinc-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white active:scale-[0.99]"
            >
              <Cloud aria-hidden="true" className="size-4.5" />
              {item.link_scope === 'item' ? 'Open in iCloud' : 'Open shared folder'}
              <ArrowUpRight aria-hidden="true" className="size-4" />
            </a>
            {item.trailer_url && (
              <a
                href={item.trailer_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-14 touch-manipulation items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-5 text-sm font-black text-white transition hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                <Play aria-hidden="true" className="size-4 fill-current" /> Watch trailer
              </a>
            )}
          </div>
        </div>
      </article>
    </main>
  );
}
