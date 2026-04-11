'use client';

import { useEffect, useState } from 'react';
import { Heart, ThumbsDown } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { getMediaPreferenceAction, setMediaPreferenceAction, type MediaPreference } from '@/lib/media-social-actions';
import { toast } from 'sonner';

interface MediaPreferenceButtonsProps {
  mediaId: string;
  mediaType: string;
  title?: string;
  posterUrl?: string | null;
  compact?: boolean;
}

export default function MediaPreferenceButtons({
  mediaId,
  mediaType,
  title,
  posterUrl,
  compact = false
}: MediaPreferenceButtonsProps) {
  const [reaction, setReaction] = useState<MediaPreference | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getMediaPreferenceAction(mediaId, mediaType).then((value) => {
      if (!cancelled) setReaction(value);
    });
    return () => {
      cancelled = true;
    };
  }, [mediaId, mediaType]);

  const applyReaction = async (next: MediaPreference, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (loading) return;
    const target = reaction === next ? null : next;
    setLoading(true);
    const previous = reaction;
    setReaction(target);
    try {
      const result = await setMediaPreferenceAction({
        mediaId,
        mediaType,
        reaction: target,
        title,
        posterUrl
      });
      if (result && 'error' in result) {
        setReaction(previous);
        toast.error(result.error as string);
        return;
      }
      if (target === 'like') toast.success('Added to your likes.');
      if (target === 'dislike') toast.success('Disliked. We will show less like this.');
      if (!target) toast.success('Preference cleared.');
    } catch {
      setReaction(previous);
      toast.error('Could not update preference.');
    } finally {
      setLoading(false);
    }
  };

  const buttonBase = 'p-1.5 rounded-full';

  return (
    <div className="flex items-center gap-2">
      <motion.button
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.94 }}
        onClick={(e) => applyReaction('like', e)}
        disabled={loading}
        className={cn(
          'transition-all flex items-center justify-center backdrop-blur-md',
          buttonBase,
          reaction === 'like'
            ? 'bg-rose-500/20 text-rose-400 scale-110'
            : 'bg-black/20 text-white/40 hover:text-white',
          loading && 'opacity-60 cursor-not-allowed'
        )}
        title="Like"
      >
        <Heart className={cn(compact ? 'w-2.5 h-2.5 md:w-3.5 md:h-3.5' : 'w-4 h-4 md:w-5 md:h-5', reaction === 'like' && 'fill-current')} />
      </motion.button>

      <motion.button
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.94 }}
        onClick={(e) => applyReaction('dislike', e)}
        disabled={loading}
        className={cn(
          'transition-all flex items-center justify-center backdrop-blur-md',
          buttonBase,
          reaction === 'dislike'
            ? 'bg-white/10 text-white scale-110'
            : 'bg-black/20 text-white/40 hover:text-white',
          loading && 'opacity-60 cursor-not-allowed'
        )}
        title="Dislike"
      >
        <ThumbsDown className={compact ? 'w-2.5 h-2.5 md:w-3.5 md:h-3.5' : 'w-4 h-4 md:w-5 md:h-5'} />
      </motion.button>
    </div>
  );
}
