'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Globe, MessageSquare, Loader2 } from 'lucide-react';
import ReviewCard from './ReviewCard';
import { getPublicReviews, getFriendReviews } from '@/lib/actions';
import { cn } from '@/lib/utils';

interface ReviewSectionProps {
  mediaId: string;
  mediaType: string;
}

export default function ReviewSection({ mediaId, mediaType }: ReviewSectionProps) {
  const [activeTab, setActiveTab] = useState<'public' | 'friends'>('public');
  const [reviews, setReviews] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadReviews() {
      setIsLoading(true);
      try {
        const data = activeTab === 'public' 
          ? await getPublicReviews(mediaId, mediaType)
          : await getFriendReviews(mediaId, mediaType);
        setReviews(data);
      } catch (error) {
        console.error("Error loading reviews:", error);
      } finally {
        setIsLoading(false);
      }
    }

    loadReviews();
  }, [activeTab, mediaId, mediaType]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <h2 className="font-display text-3xl tracking-tighter uppercase italic text-white flex items-center gap-3">
          <MessageSquare className="text-accent" />
          Community Pulse
        </h2>

        <div className="flex p-1 bg-white/5 rounded-full border border-white/10 w-fit">
          <button
            onClick={() => setActiveTab('public')}
            className={cn(
              "flex items-center gap-2 px-6 py-2 rounded-full font-data text-[10px] uppercase tracking-widest transition-all",
              activeTab === 'public' ? "bg-accent text-black font-bold" : "text-white/40 hover:text-white"
            )}
          >
            <Globe size={14} />
            Public
          </button>
          <button
            onClick={() => setActiveTab('friends')}
            className={cn(
              "flex items-center gap-2 px-6 py-2 rounded-full font-data text-[10px] uppercase tracking-widest transition-all",
              activeTab === 'friends' ? "bg-accent text-black font-bold" : "text-white/40 hover:text-white"
            )}
          >
            <Users size={14} />
            Friends
          </button>
        </div>
      </div>

      <div className="min-h-[200px] relative">
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              key="loader"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center py-12"
            >
              <Loader2 className="animate-spin text-accent" size={32} />
            </motion.div>
          ) : reviews.length > 0 ? (
            <motion.div
              key="content"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
            >
              {reviews.map((review, i) => (
                <ReviewCard key={review.id} review={review} index={i} />
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-12 text-center border border-dashed border-white/10 rounded-card bg-white/5"
            >
              <p className="font-heading text-white/40 italic">
                {activeTab === 'friends' 
                  ? "None of your friends have shared their thoughts on this yet." 
                  : "Be the first to share your frequency on this media."}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
