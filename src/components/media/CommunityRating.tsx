'use client';

import { useState, useEffect } from 'react';
import { Star } from 'lucide-react';
import { getMediaCommunityRatingAction } from '@/lib/media-social-actions';
import { motion } from 'framer-motion';

interface CommunityRatingProps {
  mediaId: string;
  mediaType: string;
}

export default function CommunityRating({ mediaId, mediaType }: CommunityRatingProps) {
  const [stats, setStats] = useState<{ average: number, count: number } | null>(null);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    async function loadStats() {
      try {
        setIsError(false);
        const data = await getMediaCommunityRatingAction(mediaId, mediaType);
        setStats(data);
      } catch (error) {
        setIsError(true);
        console.error('[CommunityRating] load failed', { mediaId, mediaType, error });
      }
    }
    loadStats();
  }, [mediaId, mediaType]);

  if (isError) {
    return (
      <div className="flex items-center gap-2">
        <span className="font-metadata text-[10px] uppercase tracking-widest text-white/35">Community score unavailable</span>
      </div>
    );
  }

  if (!stats || stats.count === 0) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-6"
    >
      <div className="flex flex-col">
        <span className="font-metadata text-[10px] uppercase tracking-[0.2em] text-white/40 mb-1">Archive Score</span>
        <div className="flex items-center gap-2">
           <div className="bg-accent/10 border border-accent/20 px-3 py-1 rounded-lg flex items-center gap-2">
              <Star size={16} className="text-accent fill-accent" />
              <span className="font-display text-2xl font-bold text-accent italic">{stats.average}<span className="text-sm opacity-40 not-italic ml-0.5">/10</span></span>
           </div>
           <span className="font-data text-[10px] text-white/20 uppercase tracking-widest ml-1">{stats.count} Ratings</span>
        </div>
      </div>
    </motion.div>
  );
}
