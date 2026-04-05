'use client';

import { motion } from 'framer-motion';
import GlassPanel from '@/components/ui/GlassPanel';
import { Layers, User, Heart, Sparkles } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { ClassificationName } from '@/lib/design-tokens';

interface VaultDisplayProps {
  entries: any[];
  onboardingTastes: any[];
  stats: any;
}

export default function VaultDisplay({ entries, onboardingTastes, stats }: VaultDisplayProps) {
  return (
    <div className="space-y-20">
      {/* Metrics Section */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          <GlassPanel className="p-6 md:p-8 flex flex-col items-center justify-center text-center bg-white/5 border-white/10">
            <Layers className="text-white/40 mb-3" size={24} />
            <span className="font-display text-3xl md:text-4xl mb-1 text-white">{stats.entriesCount}</span>
            <span className="font-data text-[9px] text-muted uppercase tracking-widest">Total Library</span>
          </GlassPanel>

          <GlassPanel className="p-6 md:p-8 flex flex-col items-center justify-center text-center bg-white/5 border-white/10">
            <User className="text-white/40 mb-3" size={24} />
            <span className="font-display text-lg md:text-xl mb-1 text-white truncate w-full">{stats.topAuteur || 'Not Set'}</span>
            <span className="font-data text-[9px] text-muted uppercase tracking-widest">Favorite Director</span>
          </GlassPanel>

          <GlassPanel className="p-6 md:p-8 flex flex-col items-center justify-center text-center bg-white/5 border-white/10">
            <Heart className="text-rose-400/60 mb-3" size={24} />
            <span className="font-display text-lg md:text-xl mb-1 text-white">{stats.primaryStyle || 'N/A'}</span>
            <span className="font-data text-[9px] text-muted uppercase tracking-widest">Style Profile</span>
          </GlassPanel>

          <GlassPanel className="p-6 md:p-8 flex flex-col items-center justify-center text-center bg-white/5 border-white/10">
            <Sparkles className="text-vibe-cyan/60 mb-3" size={24} />
            <span className="font-display text-lg md:text-xl mb-1 text-white">Advanced</span>
            <span className="font-data text-[9px] text-muted uppercase tracking-widest">Curator Level</span>
          </GlassPanel>
      </section>

      {/* Genres Section */}
      {onboardingTastes.some(t => t.category === 'genre') && (
        <section>
          <div className="flex flex-wrap justify-center md:justify-start gap-3">
            {onboardingTastes
              .filter(t => t.category === 'genre')
              .map((genre, i) => (
                <div 
                  key={i}
                  className="px-6 py-2 rounded-full bg-white/5 border border-white/10 flex items-center gap-2 group hover:bg-white/10 transition-all"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-accent opacity-60 group-hover:opacity-100 group-hover:scale-125 transition-all" />
                  <span className="font-metadata text-[10px] text-white/60 group-hover:text-white uppercase tracking-widest font-bold">
                    {genre.display_name || genre.value}
                  </span>
                </div>
              ))}
          </div>
        </section>
      )}

      {/* Gallery Section */}
      <section>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {entries.slice(0, 12).map((media: any, i: number) => (
            <motion.div
              key={media.id || i}
              whileHover={{ scale: 1.02, y: -5 }}
              className="relative group cursor-pointer"
            >
              <Link href={`/media/${media.media_type || 'movie'}/${media.media_id}`}>
                <div className="relative aspect-2/3 rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
                  {media.poster_url && (
                    <Image 
                      src={media.poster_url} 
                      alt={media.title} 
                      fill 
                      className="object-cover transition-transform duration-700 group-hover:scale-105" 
                    />
                  )}
                  <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/20 to-transparent" />
                  
                  <div className="absolute bottom-4 left-4 right-4">
                      <span className="font-data text-[8px] text-accent uppercase tracking-widest mb-1 block">
                        {media.classification || 'Movie'}
                      </span>
                      <h3 className="font-heading text-lg font-bold text-white line-clamp-2 leading-tight">{media.title}</h3>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}
