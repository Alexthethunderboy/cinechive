'use server';

import { MediaFetcher, FeedEntity } from './api/MediaFetcher';
import { AniListFetcher } from './api/anilist';
import { AnimationFetcher } from './api/AnimationFetcher';
import { MediaTransformer, AnimatrixEntity } from './api/MediaTransformer';

export async function fetchTrendingPage(
  type: 'movie' | 'tv',
  pageParam: number
): Promise<{ results: FeedEntity[]; nextCursor: number | undefined }> {
  try {
    const data = await MediaFetcher.getTrendingFeed(type, pageParam);
    
    return {
      results: data.results,
      nextCursor: pageParam < data.totalPages ? pageParam + 1 : undefined,
    };
  } catch (error) {
    console.error(`Error in fetchTrendingPage for ${type} page ${pageParam}:`, error);
    throw error;
  }
}

export async function fetchAnimePage(
  pageParam: number
): Promise<{ results: AnimatrixEntity[]; nextCursor: number | undefined }> {
  try {
    const res = await AniListFetcher.getTrendingAnime(pageParam, 20);
    const transformed = res.media.map(a => MediaTransformer.transformAniListToAnimatrix(a));
    return {
      results: transformed,
      nextCursor: res.pageInfo.hasNextPage ? pageParam + 1 : undefined,
    };
  } catch (error) {
    console.error(`Error in fetchAnimePage page ${pageParam}:`, error);
    throw error;
  }
}

export async function fetchAnimationPage(
  pageParam: number
): Promise<{ results: AnimatrixEntity[]; nextCursor: number | undefined }> {
  try {
    const res = await AnimationFetcher.getTrendingAnimation(pageParam);
    const transformed = res.results.map(r => MediaTransformer.transformFeedEntityToAnimatrix(r));
    return {
      results: transformed,
      nextCursor: pageParam < res.totalPages ? pageParam + 1 : undefined,
    };
  } catch (error) {
    console.error(`Error in fetchAnimationPage page ${pageParam}:`, error);
    throw error;
  }
}
