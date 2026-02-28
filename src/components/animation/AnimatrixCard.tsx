'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Star, ChevronDown, Check, Bookmark, Loader2, Info, Users, DollarSign } from 'lucide-react';
import { AnimatrixEntity } from '@/lib/api/MediaTransformer';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import Link from 'next/link';
import { archiveMediaAction } from '@/lib/actions';

interface AnimatrixCardProps {
  media: AnimatrixEntity;
  index: number;
}

export function AnimatrixCard({ media, index }: AnimatrixCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const handleSaveToVault = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isSaving || isSaved) return;
    
    setIsSaving(true);
    try {
      await archiveMediaAction({
        mediaId: media.id,
        mediaType: media.type,
        title: media.displayName,
        posterUrl: media.posterUrl,
        classification: 'Atmospheric', 
      });
      setIsSaved(true);
    } catch (error) {
       console.error("Failed to add to watchlist:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ 
        delay: (index % 20) * 0.05, 
        duration: 0.5, 
        type: 'spring', 
        stiffness: 100, 
        damping: 15 
      }}
      className="relative flex flex-col w-full rounded-2xl overflow-hidden bg-vibe-surface/30 border border-white/10 backdrop-blur-xl group cursor-pointer"
      onClick={() => setIsExpanded(!isExpanded)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative w-full aspect-2/3 overflow-hidden bg-black">
        {media.posterUrl ? (
          <img
            src={media.posterUrl}
            alt={media.displayName}
            className={cn(
              "absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105",
              (isExpanded || (isHovered && media.trailerUrl && media.isAnime)) ? "opacity-0" : "opacity-100",
              isExpanded ? "blur-sm brightness-50" : "brightness-90 group-hover:brightness-100"
            )}
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-vibe-dark/50 flex flex-col items-center justify-center absolute inset-0">
             <span className="text-white/30 font-display">No Image</span>
          </div>
        )}

        {/* Hover Quick-Play snippet for Anime */}
        {media.isAnime && media.trailerUrl && (
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
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10">
                <Star className="text-vibe-yellow w-3.5 h-3.5 fill-current" />
                <span className="text-white font-mono text-xs font-bold">{media.rating.average.toFixed(1)}</span>
              </div>
            )}
            
            {/* Anime Specific Badges */}
            {media.isAnime && media.studio && (
              <div className="inline-flex px-3 py-1 rounded-full bg-vibe-cyan/20 backdrop-blur-md border border-vibe-cyan/30 text-[10px] font-bold tracking-widest uppercase text-vibe-cyan shadow-sm">
                {media.studio.name}
              </div>
            )}
            {/* Animation Specific Badges */}
            {!media.isAnime && media.format && (
              <div className="inline-flex px-3 py-1 rounded-full bg-vibe-violet/20 backdrop-blur-md border border-vibe-violet/30 text-[10px] font-bold tracking-widest uppercase text-vibe-violet shadow-sm">
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
             <button 
               onClick={handleSaveToVault}
               disabled={isSaving || isSaved}
               className={cn(
                 "p-1.5 rounded-md backdrop-blur-md transition-all flex items-center justify-center border hover:scale-110",
                 isSaved ? "bg-accent/20 border-accent/40 text-accent" : "bg-black/40 border-white/10 text-white/80 hover:text-white"
               )}
               title="Collect Film"
             >
               {isSaving ? (
                 <Loader2 className="w-3.5 h-3.5 animate-spin" />
               ) : isSaved ? (
                 <Check className="w-3.5 h-3.5" />
               ) : (
                 <Bookmark className="w-3.5 h-3.5" />
               )}
             </button>
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
             "font-display font-medium text-white leading-tight mb-1 drop-shadow-2xl transition-all duration-300",
             media.displayName.length > 30 ? "text-base md:text-xl line-clamp-3" : "text-lg md:text-2xl line-clamp-2"
          )}>
            {media.displayName}
          </h2>
          
          {media.romajiTitle && media.romajiTitle !== media.displayName && (
             <p className="text-[10px] md:text-xs font-mono text-white/40 mb-2 truncate">{media.romajiTitle}</p>
          )}

          <div className="flex items-center gap-2 md:gap-3 text-white/70 text-xs md:text-sm font-sans mt-2">
            {media.releaseYear && <span>{media.releaseYear}</span>}
            {media.genres.length > 0 && (
               <>
                 <span className="w-1 h-1 rounded-full bg-white/30"></span>
                 <span className="truncate text-xs font-semibold uppercase tracking-wider text-white/50">{media.genres[0]}</span>
               </>
            )}
          </div>
        </div>
        
        {/* Quick Peek Button Indicator */}
        {!isExpanded && (
           <div className="absolute bottom-6 right-4 z-10 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center backdrop-blur text-white group-hover:bg-white group-hover:text-black transition-colors shadow-lg">
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
              {media.cast.length > 0 && (
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
                <Link href={`/media/${media.type}/${media.id}`} className="flex-1">
                  <div className="w-full bg-white text-black py-3 rounded-full font-medium text-sm hover:bg-white/90 transition-colors flex items-center justify-center gap-2">
                     <Play className="w-4 h-4 fill-current"/> Deep Scrape
                  </div>
                </Link>
                {media.providers.slice(0, 1).map(p => (
                   <button key={p.provider_id} className="flex-1 bg-vibe-dark/50 border border-white/10 text-white py-3 rounded-full font-medium text-sm hover:bg-vibe-dark/80 transition-colors flex items-center justify-center gap-2">
                     Watch on {p.provider_name}
                   </button>
                ))}
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
