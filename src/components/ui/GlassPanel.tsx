'use client';

import { ReactNode } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils'; // I'll create a simple utils.ts next

interface GlassPanelProps extends HTMLMotionProps<'div'> {
  children: ReactNode;
  className?: string;
}

export default function GlassPanel({ 
  children, 
  className, 
  ...props 
}: GlassPanelProps) {
  return (
    <motion.div
      className={cn(
        "glass rounded-card overflow-hidden",
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  );
}
