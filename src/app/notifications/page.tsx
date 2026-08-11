'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Loader2, Zap, Sparkles, ChevronRight, History } from 'lucide-react';
import { useAuth } from '@/components/providers/AuthProvider';
import { getAlgorithmicNotifications, getUserActivityHistory, CommunityNotification, UserActivityItem } from '@/lib/community-actions';
import { getSocialNotificationsAction } from '@/lib/social-notification-actions';
import Link from 'next/link';
import Image from 'next/image';
import GlassPanel from '@/components/ui/GlassPanel';
import { CLIENT_EVENTS } from '@/lib/client-events';
import { capTo99Plus, getNotificationCountSummary } from '@/lib/notification-utils';
import { cn } from '@/lib/utils';
import { SocialNotificationItem, CinemaNotificationItem } from '@/components/community/CommunityNotificationCenter';
import { markNotificationAsReadAction, SocialNotificationRecord } from '@/lib/social-notification-actions';
import { getLocalNotifications, type LocalArchiveState, useLocalArchive } from '@/lib/local-archive';

export default function ActivityPage() {
  const { user, loading, isLocalMode, serviceStatus } = useAuth();
  const localArchive = useLocalArchive();
  const [notifications, setNotifications] = useState<CommunityNotification[]>([]);
  const [socialNotifications, setSocialNotifications] = useState<SocialNotificationRecord[]>([]);
  const [history, setHistory] = useState<UserActivityItem[]>([]);
  const [topInterests, setTopInterests] = useState<string[]>([]);
  const [lane, setLane] = useState<'all' | 'social' | 'cinema' | 'history'>('all');

  useEffect(() => {
    const fetchData = () => {
      if (user && !isLocalMode && serviceStatus === 'available') {
        Promise.all([
          getAlgorithmicNotifications(),
          getUserActivityHistory(),
          getSocialNotificationsAction()
        ]).then(([notifs, hist, social]) => {
          setNotifications(notifs.notifications);
          setTopInterests(notifs.topInterests);
          setHistory(hist);
          setSocialNotifications(social as SocialNotificationRecord[]);
        });
      }
    };

    fetchData();
    window.addEventListener(CLIENT_EVENTS.refreshNotifications, fetchData);
    return () => window.removeEventListener(CLIENT_EVENTS.refreshNotifications, fetchData);
  }, [isLocalMode, serviceStatus, user]);

  const handleMarkAsRead = async (id: string) => {
    setSocialNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, is_read: true } : n)
    );
    await markNotificationAsReadAction(id);
  };

  const countSummary = getNotificationCountSummary(notifications.length, socialNotifications);

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
        <Link href="/login?returnTo=/notifications" className="mt-8 px-8 py-3 bg-white text-black font-heading font-bold rounded-full hover:bg-white/90 transition-all tracking-widest text-[10px]">
          Identify Yourself
        </Link>
      </div>
    );
  }

  if (isLocalMode) return <LocalActivityPage archive={localArchive} />;

  return (
    <div className="max-w-3xl mx-auto pt-20 pb-40 px-4 md:px-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div className="space-y-1">
          <h1 className="text-4xl font-heading italic tracking-tighter text-white">Notifications</h1>
          <p className="text-[10px] font-metadata text-white/40 tracking-[0.3em]">Recent Alerts & History</p>
        </div>
        <div className="flex flex-col items-start md:items-end gap-2">
          <div className="text-[10px] font-mono text-vibe-gold bg-vibe-gold/10 px-3 py-1 rounded-full border border-vibe-gold/20">
            {capTo99Plus(countSummary.total)} Total Alerts
          </div>
          <div className="text-[9px] font-mono text-white/50 pl-1 md:pl-0">
            {countSummary.cinema} cinema · {countSummary.socialUnread} social unread
          </div>
          {topInterests.length > 0 && (
            <div className="flex items-center gap-2 pl-1 md:pl-0">
               <Sparkles size={8} className="text-vibe-violet" />
               <span className="text-[8px] font-mono text-white/30 tracking-widest">Interests: {topInterests.join(' • ')}</span>
            </div>
          )}
        </div>
      </div>

      <div className="mb-8 flex flex-wrap items-center gap-2">
        {[
          { id: 'all', label: `All (${countSummary.total})` },
          { id: 'social', label: `Social (${socialNotifications.length})` },
          { id: 'cinema', label: `Cinema (${notifications.length})` },
          { id: 'history', label: `History (${history.length})` },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setLane(tab.id as typeof lane)}
            className={cn(
              "px-3 py-1.5 rounded-full text-[10px] uppercase tracking-widest border transition-colors whitespace-nowrap",
              lane === tab.id ? "bg-white text-black border-white" : "bg-white/5 text-white/60 border-white/10 hover:text-white"
            )}
          >
            {tab.label}
          </button>
        ))}
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

      {lane === 'history' && (
      <div className="space-y-4 mb-16">
        <div className="space-y-2 flex items-center justify-between">
           <div className="flex items-center gap-2">
             <History size={14} className="text-white/40" />
             <h2 className="text-[10px] font-data tracking-[0.4em] text-white/40 font-bold italic uppercase">Your History</h2>
           </div>
           <div className="h-px bg-white/5 flex-1 ml-4" />
        </div>

        <div className="space-y-3">
          {history.length === 0 ? (
            <div className="py-12 text-center rounded-2xl bg-white/2 border border-dashed border-white/5">
              <p className="text-[10px] font-metadata text-white/20 tracking-widest italic uppercase">No personal logs yet.</p>
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
      )}

      {(lane === 'all' || lane === 'social' || lane === 'cinema') && (
        <div className="space-y-8">
          <AnimatePresence mode="popLayout">
            {(() => {
              // Prepare and Sort Mixed Feed
              const mixedFeed: Array<
                | (SocialNotificationRecord & { itemType: 'social'; date: Date })
                | (CommunityNotification & { itemType: 'cinema'; date: Date })
              > = [
                ...(lane === 'all' || lane === 'social' 
                  ? socialNotifications.map(n => ({ ...n, itemType: 'social' as const, date: new Date(n.created_at) }))
                  : []),
                ...(lane === 'all' || lane === 'cinema' 
                  ? notifications.map(n => ({ ...n, itemType: 'cinema' as const, date: new Date(n.timestamp || 0) }))
                  : [])
              ].sort((a, b) => b.date.getTime() - a.date.getTime());

              if (mixedFeed.length === 0) {
                return (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-32 text-center space-y-4">
                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto text-white/10">
                      <Bell size={24} />
                    </div>
                    <p className="text-[10px] uppercase tracking-widest text-white/30 italic">No alerts for this lane.</p>
                  </motion.div>
                );
              }

              return mixedFeed.map((item, idx) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.03 }}
                >
                  {item.itemType === 'social' ? (
                    <div className="relative">
                       <SocialNotificationItem 
                         notif={item} 
                         onClick={() => handleMarkAsRead(item.id)} 
                       />
                       {/* Enhanced styling for page version */}
                       <div className="absolute right-4 top-1/2 -translate-y-1/2 md:block hidden">
                          <ChevronRight size={14} className="text-white/10" />
                       </div>
                    </div>
                  ) : (
                    <div className="scale-105 md:scale-100 px-1 md:px-0">
                      <CinemaNotificationItem 
                        notif={item} 
                        onClick={() => {}} 
                      />
                    </div>
                  )}
                </motion.div>
              ));
            })()}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

function LocalActivityPage({ archive }: { archive: LocalArchiveState }) {
  const reminders = getLocalNotifications(archive);
  return (
    <div className="max-w-3xl mx-auto pt-20 pb-40 px-4 md:px-6">
      <div className="mb-8 rounded-2xl border border-emerald-300/20 bg-emerald-300/8 px-4 py-3 text-xs text-emerald-100/80">
        Local activity · Reminder alerts and journal history are calculated on this device. Email, push delivery, follows and community alerts require a backend.
      </div>
      <header className="mb-12 flex items-end justify-between gap-5">
        <div>
          <h1 className="text-4xl font-heading italic tracking-tighter text-white">Notifications</h1>
          <p className="mt-2 text-[10px] font-metadata text-white/40 tracking-[0.3em] uppercase">Local reminders & history</p>
        </div>
        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 font-mono text-[10px] text-white/50">{reminders.length} reminders</span>
      </header>

      <section className="mb-14">
        <div className="mb-4 flex items-center gap-2"><Bell size={14} className="text-vibe-gold" /><h2 className="font-data text-[10px] uppercase tracking-[0.3em] text-white/50">Release reminders</h2></div>
        <div className="space-y-3">
          {reminders.length ? reminders.map((item) => (
            <Link key={item.id} href={`/media/${item.mediaType}/${item.mediaId}`} className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/3 p-3 transition-colors hover:bg-white/6">
              <div className="relative h-20 w-14 shrink-0 overflow-hidden rounded-lg bg-white/5">
                {item.posterUrl && <Image src={item.posterUrl} alt={item.title} fill className="object-cover" />}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="truncate font-heading text-base text-white">{item.title}</h3>
                <p className="mt-1 text-xs text-white/45">{item.message}</p>
              </div>
              <ChevronRight size={15} className="text-white/20" />
            </Link>
          )) : (
            <div className="rounded-2xl border border-dashed border-white/10 py-14 text-center font-metadata text-[10px] uppercase tracking-widest text-white/25">No reminders yet. Set one on an upcoming title.</div>
          )}
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-center gap-2"><History size={14} className="text-white/35" /><h2 className="font-data text-[10px] uppercase tracking-[0.3em] text-white/50">Journal history</h2></div>
        <div className="space-y-3">
          {archive.journalEntries.length ? archive.journalEntries.slice(0, 20).map((entry) => (
            <Link key={entry.id} href={`/media/${entry.media_type}/${entry.media_id}`} className="flex items-center gap-4 rounded-xl border border-white/5 bg-white/3 p-3 hover:bg-white/5">
              <div className="relative h-14 w-10 shrink-0 overflow-hidden rounded bg-white/5">{entry.poster_url && <Image src={entry.poster_url} alt={entry.title} fill className="object-cover" />}</div>
              <div className="min-w-0 flex-1">
                <h3 className="truncate font-heading text-sm text-white">{entry.title}</h3>
                <p className="mt-1 font-mono text-[9px] uppercase tracking-widest text-white/25">{new Date(entry.watched_at).toLocaleDateString()} {entry.is_rewatch ? '· Rewatch' : ''}</p>
              </div>
            </Link>
          )) : <div className="rounded-2xl border border-dashed border-white/10 py-12 text-center font-metadata text-[10px] uppercase tracking-widest text-white/25">No screenings logged yet.</div>}
        </div>
      </section>
    </div>
  );
}
