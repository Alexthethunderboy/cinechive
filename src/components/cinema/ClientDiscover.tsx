'use client';

import CinemaCollections from '@/components/cinema/CinemaCollections';
import { motion } from 'framer-motion';

export default function ClientDiscover() {
  return (
    <div className="min-h-screen pb-20">
      <header className="px-4 md:px-10 pt-12 mb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1 className="font-heading text-5xl md:text-8xl tracking-tighter text-white italic uppercase leading-none mb-4">
            DISCOVERY
          </h1>
          <p className="text-white/40 font-metadata text-xs flex items-center gap-2 uppercase tracking-widest">
            <span className="w-2 h-2 rounded-full bg-white/50" />
            The Editorial Collective
          </p>
        </motion.div>
      </header>

      <CinemaCollections />
    </div>
  );
}
