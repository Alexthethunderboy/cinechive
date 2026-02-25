'use client';

import { motion } from 'framer-motion';
import { Lightbulb, Share2, Tag, Zap } from 'lucide-react';
import GlassPanel from '@/components/ui/GlassPanel';
import { TriviaItem } from '@/lib/services/DeepDataService';
import { cn } from '@/lib/utils';

interface TriviaModuleProps {
  trivia: TriviaItem[];
}

const CATEGORY_STYLES = {
  production: { label: 'Production Secret', color: 'text-amber-400', icon: Zap },
  casting: { label: 'Casting Choice', color: 'text-indigo-400', icon: Tag },
  easter_egg: { label: 'Easter Egg', color: 'text-emerald-400', icon: Lightbulb },
  general: { label: 'Did You Know?', color: 'text-accent', icon: Lightbulb },
};

export default function TriviaModule({ trivia }: TriviaModuleProps) {
  if (!trivia || trivia.length === 0) return null;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-3xl uppercase italic tracking-tighter flex items-center gap-3">
          <Lightbulb className="text-accent" />
          The Archive Insights
        </h3>
        <span className="font-data text-[10px] text-muted uppercase tracking-[0.3em]">
          Classified Intel
        </span>
      </div>

      <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
        {trivia.map((item, i) => {
          const style = CATEGORY_STYLES[item.category] || CATEGORY_STYLES.general;
          const Icon = style.icon;

          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="break-inside-avoid mb-6"
            >
              <GlassPanel className="p-6 group hover:border-accent/40 transition-all duration-500 bg-surface/40">
                <div className="flex items-center justify-between mb-4">
                  <div className={cn("flex items-center gap-2 font-data text-[9px] uppercase tracking-widest font-bold", style.color)}>
                    <Icon size={12} />
                    {style.label}
                  </div>
                  <button className="text-muted hover:text-accent transition-colors">
                    <Share2 size={14} />
                  </button>
                </div>
                
                <p className="font-heading text-sm text-white/80 leading-relaxed mb-4">
                  {item.text}
                </p>

                <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                  <span className="font-data text-[8px] text-muted uppercase tracking-widest">
                    Source: Archive/IMDb
                  </span>
                  <div className="flex gap-1">
                    <div className="w-1 h-1 rounded-full bg-accent/40" />
                    <div className="w-1 h-1 rounded-full bg-accent/20" />
                  </div>
                </div>
              </GlassPanel>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
