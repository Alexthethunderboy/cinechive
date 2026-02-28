'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cpu, ChevronDown, Monitor, Film, Speaker } from 'lucide-react';
import GlassPanel from '@/components/ui/GlassPanel';
import { TechnicalSpecs } from '@/lib/services/DeepDataService';
import { cn } from '@/lib/utils';

interface TechnicalLabProps {
  specs: TechnicalSpecs;
}

export default function TechnicalLab({ specs }: TechnicalLabProps) {
  const [isOpen, setIsOpen] = useState(false);

  const specItems = [
    { label: 'Primary Camera', value: specs.camera, icon: Cpu },
    { label: 'Negative Format', value: specs.negativeFormat, icon: Film },
    { label: 'Aspect Ratio', value: specs.aspectRatio, icon: Monitor },
    { label: 'Sound Mix', value: specs.soundMix?.join(' / '), icon: Speaker },
  ].filter(item => item.value);

  if (specItems.length === 0) return null;

  return (
    <div className="space-y-4">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full group"
      >
        <GlassPanel className={cn(
          "p-4 flex items-center justify-between transition-all duration-500",
          isOpen ? "border-accent/40 bg-accent/5" : "border-white/5 bg-white/5 hover:border-white/20"
        )}>
          <div className="flex items-center gap-3">
            <Cpu className={cn("transition-colors", isOpen ? "text-accent" : "text-muted")} size={18} />
            <span className="font-display text-lg uppercase tracking-wider italic">Cinema Specs</span>
          </div>
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.3 }}
          >
            <ChevronDown size={18} className="text-muted" />
          </motion.div>
        </GlassPanel>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4">
              {specItems.map((item, i) => (
                <motion.div
                  key={item.label}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <GlassPanel className="p-6 border-white/5 bg-black/20 flex items-start gap-4">
                    <div className="p-3 rounded-inner bg-white/5 text-accent">
                      <item.icon size={20} />
                    </div>
                    <div>
                      <span className="font-data text-[10px] uppercase text-muted tracking-widest block mb-1">
                        {item.label}
                      </span>
                      <span className="font-heading text-lg text-white">
                        {item.value}
                      </span>
                    </div>
                  </GlassPanel>
                </motion.div>
              ))}
            </div>
            
            <div className="p-6 bg-accent/5 border border-accent/10 rounded-card flex items-center justify-center gap-4">
              <div className="h-[2px] flex-1 bg-linear-to-r from-transparent to-accent/20" />
              <span className="font-data text-[8px] text-accent/40 uppercase tracking-[0.5em]">
                Verified Studio Specs
              </span>
              <div className="h-[2px] flex-1 bg-linear-to-r from-accent/20 to-transparent" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
