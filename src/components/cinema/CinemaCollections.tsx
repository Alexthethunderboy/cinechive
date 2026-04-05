'use client';

import { useQuery } from '@tanstack/react-query';
import { getCuratedCollectionsAction } from '@/lib/actions';
import { motion } from 'framer-motion';
import { DiscoveryCard } from './DiscoveryCard';
import { Sparkles, ChevronRight, Loader2, Info } from 'lucide-react';
import GlassPanel from '../ui/GlassPanel';
import Link from 'next/link';
import { ClassificationName, CLASSIFICATION_STYLE_COLORS } from '@/lib/design-tokens';

const HERO_GENRES: { id: number; name: string; styleName: ClassificationName; description: string }[] = [
  { id: 878, name: 'Sci-Fi',   styleName: 'Atmospheric', description: 'Reality-bending, futuristic, and purely immersive.' },
  { id: 9648, name: 'Mystery', styleName: 'Noir',        description: 'Enigmatic, shadowy, and noir-inspired tales.' },
  { id: 28, name: 'Action',    styleName: 'Visceral',    description: 'High-octane cinema built to be felt in your chest.' },
  { id: 18, name: 'Drama',     styleName: 'Melancholic', description: 'Grief, love, and the depths of the human condition.' },
  { id: 16, name: 'Animation', styleName: 'Avant-Garde', description: 'Imaginative journeys that challenge form and color.' },
  { id: 27, name: 'Horror',    styleName: 'Provocative', description: 'Tense narratives designed to unsettle and challenge.' },
  { id: 37, name: 'Western',   styleName: 'Legacy',      description: 'Timeless tales of history, heritage, and the frontier.' },
  { id: 35, name: 'Comedy',    styleName: 'Essential',   description: 'Timeless works that define the lighter side of life.' },
];

const SECONDARY_GENRES = [
  { id: 12, name: 'Adventure' },
  { id: 80, name: 'Crime' },
  { id: 99, name: 'Documentary' },
  { id: 10751, name: 'Family' },
  { id: 14, name: 'Fantasy' },
  { id: 36, name: 'History' },
  { id: 10402, name: 'Music' },
  { id: 10749, name: 'Romance' },
  { id: 53, name: 'Thriller' },
  { id: 10752, name: 'War' },
  { id: 10770, name: 'TV Movie' },
  { id: 10765, name: 'Sci-Fi & Fantasy' },
];

const GENRE_COLORS: Record<number, string> = {
  28: '#EF4444', // Action - Red
  12: '#F59E0B', // Adventure - Amber
  16: '#0EA5E9', // Animation - Sky
  35: '#FACC15', // Comedy - Yellow
  80: '#6366F1', // Crime - Indigo
  99: '#10B981', // Documentary - Emerald
  18: '#3B82F6', // Drama - Blue
  10751: '#EC4899', // Family - Pink
  14: '#8B5CF6', // Fantasy - Violet
  36: '#D97706', // History - Orange
  27: '#B91C1C', // Horror - Dark Red
  10402: '#F43F5E', // Music - Rose
  9648: '#4F46E5', // Mystery - Indigo
  10749: '#FB7185', // Romance - Rose
  878: '#06B6D4', // Sci-Fi - Cyan
  53: '#475569', // Thriller - Slate
  10752: '#166534', // War - Green
  37: '#92400E', // Western - Brown
  10770: '#64748B', // TV Movie
  10765: '#7C3AED', // Sci-Fi & Fantasy
};

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
        <p className="font-metadata uppercase text-white">Loading Collections...</p>
      </div>
    );
  }

  if (error || !collections) {
    return (
      <div className="px-4 md:px-10 py-10">
        <GlassPanel className="p-8 border-rose-500/20 bg-rose-500/5 text-center">
          <Info className="w-6 h-6 text-white/40 mx-auto mb-3" />
          <p className="text-white/40 font-heading text-sm uppercase tracking-widest">Unable to load curations</p>
        </GlassPanel>
      </div>
    );
  }

  return (
    <div className="py-6 md:py-10 space-y-12 md:space-y-24">

      {/* 1. Hero Genres (High Fidelity) */}
      <section className="px-4 md:px-10">
        <div className="flex items-end justify-between mb-6 md:mb-10">
          <div>
            <h2 className="font-heading text-4xl md:text-5xl tracking-tighter text-white italic uppercase leading-none mb-2">
              Genres
            </h2>
            <p className="text-white/40 font-metadata text-xs uppercase tracking-widest">Explore film by category</p>
          </div>
          <Link href="/classifications" className="text-[10px] font-metadata text-white/30 uppercase tracking-[0.2em] border-b border-white/5 pb-1 hover:text-white transition-colors">
            View All Categories
          </Link>
        </div>

        <div className="flex gap-4 overflow-x-auto pb-8 hide-scrollbar">
          {HERO_GENRES.map((genre) => {
            const styleColor = CLASSIFICATION_STYLE_COLORS[genre.styleName];
            return (
              <Link
                key={genre.id}
                href={`/discover/genre/${genre.id}`}
                className="shrink-0 w-64 group"
              >
                <div 
                  className="p-6 rounded-2xl bg-white/3 border border-white/5 group-hover:bg-white/5 group-hover:border-white/20 transition-all relative overflow-hidden h-44 flex flex-col justify-between"
                >
                  {/* Style Gradient */}
                  <div 
                    className="absolute inset-0 opacity-20 group-hover:opacity-40 transition-opacity pointer-events-none"
                    style={{ 
                      background: `radial-gradient(circle at top left, ${styleColor}, transparent 70%)` 
                    }}
                  />

                  {/* Hover Glow Effect */}
                  <div 
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                    style={{ 
                      boxShadow: `inset 0 0 30px ${styleColor}30` 
                    }}
                  />

                  <div className="relative z-10">
                    <h3 className="font-display text-2xl italic text-white group-hover:text-white transition-colors">
                      {genre.name}
                    </h3>
                  </div>
                  
                  <p className="relative z-10 text-white/40 text-[11px] font-metadata line-clamp-2 leading-relaxed group-hover:text-white/60 transition-colors">
                    {genre.description}
                  </p>

                  {/* Subtle accent line */}
                  <div 
                    className="absolute bottom-0 left-0 h-0.5 w-0 group-hover:w-full transition-all duration-500"
                    style={{ backgroundColor: styleColor }}
                  />
                </div>
              </Link>
            );
          })}
        </div>

        {/* 2. Secondary Genres (Compact Grid) */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mt-8">
          {SECONDARY_GENRES.map((genre) => {
            const color = GENRE_COLORS[genre.id] || '#FFFFFF';
            return (
              <Link key={genre.id} href={`/discover/genre/${genre.id}`}>
                <div 
                  className="px-6 py-4 rounded-xl bg-white/3 border border-white/8 hover:border-white/20 transition-all flex flex-col gap-2 group relative overflow-hidden"
                >
                   {/* Subtle color stripe */}
                   <div 
                     className="absolute top-0 left-0 w-1 h-full opacity-40 group-hover:opacity-100 transition-opacity"
                     style={{ backgroundColor: color }}
                   />
                   
                   <span className="font-metadata text-[10px] text-white/40 group-hover:text-white transition-colors uppercase tracking-[0.2em] font-bold">
                    {genre.name}
                  </span>
                  
                  <div className="flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity translate-y-1 group-hover:translate-y-0 duration-300">
                    <span className="text-[8px] font-mono text-white/20 uppercase tracking-widest">Explore</span>
                    <ChevronRight size={10} className="text-white/20" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* 3. Curated Selections */}
      <div className="space-y-20">
        <div className="px-4 md:px-10">
          <h2 className="font-heading text-4xl md:text-5xl tracking-tighter text-white italic uppercase leading-none mb-2">
            Selections
          </h2>
          <p className="text-white/40 font-metadata text-xs uppercase tracking-widest">Curated Editorial Collections</p>
        </div>

        {collections.map((collection, idx) => (
          <section key={collection.slug} className="relative">
            <div className="px-4 md:px-10 mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
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
              <div className="grid grid-cols-2 md:flex md:gap-6 md:overflow-x-auto pb-12 pt-4 px-4 md:px-10 gap-4">
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
              <div className="hidden md:block absolute top-0 left-0 h-full w-20 bg-linear-to-r from-black to-transparent pointer-events-none z-10 opacity-60" />
              <div className="hidden md:block absolute top-0 right-0 h-full w-20 bg-linear-to-l from-black to-transparent pointer-events-none z-10 opacity-60" />
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
