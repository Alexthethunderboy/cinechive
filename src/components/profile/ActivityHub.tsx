'use client';

import { motion } from 'framer-motion';
import GlassPanel from '@/components/ui/GlassPanel';
import { formatDate } from '@/lib/utils';
import Image from 'next/image';
import Link from 'next/link';
import { Activity } from 'lucide-react';
import ProfileEmptyState from './ProfileEmptyState';

interface ActivityHubProps {
  entries: Array<{
    id: string;
    media_type: string;
    media_id?: string;
    external_id?: string;
    poster_url?: string | null;
    title: string;
    created_at?: string;
    classification?: string | null;
  }>;
}

export default function ActivityHub({ entries }: ActivityHubProps) {
  if (entries.length === 0) {
    return (
      <ProfileEmptyState
        icon={Activity}
        title="No Recent Activity"
        body="Your latest logs will appear here."
        ctaLabel="Discover titles"
        ctaHref="/discover"
      />
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      {entries.slice(0, 9).map((entry, index) => (
        <motion.div
          key={entry.id}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
        >
          <Link href={`/media/${entry.media_type}/${entry.media_id || entry.external_id}`}>
            <GlassPanel className="p-4 md:p-5 bg-white/3 border-white/8 hover:border-white/20 hover:bg-white/6 transition-all group h-full flex items-center gap-4 rounded-2xl">
              <div className="relative w-16 md:w-20 aspect-2/3 rounded-lg overflow-hidden shrink-0 bg-surface-hover shadow-lg">
                {entry.poster_url && (
                  <Image 
                    src={entry.poster_url} 
                    alt={entry.title} 
                    fill 
                    className="object-cover group-hover:scale-105 transition-transform duration-500" 
                  />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <span className="inline-flex px-2 py-0.5 rounded-md font-data text-[9px] text-accent font-bold uppercase tracking-widest bg-accent/10 border border-accent/20 mb-2">
                  {entry.classification || 'UNLOGGED'}
                </span>
                <h3 className="font-display text-lg md:text-xl text-white truncate font-bold group-hover:text-accent transition-colors">
                  {entry.title}
                </h3>
                <p className="font-data text-[10px] text-white/40 uppercase mt-1 tracking-wider">
                  Logged {formatDate(entry.created_at || new Date().toISOString())}
                </p>
              </div>
            </GlassPanel>
          </Link>
        </motion.div>
      ))}
    </div>
  );
}
