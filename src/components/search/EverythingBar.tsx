'use client';

import { useState, useEffect } from 'react';
import { Search, Loader2, X, Settings2, Sparkles, Filter } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import GlassPanel from '@/components/ui/GlassPanel';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { globalSearchAction } from '@/lib/actions';
import OracleResults from './OracleResults';
import { CLASSIFICATION_COLORS, ClassificationName, SPRING_CONFIG } from '@/lib/design-tokens';
import { useRouter } from 'next/navigation';

const CLASSIFICATIONS = Object.keys(CLASSIFICATION_COLORS) as ClassificationName[];

interface EverythingBarProps {
  onLocalSearch?: (query: string) => void;
}

export default function EverythingBar({ onLocalSearch }: EverythingBarProps = {}) {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedMood, setSelectedMood] = useState<ClassificationName | null>(null);
  const [hiddenGems, setHiddenGems] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
      if (onLocalSearch) {
        onLocalSearch(query);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [query, onLocalSearch]);

  const { data: results, isLoading, isError } = useQuery({
    queryKey: ['globalSearch', debouncedQuery, selectedMood, hiddenGems],
    queryFn: () => globalSearchAction(debouncedQuery, { 
      mood: selectedMood || undefined, 
      hiddenGems 
    }),
    enabled: debouncedQuery.length >= 2,
    staleTime: 5 * 60 * 1000,
  });

  const clearSearch = () => {
    setQuery('');
    setDebouncedQuery('');
    setSelectedMood(null);
    setHiddenGems(false);
  };

  return (
    <div className="relative w-full max-w-4xl mx-auto z-50">
      <div className="flex flex-col gap-2">
        <GlassPanel className="flex items-center gap-4 px-6 py-4 border-white/10 bg-white/5 focus-within:border-accent/40 transition-all group overflow-hidden">
          <Search className={cn("text-muted transition-colors", query && "text-white")} size={22} />
          <input 
            type="text"
            placeholder="Search movies, tv, people, collections..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && query.length >= 2) {
                router.push(`/search?q=${encodeURIComponent(query)}`);
              }
            }}
            className="bg-transparent border-none outline-none flex-1 font-heading text-lg md:text-xl placeholder:text-muted/40 text-white w-full"
          />
          
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                "p-2 rounded-inner transition-all",
                (showFilters || selectedMood || hiddenGems) ? "bg-white/10 text-white" : "hover:bg-white/5 text-muted hover:text-white"
              )}
            >
              <Settings2 size={20} />
            </button>
            <AnimatePresence>
              {(isLoading || query) && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="flex items-center gap-3"
                >
                  {isLoading && <Loader2 className="animate-spin text-white opacity-50" size={20} />}
                  {query && (
                    <button 
                      onClick={clearSearch}
                      className="p-1 hover:bg-white/10 rounded-full transition-colors text-muted hover:text-white"
                    >
                      <X size={18} />
                    </button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </GlassPanel>

        {/* Filter Toolbar */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="px-2"
            >
              <h2 className="font-display text-2xl md:text-3xl tracking-tighter mb-2 italic text-white uppercase">Cinema Index</h2>
              <p className="text-muted text-sm md:text-base opacity-40 mb-4">Explore the cinematic landscape.</p>
              <GlassPanel className="p-4 bg-black/40 border-white/5 flex flex-col items-start gap-6">
                <div className="flex flex-col gap-4 w-full">
                  <span className="font-data text-[10px] uppercase tracking-widest text-muted">Classification</span>
                  <div className="flex flex-wrap gap-2">
                    {CLASSIFICATIONS.map((classification) => (
                      <button
                        key={classification}
                        onClick={() => setSelectedMood(selectedMood === classification ? null : classification)}
                        className={cn(
                          "px-3 py-1.5 md:px-4 md:py-2 rounded-full font-data text-[10px] uppercase tracking-widest border transition-all",
                          selectedMood === classification 
                             ? "bg-accent text-black border-accent" 
                             : "bg-white/5 text-muted border-white/5 hover:border-white/20"
                        )}
                      >
                        {classification}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="h-px w-full bg-white/10" />

                <button
                  onClick={() => setHiddenGems(!hiddenGems)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-inner border transition-all font-data text-[10px] uppercase tracking-widest",
                    hiddenGems 
                      ? "bg-white/10 border-white/20 text-white" 
                      : "bg-white/5 border-white/5 text-muted hover:text-white"
                  )}
                >
                  <Sparkles size={14} className={cn(hiddenGems && "animate-pulse")} />
                  Cult Classics
                </button>
              </GlassPanel>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {debouncedQuery.length >= 2 && results && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute top-full left-0 right-0 mt-4 z-50"
          >
            <OracleResults 
              results={results || { movies: [], tv: [], people: [] }} 
              isLoading={isLoading} 
              isVisible={!!results} 
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
