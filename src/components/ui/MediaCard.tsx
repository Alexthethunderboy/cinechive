'use client';

import { useState, useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import GlassPanel from './GlassPanel';
import { ClassificationName, CLASSIFICATION_COLORS, MEDIA_TYPE_LABELS, SPRING_CONFIG } from '@/lib/design-tokens';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import Link from 'next/link';

interface MediaCardProps {
  id: string;
  title: string;
  posterUrl: string | null;
  type: 'movie' | 'tv' | 'documentary' | 'anime';
  classification?: ClassificationName;
  year?: number;
  director?: string;
  layoutId?: string;
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
  layoutId,
  onClick,
  disableLink = false
}: MediaCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  
  // 3D Tilt Effect
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [10, -10]), SPRING_CONFIG.default);
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-10, 10]), SPRING_CONFIG.default);

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    x.set(mouseX / rect.width - 0.5);
    y.set(mouseY / rect.height - 0.5);
  }

  function handleMouseLeave() {
    x.set(0);
    y.set(0);
    setIsHovered(false);
  }

  const classificationColor = classification ? CLASSIFICATION_COLORS[classification] : undefined;

  const CardContent = (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      style={{
        rotateX,
        rotateY,
        perspective: 1000,
      }}
      className="w-full h-full cursor-pointer group"
    >
        <GlassPanel
          layoutId={`media-poster-${id}`}
          className={cn(
            "w-full h-full relative transition-all duration-700 overflow-hidden rounded-card",
            isHovered && "border-white/20 shadow-[0_0_50px_rgba(255,255,255,0.05)]"
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
              <span className="font-data text-[9px] uppercase tracking-[0.2em] text-white/40 px-2 py-0.5 rounded-inner bg-white/5 border border-white/10">
                {MEDIA_TYPE_LABELS[type as keyof typeof MEDIA_TYPE_LABELS] || type}
              </span>
              {year && (
                <span className="font-data text-[9px] text-muted tracking-widest">{year}</span>
              )}
              {director && (
                <>
                  <span className="text-white/20">&bull;</span>
                  <span className="font-data text-[9px] text-muted tracking-widest uppercase">{director}</span>
                </>
              )}
            </div>
            
            <h3 className="font-display text-xl md:text-2xl leading-[1.1] text-white group-hover:translate-x-1 transition-transform duration-700 italic">
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
                <span className="font-data text-[9px] uppercase font-bold tracking-[0.3em] text-accent">
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
