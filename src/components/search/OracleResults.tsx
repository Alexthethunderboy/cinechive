'use client';

import { motion } from 'framer-motion';
import { Film, User } from 'lucide-react';
import GlassPanel from '@/components/ui/GlassPanel';
import { DiscoveryCard } from '@/components/cinema/DiscoveryCard';
import { UnifiedMedia } from '@/lib/api/mapping';
import Link from 'next/link';

interface OracleResultsProps {
  results: {
    movies: UnifiedMedia[];
    tv: UnifiedMedia[];
    people: any[];
  };
  isLoading: boolean;
  isVisible: boolean;
}

/** Convert UnifiedMedia → FeedEntity shape expected by DiscoveryCard */
function toFeedEntity(item: UnifiedMedia) {
  return {
    id: item.id,
    type: item.type as 'movie' | 'tv' | 'anime',
    displayName: item.displayName || item.title,
    posterUrl: item.posterUrl,
    backdropUrl: null,
    releaseYear: item.year ?? item.releaseYear ?? null,
    releaseLabel: null,
    overview: '',
    rating: item.rating ?? { average: 0, count: 0, showBadge: false },
    genres: item.genres ?? [],
    director: item.director ?? null,
    dp: null,
    ep: null,
    cast: [],
    trailerUrl: null,
    recommendations: [],
    providers: [],
  };
}

export default function OracleResults({ results }: OracleResultsProps) {
  const hasResults = results.movies.length > 0 || results.tv.length > 0 || results.people.length > 0;

  if (!hasResults) {
    return (
      <GlassPanel className="p-12 text-center border-white/10 bg-black/80 backdrop-blur-2xl">
        <p className="text-muted font-heading text-lg italic">No cinematic works found in the library.</p>
      </GlassPanel>
    );
  }

  return (
    <GlassPanel className="p-6 border-white/10 bg-black/90 backdrop-blur-3xl shadow-2xl max-h-[80vh] overflow-y-auto custom-scrollbar">
      <div className="space-y-10">
        {/* People Section */}
        {results.people.length > 0 && (
          <section>
            <Header icon={<User size={18} />} title="CAST & CREW" count={results.people.length} />
            <div className="flex gap-4 overflow-x-auto pb-4 pt-2 custom-scrollbar">
              {results.people.map((person, idx) => (
                <Link key={person.id} href={`/media/person/${person.id}`}>
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="flex-shrink-0 group cursor-pointer"
                  >
                    <div className="w-24 text-center">
                      <div className="w-20 h-20 mx-auto rounded-full overflow-hidden border-2 border-white/5 group-hover:border-accent transition-colors mb-2">
                        {person.profileUrl ? (
                          <img src={person.profileUrl} alt={person.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-white/5 flex items-center justify-center">
                            <User className="text-muted/30" />
                          </div>
                        )}
                      </div>
                      <p className="font-heading text-xs truncate group-hover:text-white/60 transition-colors">{person.name}</p>
                      <p className="text-[10px] text-muted uppercase tracking-widest mt-1 opacity-50">{person.knownFor}</p>
                    </div>
                  </motion.div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Movies */}
        {results.movies.length > 0 && (
          <section>
            <Header icon={<Film size={18} />} title="CINEMA" count={results.movies.length} />
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-2">
              {results.movies.map((movie, idx) => (
                <motion.div
                  key={movie.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.06 }}
                >
                  <DiscoveryCard media={toFeedEntity(movie) as any} index={idx} />
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {/* TV Shows */}
        {results.tv.length > 0 && (
          <section>
            <Header icon={<Film size={18} className="text-vibe-cyan" />} title="TELEVISION" count={results.tv.length} />
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-2">
              {results.tv.map((show, idx) => (
                <motion.div
                  key={show.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.06 }}
                >
                  <DiscoveryCard media={toFeedEntity(show) as any} index={idx} />
                </motion.div>
              ))}
            </div>
          </section>
        )}

      </div>
    </GlassPanel>
  );
}

function Header({ icon, title, count }: { icon: React.ReactNode, title: string, count: number }) {
  return (
    <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-2">
      <div className="flex items-center gap-2">
        <span className="text-white/60">{icon}</span>
        <h3 className="font-heading text-xs tracking-[0.2em] uppercase opacity-70">{title}</h3>
      </div>
      <span className="text-[10px] font-mono opacity-30">{count} ITEMS</span>
    </div>
  );
}

