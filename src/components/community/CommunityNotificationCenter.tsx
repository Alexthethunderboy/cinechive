'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CommunityNotification } from '@/lib/community-actions';
import type { SocialNotificationRecord } from '@/lib/social-notification-actions';
import { Bell, Play, Calendar, Star, Heart, MessageSquare, UserPlus, Sparkles, Globe, User, Users } from 'lucide-react';
import { cn, formatDate, formatUsername } from '@/lib/utils';
import Image from 'next/image';
import Link from 'next/link';

interface UnifiedNotificationCenterProps {
  algorithmicNotifications: CommunityNotification[];
  socialNotifications: SocialNotificationRecord[];
  onClose: () => void;
  onMarkAsRead: (id: string) => void;
  position?: 'sidebar' | 'bottom';
}

export function CommunityNotificationCenter({ 
  algorithmicNotifications, 
  socialNotifications, 
  onClose, 
  onMarkAsRead,
  position = 'sidebar' 
}: UnifiedNotificationCenterProps) {
  const [activeTab, setActiveTab] = useState<'social' | 'cinema'>(
    socialNotifications.some(n => !n.is_read) ? 'social' : 'cinema'
  );

  const positionClasses = position === 'sidebar' 
    ? "left-full ml-4 top-0" 
    : "bottom-full mb-4 left-1/2 -translate-x-1/2";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.95 }}
      className={cn(
        "absolute w-[92vw] sm:w-[22rem] md:w-96 max-h-[80vh] md:max-h-[600px] glass bg-black border border-white/10 rounded-2xl shadow-2xl z-60 overflow-hidden flex flex-col",
        positionClasses
      )}
    >
      {/* Header & Tabs */}
      <div className="bg-black border-b border-white/5">
        <div className="p-4 flex items-center justify-between">
          <h3 className="font-heading text-xs tracking-[0.2em] uppercase flex items-center gap-2 text-white/40">
            <Bell size={12} />
            Notifications
          </h3>
          <button 
            onClick={onClose}
            className="text-[10px] font-metadata uppercase tracking-widest text-white/20 hover:text-white transition-colors"
          >
            Close
          </button>
        </div>

        <div className="flex p-1 gap-1 mx-4 mb-4 bg-black/40 rounded-xl border border-white/5">
          <button
            onClick={() => setActiveTab('social')}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2 rounded-lg font-metadata text-[10px] uppercase tracking-widest transition-all",
              activeTab === 'social' ? "bg-white/10 text-white font-bold" : "text-white/30 hover:text-white/60"
            )}
          >
            <User size={12} />
            Social
            {socialNotifications.filter(n => !n.is_read).length > 0 && (
              <span className="w-1.5 h-1.5 rounded-full bg-vibe-rose animate-pulse" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('cinema')}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2 rounded-lg font-metadata text-[10px] uppercase tracking-widest transition-all",
              activeTab === 'cinema' ? "bg-white/10 text-white font-bold" : "text-white/30 hover:text-white/60"
            )}
          >
            <Globe size={12} />
            Cinema
            {algorithmicNotifications.length > 0 && activeTab !== 'cinema' && (
              <span className="w-1.5 h-1.5 rounded-full bg-vibe-teal" />
            )}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-[300px]">
        <AnimatePresence mode="wait">
          {activeTab === 'social' ? (
            <motion.div
              key="social-tab"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="space-y-2"
            >
              {socialNotifications.length === 0 ? (
                <EmptyState icon={<Users size={24} />} message="No social alerts yet" />
              ) : (
                socialNotifications.map((notif) => (
                  <SocialNotificationItem 
                    key={notif.id} 
                    notif={notif} 
                    onClick={() => {
                      onMarkAsRead(notif.id);
                      onClose();
                    }} 
                  />
                ))
              )}
            </motion.div>
          ) : (
            <motion.div
              key="cinema-tab"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="space-y-2"
            >
              {algorithmicNotifications.length === 0 ? (
                <EmptyState icon={<Sparkles size={24} />} message="No new releases today" />
              ) : (
                algorithmicNotifications.map((notif) => (
                  <CinemaNotificationItem key={notif.id} notif={notif} onClick={onClose} />
                ))
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-white/5 bg-black text-center">
        <Link 
          href="/activity" 
          onClick={onClose}
          className="text-[9px] font-metadata uppercase tracking-[0.3em] text-white/30 hover:text-accent transition-colors"
        >
          View Full Activity Hub →
        </Link>
      </div>
    </motion.div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function EmptyState({ icon, message }: { icon: React.ReactNode, message: string }) {
  return (
    <div className="py-20 text-center space-y-4">
      <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mx-auto text-white/20">
        {icon}
      </div>
      <p className="text-[10px] font-metadata text-white/20 uppercase tracking-[0.2em]">{message}</p>
    </div>
  );
}

export function SocialNotificationItem({ notif, onClick }: { notif: SocialNotificationRecord, onClick: () => void }) {
  const icons = {
    follow: <UserPlus size={14} className="text-vibe-teal" />,
    reaction: <Heart size={14} className="text-vibe-rose fill-vibe-rose" />,
    comment: <MessageSquare size={14} className="text-vibe-cyan" />,
    mention: <Sparkles size={14} className="text-vibe-purple" />,
  };

  const messages = {
    follow: "started following you",
    reaction: "liked your post",
    comment: "commented on your post",
    mention: "mentioned you",
  };
  const groupedCount = Number(notif.metadata?.grouped_count || 1);

  return (
    <Link 
      href={notif.type === 'follow' ? `/profile/${formatUsername(notif.actor?.username || 'user')}` : '/community'}
      onClick={onClick}
      className={cn(
        "group block p-3 rounded-xl transition-all border border-transparent hover:border-white/5 relative overflow-hidden",
        notif.is_read ? "bg-white/2 opacity-60" : "bg-white/5 border-white/5 hover:bg-white/8 shadow-lg"
      )}
    >
      {!notif.is_read && (
        <div className="absolute top-0 right-0 w-1.5 h-1.5 bg-accent rounded-bl-lg" />
      )}
      <div className="flex gap-3 items-center">
        <div className="relative w-10 h-10 shrink-0">
          <div className="w-full h-full rounded-full overflow-hidden border border-white/10 group-hover:border-white/20 transition-colors">
            {notif.actor?.avatar_url ? (
              <Image src={notif.actor.avatar_url} alt={notif.actor?.username || 'user'} fill className="object-cover" />
            ) : (
              <div className="w-full h-full bg-white/5 flex items-center justify-center text-xs font-bold text-white/20 lowercase">
                {formatUsername(notif.actor?.username || 'u')[0]}
              </div>
            )}
          </div>
          <div className="absolute -bottom-1 -right-1 p-1 bg-surface rounded-full shadow-lg border border-white/10">
            {icons[notif.type]}
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-heading text-white">
            <span className="font-bold underline decoration-white/10 underline-offset-2">{formatUsername(notif.actor?.username || 'user')}</span>
            <span className="text-white/60 ml-1.5">
              {messages[notif.type]}
              {groupedCount > 1 ? ` (${groupedCount}x)` : ''}
            </span>
          </p>
          {notif.metadata?.preview && (
            <p className="text-[10px] text-white/30 italic truncate mt-0.5">
              "{notif.metadata.preview}"
            </p>
          )}
          <span className="text-[8px] font-mono text-white/20 uppercase mt-1 block">
             {formatDate(notif.created_at)}
          </span>
        </div>
      </div>
    </Link>
  );
}

export function CinemaNotificationItem({ notif, onClick }: { notif: CommunityNotification, onClick: () => void }) {
  return (
    <Link 
      key={notif.id} 
      href={`/media/${notif.media.type}/${notif.media.sourceId}`}
      onClick={onClick}
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
          <h4 className="text-xs font-heading text-white truncate group-hover:text-accent transition-colors">
            {notif.media.displayTitle}
          </h4>
          <p className="text-[10px] text-white/50 line-clamp-2 leading-relaxed mt-0.5">
            {notif.message}
          </p>
          <div className="flex items-center gap-2 mt-2">
             <div className="flex items-center gap-1 text-[9px] text-accent/80 font-mono">
               <Star size={8} fill="currentColor" />
               {notif.media.rating.average.toFixed(1)}
             </div>
             <span className="text-[8px] text-white/20 font-mono italic">Released {notif.timestamp}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
