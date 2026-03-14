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
              "px-4 py-2 rounded-inner transition-all flex items-center gap-2 relative border border-white/5",
              isSelected 
                ? "bg-white text-black border-white" 
                : "bg-white/5 text-white/40 hover:text-white"
            )}
            style={{ 
              '--classification-color': color 
            } as any}
          >
            
            <span className="font-metadata text-[10px] font-bold whitespace-nowrap uppercase tracking-widest text-inherit">
              {classification}
            </span>
            
            {isSelected && (
              <div
                className="absolute inset-0 rounded-inner -z-10 bg-white/5 blur-xl"
              />
            )}
          </motion.button>
        );
      })}
    </div>
  );
}
