'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, Loader2, X, Settings2, Sparkles, Filter, RotateCcw } from 'lucide-react';
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
  isSidebar?: boolean;
}

export default function EverythingBar({ onLocalSearch, isSidebar = false }: EverythingBarProps = {}) {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedMood, setSelectedMood] = useState<ClassificationName | null>(null);
  const [hiddenGems, setHiddenGems] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [isFocused, setIsFocused] = useState(false);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('recentSearches');
    if (saved) setRecentSearches(JSON.parse(saved));
  }, []);

  const saveRecentSearch = (q: string) => {
    if (!q.trim()) return;
    const updated = [q, ...recentSearches.filter(s => s !== q)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('recentSearches', JSON.stringify(updated));
  };

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
    <div className={cn(
      "relative w-full z-50",
      !isSidebar && "max-w-6xl mx-auto"
    )}>
      <div className="flex flex-col gap-2">
        <GlassPanel 
          className={cn(
            "flex items-center gap-2 px-3 transition-all duration-500 border-white/5 overflow-hidden",
            isSidebar ? "w-full h-10" : "w-full h-12 px-6 py-4 rounded-3xl"
          )}
        >
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={(e) => {
              e.stopPropagation();
              if (query.length >= 2) {
                saveRecentSearch(query);
                router.push(`/search?q=${encodeURIComponent(query)}`);
              } else {
                inputRef.current?.focus();
              }
            }}
            className={cn(
              "p-2 -ml-2 rounded-full transition-all group/btn flex items-center justify-center",
              query ? "text-white" : "text-muted/60"
            )}
          >
            <Search size={isSidebar ? 14 : 20} className="shrink-0" />
          </motion.button>
          
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setTimeout(() => setIsFocused(false), 300)}
            placeholder={isSidebar ? "Search..." : "Search cinema, television, or cast..."}
            className={cn(
              "bg-transparent border-none outline-none flex-1 font-heading placeholder:text-muted/40 text-white w-full",
              isSidebar ? "text-xs h-full" : "text-lg md:text-[16px] min-h-[44px]"
            )}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && query.length >= 2) {
                saveRecentSearch(query);
                router.push(`/search?q=${encodeURIComponent(query)}`);
              }
            }}
          />

          <div className="flex items-center gap-1.5 shrink-0">
            {query.length > 0 && (
              <button
                onClick={(e) => { e.stopPropagation(); clearSearch(); }}
                className="p-1 hover:bg-white/5 rounded-full transition-colors"
                title="Clear Search"
              >
                <RotateCcw size={14} className="text-muted/40" />
              </button>
            )}

            <button
              onClick={(e) => { e.stopPropagation(); setShowFilters(!showFilters); }}
              className={cn(
                "p-1.5 rounded-inner transition-all",
                (showFilters || selectedMood || hiddenGems) ? "bg-white text-black" : "hover:bg-white/5 text-muted hover:text-white"
              )}
            >
              <Filter size={isSidebar ? 14 : 16} />
            </button>
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
              <GlassPanel className="p-4 bg-black/40 border-white/5 flex flex-col items-start gap-6">
                <div className="flex flex-col gap-4 w-full">
                  <span className="font-metadata text-xs opacity-50 uppercase tracking-widest">Classification</span>
                  <div className="flex flex-wrap gap-2">
                    {CLASSIFICATIONS.map((classification) => (
                      <button
                        key={classification}
                        onClick={() => setSelectedMood(selectedMood === classification ? null : classification)}
                        className={cn(
                          "px-3 py-1.5 rounded-full font-metadata text-[10px] border transition-all",
                          selectedMood === classification 
                             ? "bg-white text-black border-white" 
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
                    "flex items-center gap-2 px-3 py-1.5 rounded-inner border transition-all font-metadata text-[10px]",
                    hiddenGems 
                      ? "bg-white/10 border-white/20 text-white" 
                      : "bg-white/5 border-white/5 text-muted hover:text-white"
                  )}
                >
                  <Sparkles size={12} className={cn(hiddenGems && "animate-pulse")} />
                  Cult Classics
                </button>
              </GlassPanel>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Search Results Dropdown */}
        <AnimatePresence>
          {(isFocused || (results && (results.movies.length > 0 || results.tv.length > 0 || results.people.length > 0))) && debouncedQuery.length >= 2 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className={cn(
                "absolute z-100 shadow-2xl transition-all duration-500",
                isSidebar ? "left-full top-0 ml-4 w-[600px]" : "top-full left-0 right-0 mt-4"
              )}
            >
              <OracleResults 
                results={results || { movies: [], tv: [], people: [] }} 
                isLoading={isLoading} 
                isVisible={true} 
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
