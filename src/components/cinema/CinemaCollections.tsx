'use client';

import { useQuery } from '@tanstack/react-query';
import { getCuratedCollectionsAction } from '@/lib/actions';
import { motion } from 'framer-motion';
import { DiscoveryCard } from './DiscoveryCard';
import { Sparkles, ChevronRight, Loader2, Info } from 'lucide-react';
import { FeedEntity } from '@/lib/api/MediaFetcher';
import GlassPanel from '../ui/GlassPanel';

export default function CinemaCollections() {
  const { data: collections, isLoading, error } = useQuery({
    queryKey: ['curatedCollections'],
    queryFn: () => getCuratedCollectionsAction(),
    staleTime: 1000 * 60 * 60, // 1 hour
  });

  if (isLoading) {
    return (
      <div className="w-full flex flex-col items-center justify-center py-20 opacity-30">
        <Loader2 className="w-8 h-8 animate-spin text-accent mb-4" />
        <p className="font-data text-[10px] uppercase tracking-widest text-white">Projecting Cinematic Curations...</p>
      </div>
    );
  }

  if (error || !collections) {
    return (
      <div className="px-6 md:px-10 py-10">
        <GlassPanel className="p-8 border-rose-500/20 bg-rose-500/5 text-center">
          <Info className="w-6 h-6 text-rose-400 mx-auto mb-3" />
          <p className="text-rose-400 font-heading text-sm uppercase tracking-widest">Unable to reach the Cinema Registry</p>
        </GlassPanel>
      </div>
    );
  }

  return (
    <div className="space-y-20 py-10">
      {collections.map((collection, idx) => (
        <section key={collection.title} className="relative">
          {/* Collection Header */}
          <div className="px-6 md:px-10 mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="max-w-2xl"
            >
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-px bg-accent/40" />
                <span className="font-data text-[10px] uppercase tracking-[0.4em] text-accent/60">Volume {idx + 1}</span>
              </div>
              <h2 className="font-display text-4xl md:text-6xl tracking-tighter text-white italic uppercase leading-none mb-4">
                {collection.title}
              </h2>
              <p className="text-muted font-heading text-sm md:text-base max-w-xl opacity-60 leading-relaxed uppercase tracking-wide">
                {collection.description}
              </p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="flex items-center gap-2 text-[10px] font-data text-white/30 uppercase tracking-[0.2em] border-b border-white/10 pb-1 hover:text-accent hover:border-accent/40 transition-colors cursor-pointer group"
            >
              Examine Full Catalogue <ChevronRight size={12} className="group-hover:translate-x-1 transition-transform" />
            </motion.div>
          </div>

          {/* Scrolling Collection */}
          <div className="relative group">
            <div className="flex gap-6 overflow-x-auto pb-12 pt-4 hide-scrollbar px-6 md:px-10">
               {collection.movies.map((movie, movieIdx) => (
                 <motion.div 
                   key={movie.id}
                   initial={{ opacity: 0, scale: 0.95 }}
                   whileInView={{ opacity: 1, scale: 1 }}
                   viewport={{ once: true }}
                   transition={{ delay: movieIdx * 0.1 }}
                   className="shrink-0 w-[240px] md:w-[320px]"
                 >
                    <DiscoveryCard media={movie} index={movieIdx} />
                 </motion.div>
               ))}
               {/* Last "Explore More" Card */}
               <div className="shrink-0 w-[200px] flex items-center justify-center h-full">
                  <div className="border border-white/5 bg-white/2 h-[350px] w-full rounded-2xl flex flex-col items-center justify-center p-8 group/more cursor-pointer hover:bg-white/5 transition-all">
                    <div className="w-12 h-12 rounded-full border border-accent/20 flex items-center justify-center text-accent/40 group-hover/more:text-accent group-hover/more:scale-110 transition-all mb-4">
                      <Sparkles size={24} />
                    </div>
                    <span className="font-data text-[10px] uppercase tracking-widest text-white/40 group-hover/more:text-white transition-colors text-center">
                      Discover more cinema in <br/> {collection.title}
                    </span>
                  </div>
               </div>
            </div>
            
            {/* Edge Fades */}
            <div className="absolute top-0 left-0 h-full w-20 bg-linear-to-r from-background to-transparent pointer-events-none z-10 opacity-60" />
            <div className="absolute top-0 right-0 h-full w-20 bg-linear-to-l from-background to-transparent pointer-events-none z-10 opacity-60" />
          </div>
        </section>
      ))}
    </div>
  );
}
