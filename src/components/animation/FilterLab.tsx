'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Filter, Zap, LayoutGrid, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import GlassPanel from '@/components/ui/GlassPanel';

interface FilterLabProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: 'anime' | 'animation';
  onApplyFilters: (filters: FilterState) => void;
  currentFilters: FilterState;
}

export interface FilterState {
  genres: string[];
  studios: string[];
  year: string;
  format: string[]; // 'TV', 'MOVIE', 'OVA' for anime; 'Feature', 'Short' for animation
  status: string[]; // 'RELEASING', 'FINISHED'
}

const ANIME_GENRES = ["Action", "Adventure", "Comedy", "Drama", "Sci-Fi", "Mystery", "Supernatural", "Fantasy", "Sports", "Romance", "Slice of Life", "Mecha", "Psychological", "Thriller", "Horror"];
const ANIMATION_COMPANIES = ["Pixar", "Walt Disney Animation", "DreamWorks", "Illumination", "Sony Pictures Animation", "Studio Ghibli", "Cartoon Saloon", "Laika"];
const ANIME_STUDIOS = ["MAPPA", "ufotable", "Kyoto Animation", "Bones", "Madhouse", "Wit Studio", "CloverWorks", "A-1 Pictures", "Production I.G", "Trigger"];

export function FilterLab({ isOpen, onClose, activeTab, onApplyFilters, currentFilters }: FilterLabProps) {
  const [localFilters, setLocalFilters] = useState<FilterState>(currentFilters);

  // Sync when opened
  React.useEffect(() => {
    if (isOpen) {
      setLocalFilters(currentFilters);
    }
  }, [isOpen, currentFilters]);

  const toggleArrayItem = (key: keyof FilterState, item: string) => {
    setLocalFilters(prev => {
      const arr = prev[key] as string[];
      if (arr.includes(item)) {
        return { ...prev, [key]: arr.filter(i => i !== item) };
      }
      return { ...prev, [key]: [...arr, item] };
    });
  };

  const handleApply = () => {
    onApplyFilters(localFilters);
    onClose();
  };

  const handleClear = () => {
    const empty: FilterState = { genres: [], studios: [], year: '', format: [], status: [] };
    setLocalFilters(empty);
    onApplyFilters(empty);
    onClose();
  };

  const activeCount = 
    localFilters.genres.length + 
    localFilters.studios.length + 
    (localFilters.year ? 1 : 0) + 
    localFilters.format.length + 
    localFilters.status.length;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          />

          {/* Slide-out Panel */}
          <motion.div
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-[#050505] border-l border-white/10 shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/5 bg-white/5">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-accent/20 text-accent rounded-lg">
                  <Filter size={18} />
                </div>
                <div>
                  <h2 className="text-xl font-display text-white tracking-tight leading-none">Filter Lab</h2>
                  <p className="text-xs text-white/50 font-mono mt-1 uppercase tracking-widest">
                    {activeTab === 'anime' ? 'AniList Integration' : 'TMDB Animation'}
                  </p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-2 rounded-full hover:bg-white/10 text-white/50 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
              
              {/* Common: Year */}
              <div className="space-y-3">
                <label className="text-xs font-mono uppercase tracking-widest text-white/40 flex items-center gap-2">
                   Release Window
                </label>
                <div className="flex gap-2">
                   <input 
                     type="number" 
                     placeholder="e.g. 2024"
                     value={localFilters.year}
                     onChange={(e) => setLocalFilters(prev => ({ ...prev, year: e.target.value }))}
                     className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 w-full font-mono text-white focus:outline-none focus:border-accent/50"
                   />
                </div>
              </div>

              {/* Genres */}
              {activeTab === 'anime' && (
                <div className="space-y-3">
                  <label className="text-xs font-mono uppercase tracking-widest text-white/40">
                    Resonance (Genres)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {ANIME_GENRES.map(genre => {
                      const isActive = localFilters.genres.includes(genre);
                      return (
                        <button
                          key={genre}
                          onClick={() => toggleArrayItem('genres', genre)}
                          className={cn(
                            "px-3 py-1.5 rounded-lg text-sm transition-all border",
                            isActive 
                              ? "bg-white text-black border-white" 
                              : "bg-white/5 text-white/60 border-white/5 hover:border-white/20"
                          )}
                        >
                          {genre}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Studios / Companies */}
              <div className="space-y-3">
                <label className="text-xs font-mono uppercase tracking-widest text-white/40">
                  {activeTab === 'anime' ? 'Animation Studios' : 'Production Companies'}
                </label>
                <div className="flex flex-wrap gap-2">
                  {(activeTab === 'anime' ? ANIME_STUDIOS : ANIMATION_COMPANIES).map(studio => {
                    const isActive = localFilters.studios.includes(studio);
                    return (
                      <button
                        key={studio}
                        onClick={() => toggleArrayItem('studios', studio)}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-xs font-bold tracking-wider uppercase transition-all border",
                          isActive 
                            ? "bg-accent/20 text-accent border-accent/40" 
                            : "bg-white/5 text-white/50 border-white/5 hover:border-white/20"
                        )}
                      >
                        {studio}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Format */}
              <div className="space-y-3">
                <label className="text-xs font-mono uppercase tracking-widest text-white/40">
                  Format
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(activeTab === 'anime' ? ['TV', 'MOVIE', 'OVA', 'ONA'] : ['Feature', 'Short']).map(fmt => {
                    const isActive = localFilters.format.includes(fmt);
                    return (
                      <button
                        key={fmt}
                        onClick={() => toggleArrayItem('format', fmt)}
                        className={cn(
                          "px-4 py-3 rounded-xl text-sm font-medium transition-all border flex items-center justify-between",
                          isActive 
                            ? "bg-white text-black border-white" 
                            : "bg-white/5 text-white/60 border-white/5 hover:bg-white/10"
                        )}
                      >
                        {fmt}
                        {isActive && <Check size={14} />}
                      </button>
                    );
                  })}
                </div>
              </div>

            </div>

            {/* Footer Actions */}
            <div className="p-6 border-t border-white/5 bg-black">
              <div className="flex gap-3">
                <button 
                  onClick={handleClear}
                  className="px-6 py-3 rounded-xl font-medium text-white/50 bg-white/5 hover:bg-white/10 hover:text-white transition-colors"
                >
                  Clear
                </button>
                <button 
                  onClick={handleApply}
                  className="flex-1 bg-accent text-black py-3 rounded-xl font-medium text-lg hover:bg-accent/90 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-accent/20"
                >
                  Synthesize Feed
                  {activeCount > 0 && (
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-black/20 text-black text-xs">
                      {activeCount}
                    </span>
                  )}
                </button>
              </div>
            </div>

          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
