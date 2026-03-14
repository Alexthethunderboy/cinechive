import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Film, Tv2 } from 'lucide-react';
import { getGenrePageAction } from '@/lib/actions';
import { GenreFeed } from '@/components/cinema/GenreFeed';

interface Props {
  params: Promise<{ id: string }>;
}

// TMDB genre ID → display name mapping (movies + TV combined)
const GENRE_NAMES: Record<number, string> = {
  28: 'Action',
  12: 'Adventure',
  16: 'Animation',
  35: 'Comedy',
  80: 'Crime',
  99: 'Documentary',
  18: 'Drama',
  10751: 'Family',
  14: 'Fantasy',
  36: 'History',
  27: 'Horror',
  10402: 'Music',
  9648: 'Mystery',
  10749: 'Romance',
  878: 'Sci-Fi',
  10770: 'TV Movie',
  53: 'Thriller',
  10752: 'War',
  37: 'Western',
  // TV-specific
  10759: 'Action & Adventure',
  10762: 'Kids',
  10763: 'News',
  10764: 'Reality',
  10765: 'Sci-Fi & Fantasy',
  10766: 'Soap',
  10767: 'Talk',
  10768: 'War & Politics',
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const genreId = parseInt(id);
  const genreName = GENRE_NAMES[genreId] || 'Genre';
  return {
    title: `${genreName} — Discover`,
    description: `Browse ${genreName} films and series.`,
  };
}

export default async function GenrePage({ params }: Props) {
  const { id } = await params;
  const genreId = parseInt(id);
  const genreName = GENRE_NAMES[genreId];

  if (!genreName || isNaN(genreId)) notFound();

  const [movies, tv] = await Promise.all([
    getGenrePageAction(genreId, 'movie'),
    getGenrePageAction(genreId, 'tv'),
  ]);

  return (
    <div className="min-h-screen pb-32">
      {/* Header */}
      <header className="px-6 md:px-10 pt-12 mb-16">
        <Link
          href="/discover"
          className="inline-flex items-center gap-2 text-white/30 hover:text-white font-metadata text-xs uppercase tracking-widest transition-colors mb-10 group"
        >
          <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
          Discover
        </Link>

        <div>
          <p className="font-metadata text-xs uppercase tracking-[0.4em] text-white/30 mb-3">
            Genre
          </p>
          <h1 className="font-heading text-5xl md:text-9xl tracking-tighter italic uppercase leading-none text-white">
            {genreName}
          </h1>
        </div>
      </header>

      <GenreFeed 
        genreId={genreId} 
        initialMovies={movies} 
        initialTv={tv} 
      />
    </div>
  );
}
