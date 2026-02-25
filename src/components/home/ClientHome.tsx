'use client';

import { motion } from 'framer-motion';
import { Flame, Activity, Archive, LayoutGrid, Search, Settings } from 'lucide-react';
import GlassPanel from '@/components/ui/GlassPanel';
import Link from 'next/link';
import Image from 'next/image';
import { UnifiedMedia } from '@/lib/api/mapping';
import { ClassificationName, CLASSIFICATION_COLORS } from '@/lib/design-tokens';
import { TrendingFeed } from '@/components/cinema/TrendingFeed';

export interface ClientHomeProps {
  user?: any;
  userLogs?: any[];
  pulseFeed?: any[];
}

export default function ClientHome({ user, userLogs, pulseFeed }: ClientHomeProps) {
  return (
    <div className="min-h-screen py-10 md:py-16">
      {/* Cinematic Header */}
      <header className="px-6 md:px-10 mb-16 flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-white/5 pb-10">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-3xl"
        >
          <div className=" hidden items-center gap-2 px-3 py-1 rounded-full bg-white/5 text-muted font-data text-[10px] uppercase tracking-[0.3em] mb-6 border border-white/10">
             CineChive V2 
          </div>
          <h1 className="font-display text-6xl md:text-8xl leading-[0.85] tracking-tighter text-white italic">
            CINECHIVE <br />
            <span className="text-white/40 not-italic">COLLECTIVE</span>
          </h1>
          <p className="mt-8 text-muted text-lg md:text-xl font-heading max-w-xl leading-relaxed opacity-60">
             Indexing the world's moving images. An editorial-grade archive for the dedicated film collector.
          </p>
        </motion.div>
      </header>

      {/* Unified Trending Feed (Centralized Discovery) */}
      <section className="mt-8">
        <TrendingFeed />
      </section>
    </div>
  );
}
