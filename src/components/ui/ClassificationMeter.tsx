'use client';

import { motion } from 'framer-motion';
import { ClassificationName, CLASSIFICATION_COLORS, SPRING_CONFIG } from '@/lib/design-tokens';
import { cn } from '@/lib/utils';

interface ClassificationMeterProps {
  selected?: ClassificationName;
  onSelect?: (classification: ClassificationName) => void;
  className?: string;
}

export default function ClassificationMeter({ selected, onSelect, className }: ClassificationMeterProps) {
  const classifications = Object.keys(CLASSIFICATION_COLORS) as ClassificationName[];

  return (
    <div className={cn("flex flex-wrap gap-2 py-3", className)}>
      {classifications.map((classification) => {
        const isSelected = selected === classification;
        const color = CLASSIFICATION_COLORS[classification];

        return (
          <motion.button
            key={classification}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={SPRING_CONFIG.default}
            onClick={() => onSelect?.(classification)}
            className={cn(
              "px-4 py-2 rounded-inner border transition-all flex items-center gap-2 relative",
              isSelected 
                ? "bg-(--classification-color) border-transparent text-white elevation"
                : "bg-surface/50 border-border-glass hover:bg-surface-hover hover:border-white/20 text-muted"
            )}
            style={{ 
              '--classification-color': color 
            } as any}
          >
            
            <span className="font-data text-xs font-semibold whitespace-nowrap uppercase tracking-wider text-inherit">
              {classification}
            </span>
            
            {isSelected && (
              <motion.div
                layoutId="classification-glow"
                className="absolute inset-0 rounded-inner -z-10 blur-xl opacity-40"
                style={{ background: color }}
              />
            )}
          </motion.button>
        );
      })}
    </div>
  );
}
