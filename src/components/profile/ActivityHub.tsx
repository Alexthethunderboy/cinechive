'use client';

import { motion } from 'framer-motion';
import GlassPanel from '@/components/ui/GlassPanel';
import { formatDate } from '@/lib/utils';
import Image from 'next/image';
import Link from 'next/link';

interface ActivityHubProps {
  entries: any[];
}

export default function ActivityHub({ entries }: ActivityHubProps) {
  if (entries.length === 0) {
    return <div className="py-20 text-center text-white/20 font-heading border border-dashed border-white/5 rounded-3xl uppercase tracking-widest italic">No recent activity detected</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {entries.slice(0, 9).map((entry, index) => (
        <motion.div
          key={entry.id}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
        >
          <Link href={`/media/${entry.media_type}/${entry.media_id}`}>
            <GlassPanel className="p-4 bg-white/3 border-white/5 hover:border-white/10 hover:bg-white/6 transition-all group h-full flex items-center gap-4">
              <div className="relative w-16 aspect-2/3 rounded-lg overflow-hidden shrink-0 bg-surface-hover shadow-lg">
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
                <span className="font-data text-[8px] text-accent font-bold uppercase tracking-widest">
                  {entry.vibe || 'UNLOGGED'}
                </span>
                <h3 className="font-display text-xl text-white truncate font-bold group-hover:text-accent transition-colors">
                  {entry.title}
                </h3>
                <p className="font-data text-[9px] text-white/40 uppercase mt-1">
                  Logged {formatDate(entry.created_at)}
                </p>
              </div>
            </GlassPanel>
          </Link>
        </motion.div>
      ))}
    </div>
  );
}
