'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Archive, Filter, LayoutGrid, List, Search, Plus, Sparkles, FolderLock } from 'lucide-react';
import GlassPanel from '@/components/ui/GlassPanel';
import { BentoGrid, BentoItem } from '@/components/ui/BentoGrid';
import MediaCard from '@/components/ui/MediaCard';
import { cn } from '@/lib/utils';
import { ClassificationName } from '@/lib/design-tokens';

interface ClientCollectionsProps {
  initialEntries: any[];
}

export default function ClientCollections({ initialEntries }: ClientCollectionsProps) {
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [activeFilter, setActiveFilter] = useState<'all' | 'movie' | 'tv' | 'music' | 'watchlist'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredEntries = initialEntries.filter(entry => {
    const matchesFilter = activeFilter === 'all' 
      || (activeFilter === 'watchlist' && entry.classification === 'Atmospheric')
      || entry.media_type === activeFilter;
    const matchesSearch = entry.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="py-10 md:py-16 px-6 md:px-10">
      <header className="mb-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex flex-col justify-end"
          >
            <div className="flex items-center gap-3 mb-4">
              <Sparkles className="text-white/30" size={16} />
              <span className="font-metadata text-xs uppercase tracking-[0.4em] font-bold text-white/40">
                Personal Collection
              </span>
            </div>
            <h1 className="font-heading text-6xl md:text-8xl tracking-tighter leading-none text-white italic uppercase">
               MY <span className="text-white/40 not-italic ml-2">LIBRARY</span>
            </h1>
            <p className="text-white/60 mt-6 max-w-xl font-metadata text-sm leading-relaxed">
              Your personal cinematic registry. A highly curated collection of films, series, and visual experiences across the global network.
            </p>
          </motion.div>

          <div className="flex gap-4 items-end">
            <GlassPanel className="px-6 py-4 bg-white/5 border-white/5 flex flex-col items-center">
               <span className="font-heading text-4xl text-white leading-none">{initialEntries.length}</span>
               <span className="font-metadata text-[10px] text-white/40 uppercase tracking-widest mt-2">Total Works</span>
            </GlassPanel>
            <GlassPanel className="px-6 py-4 bg-white/5 border-white/5 flex flex-col items-center">
                <span className="font-heading text-4xl text-accent leading-none">{new Set(initialEntries.map(e => e.classification)).size}</span>
                <span className="font-metadata text-[10px] text-white/40 uppercase tracking-widest mt-2">Active Archetypes</span>
            </GlassPanel>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col md:flex-row gap-6 md:items-center justify-between py-6 border-y border-white/5">
           <div className="flex items-center gap-6 overflow-x-auto pb-4 md:pb-0 scrollbar-hide">
              {[
                { id: 'all', label: 'Everything' },
                { id: 'watchlist', label: 'Watchlist' },
                { id: 'movie', label: 'Cinema' },
                { id: 'tv', label: 'Television' },
                { id: 'music', label: 'Audio' },
              ].map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => setActiveFilter(filter.id as any)}
                  className={cn(
                    "font-data text-[10px] uppercase font-bold tracking-widest transition-all whitespace-nowrap",
                    activeFilter === filter.id ? "text-white/60" : "text-muted hover:text-white"
                  )}
                >
                  {filter.label}
                </button>
              ))}
           </div>

           <div className="flex items-center gap-4">
              <div className="relative">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={14} />
                 <input 
                  type="text"
                  placeholder="Scan library..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-white/5 border border-white/10 rounded-inner pl-10 pr-4 py-2 font-metadata text-xs focus:border-white/30 outline-none w-full md:w-64 transition-all text-white placeholder:text-white/30"
                 />
              </div>

              <div className="h-8 w-px bg-white/10 hidden md:block" />

              <div className="flex gap-2">
                 <button 
                  onClick={() => setView('grid')}
                  className={cn("p-2 rounded-inner transition-colors", view === 'grid' ? "bg-white/10 text-white" : "text-white/30 hover:text-white")}
                 >
                   <LayoutGrid size={18} />
                 </button>
                 <button 
                  onClick={() => setView('list')}
                  className={cn("p-2 rounded-inner transition-colors", view === 'list' ? "bg-white/10 text-white" : "text-white/30 hover:text-white")}
                 >
                   <List size={18} />
                 </button>
              </div>
           </div>
        </div>
      </header>

      {/* Collections Grid/List */}
      <section className="pb-20">
         {filteredEntries.length > 0 ? (
            <AnimatePresence mode="popLayout">
              {view === 'grid' ? (
                <BentoGrid key="grid">
                  {filteredEntries.map((entry, index) => (
                    <BentoItem key={entry.id} span={index % 7 === 0 ? 'medium' : 'small'}>
                       <MediaCard 
                        id={entry.media_id}
                        title={entry.title}
                        posterUrl={entry.poster_url}
                        type={entry.media_type}
                        classification={entry.classification as ClassificationName}
                       />
                    </BentoItem>
                  ))}
                </BentoGrid>
              ) : (
                <div key="list" className="space-y-4 max-w-5xl">
                   {filteredEntries.map((entry, index) => (
                      <motion.div
                        key={entry.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                         <Link href={`/media/${entry.media_type}/${entry.media_id}`}>
                           <GlassPanel className="p-4 bg-white/5 border-white/5 hover:border-white/10 transition-all flex items-center justify-between gap-6 group">
                              <div className="flex items-center gap-6">
                                  <motion.div 
                                    layoutId={`media-poster-${entry.media_id}`}
                                    className="relative w-12 aspect-2/3 rounded-sm overflow-hidden bg-surface"
                                  >
                                     {entry.poster_url && (
                                       <Image src={entry.poster_url} alt={entry.title} fill className="object-cover" />
                                     )}
                                  </motion.div>
                                 <div>
                                    <span className="font-heading text-lg block text-white group-hover:text-white/60 transition-colors">{entry.title}</span>
                                    <span className="font-data text-[10px] text-muted uppercase tracking-wider">{entry.media_type} • {entry.classification}</span>
                                 </div>
                              </div>
                              <div className="text-right">
                                 <span className="font-data text-[10px] text-muted block">{new Date(entry.created_at).toLocaleDateString()}</span>
                                 <span className="font-data text-[10px] text-white/60 uppercase tracking-widest mt-1 opacity-0 group-hover:opacity-100 transition-opacity">Examine Details</span>
                              </div>
                           </GlassPanel>
                         </Link>
                      </motion.div>
                   ))}
                </div>
              )}
            </AnimatePresence>
         ) : (
            <div className="py-32 flex flex-col items-center justify-center text-center">
               <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-6">
                 <Archive size={32} className="text-white/20" />
               </div>
               <h3 className="font-heading text-2xl tracking-tighter italic uppercase text-white/50 mb-2">Library Empty</h3>
               <p className="font-metadata text-sm text-white/40">No cinematic works collected yet.</p>
               <Link href="/discover">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="mt-8 px-8 py-3 rounded-full bg-white/10 text-white font-metadata text-xs uppercase font-bold tracking-widest hover:bg-white hover:text-black transition-colors"
                  >
                     Explore Discover
                  </motion.button>
               </Link>
            </div>
         )}
      </section>

      {/* Manifesto Footer */}
      <footer className="mt-20 py-20 border-t border-white/5 text-center">
         <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 1.5 }}
          className="max-w-3xl mx-auto space-y-8"
         >
            <Sparkles className="mx-auto text-white/60 opacity-50" size={32} />
            <p className="font-display text-3xl md:text-5xl tracking-tighter leading-tight italic text-muted">
              "Cinema does not merely show; it evokes. It is the persistent echo of everything that mattered."
            </p>
            <div className="h-12 w-px bg-accent/30 mx-auto" />
            <span className="font-data text-[10px] uppercase tracking-[0.5em] text-accent/60 font-bold">
              CINECHIVE CINEMATIC PROTOCOL // V2.0
            </span>
         </motion.div>
      </footer>
    </div>
  );
}

// Internal helper components
import Image from 'next/image';
import Link from 'next/link';
