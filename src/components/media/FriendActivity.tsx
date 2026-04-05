'use client';

import { useState, useEffect } from 'react';
import { Users, UserCheck } from 'lucide-react';
import { getFriendActivityAction } from '@/lib/media-social-actions';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { cn, formatUsername } from '@/lib/utils';

interface FriendActivityProps {
  mediaId: string;
  mediaType: string;
}

export default function FriendActivity({ mediaId, mediaType }: FriendActivityProps) {
  const [friends, setFriends] = useState<any[]>([]);

  useEffect(() => {
    async function loadFriends() {
      const data = await getFriendActivityAction(mediaId, mediaType);
      setFriends(data);
    }
    loadFriends();
  }, [mediaId, mediaType]);

  if (friends.length === 0) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex flex-col gap-2 pt-4 border-t border-white/5"
    >
      <div className="flex items-center gap-2 mb-2">
         <UserCheck size={14} className="text-accent/60" />
         <span className="font-metadata text-[10px] uppercase tracking-widest text-white/40 font-bold">
            Friends who have seen this
         </span>
      </div>
      
      <div className="flex items-center -space-x-3">
        {friends.slice(0, 5).map((friend, i) => (
          <Link 
            key={friend.userId} 
            href={`/profile/${formatUsername(friend.username)}`}
            className="relative"
            style={{ zIndex: 10 - i }}
          >
            <motion.div
              whileHover={{ y: -4, zIndex: 20 }}
              className="w-10 h-10 rounded-full border-2 border-surface overflow-hidden bg-surface-hover shadow-xl transition-all"
            >
              {friend.avatarUrl ? (
                <Image 
                  src={friend.avatarUrl} 
                  alt={friend.username} 
                  fill 
                  className="object-cover" 
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs font-bold bg-white/5 text-white/40">
                  {formatUsername(friend.username)[0].toUpperCase()}
                </div>
              )}
            </motion.div>
          </Link>
        ))}
        {friends.length > 5 && (
          <div className="w-10 h-10 rounded-full border-2 border-surface bg-white/5 flex items-center justify-center text-[10px] uppercase tracking-tighter text-white/40 font-bold z-0 backdrop-blur-md">
            +{friends.length - 5}
          </div>
        )}
      </div>
    </motion.div>
  );
}
