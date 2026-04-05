'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Star, ChevronDown, Check, Bookmark, Loader2, Info, Users, DollarSign, Bell, BellOff } from 'lucide-react';
import { UniversalMedia } from '@/lib/api/UniversalTransformer';
import { cn, formatDate, getReleaseStatus } from '@/lib/utils';
import Image from 'next/image';
import Link from 'next/link';
import { archiveMediaAction } from '@/lib/actions';
import { toggleReminder, getReminderStatus } from '@/app/actions/radar-actions';
import { isAfter, startOfToday } from 'date-fns';
import { useEffect } from 'react';

import { toast } from 'sonner';

interface AnimatrixCardProps {
  media: UniversalMedia;
  index: number;
}

export function AnimatrixCard({ media, index }: AnimatrixCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isReminded, setIsReminded] = useState(false);

  const isUpcoming = media.releaseDate ? isAfter(new Date(media.releaseDate), startOfToday()) : false;
  const releaseStatus = getReleaseStatus(media.releaseDate, media.type);

  useEffect(() => {
    if (isUpcoming) {
      getReminderStatus(String(media.sourceId), media.type).then(setIsReminded);
    }
  }, [media.sourceId, media.type, isUpcoming]);

  const handleSaveToVault = async (e: React.MouseEvent) => {
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
      toast.success("Added to library");
    } catch (error) {
       console.error("Failed to add to watchlist:", error);
       toast.error("Failed to add to library");
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleReminder = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const result = await toggleReminder(String(media.sourceId), media.type);
      if (result && 'error' in result) {
        toast.error(result.error as string);
        return;
      }
      setIsReminded(result.status === 'added');
      toast.success(result.status === 'added' ? "Reminder set" : "Reminder removed");
    } catch (err) {
      console.error('Failed to toggle reminder:', err);
      toast.error("Failed to toggle reminder");
    }
  };

  return (
    <div
      className="relative flex flex-col w-full rounded-2xl overflow-hidden bg-black border border-white/5 group cursor-pointer transition-all duration-500 hover:shadow-[0_0_40px_rgba(255,255,255,0.05)]"
      onClick={() => setIsExpanded(!isExpanded)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative w-full aspect-2/3 overflow-hidden bg-black">
        {media.posterUrl ? (
          <img
            src={media.posterUrl}
            alt={media.displayTitle}
            className={cn(
              "absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105",
              (isExpanded || (isHovered && media.trailerUrl && media.source === 'anilist')) ? "opacity-0" : "opacity-100",
              isExpanded ? "blur-sm brightness-50" : "brightness-90 group-hover:brightness-100"
            )}
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-white/5 flex flex-col items-center justify-center absolute inset-0">
             <span className="text-white/30 font-heading">No Image</span>
          </div>
        )}

        {/* Hover Quick-Play snippet for Anime */}
        {media.source === 'anilist' && media.trailerUrl && (
          <div className={cn(
            "absolute inset-0 w-full h-full transition-opacity duration-500 bg-black",
            (isHovered && !isExpanded) ? "opacity-100 z-0" : "opacity-0 -z-10"
          )}>
             {(isHovered && !isExpanded) && (
               <iframe 
                 width="100%" 
                 height="100%" 
                 src={`${media.trailerUrl.replace('watch?v=', 'embed/')}?autoplay=1&mute=1&controls=0&modestbranding=1&loop=1&playlist=${media.trailerUrl.split('?v=')[1]}`}
                 title="Quick Play Trailer"
                 frameBorder="0"
                 allow="autoplay; encrypted-media"
                 className="w-full h-full object-cover scale-150 pointer-events-none"
               />
             )}
             {/* Gradient over video to ensure text legibility */}
             <div className="absolute inset-0 bg-linear-to-t from-black via-black/40 to-black/20" />
          </div>
        )}

        {/* Top Badges */}
        <div className="absolute top-4 left-4 right-4 flex justify-between items-start z-10 transition-opacity duration-300">
          <div className="flex flex-col gap-2">
            {media.rating.showBadge && (
              <div className="flex items-center gap-1 px-1 py-[2px] md:px-1.5 md:py-0.5 rounded bg-black/60 backdrop-blur-md border border-white/10 shadow-lg">
                <Star className="text-vibe-yellow w-2 h-2 md:w-2.5 md:h-2.5 fill-current" />
                <span className="text-white font-mono tracking-widest text-[7px] md:text-[9px] font-bold">{media.rating.average.toFixed(1)}</span>
              </div>
            )}
            
            {/* Anime Specific Badges */}
            {media.source === 'anilist' && media.studio && (
              <div className="inline-flex px-2 py-0.5 md:px-3 md:py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/5 text-[9px] md:text-[10px] font-metadata text-white">
                {media.studio}
              </div>
            )}
            {/* Animation Specific Badges */}
            {media.source === 'tmdb' && media.format && (
              <div className="inline-flex px-2 py-0.5 md:px-3 md:py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/5 text-[9px] md:text-[10px] font-metadata text-white">
                {media.format}
              </div>
            )}
            {/* Seasonal Icon / Label */}
            {media.season && (
               <div className="inline-flex px-2 py-0.5 rounded-md bg-white/10 backdrop-blur-md border border-white/5 text-[9px] font-mono text-white/70">
                 {media.season}
               </div>
            )}
          </div>
          
          <div className="flex gap-2 relative">
             {releaseStatus && (
               <div className={cn(
                 "inline-flex items-center text-[7px] md:text-[9px] font-mono tracking-widest font-bold px-1 py-[2px] md:px-1.5 md:py-0.5 rounded backdrop-blur-md uppercase",
                 releaseStatus.style
               )}>
                 {releaseStatus.label}
               </div>
             )}
             {!isUpcoming && (
                <button 
                  onClick={handleSaveToVault}
                  disabled={isSaving || isSaved}
                  className={cn(
                    "p-1 md:p-1.5 rounded-md backdrop-blur-md transition-all flex items-center justify-center border hover:scale-110",
                    isSaved ? "bg-accent/20 border-accent/40 text-accent" : "bg-black/40 border-white/10 text-white/80 hover:text-white"
                  )}
                  title="Collect Film"
                >
                  {isSaving ? (
                    <Loader2 className="w-2.5 md:w-3.5 h-2.5 md:h-3.5 animate-spin" />
                  ) : isSaved ? (
                    <Check className="w-2.5 md:w-3.5 h-2.5 md:h-3.5" />
                  ) : (
                    <Bookmark className="w-2.5 md:w-3.5 h-2.5 md:h-3.5" />
                  )}
                </button>
             )}

             {isUpcoming && (
                <button 
                  onClick={handleToggleReminder}
                  className={cn(
                    "p-1 md:p-1.5 rounded-md backdrop-blur-md transition-all flex items-center justify-center border hover:scale-110",
                    isReminded ? "bg-accent/20 border-accent/40 text-accent" : "bg-black/40 border-white/10 text-white/80 hover:text-white"
                  )}
                  title={isReminded ? "Dismiss Reminder" : "Notify Me"}
                >
                  {isReminded ? <BellOff className="w-2.5 md:w-3.5 h-2.5 md:h-3.5" /> : <Bell className="w-2.5 md:w-3.5 h-2.5 md:h-3.5" />}
                </button>
             )}
          </div>
        </div>

        {/* Gradient Overlay for Base Info if no video playing */}
        {!isHovered && (
          <div className={cn(
            "absolute inset-0 bg-linear-to-t from-black/95 via-black/40 to-transparent transition-opacity duration-500",
            isExpanded ? "opacity-90" : "opacity-100"
          )}></div>
        )}

        {/* Base Info (Title & Year) */}
        <div className={cn(
          "absolute left-4 right-4 transition-all duration-500 z-10",
           isExpanded ? "bottom-[calc(100%-80px)] opacity-50" : "bottom-6 opacity-100"
        )}>
          <h2 className={cn(
             "font-heading text-white leading-tight mb-1 transition-all duration-300",
             media.displayTitle.length > 30 ? "text-base md:text-xl line-clamp-3" : "text-xl md:text-2xl line-clamp-2"
          )}>
            {media.displayTitle}
          </h2>
          
          {media.romajiTitle && media.romajiTitle !== media.displayTitle && (
              <p className="text-[10px] md:text-xs font-mono text-white/40 mb-2 truncate">{media.romajiTitle}</p>
          )}

          <div className="flex items-center gap-2 md:gap-3 text-white/50 font-metadata mt-2">
            {media.releaseYear && <span>{media.releaseYear}</span>}
            {media.duration && (
               <>
                 <span className="w-1 h-1 rounded-full bg-white/30"></span>
                 <span className="truncate">{media.duration}</span>
               </>
            )}
            {media.genres?.length > 0 && (
               <>
                 <span className="w-1 h-1 rounded-full bg-white/30"></span>
                 <Link 
                   href={`/search?q=${encodeURIComponent(media.genres[0])}`}
                   onClick={(e) => e.stopPropagation()}
                   className="truncate hover:text-white transition-colors relative z-20 hover:underline decoration-accent/40 underline-offset-4 text-accent/80 font-bold"
                   title={`Explore more ${media.genres[0]}`}
                 >
                   {media.genres[0]}
                 </Link>
               </>
            )}
          </div>
        </div>
        

        {/* Quick Peek Button Indicator */}
        {!isExpanded && (
           <div className="absolute bottom-6 right-4 z-10 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center backdrop-blur text-white group-hover:scale-0 transition-transform duration-300 shadow-lg">
              <ChevronDown className="w-4 h-4" />
           </div>
        )}

      </div>

      {/* Expanded Quick Peek Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="absolute inset-x-0 bottom-0 bg-black/85 backdrop-blur-3xl border-t border-white/10 z-20 flex flex-col p-5 overflow-y-auto max-h-[85%]"
            onClick={(e) => e.stopPropagation()} 
          >
            <button 
              onClick={() => setIsExpanded(false)}
              className="absolute top-3 right-4 p-2 rounded-full hover:bg-white/10 transition-colors text-white/50 hover:text-white"
            >
              <ChevronDown className="w-5 h-5" />
            </button>

            <div className="space-y-6 pt-2">
              
              <p className="text-sm text-white/70 leading-relaxed font-serif italic border-l-2 border-white/10 pl-3">
                 {media.overview ? (media.overview.length > 150 ? media.overview.substring(0, 150) + "..." : media.overview) : "No description available."}
              </p>

              {/* Cast/Characters */}
              {media.cast && media.cast.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[10px] uppercase tracking-widest text-white/40 font-semibold font-mono flex items-center gap-1.5">
                    <Users className="w-3 h-3" /> Key Elements
                  </span>
                  <div className="flex flex-wrap gap-2 text-sm text-white/80">
                     {media.cast.map(c => c.name).slice(0, 3).join(" • ")}
                  </div>
                </div>
              )}

              {/* Trailer Embed for regular view if anime hover isn't enough, or for TMDB animation */}
              {media.trailerUrl && (
                <div className="w-full aspect-video rounded-xl overflow-hidden bg-white/5 relative border border-white/10 shadow-2xl mt-4">
                  <iframe 
                    width="100%" 
                    height="100%" 
                    src={media.trailerUrl.replace('watch?v=', 'embed/') + "?autoplay=0&controls=1&modestbranding=1&rel=0"} 
                    title="Trailer" 
                    frameBorder="0" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                    allowFullScreen
                    className="absolute inset-0 z-10"
                  ></iframe>
                </div>
              )}

              {/* Providers & Routing */}
              <div className="flex gap-2 w-full pt-4">
                <Link href={`/media/${media.type}/${media.sourceId}`} className="flex-1">
                  <div className="w-full bg-white text-black py-3 rounded-full font-medium text-sm hover:bg-white/90 transition-colors flex items-center justify-center gap-2">
                     <Play className="w-4 h-4 fill-current"/> Deep Scrape
                  </div>
                </Link>
                {media.providers && media.providers.slice(0, 1).map(p => (
                   <button key={p.provider_id} className="flex-1 bg-white/5 border border-white/5 text-white/70 py-3 rounded-full font-metadata hover:bg-white/10 transition-colors flex items-center justify-center gap-2">
                     Watch on {p.provider_name}
                   </button>
                ))}
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
