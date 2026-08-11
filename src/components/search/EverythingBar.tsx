'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import GlassPanel from '@/components/ui/GlassPanel';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { globalSearchAction } from '@/lib/actions';
import OracleResults from './OracleResults';
import { useRouter } from 'next/navigation';

interface EverythingBarProps {
  onLocalSearch?: (query: string) => void;
  isSidebar?: boolean;
  onResultClick?: () => void;
}

export default function EverythingBar({ onLocalSearch, isSidebar = false, onResultClick }: EverythingBarProps = {}) {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [isFocused, setIsFocused] = useState(false);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsFocused(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside as any);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside as any);
    };
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem('recentSearches');
    if (saved) setRecentSearches(JSON.parse(saved));
  }, []);

  useEffect(() => {
    const q = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('q') || '' : '';
    if (!isFocused) {
      setQuery(q);
      setDebouncedQuery(q);
    }
  }, [isFocused]);

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

  const { data: results, isLoading } = useQuery({
    queryKey: ['globalSearch', debouncedQuery],
    queryFn: () => globalSearchAction(debouncedQuery),
    enabled: debouncedQuery.length >= 2,
    staleTime: 5 * 60 * 1000,
  });

  const clearSearch = () => {
    setQuery('');
    setDebouncedQuery('');
  };


  return (
    <div ref={containerRef} className={cn(
      "relative w-full z-50",
      !isSidebar && "max-w-7xl mx-auto"
    )}>
      <div className="flex flex-col gap-2">
        <GlassPanel 
          className={cn(
            "flex items-center transition-all duration-500 border-white/10 bg-black",
            isSidebar
              ? "w-full h-12 px-3 rounded-2xl overflow-hidden"
              : "w-full min-h-16 px-4 sm:px-8 py-4 sm:py-5 rounded-3xl"
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
          
          <div className="flex-1 min-w-0">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setIsFocused(true)}
              placeholder={isSidebar ? "Search titles, people..." : "Search cinema, television, or cast..."}
              className={cn(
                "bg-transparent border-none outline-none focus:outline-none focus-visible:outline-none focus-visible:outline-offset-0 font-heading placeholder:text-white/40 text-white w-full min-w-0",
                isSidebar ? "text-sm h-10 leading-10" : "text-lg sm:text-xl min-h-[44px] sm:min-h-[52px]"
              )}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && query.length >= 2) {
                  saveRecentSearch(query);
                  router.push(`/search?q=${encodeURIComponent(query)}`);
                }
              }}
            />
          </div>

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
          </div>
        </GlassPanel>

        {/* Search Results Dropdown */}
        <AnimatePresence>
          {isFocused && debouncedQuery.length >= 2 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className={cn(
                "absolute z-100 shadow-2xl transition-all duration-500",
                isSidebar
                  ? "left-0 top-full mt-3 w-[min(600px,calc(100vw-20rem))] max-w-[calc(100vw-20rem)]"
                  : "top-full left-0 right-0 mt-4"
              )}
            >
              <OracleResults 
                results={results || { movies: [], tv: [], people: [] }} 
                isLoading={isLoading} 
                isVisible={true}
                onResultClick={onResultClick}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Recent Searches Dropdown */}
        <AnimatePresence>
          {isFocused && debouncedQuery.length < 2 && recentSearches.length > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.98, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 8 }}
              className={cn(
                "absolute z-100 shadow-2xl transition-all duration-300",
                isSidebar
                  ? "left-0 top-full mt-3 w-[min(600px,calc(100vw-20rem))] max-w-[calc(100vw-20rem)]"
                  : "top-full left-0 right-0 mt-4"
              )}
            >
              <GlassPanel className="p-4 bg-black border-white/10">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] uppercase tracking-widest text-white/45">Recent searches</span>
                  <button
                    onClick={() => {
                      setRecentSearches([]);
                      localStorage.removeItem('recentSearches');
                    }}
                    className="text-[10px] uppercase tracking-widest text-white/45 hover:text-white"
                  >
                    Clear
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {recentSearches.map((item) => (
                    <button
                      key={item}
                      onClick={() => {
                        setQuery(item);
                        setDebouncedQuery(item);
                        saveRecentSearch(item);
                        router.push(`/search?q=${encodeURIComponent(item)}`);
                      }}
                      className="px-3 py-1.5 rounded-full border border-white/15 bg-white/5 text-white/80 hover:text-white hover:border-white/30 text-xs"
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </GlassPanel>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
