'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Filter, Clapperboard, Tv, Ghost, Sparkles, ChevronLeft, ChevronRight, Telescope } from 'lucide-react';
import { cn } from '@/lib/utils';
import { UniversalMedia } from '@/lib/api/UniversalTransformer';
import { getReleaseRadarAction, getFutureHorizonsAction } from '@/lib/feed-actions';
import { getCurrentUser } from '@/lib/actions';
import ReleaseRadarCard from './ReleaseRadarCard';
import { addWeeks, format, startOfToday, endOfWeek, startOfWeek, isWithinInterval } from 'date-fns';

type RadarFilter = 'all' | 'movies' | 'series' | 'animations' | 'anime' | 'horizons';

export default function ReleaseRadar() {
  const [activeFilter, setActiveFilter] = useState<RadarFilter>('all');
  const [data, setData] = useState<UniversalMedia[]>([]);
  const [futureData, setFutureData] = useState<UniversalMedia[]>([]);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeWeek, setActiveWeek] = useState(1); // 0 = All Time, 1 = This week, etc.

  useEffect(() => {
    async function fetchAll() {
      setIsLoading(true);
      try {
        const [sorted, futures, user] = await Promise.all([
          getReleaseRadarAction(),
          getFutureHorizonsAction(new Date().getFullYear() + 1),
          getCurrentUser()
        ]);
        setData(sorted);
        setFutureData(futures);
        setUserProfile(user);
      } catch (err) {
        console.error('Failed to fetch Release Radar data:', err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchAll();
  }, []);

  const weeks = useMemo(() => {
    const today = startOfToday();
    const futureWeeks = Array.from({ length: 12 }).map((_, i) => {
      const date = addWeeks(today, i);
      return {
        label: i === 0 ? 'Today' : i === 1 ? 'Next Week' : format(date, 'MMM dd'),
        date
      };
    });
    
    return [
      { label: 'All Time', date: today }, // index 0
      ...futureWeeks
    ];
  }, []);

  const filteredData = useMemo(() => {
    let result = data;
    if (activeFilter !== 'all') {
      result = data.filter(item => {
        if (activeFilter === 'movies') return item.type === 'movie';
        if (activeFilter === 'series') return item.type === 'tv';
        if (activeFilter === 'animations') return item.type === 'animation';
        if (activeFilter === 'anime') return item.type === 'anime';
        return true;
      });
    }

    // Filter by week - Index 0 is "All Time"
    let filtered = result;
    if (activeWeek !== 0) {
      const targetWeek = weeks[activeWeek].date;
      const start = startOfWeek(targetWeek);
      const end = endOfWeek(targetWeek);
      filtered = result.filter(item => {
        if (!item.releaseDate) return false;
        const date = new Date(item.releaseDate);
        return isWithinInterval(date, { start, end });
      });
    }

    // Personalized Layer: Push upcoming releases matching user's highly-rated classifications
    const favoriteMood = userProfile?.profile?.mood_distribution 
      ? Object.entries(userProfile.profile.mood_distribution).sort((a: any, b: any) => b[1] - a[1])[0]?.[0]
      : 'Noir'; // Default example for the persona

    const personalized = filtered.sort((a, b) => {
       if (a.classification === favoriteMood && b.classification !== favoriteMood) return -1;
       if (a.classification !== favoriteMood && b.classification === favoriteMood) return 1;
       return 0;
    });

    // Normalize Hype Levels
    const maxPop = Math.max(...personalized.map(i => i.popularity || 0), 1);
    return personalized.map(item => ({
      ...item,
      hypeLevel: Math.min(Math.round(((item.popularity || 0) / maxPop) * 100), 100)
    }));
  }, [data, activeFilter, activeWeek, weeks, userProfile]);

  const normalizedFutureData = useMemo(() => {
    const maxPop = Math.max(...futureData.map(i => i.popularity || 0), 1);
    return futureData.map(item => ({
      ...item,
      hypeLevel: Math.min(Math.round(((item.popularity || 0) / maxPop) * 100), 100)
    }));
  }, [futureData]);

  return (
    <div className="space-y-2 md:space-y-8 pb-20">
      {/* Date Scroller */}
      <AnimatePresence>
        {activeFilter !== 'horizons' && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 md:px-10 pt-1 mb-1 md:mb-4">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-white font-heading text-xs uppercase tracking-[0.3em] opacity-40">Release Calendar</h2>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setActiveWeek(prev => Math.max(0, prev - 1))}
                    className="p-1 rounded-full hover:bg-white/5 text-white/40 hover:text-white"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button 
                    onClick={() => setActiveWeek(prev => Math.min(weeks.length - 1, prev + 1))}
                    className="p-1 rounded-full hover:bg-white/5 text-white/40 hover:text-white"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
              
              <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar -mx-4 px-4 md:mx-0 md:px-0 snap-x">
                {weeks.map((week, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveWeek(i)}
                    className={cn(
                      "whitespace-nowrap px-5 py-2.5 rounded-full border transition-all duration-300 flex flex-col items-center gap-1 min-w-[100px] snap-start",
                      activeWeek === i 
                        ? "bg-white text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.1)]" 
                        : "bg-white/5 text-white/40 border-white/5 hover:border-white/20"
                    )}
                  >
                    <span className="text-[9px] font-data font-bold uppercase tracking-widest">{week.label}</span>
                    {activeWeek === i && <motion.div layoutId="week-dot" className="w-1 h-1 bg-black rounded-full" />}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filters & Horizons Toggle */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 md:gap-6">
        <div className="flex gap-2 md:gap-4 overflow-x-auto pb-2 md:pb-0 no-scrollbar px-4 md:px-10 md:flex-wrap snap-x items-center w-full">
          {[
            { id: 'all', label: 'All Media', icon: Sparkles },
            { id: 'movies', label: 'Movies', icon: Clapperboard },
            { id: 'series', label: 'TV Series', icon: Tv },
            { id: 'animations', label: 'Animations', icon: Ghost },
            { id: 'anime', label: 'Anime', icon: Sparkles },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setActiveFilter(f.id as RadarFilter)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-full border text-[10px] font-data font-bold uppercase tracking-widest transition-all shrink-0 snap-start",
                activeFilter === f.id 
                  ? "bg-accent/10 text-accent border-accent/20" 
                  : "bg-white/5 text-white/30 border-white/5 hover:text-white/60 hover:border-white/20"
              )}
            >
              <f.icon size={12} className="shrink-0" />
              <span className="whitespace-nowrap">{f.label}</span>
            </button>
          ))}
        </div>

        {/* Future Horizons Premium Button */}
        <div className="px-4 md:px-10 shrink-0">
          <button
            onClick={() => setActiveFilter('horizons')}
            className={cn(
              "group relative flex w-full md:w-auto items-center justify-center gap-3 px-6 py-3 rounded-2xl border text-[10px] font-data font-bold uppercase tracking-[0.2em] transition-all duration-500 overflow-hidden",
              activeFilter === 'horizons'
                ? "bg-white text-black border-white shadow-[0_0_30px_rgba(255,255,255,0.3)] scale-105"
                : "bg-white/5 text-white/60 border-white/10 hover:border-white/30 hover:text-white"
            )}
          >
            {activeFilter !== 'horizons' && (
              <div className="absolute inset-0 bg-linear-to-r from-blue-500/10 via-purple-500/10 to-accent/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            )}
            <Telescope size={16} className={cn("transition-transform duration-500 group-hover:rotate-12", activeFilter === 'horizons' ? "text-accent" : "text-white/40 group-hover:text-accent")} />
            <span className="relative z-10 w-full text-center md:w-auto">Future Horizons</span>
            {activeFilter === 'horizons' && (
              <motion.div layoutId="horizons-glow" className="absolute inset-0 bg-white/20 blur-md rounded-2xl -z-10" />
            )}
          </button>
        </div>
      </div>

      {/* Grid */}
      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div 
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="px-4 md:px-10 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6"
          >
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="aspect-2/3 rounded-2xl bg-white/5 animate-pulse" />
            ))}
          </motion.div>
        ) : activeFilter === 'horizons' ? (
          <motion.div
            key="horizons"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex flex-col gap-4 md:gap-8"
          >
            <div className="px-4 md:px-10 flex flex-col items-center text-center max-w-2xl mx-auto pt-4 md:pt-8">
              <Telescope size={40} className="text-accent mb-4 md:mb-6 opacity-80" />
              <h2 className="font-display text-3xl md:text-5xl italic tracking-tighter mb-2 md:mb-4 bg-clip-text text-transparent bg-linear-to-b from-white to-white/60 leading-none">
                BEYOND THE <br />HORIZON
              </h2>
              <p className="text-white/50 font-heading text-sm md:text-base leading-relaxed">
                Charting the most anticipated cinematic events scheduled for {new Date().getFullYear() + 1} and {new Date().getFullYear() + 2}. The anticipation meter reflects global hype and pre-release tracking.
              </p>
            </div>
            
            <div className="px-4 md:px-10 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
              {normalizedFutureData.map((item, i) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <ReleaseRadarCard item={item} />
                </motion.div>
              ))}
            </div>
            
            {futureData.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-white/20">
                <p className="font-data uppercase tracking-[0.3em] text-xs">Awaiting transmission...</p>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="grid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="px-4 md:px-10 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6"
          >
            {filteredData.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <ReleaseRadarCard item={item} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
      
      {activeFilter !== 'horizons' && filteredData.length === 0 && !isLoading && (
        <div className="flex flex-col items-center justify-center py-20 text-white/20">
          <Calendar size={48} className="mb-4 opacity-10" />
          <p className="font-data uppercase tracking-[0.3em] text-xs">No releases found for this criteria</p>
        </div>
      )}
    </div>
  );
}
