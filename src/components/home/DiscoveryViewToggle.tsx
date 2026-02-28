'use client';

import { motion } from 'framer-motion';
import { LayoutGrid, Flame } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SPRING_CONFIG } from '@/lib/design-tokens';

export type DiscoveryViewMode = 'registries' | 'broadcast';

interface DiscoveryViewToggleProps {
  activeView: DiscoveryViewMode;
  onViewChange: (view: DiscoveryViewMode) => void;
}

export default function DiscoveryViewToggle({ activeView, onViewChange }: DiscoveryViewToggleProps) {
  const options = [
    { id: 'registries', label: 'Cinematic Selections', icon: LayoutGrid },
    { id: 'broadcast', label: 'Live Projection', icon: Flame },
  ] as const;

  return (
    <div className="flex justify-center mb-16 px-6">
      <div className="glass p-1.5 rounded-full border border-white/5 flex items-center gap-1 shadow-2xl relative overflow-hidden group">
        {/* Animated Background Highlight */}
        <div className="absolute inset-0 bg-linear-to-tr from-accent/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
        
        {options.map((option) => {
          const isActive = activeView === option.id;
          const Icon = option.icon;

          return (
            <button
              key={option.id}
              onClick={() => onViewChange(option.id)}
              className={cn(
                "relative flex items-center gap-3 px-6 py-2.5 rounded-full transition-all duration-500 z-10",
                isActive ? "text-white" : "text-white/40 hover:text-white/60"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="active-view-bg"
                  className="absolute inset-0 bg-white/10 border border-white/10 rounded-full shadow-inner"
                  transition={SPRING_CONFIG.default}
                />
              )}
              
              <Icon size={16} className={cn(
                "transition-transform duration-500",
                isActive ? "scale-110" : "scale-100",
                isActive && option.id === 'broadcast' && "text-rose-400 drop-shadow-[0_0_8px_rgba(251,113,133,0.4)]",
                isActive && option.id === 'registries' && "text-accent"
              )} />
              
              <span className="font-data text-[10px] uppercase tracking-[0.2em] font-bold">
                {option.label}
              </span>

              {isActive && (
                <motion.div
                  layoutId="active-dot"
                  className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-accent rounded-full blur-[1px]"
                  transition={SPRING_CONFIG.default}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
