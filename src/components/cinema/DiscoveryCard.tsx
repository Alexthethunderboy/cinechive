'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Star, Info, ChevronDown, ChevronUp, Users, DollarSign, Eye, Bookmark, Loader2, Check } from 'lucide-react';
import { FeedEntity } from '@/lib/api/MediaFetcher';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import Link from 'next/link';
import { archiveMediaAction } from '@/lib/actions';

interface DiscoveryCardProps {
  media: FeedEntity;
  index: number;
}

export function DiscoveryCard({ media, index }: DiscoveryCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
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
        classification: 'Atmospheric', // Default vibe for trending
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
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        delay: (index % 20) * 0.05, 
        duration: 0.5, 
        type: 'spring', 
        stiffness: 100, 
        damping: 15 
      }}
      className="relative flex flex-col w-full rounded-2xl overflow-hidden bg-vibe-surface/30 border border-white/10 backdrop-blur-xl group cursor-pointer"
      onClick={() => setIsExpanded(!isExpanded)}
    >
      {/* Base Card Image Container (2:3 aspect ratio) */}
      <div className="relative w-full aspect-2/3 overflow-hidden">
        {media.posterUrl ? (
          <img
            src={media.posterUrl}
            alt={media.displayName}
            className={cn(
              "w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105",
              isExpanded ? "blur-sm brightness-50" : "brightness-90 group-hover:brightness-100"
            )}
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-vibe-dark/50 flex flex-col items-center justify-center">
             <span className="text-white/30 font-display">No Image</span>
          </div>
        )}

        {/* Top Badges */}
        <div className="absolute top-4 left-4 right-4 flex justify-between items-start z-10">
          <div className="flex flex-col gap-2">
            {media.rating.showBadge && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10">
                <Star className="text-vibe-yellow w-3.5 h-3.5 fill-current" />
                <span className="text-white font-mono text-xs font-bold">{media.rating.average.toFixed(1)}</span>
              </div>
            )}
            {media.releaseLabel && (
              <div className="inline-flex px-3 py-1 rounded-full bg-vibe-blue/20 backdrop-blur-md border border-vibe-blue/30 text-xs font-medium text-vibe-blue shadow-sm">
                {media.releaseLabel}
              </div>
            )}
          </div>
          
          <div className="flex gap-2 relative">
             <span className="text-[10px] font-mono tracking-widest text-white/50 bg-black/40 px-2 py-1 rounded-md backdrop-blur-md">
               {media.type === 'movie' ? 'FILM' : 'SERIES'}
             </span>
             <button 
               onClick={handleSaveToVault}
               disabled={isSaving || isSaved}
               className={cn(
                 "p-1.5 rounded-md backdrop-blur-md transition-all flex items-center justify-center border",
                 isSaved ? "bg-accent/20 border-accent/40 text-accent" : "bg-black/40 border-white/10 text-white/50 hover:text-white"
               )}
               title="Add to Collections"
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

        {/* Gradient Overlay for Base Info */}
        <div className={cn(
          "absolute inset-0 bg-linear-to-t from-black/90 via-black/40 to-transparent transition-opacity duration-500",
          isExpanded ? "opacity-90" : "opacity-100"
        )}></div>

        {/* Base Info (Title & Year) */}
        <div className={cn(
          "absolute left-4 right-4 transition-all duration-500 z-10",
           isExpanded ? "bottom-[calc(100%-80px)] opacity-50" : "bottom-6 opacity-100"
        )}>
          <h2 className="text-lg md:text-2xl font-display font-medium text-white leading-tight mb-1 line-clamp-2 drop-shadow-lg">
            {media.displayName}
          </h2>
          <div className="flex items-center gap-2 md:gap-3 text-white/70 text-xs md:text-sm font-sans">
            {media.releaseYear && <span>{media.releaseYear}</span>}
            {media.genres.length > 0 && (
               <>
                 <span className="w-1 h-1 rounded-full bg-white/30"></span>
                 <span className="truncate">{media.genres[0]}</span>
               </>
            )}
          </div>
        </div>
        
        {/* Quick Peek Button Indicator */}
        {!isExpanded && (
           <div className="absolute bottom-6 right-4 z-10 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center backdrop-blur text-white group-hover:bg-white group-hover:text-black transition-colors">
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
            className="absolute inset-x-0 bottom-0 bg-black/80 backdrop-blur-2xl border-t border-white/10 z-20 flex flex-col p-5 overflow-y-auto max-h-[85%]"
            onClick={(e) => e.stopPropagation()} // Keep card from closing if interacting inside
          >
            {/* Close Handle */}
            <button 
              onClick={() => setIsExpanded(false)}
              className="absolute top-3 right-4 p-2 rounded-full hover:bg-white/10 transition-colors text-white/50 hover:text-white"
            >
              <ChevronDown className="w-5 h-5" />
            </button>

            <div className="space-y-6 pt-2">
              {/* Creator Info */}
              <div className="flex flex-col gap-1">
                <span className="text-[10px] uppercase tracking-widest text-vibe-cyan/70 font-semibold font-mono">
                  {media.type === 'movie' ? 'Director' : 'Executive Producer'}
                </span>
                <span className="text-white text-lg font-medium">
                  {media.director || media.ep || 'Unknown'}
                </span>
                {media.dp && (
                   <div className="mt-1 text-xs text-white/50">
                     <span className="mr-2">DP:</span> {media.dp}
                   </div>
                )}
              </div>

              {/* Cast */}
              {media.cast.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[10px] uppercase tracking-widest text-white/40 font-semibold font-mono flex items-center gap-1.5">
                    <Users className="w-3 h-3" /> Cast
                  </span>
                  <div className="flex flex-wrap gap-2 text-sm text-white/80">
                     {media.cast.map(c => c.name).slice(0, 3).join(" • ")}
                  </div>
                </div>
              )}

              {/* Trailer Embed */}
              {media.trailerUrl ? (
                <div className="w-full aspect-video rounded-xl overflow-hidden bg-white/5 relative border border-white/10 shadow-2xl">
                  {/* Since we need a 30-sec snippet conceptually, typically we'd use YouTube iframe API. 
                      For React, a simple iframe is direct. We can append ?start=0&end=30 or let the user watch. */}
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
              ) : (
                <div className="w-full aspect-video rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                  <span className="text-white/30 text-sm font-mono flex items-center gap-2">
                     <Info className="w-4 h-4"/> No Trailer Available
                  </span>
                </div>
              )}

              {/* Business Data (Movies Only) */}
              {media.business && (
                <div className="grid grid-cols-2 gap-3 pb-2">
                  <div className="bg-white/5 rounded-lg p-3">
                    <span className="text-[10px] uppercase tracking-widest text-white/40 font-mono block mb-1">Budget</span>
                    <span className="text-white text-sm font-medium flex items-center gap-1">
                      <DollarSign className="w-3.5 h-3.5 text-vibe-green" /> 
                      {(media.business.budget / 1000000).toFixed(1)}M
                    </span>
                  </div>
                  <div className="bg-white/5 rounded-lg p-3">
                    <span className="text-[10px] uppercase tracking-widest text-white/40 font-mono block mb-1">Revenue</span>
                    <span className="text-white text-sm font-medium flex items-center gap-1">
                      <DollarSign className="w-3.5 h-3.5 text-vibe-green" /> 
                      {(media.business.revenue / 1000000).toFixed(1)}M
                    </span>
                  </div>
                </div>
              )}

              {/* Providers (Action Buttons) */}
              <div className="flex gap-2 w-full pt-2">
                <Link href={`/media/${media.type}/${media.id}`} className="flex-1">
                  <div className="w-full bg-white text-black py-3 rounded-full font-medium text-sm hover:bg-white/90 transition-colors flex items-center justify-center gap-2">
                     <Play className="w-4 h-4 fill-current"/> Full Details
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
