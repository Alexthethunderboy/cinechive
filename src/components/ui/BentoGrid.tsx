'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface BentoGridProps {
  children: ReactNode;
  className?: string;
}

export function BentoGrid({ children, className }: BentoGridProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 auto-rows-[200px] gap-7 p-6 md:p-10 max-w-7xl mx-auto",
        className
      )}
    >
      {children}
    </div>
  );
}

interface BentoItemProps {
  children: ReactNode;
  className?: string;
  span?: 'small' | 'medium' | 'large' | 'tall' | 'wide' | 'feature';
}

export function BentoItem({ children, className, span = 'small' }: BentoItemProps) {
  const spanClasses = {
    small: 'col-span-1 row-span-1',
    medium: 'col-span-1 md:col-span-2 row-span-1',
    large: 'col-span-1 md:col-span-2 row-span-2',
    tall: 'col-span-1 row-span-2',
    wide: 'col-span-1 md:col-span-3 row-span-1',
    feature: 'col-span-1 md:col-span-4 lg:col-span-4 row-span-2',
  };

  return (
    <div
      className={cn(
        "bento-card relative",
        spanClasses[span],
        className
      )}
    >
      {children}
    </div>
  );
}
