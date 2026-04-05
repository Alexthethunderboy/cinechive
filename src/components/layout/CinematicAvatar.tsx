'use client';

import { motion } from 'framer-motion';
import { cn, formatUsername } from '@/lib/utils';
import { ClassificationName, CLASSIFICATION_STYLE_COLORS } from '@/lib/design-tokens';
import Image from 'next/image';

interface CinematicAvatarProps {
  src?: string | null;
  username?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  style?: ClassificationName | 'Atmospheric';
  className?: string;
}

const sizeMap = {
  sm: 'w-8 h-8 text-[10px]',
  md: 'w-10 h-10 text-xs',
  lg: 'w-16 h-16 text-xl',
  xl: 'w-32 h-32 md:w-44 md:h-44 text-5xl',
};

export default function CinematicAvatar({
  src,
  username = 'User',
  size = 'md',
  style = 'Atmospheric',
  className,
}: CinematicAvatarProps) {
  const themeColor = style === 'Atmospheric' ? 'rgba(255,255,255,0.2)' : CLASSIFICATION_STYLE_COLORS[style as ClassificationName];
  const formattedUsername = formatUsername(username);

  return (
    <div className={cn("relative shrink-0", className)}>
      {/* Ambient Styles Glow */}
      <motion.div 
        animate={{ 
          opacity: [0.1, 0.3, 0.1], 
          scale: [1, 1.1, 1] 
        }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="absolute inset-0 blur-xl rounded-full"
        style={{ backgroundColor: themeColor }}
      />

      <div className={cn(
        "relative rounded-full overflow-hidden border-2 border-white/10 bg-surface-hover shadow-2xl flex items-center justify-center font-display text-muted",
        sizeMap[size]
      )}>
        {src ? (
          <Image 
            src={src} 
            alt={formattedUsername} 
            fill 
            className="object-cover group-hover:scale-110 transition-transform duration-500" 
          />
        ) : (
          <span className="uppercase font-bold tracking-tighter opacity-40">
            {formattedUsername[0]}
          </span>
        )}
      </div>

      {/* Rim Light */}
      <div 
        className="absolute inset-0 rounded-full border border-white/5 pointer-events-none" 
        style={{ boxShadow: `inset 0 0 10px ${themeColor}20` }}
      />
    </div>
  );
}
