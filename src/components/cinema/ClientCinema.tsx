'use client';

import { motion } from 'framer-motion';
import EverythingBar from '@/components/search/EverythingBar';
import { TrendingFeed } from './TrendingFeed';
export default function ClientCinema() {
  return (
    <div className="pt-6 pb-24 md:py-16 px-4 md:px-10 max-w-7xl mx-auto">
      <header className="mb-12">
        <motion.div
           initial={{ opacity: 0, x: -20 }}
           animate={{ opacity: 1, x: 0 }}
           className="mb-8"
        >
          <h1 className="font-display text-4xl md:text-6xl tracking-tighter mb-4">
            CINEMA <span className="text-white/60 italic">& TV</span>
          </h1>
          <p className="text-muted max-w-xl">
             The library of visual storytelling. From blockbuster cinema to high-order television and deep-dive documentaries.
          </p>
        </motion.div>

        <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
          <EverythingBar />
        </div>
      </header>

      <section className="mt-8">
        <TrendingFeed />
      </section>
    </div>
  );
}
