'use client';

import React, { useEffect } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useInView } from 'react-intersection-observer';
import { getArchetypePageAction } from '@/lib/actions';
import { UniversalMedia } from '@/lib/api/UniversalTransformer';
import { DiscoveryCard } from './DiscoveryCard';
import { Loader2, Film, Tv2 } from 'lucide-react';

interface ArchetypeFeedProps {
  slug: string;
  initialMovies: { results: UniversalMedia[]; totalPages: number };
  initialTv: { results: UniversalMedia[]; totalPages: number };
}

export function ArchetypeFeed({ slug, initialMovies, initialTv }: ArchetypeFeedProps) {
  const { ref: movieRef, inView: movieInView } = useInView({ rootMargin: '1000px' });
  const { ref: tvRef, inView: tvInView } = useInView({ rootMargin: '1000px' });

  // Movies Query
  const {
    data: moviesData,
    fetchNextPage: fetchNextMoviePage,
    hasNextPage: hasNextMoviePage,
    isFetchingNextPage: isFetchingNextMoviePage,
  } = useInfiniteQuery({
    queryKey: ['archetypeFeed', 'movie', slug],
    queryFn: async ({ pageParam = 1 }) => {
      if (pageParam === 1) return initialMovies;
      const result = await getArchetypePageAction(slug, pageParam);
      return result.movies;
    },
    initialPageParam: 1,
    initialData: {
      pages: [initialMovies],
      pageParams: [1]
    },
    getNextPageParam: (lastPage, allPages) => {
      const nextPage = allPages.length + 1;
      return nextPage <= lastPage.totalPages ? nextPage : undefined;
    },
    staleTime: 60 * 60 * 1000,
  });

  // TV Query
  const {
    data: tvData,
    fetchNextPage: fetchNextTvPage,
    hasNextPage: hasNextTvPage,
    isFetchingNextPage: isFetchingNextTvPage,
  } = useInfiniteQuery({
    queryKey: ['archetypeFeed', 'tv', slug],
    queryFn: async ({ pageParam = 1 }) => {
      if (pageParam === 1) return initialTv;
      const result = await getArchetypePageAction(slug, pageParam);
      return result.tv;
    },
    initialPageParam: 1,
    initialData: {
      pages: [initialTv],
      pageParams: [1]
    },
    getNextPageParam: (lastPage, allPages) => {
      const nextPage = allPages.length + 1;
      return nextPage <= lastPage.totalPages ? nextPage : undefined;
    },
    staleTime: 60 * 60 * 1000,
  });

  useEffect(() => {
    if (movieInView && hasNextMoviePage && !isFetchingNextMoviePage) fetchNextMoviePage();
  }, [movieInView, fetchNextMoviePage, hasNextMoviePage, isFetchingNextMoviePage]);

  useEffect(() => {
    if (tvInView && hasNextTvPage && !isFetchingNextTvPage) fetchNextTvPage();
  }, [tvInView, fetchNextTvPage, hasNextTvPage, isFetchingNextTvPage]);

  const allMovies = moviesData?.pages.flatMap((page) => page.results) || [];
  const allTv = tvData?.pages.flatMap((page) => page.results) || [];

  return (
    <>
      {/* Movies Section */}
      {allMovies.length > 0 && (
        <section className="px-4 md:px-10 mb-20">
          <div className="flex items-center gap-3 mb-8">
            <Film size={16} className="text-white/30" />
            <h2 className="font-heading text-2xl tracking-tighter italic uppercase text-white/60">
              Films
            </h2>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-8">
            {allMovies.map((item, i) => (
              <DiscoveryCard key={`movie-${item.sourceId}-${i}`} media={item} index={i} />
            ))}
          </div>
          <div ref={movieRef} className="w-full py-12 flex justify-center mt-4 text-white/30">
            {isFetchingNextMoviePage && <Loader2 className="w-5 h-5 animate-spin text-white/30" />}
          </div>
        </section>
      )}

      {/* Series Section */}
      {allTv.length > 0 && (
        <section className="px-6 md:px-10">
          <div className="flex items-center gap-3 mb-8">
            <Tv2 size={16} className="text-white/30" />
            <h2 className="font-heading text-2xl tracking-tighter italic uppercase text-white/40">
              Series
            </h2>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-8">
            {allTv.map((item, i) => (
              <DiscoveryCard key={`tv-${item.sourceId}-${i}`} media={item} index={i} />
            ))}
          </div>
          <div ref={tvRef} className="w-full py-12 flex justify-center mt-4 text-white/30">
            {isFetchingNextTvPage && <Loader2 className="w-5 h-5 animate-spin text-white/30" />}
          </div>
        </section>
      )}
    </>
  );
}
