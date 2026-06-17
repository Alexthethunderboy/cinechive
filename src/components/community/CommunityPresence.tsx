'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';

export default function CommunityPresence({ currentUserId, currentUserProfile }: { currentUserId: string | null; currentUserProfile: any }) {
  const [onlineUsers, setOnlineUsers] = useState<any[]>([]);

  useEffect(() => {
    if (!currentUserId || !currentUserProfile) return;

    const supabase = createClient();
    const channel = supabase.channel('community_presence', {
      config: { presence: { key: currentUserId } },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const users = Object.values(state).map((presence: any) => presence[0]);
        // Filter out current user from display
        const others = users.filter((u) => u.id !== currentUserId);
        setOnlineUsers(others);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            id: currentUserId,
            username: currentUserProfile.username,
            avatar_url: currentUserProfile.avatar_url,
            online_at: new Date().toISOString(),
          });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId, currentUserProfile]);

  if (onlineUsers.length === 0) return null;

  return (
    <div className="flex items-center gap-2 mb-4 px-2">
      <div className="flex -space-x-2 overflow-hidden">
        <AnimatePresence>
          {onlineUsers.slice(0, 5).map((user) => (
            <motion.div
              key={user.id}
              initial={{ opacity: 0, scale: 0.5, x: -10 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.5 }}
              className="inline-block border-2 border-black rounded-full relative z-10"
              title={user.username}
            >
              <div className="w-6 h-6 rounded-full overflow-hidden bg-white/10">
                {user.avatar_url ? (
                  <img src={user.avatar_url} alt={user.username} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-accent text-[8px] text-white font-bold">
                    {user.username?.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      <span className="text-[10px] uppercase tracking-widest text-emerald-400 font-bold flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        {onlineUsers.length} {onlineUsers.length === 1 ? 'Cinephile' : 'Cinephiles'} Online
      </span>
    </div>
  );
}
