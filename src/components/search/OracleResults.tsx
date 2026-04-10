'use client';

import { motion } from 'framer-motion';
import { Film, Tv } from 'lucide-react';
import GlassPanel from '@/components/ui/GlassPanel';
import { UnifiedMedia } from '@/lib/api/mapping';
import Link from 'next/link';
import Image from 'next/image';
import { buildMediaHref } from '@/lib/media-identity';
import PersonResultCard from './PersonResultCard';

interface OracleResultsProps {
  results: {
    movies: UnifiedMedia[];
    tv: UnifiedMedia[];
    people: any[];
  };
  isLoading: boolean;
  isVisible: boolean;
  onResultClick?: () => void;
}

/** Convert UnifiedMedia → FeedEntity shape expected by DiscoveryCard */

function CompactMediaRow({ item, onResultClick }: { item: UnifiedMedia; onResultClick?: () => void }) {
  return (
    <Link href={buildMediaHref(item)} onClick={onResultClick} className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition-colors">
      <div className="relative w-12 h-16 rounded-md overflow-hidden bg-white/5 border border-white/10 shrink-0">
        {item.posterUrl ? (
          <Image src={item.posterUrl} alt={item.displayTitle} fill className="object-cover" />
        ) : null}
      </div>
      <div className="min-w-0">
        <p className="font-heading text-sm truncate">{item.displayTitle}</p>
        <p className="text-[10px] text-white/40 uppercase tracking-widest truncate">
          {item.type} {item.releaseYear ? `• ${item.releaseYear}` : ''}
        </p>
      </div>
    </Link>
  );
}

export default function OracleResults({ results, onResultClick }: OracleResultsProps) {
  const hasResults = results.movies.length > 0 || results.tv.length > 0 || results.people.length > 0;

  if (!hasResults) {
    return (
      <GlassPanel className="p-12 text-center border-white/10 bg-black backdrop-blur-2xl">
        <p className="text-muted font-heading text-lg italic">No cinematic works found in the library.</p>
      </GlassPanel>
    );
  }

  return (
    <GlassPanel className="p-6 border-white/10 bg-black backdrop-blur-3xl shadow-2xl max-h-[80vh] overflow-y-auto custom-scrollbar">
      <div className="space-y-10">
        {/* People Section */}
        {results.people.length > 0 && (
          <section>
            <Header icon={<Film size={18} />} title="CAST & CREW" count={results.people.length} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
              {results.people.map((person, idx) => (
                <motion.div key={person.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.03 }}>
                  <PersonResultCard person={person} variant="compact" onResultClick={onResultClick} />
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {/* Movies */}
        {results.movies.length > 0 && (
          <section>
            <Header icon={<Film size={18} />} title="CINEMA" count={results.movies.length} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
              {results.movies.map((movie, idx) => (
                <motion.div key={movie.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.03 }}>
                  <CompactMediaRow item={movie} onResultClick={onResultClick} />
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {/* TV Shows */}
        {results.tv.length > 0 && (
          <section>
            <Header icon={<Tv size={18} className="text-vibe-cyan" />} title="TELEVISION" count={results.tv.length} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
              {results.tv.map((show, idx) => (
                <motion.div key={show.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.03 }}>
                  <CompactMediaRow item={show} onResultClick={onResultClick} />
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

