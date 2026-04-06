import React, { useState, useEffect } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useInView } from 'react-intersection-observer';
import { getTrendingFeedAction, getAnimeFeedAction, getAnimationFeedAction, getDocumentaryFeedAction } from '@/lib/feed-actions';
import { UniversalMedia } from '@/lib/api/UniversalTransformer';
import { DiscoveryCard } from './DiscoveryCard';
import { AnimatrixCard } from '@/components/animation/AnimatrixCard';
import { AdvancedFilters, FilterState } from '@/components/animation/FilterLab';
import { Loader2, Film, Tv, Sparkles, Wand2, Filter, Library } from 'lucide-react';
import { motion } from 'framer-motion';

export function TrendingFeed({ isVisible = true }: { isVisible?: boolean }) {
  const [activeTab, setActiveTab] = useState<'movie' | 'tv' | 'anime' | 'animation' | 'documentary'>('movie');
  const [localQuery, setLocalQuery] = useState('');
  
  // FilterLab State
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
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
        const data = await getTrendingFeedAction(activeTab, pageParam);
        return {
          results: data.results,
          nextCursor: pageParam < data.totalPages ? pageParam + 1 : undefined
        };
      } else if (activeTab === 'anime') {
        const data = await getAnimeFeedAction(pageParam);
        return {
          results: data.results,
          nextCursor: data.hasNextPage ? pageParam + 1 : undefined
        };
      } else if (activeTab === 'animation') {
        const data = await getAnimationFeedAction(pageParam);
        return {
          results: data.results,
          nextCursor: pageParam < data.totalPages ? pageParam + 1 : undefined
        };
      } else {
        const data = await getDocumentaryFeedAction(pageParam);
        return {
          results: data.results,
          nextCursor: pageParam < data.totalPages ? pageParam + 1 : undefined
        };
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
    let items = allItems as UniversalMedia[];
    
    // 1. Local Search Query
    if (localQuery) {
      const q = localQuery.toLowerCase();
      items = items.filter(item => {
        return (
           item.displayTitle.toLowerCase().includes(q) ||
           item.genres?.some((g: string) => g.toLowerCase().includes(q)) ||
           (item.director || item.creator || '').toLowerCase().includes(q) ||
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
          items = items.filter(i => i.studio && animationFilters.studios.includes(i.studio));
       }
       if (animationFilters.format.length > 0) {
          items = items.filter(i => i.format && animationFilters.format.includes(i.format));
       }
    }

    return items;
  }, [allItems, localQuery, animationFilters, activeTab]);

  return (
    <div className="flex flex-col">
      


      {/* Top Controls - Animated on scroll */}
      <motion.div 
        initial={false}
        animate={{ 
          y: isVisible ? 0 : -80,
          opacity: isVisible ? 1 : 0
        }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="sticky top-0 z-40 bg-black/80 backdrop-blur-xl border-b border-white/5 p-1.5 flex flex-col md:flex-row items-center justify-between gap-3 overflow-hidden max-w-full pointer-events-auto"
        style={{ pointerEvents: isVisible ? 'auto' : 'none' }}
      >
        <div className="flex bg-white/5 p-1 rounded-full border border-white/5 relative overflow-x-auto max-w-full scrollbar-hide">
          <button
            onClick={() => setActiveTab('movie')}
            className={`relative z-10 flex items-center gap-2 px-4 py-1.5 rounded-full font-metadata text-xs transition-colors whitespace-nowrap ${
              activeTab === 'movie' ? 'bg-white text-black' : 'text-white/40 hover:text-white'
            }`}
          >
            <Film className="w-3.5 h-3.5" /> Movies
          </button>
          <button
            onClick={() => setActiveTab('tv')}
            className={`relative z-10 flex items-center gap-2 px-4 py-1.5 rounded-full font-metadata text-xs transition-colors whitespace-nowrap ${
              activeTab === 'tv' ? 'bg-white text-black' : 'text-white/40 hover:text-white'
            }`}
          >
            <Tv className="w-3.5 h-3.5" /> Series
          </button>
          <button
            onClick={() => setActiveTab('anime')}
            className={`relative z-10 flex items-center gap-2 px-4 py-1.5 rounded-full font-metadata text-xs transition-colors whitespace-nowrap ${
              activeTab === 'anime' ? 'bg-white text-black' : 'text-white/40 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" /> Anime
          </button>
          <button
            onClick={() => setActiveTab('animation')}
            className={`relative z-10 flex items-center gap-2 px-4 py-1.5 rounded-full font-metadata text-xs transition-colors whitespace-nowrap ${
              activeTab === 'animation' ? 'bg-white text-black' : 'text-white/40 hover:text-white'
            }`}
          >
            <Wand2 className="w-3.5 h-3.5" /> Animation
          </button>
          <button
            onClick={() => setActiveTab('documentary')}
            className={`relative z-10 flex items-center gap-2 px-4 py-1.5 rounded-full font-metadata text-xs transition-colors whitespace-nowrap ${
              activeTab === 'documentary' ? 'bg-white text-black' : 'text-white/40 hover:text-white'
            }`}
          >
            <Library className="w-3.5 h-3.5" /> Documentaries
          </button>
        </div>

        {/* Filters Trigger for Anime/Animation */}
        {(activeTab === 'anime' || activeTab === 'animation') && (
           <button 
             onClick={() => setIsFiltersOpen(true)}
             className={`px-3 py-1 rounded-full border flex items-center gap-1.5 transition-all text-[10px] font-metadata tracking-tighter ${
               animationFilters.genres.length > 0 || animationFilters.studios.length > 0 
                ? 'bg-white/20 border-white/30 text-white' 
                : 'bg-white/5 border-white/5 text-white/50 hover:bg-white/10 hover:text-white'
             }`}
           >
              <Filter className="w-3 h-3" /> Filters
           </button>
        )}
      </motion.div>

      {/* Advanced Filters */}
      <AdvancedFilters 
        isOpen={isFiltersOpen}
        onClose={() => setIsFiltersOpen(false)}
        activeTab={activeTab as 'anime' | 'animation'}
        onApplyFilters={setAnimationFilters}
        currentFilters={animationFilters}
      />

      {/* Grid container */}
      <div className="flex-1 p-2 md:p-8">
        
        {status === 'pending' ? (
          <div className="w-full flex flex-col items-center justify-center py-20 opacity-50 space-y-4">
            <Loader2 className="w-8 h-8 animate-spin text-vibe-cyan" />
            <p className="font-mono text-sm tracking-widest">Loading...</p>
          </div>
        ) : status === 'error' ? (
          <div className="w-full flex flex-col items-center justify-center py-20 space-y-4">
            <p className="text-red-400 font-mono text-sm">Failed to load. Please try again.</p>
            <button onClick={() => refetch()} className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-full text-sm">Try Again</button>
          </div>
        ) : (
          <>
            {filteredItems.length === 0 && localQuery ? (
               <div className="w-full py-20 text-center text-white/50 font-mono">
                  No matches found in the current stream for "{localQuery}".
               </div>
            ) : (
            <motion.div 
              variants={{
                hidden: { opacity: 0 },
                show: {
                  opacity: 1,
                  transition: {
                    staggerChildren: 0.05
                  }
                }
              }}
              initial="hidden"
              animate="show"
              className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8"
            >
              {filteredItems.map((item, i) => (
                <motion.div 
                  key={`${item.id}-${i}`}
                  variants={{
                    hidden: { opacity: 0, y: 20 },
                    show: { opacity: 1, y: 0 }
                  }}
                >
                  {(activeTab === 'anime' || activeTab === 'animation') 
                    ? <AnimatrixCard media={item} index={i} />
                    : <DiscoveryCard media={item} index={i} />
                  }
                </motion.div>
              ))}
            </motion.div>
            )}

            {/* InView trigger for Infinite Scroll */}
            {!localQuery && (
               <div ref={ref} className="w-full py-12 flex flex-col items-center justify-center mt-20 relative">
                 <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-white/10 to-transparent" />
                 
                 {isFetchingNextPage ? (
                   <div className="flex flex-col items-center gap-4 opacity-50">
                     <Loader2 className="w-6 h-6 animate-spin text-accent" />
                     <span className="font-data text-[10px] tracking-[0.3em] text-white/40">Synchronizing deep stream...</span>
                   </div>
                 ) : hasNextPage ? (
                   <div className="h-20"></div> /* Space to trigger inView */
                 ) : (
                   <div className="flex flex-col items-center gap-6 py-10 opacity-30">
                      <div className="w-12 h-12 rounded-full border border-dashed border-white/20 flex items-center justify-center">
                         <Sparkles size={20} />
                      </div>
                      <div className="text-center space-y-1">
                        <h4 className="font-heading text-lg italic tracking-tighter text-white">You've reached the end.</h4>
                        <p className="font-metadata text-[9px] tracking-[0.3em] text-white/50">You've seen all current entries in this category.</p>
                      </div>
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
