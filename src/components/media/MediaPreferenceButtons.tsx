'use client';

import { useEffect, useState } from 'react';
import { Heart, ThumbsDown } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { getMediaPreferenceAction, setMediaPreferenceAction, type MediaPreference } from '@/lib/media-social-actions';
import { toast } from 'sonner';
import { useAuth } from '@/components/providers/AuthProvider';
import { getLocalPreference, setLocalPreference, useLocalArchive } from '@/lib/local-archive';

interface MediaPreferenceButtonsProps {
  mediaId: string;
  mediaType: string;
  title?: string;
  posterUrl?: string | null;
  compact?: boolean;
  initialPreference?: MediaPreference | null;
  loadInitialPreference?: boolean;
}

export default function MediaPreferenceButtons({
  mediaId,
  mediaType,
  title,
  posterUrl,
  compact = false,
  initialPreference = null,
  loadInitialPreference = false,
}: MediaPreferenceButtonsProps) {
  const { user, serviceStatus, isLocalMode } = useAuth();
  const localArchive = useLocalArchive();
  const [remoteReactionOverride, setRemoteReactionOverride] = useState<MediaPreference | null | undefined>(undefined);
  const [loadedRemoteReaction, setLoadedRemoteReaction] = useState<MediaPreference | null | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const reaction = isLocalMode
    ? getLocalPreference(mediaId, mediaType, localArchive)?.reaction || null
    : remoteReactionOverride !== undefined
      ? remoteReactionOverride
      : loadedRemoteReaction !== undefined
        ? loadedRemoteReaction
        : initialPreference;

  useEffect(() => {
    if (isLocalMode || !loadInitialPreference || !user || serviceStatus !== 'available') return;

    let cancelled = false;
    getMediaPreferenceAction(mediaId, mediaType).then((value) => {
      if (!cancelled) setLoadedRemoteReaction(value);
    });
    return () => {
      cancelled = true;
    };
  }, [isLocalMode, loadInitialPreference, mediaId, mediaType, serviceStatus, user]);

  const applyReaction = async (next: MediaPreference, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (loading) return;
    const target = reaction === next ? null : next;
    setLoading(true);
    const previous = reaction;
    if (!isLocalMode) setRemoteReactionOverride(target);
    try {
      if (isLocalMode) {
        setLocalPreference({ mediaId, mediaType, reaction: target, title, posterUrl });
        if (target === 'like') toast.success('Added to your local likes.');
        if (target === 'dislike') toast.success('Saved locally. We will show less like this.');
        if (!target) toast.success('Preference cleared.');
        return;
      }
      const result = await setMediaPreferenceAction({
        mediaId,
        mediaType,
        reaction: target,
        title,
        posterUrl
      });
      if (result && 'error' in result) {
        setRemoteReactionOverride(previous);
        toast.error(result.error as string);
        return;
      }
      if (target === 'like') toast.success('Added to your likes.');
      if (target === 'dislike') toast.success('Disliked. We will show less like this.');
      if (!target) toast.success('Preference cleared.');
    } catch {
      if (!isLocalMode) setRemoteReactionOverride(previous);
      toast.error('Could not update preference.');
    } finally {
      setLoading(false);
    }
  };

  const buttonBase = 'p-1.5 rounded-full';

  if (!user || (!isLocalMode && serviceStatus !== 'available')) return null;

  return (
    <div className="flex items-center gap-2">
      <motion.button
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.94 }}
        onClick={(e) => applyReaction('like', e)}
        disabled={loading}
        aria-label={`${reaction === 'like' ? 'Remove like from' : 'Like'} ${title || 'this title'}`}
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
        aria-label={`${reaction === 'dislike' ? 'Remove dislike from' : 'Dislike'} ${title || 'this title'}`}
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
