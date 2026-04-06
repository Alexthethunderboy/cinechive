'use client';

import React, { useId } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { ClassificationName, CLASSIFICATION_STYLE_COLORS } from '@/lib/design-tokens';

interface CinematicAvatarProps {
  src?: string | null;
  username: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  style?: ClassificationName;
  seed?: string | null;
  showSpotlight?: boolean;
}

const sizeClasses = {
  sm: 'w-8 h-8 text-[10px]',
  md: 'w-10 h-10 text-xs',
  lg: 'w-16 h-16 text-xl',
  xl: 'w-32 h-32 text-4xl md:w-44 md:h-44 md:text-6xl',
};

/**
 * CinematicAvatar: A high-fidelity profile component 
 * featuring 35mm grain, color grading (LUTs), and spectral logic.
 */
export default function CinematicAvatar({ 
  src: initialSrc, 
  username = "U", 
  size = 'md', 
  className, 
  style = 'Atmospheric',
  seed,
  showSpotlight = true
}: CinematicAvatarProps) {
  
  const { getCinematicVibe } = require('@/lib/avatar-utils');
  const vibe = getCinematicVibe(seed, username);
  
  const src = initialSrc?.startsWith('http') 
    ? initialSrc 
    : initialSrc?.startsWith('/storage/v1/object/public/')
      ? `https://crnjvztlpdxsugypctqu.supabase.co${initialSrc}`
      : initialSrc 
        ? `https://crnjvztlpdxsugypctqu.supabase.co/storage/v1/object/public/avatars/${initialSrc}`
        : null;
  
  const styleColor = src ? (CLASSIFICATION_STYLE_COLORS[style] || '#ffffff') : vibe.primaryColor;
  
  // Spotlight Motion
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { damping: 20, stiffness: 200 };
  const spotlightX = useSpring(mouseX, springConfig);
  const spotlightY = useSpring(mouseY, springConfig);

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    mouseX.set(e.clientX - rect.left);
    mouseY.set(e.clientY - rect.top);
  };

  // SVG Filter unique ID to avoid collisions
  const id = useId();
  const filterId = `cinematic-grain-${id.replace(/:/g, '')}`;

  return (
    <div 
      className={cn("relative group cursor-pointer select-none", sizeClasses[size], className)}
      onMouseMove={handleMouseMove}
    >
      {/* 1. The Backglow Style */}
      <motion.div 
        className="absolute inset-0 rounded-full blur-xl opacity-20 group-hover:opacity-40 transition-opacity duration-700"
        style={{ backgroundColor: styleColor }}
      />

      {/* 2. Main Avatar Container */}
      <div className="relative w-full h-full rounded-full overflow-hidden border border-white/10 bg-surface-hover shadow-2xl flex items-center justify-center">
        
        {/* SVG Grain Filter */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.15] mix-blend-overlay">
          <filter id={filterId}>
            <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
            <feComposite operator="in" in2="SourceGraphic" />
          </filter>
          <rect width="100%" height="100%" filter={`url(#${filterId})`} />
        </svg>

        {/* Cinematic LUT Overlay (Color Grading) */}
        <div 
          className="absolute inset-0 pointer-events-none mix-blend-soft-light opacity-30 group-hover:opacity-50 transition-opacity"
          style={{ 
            background: `radial-gradient(circle at center, ${styleColor}, transparent 100%)` 
          }}
        />

        {/* Content */}
        {src ? (
          <motion.div 
            className="relative w-full h-full"
            animate={{ 
              x: [0, 0.5, -0.5, 0], 
              y: [0, -0.5, 0.5, 0] 
            }}
            transition={{ 
              duration: 4, 
              repeat: Infinity, 
              ease: "linear" 
            }}
          >
             <Image 
                src={src} 
                alt={username} 
                fill 
                className="object-cover filter grayscale-[0.2] contrast-[1.1]" 
             />
          </motion.div>
        ) : (
          <div 
            className="relative w-full h-full flex items-center justify-center font-display uppercase tracking-tighter"
            style={{ 
              background: vibe.gradient,
              textShadow: '0 2px 10px rgba(0,0,0,0.5)'
            }}
          >
            {/* Inner Pattern Overlay for the generated vibe */}
            <div className="absolute inset-0 opacity-40 mix-blend-overlay pointer-events-none" 
              style={{
                background: `radial-gradient(circle at ${vibe.center.x}% ${vibe.center.y}%, white 0%, transparent 70%)`
              }} 
            />
            <span className="relative z-10 text-white/90">{username[0]}</span>
          </div>
        )}

        {/* 3. The Lens Flare / Spotlight */}
        {showSpotlight && (
          <motion.div 
            className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"
            style={{
              background: useTransform(
                [spotlightX, spotlightY],
                ([x, y]) => `radial-gradient(circle at ${x}px ${y}px, rgba(255,255,255,0.4) 0%, transparent 60%)`
              )
            }}
          />
        )}

        {/* Chromatic Aberration Simulation (Layered) */}
        <div className="absolute inset-0 border border-vibe-rose/10 rounded-full scale-[1.02] mix-blend-screen pointer-events-none opacity-0 group-hover:opacity-40 transition-opacity" />
      </div>

      {/* 4. The Style Ring (Animations) */}
      <motion.div 
        className="absolute -inset-1 rounded-full border border-white/20 pointer-events-none"
        animate={{ scale: [1, 1.05, 1], opacity: [0.3, 0.1, 0.3] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}
