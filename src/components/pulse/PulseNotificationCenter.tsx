'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { PulseNotification } from '@/lib/pulse-actions';
import { Bell, Play, Calendar, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import Link from 'next/link';

interface PulseNotificationCenterProps {
  notifications: PulseNotification[];
  onClose: () => void;
  position?: 'sidebar' | 'bottom';
}

export function PulseNotificationCenter({ notifications, onClose, position = 'sidebar' }: PulseNotificationCenterProps) {
  const positionClasses = position === 'sidebar' 
    ? "left-full ml-4 top-0" 
    : "bottom-full mb-4 left-1/2 -translate-x-1/2";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.95 }}
      className={cn(
        "absolute w-80 max-h-[500px] glass border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col",
        positionClasses
      )}
    >
      <div className="p-4 border-b border-white/5 bg-white/5 flex items-center justify-between">
        <h3 className="font-heading text-sm tracking-widest uppercase flex items-center gap-2">
          <Bell size={14} className="text-vibe-gold" fill="currentColor" />
          Pulse Notifications
        </h3>
        <span className="text-[10px] font-mono text-white/30">{notifications.length} New</span>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {notifications.length === 0 ? (
          <div className="py-20 text-center space-y-2">
            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center mx-auto text-white/20">
              <Bell size={20} />
            </div>
            <p className="text-xs font-metadata text-white/30 uppercase tracking-[0.2em]">Silence in the void</p>
          </div>
        ) : (
          notifications.map((notif) => (
            <Link 
              key={notif.id} 
              href={`/media/${notif.media.type}/${notif.media.sourceId}`}
              onClick={onClose}
              className="group block p-2 rounded-xl hover:bg-white/5 transition-all border border-transparent hover:border-white/5"
            >
              <div className="flex gap-3">
                <div className="relative w-16 aspect-2/3 shrink-0 rounded-lg overflow-hidden border border-white/10">
                  {notif.media.posterUrl ? (
                    <img 
                      src={notif.media.posterUrl} 
                      alt={notif.media.displayTitle}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full bg-white/5 flex items-center justify-center text-[8px] text-white/20">No Img</div>
                  )}
                </div>
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                  <h4 className="text-xs font-heading text-white truncate group-hover:text-vibe-gold transition-colors">
                    {notif.media.displayTitle}
                  </h4>
                  <p className="text-[10px] text-white/50 line-clamp-2 leading-relaxed mt-0.5">
                    {notif.message}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                     <div className="flex items-center gap-1 text-[9px] text-vibe-gold/80 font-mono">
                       <Star size={8} fill="currentColor" />
                       {notif.media.rating.average.toFixed(1)}
                     </div>
                     <span className="text-[8px] text-white/20 font-mono italic">Released {notif.timestamp}</span>
                  </div>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>

      <div className="p-3 border-t border-white/5 text-center">
        <Link 
          href="/pulse" 
          onClick={onClose}
          className="text-[10px] font-metadata uppercase tracking-[0.3em] text-white/40 hover:text-white transition-colors"
        >
          View Full Rhythm →
        </Link>
      </div>
    </motion.div>
  );
}
