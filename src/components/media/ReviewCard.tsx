'use client';

import { motion } from 'framer-motion';
import GlassPanel from '@/components/ui/GlassPanel';
import { Star, Quote } from 'lucide-react';
import Image from 'next/image';

interface ReviewCardProps {
  review: {
    id: string;
    notes: string;
    rating: number | null;
    created_at: string;
    profiles: {
      username: string;
      display_name: string | null;
      avatar_url: string | null;
    };
    mood_tags?: {
      label: string;
      emoji: string | null;
      color: string | null;
    } | null;
  };
  index: number;
}

export default function ReviewCard({ review, index }: ReviewCardProps) {
  const date = new Date(review.created_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <GlassPanel className="p-6 bg-white/5 border-white/10 hover:border-accent/30 transition-all group">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 rounded-full overflow-hidden border border-white/10">
              {review.profiles.avatar_url ? (
                <Image 
                  src={review.profiles.avatar_url} 
                  alt={review.profiles.username} 
                  fill 
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full bg-accent/20 flex items-center justify-center text-accent font-bold text-xs">
                  {review.profiles.username[0].toUpperCase()}
                </div>
              )}
            </div>
            <div>
              <h4 className="font-heading text-sm text-white leading-none mb-1">
                {review.profiles.display_name || review.profiles.username}
              </h4>
              <p className="font-data text-[10px] text-muted uppercase tracking-widest">
                @{review.profiles.username} • {date}
              </p>
            </div>
          </div>

          {review.rating && (
            <div className="flex items-center gap-1.5 px-3 py-1 bg-accent/10 rounded-full border border-accent/20">
              <Star size={12} className="text-accent fill-accent" />
              <span className="font-display text-sm text-accent">{review.rating}</span>
            </div>
          )}
        </div>

        <div className="relative">
          <Quote className="absolute -top-2 -left-2 text-white/5 w-8 h-8 -z-10" />
          <p className="font-sans text-sm text-white/80 leading-relaxed mb-4 pl-2">
            {review.notes}
          </p>
        </div>

        {review.mood_tags && (
          <div className="flex items-center gap-2 pt-4 border-t border-white/5">
            <span className="text-xs">{review.mood_tags.emoji}</span>
            <span 
              className="font-data text-[10px] uppercase tracking-[0.2em]"
              style={{ color: review.mood_tags.color || 'var(--color-muted)' }}
            >
              {review.mood_tags.label}
            </span>
          </div>
        )}
      </GlassPanel>
    </motion.div>
  );
}
