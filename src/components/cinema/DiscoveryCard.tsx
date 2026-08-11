'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Star, Bell, BellOff } from 'lucide-react';
import { UniversalMedia } from '@/lib/api/UniversalTransformer';
import { cn, getReleaseStatus } from '@/lib/utils';
import Image from 'next/image';
import Link from 'next/link';
import { toggleReminder } from '@/app/actions/radar-actions';
import { isAfter, startOfToday } from 'date-fns';
import { toast } from 'sonner';
import { buildMediaHref, toCanonicalMediaId } from '@/lib/media-identity';
import MediaPreferenceButtons from '@/components/media/MediaPreferenceButtons';
import { useAuth } from '@/components/providers/AuthProvider';
import type { MediaPreference } from '@/lib/media-social-actions';
import { getLocalReminder, toggleLocalReminder, useLocalArchive } from '@/lib/local-archive';

interface DiscoveryCardProps {
  media: UniversalMedia;
  index: number;
  initialPreference?: MediaPreference | null;
  initialReminderStatus?: boolean;
}

export function DiscoveryCard({
  media: initialMedia,
  index,
  initialPreference = null,
  initialReminderStatus = false,
}: DiscoveryCardProps) {
  const { user, serviceStatus, isLocalMode } = useAuth();
  const localArchive = useLocalArchive();
  const [media] = useState<UniversalMedia>(initialMedia);
  const [remoteReminderOverride, setRemoteReminderOverride] = useState<boolean | null>(null);

  const isUpcoming = media.releaseDate ? isAfter(new Date(media.releaseDate), startOfToday()) : false;
  const releaseStatus = getReleaseStatus(media.releaseDate, media.type);

  const isReminded = isLocalMode
    ? !!getLocalReminder(toCanonicalMediaId(media), media.type, localArchive)
    : remoteReminderOverride ?? initialReminderStatus;

  const handleToggleReminder = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      if (isLocalMode) {
        const added = toggleLocalReminder({
          mediaId: toCanonicalMediaId(media),
          mediaType: media.type,
          title: media.displayTitle,
          posterUrl: media.posterUrl,
          releaseDate: media.releaseDate,
        });
        toast.success(added ? 'Reminder set locally' : 'Reminder removed');
        return;
      }
      const result = await toggleReminder(String(media.sourceId), media.type);
      if (result && 'error' in result) {
        toast.error(result.error as string);
        return;
      }
      setRemoteReminderOverride(result.status === 'added');
      if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(10);
      toast.success(result.status === 'added' ? "Reminder set" : "Reminder removed");
    } catch (err) {
      console.error('Failed to toggle reminder:', err);
      toast.error("Failed to toggle reminder");
    }
  };

  return (
    <article
      className="relative flex flex-col w-full rounded-2xl overflow-hidden bg-black border border-white/5 group transition-shadow duration-300 hover:shadow-[0_0_30px_rgba(255,255,255,0.05)]"
    >
      <Link
        href={buildMediaHref(media)}
        aria-label={`Open details for ${media.displayTitle}`}
        className="absolute inset-0 z-20"
      />
      {/* Base Card Image Container (2:3 aspect ratio) */}
      <div className="relative w-full aspect-2/3 overflow-hidden">
        {media.posterUrl ? (
          <Image
            src={media.posterUrl}
            alt={media.displayTitle}
            fill
            priority={index === 0}
            className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110 brightness-90 group-hover:brightness-100"
            sizes="(max-width: 639px) 92vw, (max-width: 768px) 50vw, 25vw"
          />
        ) : (
          <div className="w-full h-full bg-white/5 flex flex-col items-center justify-center">
             <span className="text-white/30 font-heading">No Image</span>
          </div>
        )}

        {/* Top Badges */}
        <div className="absolute top-2 left-2 right-2 flex justify-between items-start z-30 pointer-events-none">
          <div className="flex flex-col gap-1.5">
            {media.rating?.showBadge && (
              <div className="flex items-center gap-1 px-1 py-[2px] md:px-1.5 md:py-0.5 rounded bg-black/60 backdrop-blur-md border border-white/10 shadow-lg">
                <Star className="text-vibe-yellow w-2 h-2 md:w-2.5 md:h-2.5 fill-current" />
                <span className="text-white font-mono tracking-widest text-[7px] md:text-[9px] font-bold">{media.rating?.average?.toFixed(1)}</span>
              </div>
            )}
          </div>
          
          <div className="flex gap-1.5 relative pointer-events-auto">
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
               <MediaPreferenceButtons
                 mediaId={toCanonicalMediaId(media)}
                 mediaType={media.type}
                 title={media.displayTitle}
                 posterUrl={media.posterUrl}
                 compact
                 initialPreference={initialPreference}
               />
             )}

             {isUpcoming && user && (isLocalMode || serviceStatus === 'available') && (
                <motion.button 
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleToggleReminder}
                  aria-label={`${isReminded ? 'Dismiss reminder for' : 'Set reminder for'} ${media.displayTitle}`}
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
    </article>
  );
}
