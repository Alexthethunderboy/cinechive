'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, Activity, LayoutGrid, Search, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import GlassPanel from '@/components/ui/GlassPanel';
import Link from 'next/link';
import Image from 'next/image';
import { UnifiedMedia } from '@/lib/api/mapping';
import { ClassificationName, CLASSIFICATION_COLORS } from '@/lib/design-tokens';
import { TrendingFeed } from '@/components/cinema/TrendingFeed';
import CinemaCollections from '@/components/cinema/CinemaCollections';
import RandomFactWidget from '@/components/dashboard/RandomFactWidget';

type DiscoveryMode = 'registries' | 'broadcast';

export interface ClientHomeProps {
  user?: any;
  userLogs?: any[];
  pulseFeed?: any[];
}

export default function ClientHome({ user, userLogs, pulseFeed }: ClientHomeProps) {
  const [activeView, setActiveView] = useState<DiscoveryMode>('broadcast');

  return (
    <div>
      {/* Cinematic Header */}
      <header className="px-6 md:px-10 pt-8 mb-8 flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-white/5 pb-8">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-3xl"
        >
          <div className=" hidden items-center gap-2 px-3 py-1 rounded-full bg-white/5 text-muted font-data text-[10px] uppercase tracking-[0.3em] mb-6 border border-white/10">
             CineChive V2 
          </div>
          <h1 className="font-display text-4xl md:text-6xl leading-tight tracking-tighter text-white italic">
            CINECHIVE <br />
            <span className="text-white/40 not-italic">COLLECTIVE</span>
          </h1>
          <p className="mt-4 text-muted text-base md:text-lg font-heading max-w-xl leading-relaxed opacity-60">
             Curating the world's moving images. An editorial-grade library for the dedicated cinephile.
          </p>
        </motion.div>
      </header>
 
      {/* Cinematic Insights */}
      <section className="px-6 md:px-10 mb-8">
         <RandomFactWidget />
      </section>

      {/* Discovery Perspective Toggle */}
      <div className="flex justify-center mb-12 px-6 sticky top-24 z-50">
        <div className="glass p-1.5 rounded-full border border-white/10 flex items-center gap-1 shadow-2xl relative overflow-hidden group pointer-events-auto">
          <div className="absolute inset-0 bg-linear-to-tr from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
          
          {(['broadcast', 'registries'] as const).map((mode) => {
            const isActive = activeView === mode;
            const label = mode === 'broadcast' ? 'New and Trending' : 'Cinematic Selections';
            
            return (
              <button
                key={mode}
                onClick={() => setActiveView(mode)}
                className={cn(
                  "relative flex items-center gap-3 px-8 py-3 rounded-full transition-all duration-500 z-10",
                  isActive ? "text-white" : "text-white/30 hover:text-white/60"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="active-mode-pill"
                    className="absolute inset-0 bg-white/10 border border-white/10 rounded-full shadow-inner"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                
                {mode === 'registries' ? (
                  <LayoutGrid size={16} className={isActive ? "text-accent scale-110" : "scale-100"} />
                ) : (
                  <Flame size={16} className={isActive ? "text-rose-400 scale-110" : "scale-100"} />
                )}

                <span className="font-data text-[8px] md:text-[10px] uppercase tracking-[0.2em] font-bold">
                  {label}
                </span>

                {isActive && (
                  <motion.div
                    layoutId="active-dot-home"
                    className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-accent rounded-full blur-[1px]"
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="relative z-10">
        {activeView === 'registries' ? (
           <CinemaCollections />
        ) : (
           <TrendingFeed />
        )}
      </div>
    </div>
  );
}
