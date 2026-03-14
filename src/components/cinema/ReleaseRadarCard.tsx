'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bell, BellOff, Info, Play, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { UniversalMedia } from '@/lib/api/UniversalTransformer';
import { formatDateBadge } from '@/lib/date-utils';
import { toggleReminder, getReminderStatus } from '@/app/actions/radar-actions';
import Image from 'next/image';
import { toast } from 'sonner';

interface ReleaseRadarCardProps {
  item: UniversalMedia;
}

export default function ReleaseRadarCard({ item }: ReleaseRadarCardProps) {
  const [isNotified, setIsNotified] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const { day, month } = formatDateBadge(item.targetDate || item.releaseDate);

  useEffect(() => {
    getReminderStatus(String(item.sourceId), item.type).then(setIsNotified);
  }, [item.sourceId, item.type]);

  const handleToggleNotify = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const result = await toggleReminder(String(item.sourceId), item.type);
      
      if ('error' in result && result.error) {
        toast.error(result.error);
        return;
      }

      setIsNotified(result.status === 'added');
      if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(10);
      toast.success(result.status === 'added' ? "Reminder set." : "Reminder dismissed.");
    } catch (err) {
      console.error('Failed to toggle reminder:', err);
      toast.error("An unexpected error occurred.");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5 }}
      className="group relative bg-white/5 border border-white/10 rounded-2xl overflow-hidden aspect-2/3 md:aspect-auto md:h-[400px]"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Background Image / Video Preview */}
      <div className="absolute inset-0">
        <motion.img
          layoutId={`radar-poster-${item.id}-${item.sourceId}`}
          src={item.posterUrl || '/placeholder-poster.jpg'}
          alt={item.displayTitle}
          className={cn(
            "absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110",
            isHovered && item.trailerUrl ? "opacity-40" : "opacity-100"
          )}
        />
        
        {/* Muted Looping Video Preview on Hover */}
        {isHovered && item.trailerUrl && (
          <div className="absolute inset-0 z-0">
            {/* 
              Simplified: In a real app, we'd use a YouTube embed or direct .mp4 if available.
              For this high-fidelity mockup, we'll assume a local or proxied muted video.
            */}
            <iframe
              src={`${item.trailerUrl.replace('watch?v=', 'embed/')}?autoplay=1&mute=1&controls=0&loop=1&playlist=${item.trailerUrl.split('v=')[1]}`}
              className="w-full h-full pointer-events-none scale-150"
              allow="autoplay"
            />
          </div>
        )}

        <div className="absolute inset-0 bg-linear-to-t from-black via-black/40 to-transparent" />
      </div>

      {/* Date Badge */}
      <div className="absolute top-2 left-2 z-20">
        <div className="bg-white text-black p-1 md:p-1.5 rounded-lg flex flex-col items-center justify-center min-w-[38px] md:min-w-[45px] shadow-2xl border border-white/20">
          <span className="text-lg font-bold leading-none">{day}</span>
          <span className="text-[9px] font-data font-bold tracking-wider">{month}</span>
        </div>
      </div>

      {/* Countdown \& Status Badge */}
      <div className="absolute top-2 right-2 z-20 flex flex-col items-end gap-1">
        <div className="glass px-2 py-0.5 rounded-full border border-white/20">
          <span className="text-[9px] font-data text-white font-bold tracking-widest uppercase">
            {item.countdown}
          </span>
        </div>
        <div className="bg-accent/20 text-accent px-1.5 py-0.5 rounded text-[7px] font-data font-bold uppercase tracking-tighter border border-accent/30">
          {item.status}
        </div>
      </div>

      {/* Content */}
      <div className="absolute inset-x-0 bottom-0 p-4 z-20">
        <div className="mb-2 flex items-center gap-2">
          {item.type === 'anime' && (
            <span className="text-[8px] font-data bg-rose-500/20 text-rose-400 px-2 py-0.5 rounded border border-rose-500/30 uppercase tracking-widest">Anime</span>
          )}
          {item.type === 'animation' && (
            <span className="text-[8px] font-data bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded border border-blue-500/30 uppercase tracking-widest">Animation</span>
          )}
        </div>
        
        <h3 className="text-lg font-heading font-bold text-white mb-2 line-clamp-1 group-hover:text-accent transition-colors">
          {item.displayTitle}
        </h3>

        {/* Hype Meter */}
        <div className="space-y-1 mb-4">
          <div className="flex items-center justify-between text-[10px] font-data text-white/40 uppercase tracking-tighter">
            <span>Anticipation Meter</span>
            <span className="text-white/80">{item.hypeLevel || 0}%</span>
          </div>
          <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${item.hypeLevel || 0}%` }}
              className="h-full bg-linear-to-r from-accent to-accent/40"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleToggleNotify}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2 rounded-xl border transition-all duration-300",
              isNotified 
                ? "bg-accent text-black border-accent" 
                : "bg-white/10 text-white border-white/10 hover:bg-white/20"
            )}
          >
            {isNotified ? <BellOff size={14} /> : <Bell size={14} />}
            <span className="text-[10px] font-data font-bold uppercase tracking-widest">
              {isNotified ? 'Dismiss' : 'Notify Me'}
            </span>
          </motion.button>
          
          <motion.button 
            whileTap={{ scale: 0.95 }}
            className="p-2 rounded-xl bg-white/10 text-white border border-white/10 hover:bg-white/20 transition-all"
          >
            <Info size={14} />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
