'use client';

import { ReactNode } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils'; // I'll create a simple utils.ts next

interface GlassPanelProps extends HTMLMotionProps<'div'> {
  children: ReactNode;
  className?: string;
  vibeColor?: string;
}

export default function GlassPanel({ 
  children, 
  className, 
  vibeColor,
  ...props 
}: GlassPanelProps) {
  return (
    <motion.div
      className={cn(
        "glass rounded-card elevation overflow-hidden",
        className
      )}
      style={{
        '--glow-color': vibeColor || 'rgba(255,255,255,0.05)',
      } as any}
      {...props}
    >
      {children}
    </motion.div>
  );
}
