'use client';

import React, { useEffect } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useInView } from 'react-intersection-observer';
import { getSelectionPageAction } from '@/lib/actions';
import { UniversalMedia } from '@/lib/api/UniversalTransformer';
import { DiscoveryCard } from './DiscoveryCard';
import { Loader2, Sparkles } from 'lucide-react';

interface SelectionFeedProps {
  slug: string;
  initialMovies: { results: UniversalMedia[]; totalPages: number };
}

export function SelectionFeed({ slug, initialMovies }: SelectionFeedProps) {
  const { ref, inView } = useInView({ rootMargin: '1000px' });

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['selectionFeed', slug],
    queryFn: async ({ pageParam = 1 }) => {
      if (pageParam === 1) return initialMovies;
      const result = await getSelectionPageAction(slug, pageParam);
      return result?.movies || { results: [], totalPages: 0 };
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

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [inView, fetchNextPage, hasNextPage, isFetchingNextPage]);

  const allMovies = data?.pages.flatMap((page) => page.results) || [];

  return (
    <section className="px-4 md:px-10">
      <div className="flex items-center gap-2 mb-8">
        <Sparkles size={14} className="text-white/20" />
        <span className="font-metadata text-[11px] text-white/20 uppercase tracking-widest">
           films available
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {allMovies.map((item, i) => (
          <DiscoveryCard key={`${item.sourceId}-${i}`} media={item} index={i} />
        ))}
      </div>
      
      <div ref={ref} className="w-full py-12 flex justify-center mt-4 text-white/30">
        {isFetchingNextPage && <Loader2 className="w-5 h-5 animate-spin text-white/30" />}
      </div>
    </section>
  );
}
