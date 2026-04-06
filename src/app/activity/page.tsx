'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Loader2, Search, Zap, Sparkles, ChevronRight, History, Activity as ActivityIcon, MessageSquare, Repeat2 } from 'lucide-react';
import { useAuth } from '@/components/providers/AuthProvider';
import { getAlgorithmicNotifications, getUserActivityHistory, CommunityNotification, UserActivityItem } from '@/lib/community-actions';
import Link from 'next/link';
import Image from 'next/image';
import GlassPanel from '@/components/ui/GlassPanel';

export default function ActivityPage() {
  const { user, loading } = useAuth();
  const [notifications, setNotifications] = useState<CommunityNotification[]>([]);
  const [history, setHistory] = useState<UserActivityItem[]>([]);
  const [topInterests, setTopInterests] = useState<string[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const fetchData = () => {
      if (user) {
        Promise.all([
          getAlgorithmicNotifications(),
          getUserActivityHistory()
        ]).then(([notifs, hist]) => {
          setNotifications(notifs.notifications);
          setTopInterests(notifs.topInterests);
          setHistory(hist);
        });
      }
    };

    fetchData();
    window.addEventListener('refresh-notifications', fetchData);
    return () => window.removeEventListener('refresh-notifications', fetchData);
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
        <h1 className="text-2xl font-heading italic tracking-tighter text-white/40 mb-2">Access Denied</h1>
        <p className="text-xs font-metadata text-white/20 tracking-widest max-w-xs">
          Sign in to access your activity history.
        </p>
        <Link href="/login?returnTo=/activity" className="mt-8 px-8 py-3 bg-white text-black font-heading font-bold rounded-full hover:bg-white/90 transition-all tracking-widest text-[10px]">
          Identify Yourself
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto pt-20 pb-40 px-6">
      <div className="flex items-center justify-between mb-12">
        <div className="space-y-1">
          <h1 className="text-4xl font-heading italic tracking-tighter text-white">Activity</h1>
          <p className="text-[10px] font-metadata text-white/40 tracking-[0.3em]">Recent Notifications & History</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="text-[10px] font-mono text-vibe-gold bg-vibe-gold/10 px-3 py-1 rounded-full border border-vibe-gold/20">
            {notifications.length} New Alerts
          </div>
          {topInterests.length > 0 && (
            <div className="flex items-center gap-2">
               <Sparkles size={8} className="text-vibe-violet" />
               <span className="text-[8px] font-mono text-white/30 tracking-widest">Interests: {topInterests.join(' • ')}</span>
            </div>
          )}
        </div>
      </div>

      {/* Onboarding Notice */}
      {user?.profile?.onboarding_completed === false && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-10"
        >
          <GlassPanel className="p-6 bg-vibe-violet/10 border-vibe-violet/20 overflow-hidden relative group">
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
              <Zap size={80} className="text-vibe-violet" />
            </div>
            <div className="relative z-10 space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-vibe-violet/20 text-vibe-violet">
                  <Sparkles size={18} />
                </div>
                <h3 className="font-heading text-lg text-white">Complete Your Profile</h3>
              </div>
              <p className="text-sm text-white/60 font-metadata leading-relaxed max-w-lg">
                Your activity feed is currently showing general trends. Finish onboarding to unlock deep personalization tailored to your movie style.
              </p>
              <Link 
                href="/" 
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-white text-black font-heading font-bold rounded-xl hover:bg-white/90 transition-all text-xs tracking-widest"
              >
                Start Onboarding
                <ChevronRight size={14} />
              </Link>
            </div>
          </GlassPanel>
        </motion.div>
      )}

      {/* Taste Profile */}
      {topInterests.length > 0 && (
         <motion.div 
           initial={{ opacity: 0, y: 10 }}
           animate={{ opacity: 1, y: 0 }}
           className="mb-12 space-y-4"
         >
           <div className="flex items-center gap-2">
             <div className="h-px bg-white/10 flex-1" />
             <span className="text-[10px] font-mono text-white/30 tracking-[0.2em] px-2 italic">Your Style</span>
             <div className="h-px bg-white/10 flex-1" />
           </div>
           
           <div className="flex flex-wrap justify-center gap-3">
             {topInterests.map((interest) => (
               <div 
                 key={interest}
                 className="px-6 py-3 rounded-2xl bg-white/3 border border-white/5 flex flex-col items-center gap-1 group hover:bg-white/5 transition-all"
               >
                 <span className="text-lg font-heading text-white italic tracking-tighter group-hover:text-vibe-violet transition-colors">
                   {interest}
                 </span>
                 <div className="w-1 h-1 rounded-full bg-vibe-violet opacity-40 group-hover:scale-150 transition-transform" />
               </div>
             ))}
           </div>
         </motion.div>
      )}

      {/* Personal Activity History */}
      <div className="space-y-4 mb-16">
        <div className="space-y-2 flex items-center justify-between">
           <div className="flex items-center gap-2">
             <History size={14} className="text-white/40" />
             <h2 className="text-[10px] font-data tracking-[0.4em] text-white/40 font-bold italic">Your History</h2>
           </div>
           <div className="h-px bg-white/5 flex-1 ml-4" />
        </div>

        <div className="space-y-3">
          {history.length === 0 ? (
            <div className="py-12 text-center rounded-2xl bg-white/2 border border-dashed border-white/5">
              <p className="text-[10px] font-metadata text-white/20 tracking-widest italic">No personal logs yet. Start archiving to build your history.</p>
            </div>
          ) : (
            history.map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-4 p-3 rounded-xl bg-white/3 border border-white/5 hover:bg-white/5 transition-all group"
              >
                <div className="relative w-10 aspect-2/3 rounded overflow-hidden border border-white/10 shrink-0">
                  {item.poster_url && (
                    <Image src={item.poster_url} alt={item.title} fill className="object-cover" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[8px] font-mono text-white/30 tracking-widest">
                      {item.activity_type === 'entry' ? 'Log' : item.activity_type === 're_archive' ? 'Re-collect' : 'Trivia'}
                    </span>
                    <span className="text-[8px] font-mono text-white/10">•</span>
                    <span className="text-[8px] font-mono text-white/20">{new Date(item.created_at).toLocaleDateString()}</span>
                  </div>
                  <h4 className="text-sm font-heading text-white truncate">{item.title}</h4>
                  {item.vibe && (
                    <span className="text-[8px] font-mono text-vibe-gold/60">{item.vibe}</span>
                  )}
                </div>
                <Link 
                  href={`/media/${item.media_type}/${item.media_id}`}
                  className="p-2 text-white/20 hover:text-white transition-colors"
                >
                  <ChevronRight size={14} />
                </Link>
              </motion.div>
            ))
          )}
        </div>
      </div>

      <div className="space-y-2 mb-6 flex items-center justify-between">
         <div className="flex items-center gap-2">
           <ActivityIcon size={14} className="text-vibe-gold/40" />
           <h2 className="text-[10px] font-data tracking-[0.4em] text-vibe-gold/40 font-bold italic">Recommended for You</h2>
         </div>
         <div className="h-px bg-white/5 flex-1 ml-4" />
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
              <p className="font-metadata text-xs text-white/20 tracking-[0.2em]">No recommendations right now</p>
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
                      <span className="text-[10px] font-mono text-vibe-gold/80 tracking-widest">{notif.media.type} Release</span>
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
