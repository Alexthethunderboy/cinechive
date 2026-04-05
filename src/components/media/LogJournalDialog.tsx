'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Star, History, Check, Loader2, Play } from 'lucide-react';
import GlassPanel from '@/components/ui/GlassPanel';
import { cn } from '@/lib/utils';
import { logScreeningAction } from '@/lib/journal-actions';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface LogJournalDialogProps {
  isOpen: boolean;
  onClose: () => void;
  media: {
    id: string;
    type: string;
    title: string;
    posterUrl: string | null;
  };
}

export default function LogJournalDialog({ isOpen, onClose, media }: LogJournalDialogProps) {
  const router = useRouter();
  const [watchedAt, setWatchedAt] = useState(new Date().toISOString().split('T')[0]);
  const [isRewatch, setIsRewatch] = useState(false);
  const [rating, setRating] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    setIsSubmitting(true);
    try {
      await logScreeningAction({
        mediaId: media.id,
        mediaType: media.type,
        title: media.title,
        posterUrl: media.posterUrl,
        watchedAt: new Date(watchedAt).toISOString(),
        isRewatch,
        rating: rating || undefined
      });
      toast.success(`Logged ${media.title} to your journal.`);
      onClose();
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "Failed to log screening.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center px-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md"
          >
            <GlassPanel className="p-8 border-white/10 bg-surface shadow-2xl overflow-hidden">
               {/* Header */}
               <div className="flex items-center justify-between mb-8">
                  <div className="space-y-1">
                     <h2 className="font-display text-2xl font-bold text-white uppercase italic tracking-tighter">Log <span className="text-accent underline decoration-white/10 underline-offset-4">Screening</span></h2>
                     <p className="font-metadata text-[10px] text-white/30 uppercase tracking-widest italic">Add to your cinematic journal</p>
                  </div>
                  <button onClick={onClose} className="p-2 rounded-full hover:bg-white/5 text-white/40 hover:text-white transition-all">
                     <X size={20} />
                  </button>
               </div>

               {/* Media Info Mini */}
               <div className="flex gap-4 p-3 bg-white/5 border border-white/5 rounded-2xl mb-8">
                  <div className="relative w-12 aspect-2/3 rounded-lg overflow-hidden border border-white/10 shrink-0">
                     {media.posterUrl && <img src={media.posterUrl} alt={media.title} className="w-full h-full object-cover" />}
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                     <h3 className="font-heading text-sm text-white font-bold truncate">{media.title}</h3>
                     <span className="font-data text-[9px] text-accent uppercase tracking-widest">{media.type}</span>
                  </div>
               </div>

               {/* Form */}
               <div className="space-y-6">
                  {/* Date Pick */}
                  <div className="space-y-3">
                     <label className="flex items-center gap-2 font-metadata text-[10px] text-white/40 uppercase tracking-widest leading-none">
                        <Calendar size={12} className="text-accent" />
                        Screening Date
                     </label>
                     <input 
                        type="date" 
                        value={watchedAt}
                        onChange={(e) => setWatchedAt(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 font-heading text-white focus:outline-none focus:border-accent/40 transition-colors"
                     />
                  </div>

                  {/* Rating Log */}
                  <div className="space-y-3">
                     <label className="flex items-center gap-2 font-metadata text-[10px] text-white/40 uppercase tracking-widest leading-none">
                        <Star size={12} className="text-vibe-gold" />
                        Journal Rating (Optional)
                     </label>
                     <div className="flex justify-between gap-1">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((r) => (
                           <button
                              key={r}
                              onClick={() => setRating(r === rating ? null : r)}
                              className={cn(
                                 "flex-1 aspect-square rounded-lg font-display text-[10px] font-bold transition-all border",
                                 rating === r 
                                    ? "bg-accent border-accent text-black" 
                                    : "bg-white/5 border-white/10 text-white/40 hover:border-white/30"
                              )}
                           >
                              {r}
                           </button>
                        ))}
                     </div>
                  </div>

                  {/* Rewatch Toggle */}
                  <button 
                     onClick={() => setIsRewatch(!isRewatch)}
                     className={cn(
                        "w-full flex items-center justify-between p-4 rounded-xl border transition-all group",
                        isRewatch ? "bg-amber-500/10 border-amber-500/30" : "bg-white/5 border-white/10 hover:border-white/20"
                     )}
                  >
                     <div className="flex items-center gap-3">
                        <div className={cn(
                           "p-2 rounded-lg transition-colors",
                           isRewatch ? "bg-amber-500 text-black" : "bg-white/10 text-white/40 group-hover:text-white"
                        )}>
                           <History size={16} />
                        </div>
                        <div className="text-left">
                           <p className="font-heading text-xs text-white font-bold">Rewatch</p>
                           <p className="font-metadata text-[9px] text-white/20 uppercase tracking-widest">Seen before?</p>
                        </div>
                     </div>
                     <div className={cn(
                        "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all",
                        isRewatch ? "bg-amber-500 border-amber-500 text-black" : "border-white/10"
                     )}>
                        {isRewatch && <Check size={12} strokeWidth={4} />}
                     </div>
                  </button>

                  <div className="pt-4">
                     <button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="w-full flex items-center justify-center gap-3 py-4 rounded-xl bg-white text-black font-heading text-sm font-bold hover:bg-white/90 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100 shadow-xl"
                     >
                        {isSubmitting ? (
                           <Loader2 className="animate-spin" size={18} />
                        ) : (
                           <>
                              <Play size={18} fill="currentColor" />
                              Confirm Screening Log
                           </>
                        )}
                     </button>
                  </div>
               </div>
            </GlassPanel>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
