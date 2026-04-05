'use client';

import { useState, useTransition } from 'react';
import { Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toggleReactionAction } from '@/lib/reaction-actions';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface ReactionButtonProps {
  activityId: string;
  activityType: 'entry' | 're_archive' | 'echo' | 'dispatch' | 'screening';
  initialCount?: number;
  initialReacted?: boolean;
  className?: string;
  size?: number;
}

export default function ReactionButton({
  activityId,
  activityType,
  initialCount = 0,
  initialReacted = false,
  className
}: ReactionButtonProps) {
  const [isReacted, setIsReacted] = useState(initialReacted);
  const [count, setCount] = useState(initialCount);
  const [isPending, startTransition] = useTransition();

  async function handleToggle() {
    // Optimistic Update
    const prevReacted = isReacted;
    const prevCount = count;
    
    setIsReacted(!prevReacted);
    setCount(prevCount + (prevReacted ? -1 : 1));

    startTransition(async () => {
      const result = await toggleReactionAction(activityId, activityType);
      
      if (result.error) {
        // Revert on failure
        setIsReacted(prevReacted);
        setCount(prevCount);
        toast.error(result.error);
      }
    });
  }

  return (
    <button
      onClick={handleToggle}
      disabled={isPending}
      className={cn(
        "flex items-center gap-1.5 transition-all text-xs font-data group/btn",
        isReacted ? "text-rose-500" : "text-white/30 hover:text-rose-400",
        className
      )}
    >
      <div className="relative">
        <Heart 
          size={16} 
          className={cn(
            "transition-transform duration-300 group-hover/btn:scale-125",
            isReacted && "fill-current"
          )} 
        />
        <AnimatePresence>
          {isReacted && (
            <motion.div
              initial={{ scale: 0, opacity: 1 }}
              animate={{ scale: 2.5, opacity: 0 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-rose-500 rounded-full -z-10 pointer-events-none"
            />
          )}
        </AnimatePresence>
      </div>
      <motion.span
        key={count}
        initial={{ y: 2, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="min-w-[1ch]"
      >
        {count}
      </motion.span>
    </button>
  );
}
