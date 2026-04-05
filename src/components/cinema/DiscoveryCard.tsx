'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Star, Bookmark, Loader2, Check, Bell, BellOff, Plus } from 'lucide-react';
import { UniversalMedia } from '@/lib/api/UniversalTransformer';
import { cn, formatDate, getReleaseStatus } from '@/lib/utils';
import Image from 'next/image';
import Link from 'next/link';
import { archiveMediaAction } from '@/lib/actions';
import { toggleReminder, getReminderStatus } from '@/app/actions/radar-actions';
import { isAfter, startOfToday } from 'date-fns';
import { toast } from 'sonner';
import SaveMediaDialog from '../vault/SaveMediaDialog';

interface DiscoveryCardProps {
  media: UniversalMedia;
  index: number;
  isAlreadySaved?: boolean;
}

export function DiscoveryCard({ media: initialMedia, index, isAlreadySaved = false }: DiscoveryCardProps) {
  const [media] = useState<UniversalMedia>(initialMedia);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(isAlreadySaved);
  const [isReminded, setIsReminded] = useState(false);
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);

  const isUpcoming = media.releaseDate ? isAfter(new Date(media.releaseDate), startOfToday()) : false;
  const releaseStatus = getReleaseStatus(media.releaseDate, media.type);

  useEffect(() => {
    if (isUpcoming) {
      getReminderStatus(String(media.sourceId), media.type).then(setIsReminded);
    }
  }, [media.sourceId, media.type, isUpcoming]);

  const handleSaveToVault = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isSaving || isSaved) return;
    
    setIsSaving(true);
    try {
      const result = await archiveMediaAction({
        mediaId: media.id,
        mediaType: media.type,
        title: media.displayTitle,
        posterUrl: media.posterUrl,
        classification: 'Atmospheric', 
      });
      
      if (result && 'error' in result) {
        toast.error(result.error as string);
        return;
      }
      
      setIsSaved(true);
      if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(10);
      toast.success("Added to library");
    } catch (error) {
       console.error("Failed to add to watchlist:", error);
       toast.error("Failed to add to library");
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenSaveDialog = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsSaveDialogOpen(true);
  };

  const handleToggleReminder = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const result = await toggleReminder(String(media.sourceId), media.type);
      if (result && 'error' in result) {
        toast.error(result.error as string);
        return;
      }
      setIsReminded(result.status === 'added');
      if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(10);
      toast.success(result.status === 'added' ? "Reminder set" : "Reminder removed");
    } catch (err) {
      console.error('Failed to toggle reminder:', err);
      toast.error("Failed to toggle reminder");
    }
  };

  return (
    <Link
      href={`/media/${media.type}/${media.sourceId}`}
      className="relative flex flex-col w-full rounded-2xl overflow-hidden bg-black border border-white/5 group transition-all duration-500 hover:shadow-[0_0_40px_rgba(255,255,255,0.05)]"
    >
      {/* Base Card Image Container (2:3 aspect ratio) */}
      <div className="relative w-full aspect-2/3 overflow-hidden">
        {media.posterUrl ? (
          <Image
            src={media.posterUrl}
            alt={media.displayTitle}
            fill
            className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110 brightness-90 group-hover:brightness-100"
            sizes="(max-width: 768px) 50vw, 25vw"
          />
        ) : (
          <div className="w-full h-full bg-white/5 flex flex-col items-center justify-center">
             <span className="text-white/30 font-heading">No Image</span>
          </div>
        )}

        {/* Top Badges */}
        <div className="absolute top-2 left-2 right-2 flex justify-between items-start z-10">
          <div className="flex flex-col gap-1.5">
            {media.rating?.showBadge && (
              <div className="flex items-center gap-1 px-1 py-[2px] md:px-1.5 md:py-0.5 rounded bg-black/60 backdrop-blur-md border border-white/10 shadow-lg">
                <Star className="text-vibe-yellow w-2 h-2 md:w-2.5 md:h-2.5 fill-current" />
                <span className="text-white font-mono tracking-widest text-[7px] md:text-[9px] font-bold">{media.rating?.average?.toFixed(1)}</span>
              </div>
            )}
          </div>
          
          <div className="flex gap-1.5 relative z-20">
             {releaseStatus && (
               <span className={cn(
                 "inline-flex items-center text-[7px] md:text-[9px] font-mono tracking-widest font-bold px-1 py-[2px] md:px-1.5 md:py-0.5 rounded backdrop-blur-md uppercase shadow-lg",
                 releaseStatus.style
               )}>
                 {releaseStatus.label}
               </span>
             )}
             <span className="hidden xs:inline-block text-[9px] font-mono tracking-widest text-white/50 bg-black/40 px-1.5 py-0.5 rounded backdrop-blur-md uppercase">
               {media.type}
             </span>
             
             {!isUpcoming && (
               <div className="flex gap-1">
                  <motion.button 
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleOpenSaveDialog}
                    className={cn(
                      "p-1 md:p-1.5 rounded-md backdrop-blur-md transition-all flex items-center justify-center border",
                      isSaved ? "bg-white text-black border-white" : "bg-black/40 border-white/10 text-white/50 hover:text-white"
                    )}
                    title="Save & Curate"
                  >
                    <Bookmark className={cn("w-2.5 md:w-3.5 h-2.5 md:h-3.5", isSaved && "fill-current")} fill={isSaved ? "currentColor" : "none"} />
                  </motion.button>
               </div>
             )}

             {isUpcoming && (
                <motion.button 
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleToggleReminder}
                  className={cn(
                    "p-1 md:p-1.5 rounded-md backdrop-blur-md transition-all flex items-center justify-center border",
                    isReminded ? "bg-white text-black border-white" : "bg-black/40 border-white/10 text-white/50 hover:text-white"
                  )}
                  title={isReminded ? "Dismiss Reminder" : "Notify Me"}
                >
                  {isReminded ? <BellOff className="w-2.5 md:w-3.5 h-2.5 md:h-3.5" /> : <Bell className="w-2.5 md:w-3.5 h-2.5 md:h-3.5" />}
                </motion.button>
             )}
          </div>
        </div>

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/20 to-transparent transition-opacity duration-500 opacity-100 group-hover:via-black/40"></div>

        {/* Base Info (Title & Year) */}
        <div className="absolute left-3 right-3 bottom-4 z-10 transition-all duration-500">
          <h2 className="text-lg font-heading text-white leading-tight mb-1 line-clamp-2 group-hover:text-accent transition-colors">
            {media.displayTitle}
          </h2>
          <div className="flex items-center gap-2 text-white/40 font-metadata text-[10px]">
            {media.releaseYear && <span>{media.releaseYear}</span>}
            {media.duration && (
              <>
                <span className="w-0.5 h-0.5 rounded-full bg-white/20"></span>
                <span>{media.duration}</span>
              </>
            )}
            {media.genres?.length > 0 && (
               <>
                 <span className="w-0.5 h-0.5 rounded-full bg-white/20"></span>
                 <span className="text-white/30 truncate">{media.genres[0]}</span>
               </>
            )}
          </div>
        </div>
      </div>
      <SaveMediaDialog 
        isOpen={isSaveDialogOpen} 
        onClose={() => setIsSaveDialogOpen(false)} 
        media={media} 
      />
    </Link>
  );
}
