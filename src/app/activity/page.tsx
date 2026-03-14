'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Loader2, Search } from 'lucide-react';
import { useAuth } from '@/components/providers/AuthProvider';
import { getAlgorithmicNotifications, PulseNotification } from '@/lib/pulse-actions';
import Link from 'next/link';
import Image from 'next/image';

export default function ActivityPage() {
  const { user, loading } = useAuth();
  const [notifications, setNotifications] = useState<PulseNotification[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (user) {
      getAlgorithmicNotifications().then(setNotifications);
    }
  }, [user]);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="animate-spin text-white/20" size={32} />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center">
        <Bell size={48} className="text-white/5 mb-6" />
        <h1 className="text-2xl font-heading uppercase italic tracking-tighter text-white/40 mb-2">Access Denied</h1>
        <p className="text-xs font-metadata text-white/20 uppercase tracking-widest max-w-xs">
          Sign in to access your activity history.
        </p>
        <Link href="/login?returnTo=/activity" className="mt-8 px-8 py-3 bg-white text-black font-heading font-bold rounded-full hover:bg-white/90 transition-all uppercase tracking-widest text-[10px]">
          Identify Yourself
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto pt-20 pb-40 px-6">
      <div className="flex items-center justify-between mb-12">
        <div className="space-y-1">
          <h1 className="text-4xl font-heading uppercase italic tracking-tighter text-white">Activity</h1>
          <p className="text-[10px] font-metadata text-white/40 uppercase tracking-[0.3em]">Recent Notifications & History</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-[10px] font-mono text-vibe-gold bg-vibe-gold/10 px-3 py-1 rounded-full border border-vibe-gold/20">
            {notifications.length} New Alerts
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {notifications.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-40 text-center space-y-4"
            >
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto text-white/10">
                <Bell size={32} />
              </div>
              <p className="font-metadata text-xs text-white/20 uppercase tracking-[0.2em]">The void remains silent</p>
            </motion.div>
          ) : (
            notifications.map((notif, idx) => (
              <motion.div
                key={notif.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Link 
                  href={`/media/${notif.media.type}/${notif.media.sourceId}`}
                  className="group flex items-center gap-6 p-4 rounded-2xl bg-white/3 border border-white/5 hover:bg-white/5 hover:border-white/10 transition-all"
                >
                  <div className="relative w-24 aspect-2/3 rounded-lg overflow-hidden border border-white/10 shrink-0">
                    {notif.media.posterUrl ? (
                      <Image 
                        src={notif.media.posterUrl} 
                        alt={notif.media.displayTitle}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-700"
                      />
                    ) : (
                      <div className="w-full h-full bg-white/5 flex items-center justify-center text-[10px] text-white/20">NO IMAGE</div>
                    )}
                    <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent" />
                  </div>

                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono text-vibe-gold/80 uppercase tracking-widest">{notif.media.type} Alert</span>
                      <span className="text-[10px] font-mono text-white/20 capitalize">{notif.timestamp}</span>
                    </div>
                    <h3 className="text-xl font-heading text-white line-clamp-1 group-hover:text-vibe-gold transition-colors">
                      {notif.media.displayTitle}
                    </h3>
                    <p className="text-sm text-white/40 font-metadata leading-relaxed line-clamp-2 italic">
                      {notif.message}
                    </p>
                    <div className="pt-2 flex items-center gap-4">
                      <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-white/5 text-[10px] text-white/60 font-mono">
                        View Details
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
