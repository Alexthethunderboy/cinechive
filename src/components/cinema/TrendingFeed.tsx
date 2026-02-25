'use client';

import React, { useState, useEffect } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useInView } from 'react-intersection-observer';
import { fetchTrendingPage, fetchAnimePage, fetchAnimationPage } from '@/lib/feed-actions';
import { AnimatrixEntity } from '@/lib/api/MediaTransformer';
import { DiscoveryCard } from './DiscoveryCard';
import { AnimatrixCard } from '@/components/animation/AnimatrixCard';
import { FilterLab, FilterState } from '@/components/animation/FilterLab';
import { Loader2, Film, Tv, Sparkles, Wand2, Filter } from 'lucide-react';
import { motion } from 'framer-motion';
import EverythingBar from '@/components/search/EverythingBar';
import { FeedEntity } from '@/lib/api/MediaFetcher';

export function TrendingFeed() {
  const [activeTab, setActiveTab] = useState<'movie' | 'tv' | 'anime' | 'animation'>('movie');
  const [localQuery, setLocalQuery] = useState('');
  
  // FilterLab State
  const [isFilterLabOpen, setIsFilterLabOpen] = useState(false);
  const [animationFilters, setAnimationFilters] = useState<FilterState>({
    genres: [], studios: [], year: '', format: [], status: []
  });

  const { ref, inView } = useInView({
    // Fetch 20 items ahead of time (around a screen or two)
    rootMargin: '1000px',
  });

  const fetchPage = async (pageParam: number) => {
    try {
      if (activeTab === 'movie' || activeTab === 'tv') {
        return await fetchTrendingPage(activeTab, pageParam);
      } else if (activeTab === 'anime') {
        return await fetchAnimePage(pageParam);
      } else {
        return await fetchAnimationPage(pageParam);
      }
    } catch (err) {
      console.error(`Feed Error [${activeTab}]:`, err);
      throw err;
    }
  };

  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    status,
    refetch,
  } = useInfiniteQuery({
    queryKey: ['trendingFeed', activeTab],
    queryFn: ({ pageParam = 1 }) => fetchPage(pageParam),
    initialPageParam: 1,
    getNextPageParam: (lastPage: any) => lastPage?.nextCursor,
    staleTime: 60 * 60 * 1000, 
  });

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, fetchNextPage, hasNextPage, isFetchingNextPage]);

  const allItems = data?.pages.flatMap((page: any) => page.results) || [];

  // Client-side filtering strategy (Combined Search Query + FilterLab)
  const filteredItems = React.useMemo(() => {
    let items = allItems as any[];
    
    // 1. Local Search Query
    if (localQuery) {
      const q = localQuery.toLowerCase();
      items = items.filter(item => {
        return (
           item.displayName.toLowerCase().includes(q) ||
           item.genres?.some((g: string) => g.toLowerCase().includes(q)) ||
           (item.director || item.ep || '').toLowerCase().includes(q) ||
           (item.englishTitle && item.englishTitle.toLowerCase().includes(q)) ||
           (item.romajiTitle && item.romajiTitle.toLowerCase().includes(q))
        );
      });
    }

    // 2. FilterLab logic strictly for Anime/Animation tabs
    if (activeTab === 'anime' || activeTab === 'animation') {
       if (animationFilters.year) {
          items = items.filter(i => String(i.releaseYear) === animationFilters.year);
       }
       if (animationFilters.genres.length > 0) {
          items = items.filter(i => animationFilters.genres.some(g => i.genres?.includes(g)));
       }
       if (animationFilters.studios.length > 0) {
          items = items.filter(i => i.studio && animationFilters.studios.includes(i.studio.name));
       }
       if (animationFilters.format.length > 0) {
          items = items.filter(i => i.format && animationFilters.format.includes(i.format));
       }
    }

    return items;
  }, [allItems, localQuery, animationFilters, activeTab]);

  return (
    <div className="w-full flex flex-col min-h-screen">
      
      {/* Global Search / Local Filter Unified */}
      <div className="px-6 md:px-10 mb-6 z-50 relative flex gap-4">
         <div className="flex-1">
            <EverythingBar onLocalSearch={setLocalQuery} />
         </div>
      </div>

      {/* Top Controls */}
      <div className="sticky top-0 z-40 bg-black/80 backdrop-blur-xl border-b border-white/10 p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex bg-white/10 p-1 rounded-full border border-white/5 relative overflow-x-auto max-w-full scrollbar-hide">
          {/* Static rendering of tabs to avoid complex layout calc bugs across 4 items, keeping it simple */}
          <button
            onClick={() => setActiveTab('movie')}
            className={`relative z-10 flex items-center gap-2 px-6 py-2 rounded-full font-medium transition-colors whitespace-nowrap ${
              activeTab === 'movie' ? 'bg-white text-black' : 'text-white/60 hover:text-white'
            }`}
          >
            <Film className="w-4 h-4" /> Movies
          </button>
          <button
            onClick={() => setActiveTab('tv')}
            className={`relative z-10 flex items-center gap-2 px-6 py-2 rounded-full font-medium transition-colors whitespace-nowrap ${
              activeTab === 'tv' ? 'bg-white text-black' : 'text-white/60 hover:text-white'
            }`}
          >
            <Tv className="w-4 h-4" /> Series
          </button>
          <button
            onClick={() => setActiveTab('anime')}
            className={`relative z-10 flex items-center gap-2 px-6 py-2 rounded-full font-medium transition-colors whitespace-nowrap ${
              activeTab === 'anime' ? 'bg-vibe-cyan text-black' : 'text-white/60 hover:text-white'
            }`}
          >
            <Sparkles className="w-4 h-4" /> Anime
          </button>
          <button
            onClick={() => setActiveTab('animation')}
            className={`relative z-10 flex items-center gap-2 px-6 py-2 rounded-full font-medium transition-colors whitespace-nowrap ${
              activeTab === 'animation' ? 'bg-vibe-violet text-black' : 'text-white/60 hover:text-white'
            }`}
          >
            <Wand2 className="w-4 h-4" /> Animation
          </button>
        </div>

        {/* Filter Lab Trigger for Anime/Animation */}
        {(activeTab === 'anime' || activeTab === 'animation') && (
           <button 
             onClick={() => setIsFilterLabOpen(true)}
             className={`px-4 py-2 rounded-full border flex items-center gap-2 transition-all ${
               animationFilters.genres.length > 0 || animationFilters.studios.length > 0 
                ? 'bg-accent/20 border-accent/40 text-accent' 
                : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white'
             }`}
           >
              <Filter className="w-4 h-4" /> Filter Lab
           </button>
        )}
      </div>

      {/* Slide-out Filter Lab */}
      <FilterLab 
        isOpen={isFilterLabOpen}
        onClose={() => setIsFilterLabOpen(false)}
        activeTab={activeTab as 'anime' | 'animation'}
        onApplyFilters={setAnimationFilters}
        currentFilters={animationFilters}
      />

      {/* Grid container */}
      <div className="flex-1 p-6 md:p-10">
        
        {status === 'pending' ? (
          <div className="w-full flex flex-col items-center justify-center py-20 opacity-50 space-y-4">
            <Loader2 className="w-8 h-8 animate-spin text-vibe-cyan" />
            <p className="font-mono text-sm tracking-widest uppercase">Initializing Deep Feed...</p>
          </div>
        ) : status === 'error' ? (
          <div className="w-full flex flex-col items-center justify-center py-20 space-y-4">
            <p className="text-red-400 font-mono text-sm">Failed to load intel. Connection disrupted.</p>
            <button onClick={() => refetch()} className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-full text-sm">Retry Connection</button>
          </div>
        ) : (
          <>
            {filteredItems.length === 0 && localQuery ? (
               <div className="w-full py-20 text-center text-white/50 font-mono">
                  No matches found in the current stream for "{localQuery}".
               </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {filteredItems.map((item, i) => (
                  <div key={`${item.id}-${i}`}>
                    {(activeTab === 'anime' || activeTab === 'animation') 
                      ? <AnimatrixCard media={item as AnimatrixEntity} index={i} />
                      : <DiscoveryCard media={item as FeedEntity} index={i} />
                    }
                  </div>
                ))}
              </div>
            )}

            {/* InView trigger for Infinite Scroll */}
            {!localQuery && (
               <div ref={ref} className="w-full py-12 flex justify-center mt-10">
                 {isFetchingNextPage ? (
                   <div className="flex items-center gap-3 opacity-50">
                     <Loader2 className="w-5 h-5 animate-spin text-vibe-cyan" />
                     <span className="font-mono text-xs tracking-widest uppercase">Fetching more records...</span>
                   </div>
                 ) : hasNextPage ? (
                   <div className="h-10"></div> /* Empty invisible div to observe */
                 ) : (
                   <div className="font-mono text-sm tracking-widest uppercase text-white/30 pt-10 border-t border-white/5 w-full text-center">
                     End of Records
                   </div>
                 )}
               </div>
            )}
          </>
        )}
      </div>

    </div>
  );
}
