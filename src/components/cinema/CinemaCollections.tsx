'use client';

import { useQuery } from '@tanstack/react-query';
import { getCuratedCollectionsAction } from '@/lib/actions';
import { motion } from 'framer-motion';
import { DiscoveryCard } from './DiscoveryCard';
import { Sparkles, ChevronRight, Loader2, Info } from 'lucide-react';
import GlassPanel from '../ui/GlassPanel';
import Link from 'next/link';

const ARCHETYPES = [
  {
    slug: 'essential',
    name: 'Essential',
    color: '#F5F5F5',
    description: 'Monumental achievements that redefined the art form.',
  },
  {
    slug: 'avant-garde',
    name: 'Avant-Garde',
    color: '#D4D4D8',
    description: 'Reality-bending films that shatter conventions.',
  },
  {
    slug: 'melancholic',
    name: 'Melancholic',
    color: '#A1A1AA',
    description: 'Grief, love, and the depths of the human condition.',
  },
  {
    slug: 'atmospheric',
    name: 'Atmospheric',
    color: '#71717A',
    description: 'Immersive worlds where the setting is a character.',
  },
  {
    slug: 'noir',
    name: 'Noir',
    color: '#52525B',
    description: 'Shadowy crime, moral ambiguity, darkness.',
  },
  {
    slug: 'visceral',
    name: 'Visceral',
    color: '#FAFAFA',
    description: 'High-octane cinema built to be felt in your chest.',
  },
  {
    slug: 'legacy',
    name: 'Legacy',
    color: '#CA8A04',
    description: 'Timeless tales of history, heritage, and the frontier.',
  },
  {
    slug: 'provocative',
    name: 'Provocative',
    color: '#DC2626',
    description: 'Tense narratives designed to unsettle and challenge.',
  },
];

const GENRES = [
  { id: 28, name: 'Action' },
  { id: 12, name: 'Adventure' },
  { id: 16, name: 'Animation' },
  { id: 35, name: 'Comedy' },
  { id: 80, name: 'Crime' },
  { id: 99, name: 'Documentary' },
  { id: 18, name: 'Drama' },
  { id: 10751, name: 'Family' },
  { id: 14, name: 'Fantasy' },
  { id: 36, name: 'History' },
  { id: 27, name: 'Horror' },
  { id: 10402, name: 'Music' },
  { id: 9648, name: 'Mystery' },
  { id: 10749, name: 'Romance' },
  { id: 878, name: 'Sci-Fi' },
  { id: 53, name: 'Thriller' },
  { id: 10752, name: 'War' },
  { id: 37, name: 'Western' },
  { id: 10770, name: 'TV Movie' },
  { id: 10765, name: 'Sci-Fi & Fantasy' },
];

export default function CinemaCollections() {
  const { data: collections, isLoading, error } = useQuery({
    queryKey: ['curatedCollections'],
    queryFn: () => getCuratedCollectionsAction(),
    staleTime: 1000 * 60 * 60,
  });

  if (isLoading) {
    return (
      <div className="w-full flex flex-col items-center justify-center py-20 opacity-30">
        <Loader2 className="w-8 h-8 animate-spin text-white mb-4" />
        <p className="font-metadata uppercase text-white">Loading Curations...</p>
      </div>
    );
  }

  if (error || !collections) {
    return (
      <div className="px-6 md:px-10 py-10">
        <GlassPanel className="p-8 border-rose-500/20 bg-rose-500/5 text-center">
          <Info className="w-6 h-6 text-white/40 mx-auto mb-3" />
          <p className="text-white/40 font-heading text-sm uppercase tracking-widest">Unable to load curations</p>
        </GlassPanel>
      </div>
    );
  }

  return (
    <div className="py-10 space-y-24">

      {/* 1. Archetypes */}
      <section className="px-4 md:px-10">
        <div className="flex items-end justify-between mb-10">
          <div>
            <h2 className="font-heading text-4xl md:text-5xl tracking-tighter text-white italic uppercase leading-none mb-2">
              Archetypes
            </h2>
            <p className="text-white/40 font-metadata text-xs uppercase tracking-widest">Browse by Cinematic Resonance</p>
          </div>
          <Link href="/classifications" className="text-[10px] font-metadata text-white/30 uppercase tracking-[0.2em] border-b border-white/5 pb-1 hover:text-white transition-colors">
            View All
          </Link>
        </div>

        <div className="flex gap-4 overflow-x-auto pb-4 hide-scrollbar">
          {ARCHETYPES.map((archetype) => (
            <Link
              key={archetype.slug}
              href={`/discover/archetype/${archetype.slug}`}
              className="shrink-0 w-60"
            >
              <div className="p-6 rounded-2xl bg-white/5 border border-white/5 hover:border-white/20 transition-all group relative overflow-hidden h-40 flex flex-col justify-between">
                <div
                  className="absolute -top-12 -right-12 w-32 h-32 rounded-full blur-[40px] opacity-0 group-hover:opacity-10 transition-opacity bg-white"
                />
                <h3 className="font-heading text-xl text-white">{archetype.name}</h3>
                <p className="text-white/40 text-xs font-metadata line-clamp-2 leading-relaxed">{archetype.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 2. Genres */}
      <section className="px-4 md:px-10">
        <div className="flex items-end justify-between mb-10">
          <div>
            <h2 className="font-heading text-4xl md:text-5xl tracking-tighter text-white italic uppercase leading-none mb-2">
              Genres
            </h2>
            <p className="text-white/40 font-metadata text-xs uppercase tracking-widest">Structural Anchors</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {GENRES.map((genre) => (
            <Link key={genre.id} href={`/discover/genre/${genre.id}`}>
              <div className="px-6 py-3 rounded-full bg-white/5 border border-white/5 hover:bg-white hover:border-white transition-all text-center group">
                <span className="font-metadata text-[11px] text-white/40 group-hover:text-black transition-colors uppercase tracking-widest font-bold">
                  {genre.name}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 3. Curated Selections */}
      <div className="space-y-20">
        <div className="px-6 md:px-10">
          <h2 className="font-heading text-4xl md:text-5xl tracking-tighter text-white italic uppercase leading-none mb-2">
            Selections
          </h2>
          <p className="text-white/40 font-metadata text-xs uppercase tracking-widest">Curated Editorial Volumes</p>
        </div>

        {collections.map((collection, idx) => (
          <section key={collection.slug} className="relative">
            <div className="px-6 md:px-10 mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                className="max-w-2xl"
              >
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-px bg-white/20" />
                  <span className="font-metadata text-white/40 text-xs">Vol. {idx + 1}</span>
                </div>
                <h2 className="font-heading text-4xl md:text-6xl tracking-tighter text-white italic uppercase leading-none mb-4">
                  {collection.title}
                </h2>
                <p className="text-white/60 font-metadata max-w-xl leading-relaxed uppercase text-xs">
                  {collection.description}
                </p>
              </motion.div>

              <Link
                href={`/discover/selection/${collection.slug}`}
                className="flex items-center gap-2 text-[10px] font-metadata text-white/30 uppercase tracking-[0.2em] border-b border-white/5 pb-1 hover:text-white hover:border-white/20 transition-colors group shrink-0"
              >
                Full Catalogue <ChevronRight size={12} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            {/* Grid/Row container */}
            <div className="relative group">
              <div className="grid grid-cols-2 md:flex md:gap-6 md:overflow-x-auto pb-12 pt-4 px-6 md:px-10 gap-4">
                {collection.movies.map((movie, movieIdx) => (
                  <div key={movie.id} className="min-w-0 md:shrink-0 md:w-[300px]">
                    <DiscoveryCard media={movie} index={movieIdx} />
                  </div>
                ))}
                
                {/* Explore more card - only on desktop scroller or at the end of grid? */}
                {/* For mobile grid, let's keep it as the last item */}
                <Link href={`/discover/selection/${collection.slug}`} className="flex items-center justify-center h-full">
                  <div className="border border-white/5 bg-white/2 min-h-[300px] md:h-[350px] w-full rounded-2xl flex flex-col items-center justify-center p-8 group/more hover:bg-white/5 transition-all">
                    <div className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center text-white/20 group-hover/more:text-white group-hover/more:scale-110 transition-all mb-4">
                      <Sparkles size={20} />
                    </div>
                    <span className="font-metadata text-white/40 group-hover/more:text-white transition-colors text-center text-xs leading-relaxed uppercase tracking-widest">
                      Full <br/> Catalogue
                    </span>
                  </div>
                </Link>
              </div>

              {/* Desktop-only Edge fades */}
              <div className="hidden md:block absolute top-0 left-0 h-full w-20 bg-gradient-to-r from-black to-transparent pointer-events-none z-10 opacity-60" />
              <div className="hidden md:block absolute top-0 right-0 h-full w-20 bg-gradient-to-l from-black to-transparent pointer-events-none z-10 opacity-60" />
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
