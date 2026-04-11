'use client';

import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';
import { DiscoveryCard } from '../cinema/DiscoveryCard';
import ProfileEmptyState from './ProfileEmptyState';
import { UniversalMedia } from '@/lib/api/UniversalTransformer';

interface LikesDisplayProps {
  likedMedia: any[];
}

export default function LikesDisplay({ likedMedia }: LikesDisplayProps) {
  // Map simple liked rows to UniversalMedia-like structure
  const items: UniversalMedia[] = likedMedia.map(item => ({
    id: item.id || item.media_id,
    sourceId: item.sourceId || item.media_id,
    source: (item.media_type === 'anime' ? 'anilist' : 'tmdb') as 'tmdb' | 'anilist',
    type: item.type as any,
    displayTitle: item.displayTitle,
    posterUrl: item.posterUrl,
    overview: '',
    backdropUrl: null,
    classification: 'Atmospheric', // Default for likes view
    genres: [],
    releaseYear: null,
    releaseDate: null,
    status: null,
    rating: {
      average: 0,
      count: 0,
      showBadge: false
    },
    popularity: 0
  }));

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h3 className="font-heading text-xl md:text-2xl italic uppercase tracking-tight text-white/80">
          Personal Favorites
        </h3>
        <div className="flex items-center gap-2 px-3 py-1 bg-rose-500/10 border border-rose-500/20 rounded-full">
          <Heart size={12} className="text-rose-400 fill-current" />
          <span className="font-data text-[10px] text-rose-300 uppercase tracking-widest font-bold">
            {items.length} Liked
          </span>
        </div>
      </div>

      {items.length === 0 ? (
        <ProfileEmptyState
          icon={Heart}
          title="No Favorites Yet"
          body="Heart titles you love across the archive to build your collection."
          ctaLabel="Discover media"
          ctaHref="/discover"
        />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
          {items.map((media, idx) => (
            <motion.div
              key={media.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <DiscoveryCard media={media} index={idx} />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
