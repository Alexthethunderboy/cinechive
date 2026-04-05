'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { UserPlus, UserCheck, Loader2 } from 'lucide-react';
import { followUserAction, unfollowUserAction } from '@/lib/social-actions';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface FollowButtonProps {
  targetUserId: string;
  initialFollowing?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

export default function FollowButton({
  targetUserId,
  initialFollowing = false,
  size = 'md',
  className,
}: FollowButtonProps) {
  const router = useRouter();
  const [isFollowing, setIsFollowing] = useState(initialFollowing);
  const [isHovered, setIsHovered] = useState(false);
  const [isPending, startTransition] = useTransition();

  async function handleClick() {
    // Optimistic update
    const prev = isFollowing;
    setIsFollowing(!prev);

    startTransition(async () => {
      const result = prev
        ? await unfollowUserAction(targetUserId)
        : await followUserAction(targetUserId);

      if (result?.error) {
        // Revert on failure
        setIsFollowing(prev);
        toast.error(result.error);
      } else {
        toast.success(prev ? 'Unfollowed' : 'Following');
        router.refresh();
      }
    });
  }

  const isSmall = size === 'sm';

  return (
    <motion.button
      onClick={handleClick}
      disabled={isPending}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileTap={{ scale: 0.95 }}
      className={cn(
        'relative inline-flex items-center gap-2 font-heading font-bold uppercase tracking-wider transition-all duration-300 rounded-full border focus:outline-none',
        isSmall ? 'px-3 py-1.5 text-[10px]' : 'px-5 py-2.5 text-xs',
        isFollowing
          ? 'bg-white/5 border-white/20 text-white hover:bg-red-500/10 hover:border-red-500/40 hover:text-red-400'
          : 'bg-white text-black border-white hover:bg-white/90',
        isPending && 'opacity-60 cursor-not-allowed',
        className
      )}
    >
      <AnimatePresence mode="wait">
        {isPending ? (
          <motion.span
            key="loading"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="flex items-center gap-2"
          >
            <Loader2 size={isSmall ? 10 : 13} className="animate-spin" />
            {!isSmall && 'Loading...'}
          </motion.span>
        ) : isFollowing ? (
          <motion.span
            key="following"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            className="flex items-center gap-1.5"
          >
            <UserCheck size={isSmall ? 10 : 13} />
            {isHovered ? (isSmall ? '–' : 'Unfollow') : isSmall ? '✓' : 'Following'}
          </motion.span>
        ) : (
          <motion.span
            key="follow"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            className="flex items-center gap-1.5"
          >
            <UserPlus size={isSmall ? 10 : 13} />
            Follow
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}
