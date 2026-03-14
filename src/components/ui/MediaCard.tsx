'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import GlassPanel from './GlassPanel';
import { ClassificationName, CLASSIFICATION_COLORS, MEDIA_TYPE_LABELS, SPRING_CONFIG } from '@/lib/design-tokens';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import Link from 'next/link';

interface MediaCardProps {
  id: string;
  title: string;
  posterUrl: string | null;
  type: 'movie' | 'tv' | 'documentary' | 'anime' | 'animation' | 'person';
  classification?: ClassificationName;
  year?: number;
  director?: string;
  onClick?: () => void;
  disableLink?: boolean;
}

export default function MediaCard({
  id,
  title,
  posterUrl,
  type,
  classification,
  year,
  director,
  onClick,
  disableLink = false
}: MediaCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const classificationColor = classification ? CLASSIFICATION_COLORS[classification] : undefined;

  const CardContent = (
    <motion.div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
      whileHover={{ y: -5 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="w-full h-full cursor-pointer group"
    >
        <GlassPanel
          className={cn(
            "w-full h-full relative transition-all duration-700 overflow-hidden rounded-card",
            isHovered && "shadow-[0_0_50px_rgba(255,255,255,0.05)]"
          )}
        >
        {/* Background Poster layer */}
        <div className="absolute inset-0 z-0">
          {posterUrl ? (
            <Image
              src={posterUrl}
              alt={title}
              fill
              className="object-cover opacity-60 group-hover:opacity-80 transition-opacity duration-700"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="w-full h-full bg-surface/80 flex items-center justify-center p-6 text-center">
              <span className="text-muted text-sm font-data">{title}</span>
            </div>
          )}
          
          <div className="absolute inset-0 bg-linear-to-t from-background via-background/40 to-transparent opacity-90" />
          <div className="absolute inset-0 bg-linear-to-tr from-transparent via-background/20 to-white/5 opacity-40" />
        </div>

        {/* Content Layer */}
        <div className="absolute inset-0 z-10 p-5 flex flex-col justify-end">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
                <span className="font-metadata px-2 py-0.5 rounded-inner bg-white/5">
                  {MEDIA_TYPE_LABELS[type as keyof typeof MEDIA_TYPE_LABELS] || type}
                </span>
                {year && (
                  <span className="font-metadata">{year}</span>
                )}
                {director && (
                  <>
                    <span className="text-white/20">&bull;</span>
                    <span className="font-metadata">{director}</span>
                  </>
                )}
            </div>
            
              <h3 className="font-heading text-2xl md:text-3xl leading-[1.1] text-white group-hover:translate-x-1 transition-transform duration-700 italic">
                {title}
              </h3>
            
            {classification && (
              <div 
                className="pt-1 flex items-center gap-2 opacity-40 group-hover:opacity-100 transition-opacity duration-700"
              >
                <div 
                  className="w-1.5 h-1.5 rounded-full" 
                  style={{ backgroundColor: classificationColor }} 
                />
                  <span className="font-metadata font-bold tracking-[0.3em] text-accent">
                     {classification}
                  </span>
              </div>
            )}
          </div>
        </div>

        {/* Highlight/Reflect layer */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-linear-to-br from-white/5 via-transparent to-transparent pointer-events-none transition-opacity duration-700" />
      </GlassPanel>
    </motion.div>
  );

  if (disableLink) return CardContent;

  return (
    <Link href={`/media/${type}/${id}`} className="block w-full h-full">
      {CardContent}
    </Link>
  );
}
