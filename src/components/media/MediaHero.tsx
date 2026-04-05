'use client';

import { motion } from 'framer-motion';
import { ChevronLeft, Calendar, Clock, Play, Bookmark, Share2, Loader2, Check, History } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { DetailedMedia } from '@/lib/api/mapping';
import { toast } from 'sonner';

interface MediaHeroProps {
  media: DetailedMedia;
  isSaving: boolean;
  saveStatus: 'idle' | 'success' | 'error';
  isAlreadySaved?: boolean;
  onSave: () => void;
  onOpenSaveDialog?: () => void;
  onOpenJournal?: () => void;
  user?: any;
}

export default function MediaHero({ media, isSaving, saveStatus, isAlreadySaved = false, onSave, onOpenSaveDialog, onOpenJournal, user }: MediaHeroProps) {
  const router = useRouter();

  return (
    <section className="relative h-[50vh] md:h-[70vh] w-full overflow-hidden">
      <div className="absolute inset-0 z-0">
        {media.backdropUrl ? (
          <Image
            src={media.backdropUrl}
            alt={media.displayTitle}
            fill
            className="object-cover"
            priority
          />
        ) : (
          <div className="w-full h-full bg-surface" />
        )}
        {/* Layered mask for depth */}
        <div className="absolute inset-0 bg-linear-to-t from-background via-background/60 to-transparent" />
        <div className="absolute inset-0 bg-linear-to-r from-background via-transparent to-transparent opacity-80" />
      </div>

      {/* Back Button */}
      <nav className="absolute top-8 left-4 md:left-8 z-20">
        <motion.button
          whileHover={{ x: -5 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => router.back()}
          className="glass p-2.5 rounded-full hover:border-accent/30 transition-colors text-white/40 hover:text-accent"
        >
          <ChevronLeft size={20} />
        </motion.button>
      </nav>

      {/* Hero Content */}
      <div className="absolute bottom-0 left-0 right-0 z-10 p-4 md:p-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="max-w-4xl"
        >
          <div className="flex items-center gap-3 mb-2 md:mb-4">
            <span className="font-metadata bg-white/10 text-white px-2 py-0.5 md:px-3 md:py-1 rounded-inner text-[10px] md:text-xs uppercase">
              {media.type}
            </span>
            <div className="flex items-center gap-2 text-muted font-metadata text-[10px] md:text-xs">
              <Calendar size={10} className="md:w-3 md:h-3" />
              <span>{media.releaseYear}</span>
              {media.duration && (
                <>
                  <span className="mx-1">•</span>
                  <Clock size={10} className="md:w-3 md:h-3" />
                  <span>{media.duration}</span>
                </>
              )}
              {media.episodes && (
                <>
                  <span className="mx-1">•</span>
                  <span>{media.episodes} Episodes</span>
                </>
              )}
              {media.format && (
                <>
                  <span className="mx-1">•</span>
                  <span className="uppercase text-[10px] tracking-widest bg-white/5 px-2 py-0.5 rounded-xs">{media.format}</span>
                </>
              )}
            </div>
          </div>

          <h1 className="font-heading text-3xl md:text-8xl tracking-tighter leading-[0.8] mb-4 md:mb-6 italic">
            {media.displayTitle.toUpperCase()}
          </h1>

          <div className="flex flex-wrap items-center gap-2 md:gap-4">
            {media.trailerUrl ? (
              <a href={media.trailerUrl} target="_blank" rel="noopener noreferrer">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-4 py-2.5 md:px-6 md:py-3 rounded-card bg-white text-black font-heading text-sm md:text-base flex items-center gap-2 hover:bg-white/90 transition-colors shadow-2xl"
                >
                  <Play size={16} fill="currentColor" className="md:w-[18px] md:h-[18px]" />
                  Watch Trailer
                </motion.button>
              </a>
            ) : (
              <motion.button
                disabled
                className="px-8 py-4 rounded-card bg-white/10 text-white/50 font-heading flex items-center gap-3 cursor-not-allowed"
              >
                No Trailer Found
              </motion.button>
            )}
            <div className="flex gap-2">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onOpenSaveDialog || onSave}
                className={cn(
                  "p-2.5 md:p-3 rounded-xl backdrop-blur-md transition-all flex items-center justify-center border",
                  (saveStatus === 'success' || isAlreadySaved)
                    ? "bg-accent/20 border-accent/40 text-accent" 
                    : "bg-black/40 border-white/10 text-white/50 hover:text-white"
                )}
                title="Collect Film"
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 md:w-5 md:h-5 animate-spin" />
                ) : saveStatus === 'success' ? (
                  <Check className="w-4 h-4 md:w-5 md:h-5" />
                ) : (
                  <Bookmark className="w-4 h-4 md:w-5 md:h-5" fill={isAlreadySaved ? "currentColor" : "none"} />
                )}
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onOpenJournal}
                className="p-2.5 md:p-3 rounded-xl backdrop-blur-md transition-all flex items-center justify-center border bg-black/40 border-white/10 text-white/50 hover:text-white"
                title="Log Screening"
              >
                <History className="w-4 h-4 md:w-5 md:h-5" />
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={async () => {
                  const url = new URL(window.location.href);
                  if (user?.profile?.username) {
                    url.searchParams.set('via', user.profile.username);
                  }
                  const shareUrl = url.toString();

                  if (navigator.share) {
                    try {
                      await navigator.share({
                        title: media.displayTitle,
                        text: `Check out ${media.displayTitle} on CineChive!`,
                        url: shareUrl,
                      });
                    } catch (err) {
                      if ((err as Error).name !== 'AbortError') console.error('Error sharing:', err);
                    }
                  } else {
                    try {
                      await navigator.clipboard.writeText(shareUrl);
                      toast.success('Link copied to clipboard.');
                    } catch (err) {
                      console.error('Failed to copy:', err);
                    }
                  }
                }}
                className="p-2.5 md:p-3 rounded-xl backdrop-blur-md transition-all flex items-center justify-center border bg-black/40 border-white/10 text-white/50 hover:text-white"
                title="Share"
              >
                <Share2 className="w-4 h-4 md:w-5 md:h-5" />
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
