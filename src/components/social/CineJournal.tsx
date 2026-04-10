'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import GlassPanel from '@/components/ui/GlassPanel';
import { Calendar, Star, Play, History } from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

interface JournalEntry {
  id: string;
  title: string;
  poster_url: string | null;
  watched_at: string;
  is_rewatch: boolean;
  rating: number | null;
  media_id: string;
  media_type: string;
}

interface CineJournalProps {
  userId: string;
  isOwnProfile?: boolean;
}

export default function CineJournal({ userId, isOwnProfile }: CineJournalProps) {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchJournal() {
      const supabase = createClient();
      const { data, error } = await (supabase.from('cine_journal') as any)
        .select('*')
        .eq('user_id', userId)
        .order('watched_at', { ascending: false });

      if (!error && data) setEntries(data);
      setIsLoading(false);
    }
    fetchJournal();
  }, [userId]);

  if (isLoading) {
    return (
      <div className="py-20 flex justify-center">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="py-20 text-center space-y-4 border border-dashed border-white/5 rounded-3xl">
        <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mx-auto text-white/20">
          <History size={24} />
        </div>
        <p className="text-xs font-metadata text-white/20 uppercase tracking-[0.2em] italic">No screenings logged in the journal yet</p>
        {isOwnProfile && (
          <Link
            href="/discover"
            className="inline-flex px-4 py-2 rounded-full border border-white/10 text-[10px] tracking-widest text-white/60 hover:text-white hover:border-white/30 transition-colors"
          >
            Log your first screening
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-10">
        <div className="h-px flex-1 bg-white/5" />
        <h2 className="font-display text-lg text-white/40 uppercase tracking-widest italic font-bold">Screening History</h2>
        <div className="h-px flex-1 bg-white/5" />
      </div>

      <div className="space-y-4">
        {entries.map((entry, index) => (
          <motion.div
            key={entry.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <GlassPanel className="p-4 flex items-center gap-6 group hover:bg-white/5 transition-all">
              <div className="flex flex-col items-center justify-center min-w-[60px] text-center border-r border-white/5 pr-4">
                 <span className="font-metadata text-[10px] text-white/20 uppercase tracking-tighter mb-1">
                    {new Date(entry.watched_at).toLocaleDateString('en-US', { month: 'short' })}
                 </span>
                 <span className="font-display text-2xl font-bold text-white leading-none">
                    {new Date(entry.watched_at).getDate()}
                 </span>
              </div>

              <Link href={`/media/${entry.media_type}/${entry.media_id}`} className="relative w-12 h-18 aspect-2/3 rounded-md overflow-hidden shrink-0 border border-white/10">
                 {entry.poster_url && <Image src={entry.poster_url} alt={entry.title} fill className="object-cover" />}
              </Link>

              <div className="flex-1 min-w-0">
                 <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-heading text-lg text-white font-bold truncate group-hover:text-accent transition-colors">
                       {entry.title}
                    </h3>
                    {entry.is_rewatch && (
                       <div className="px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-[8px] font-bold text-amber-500 uppercase tracking-widest flex items-center gap-1">
                          <History size={8} />
                          Rewatch
                       </div>
                    )}
                 </div>
                 <div className="flex items-center gap-4">
                    {entry.rating && (
                       <div className="flex items-center gap-1">
                          {Array.from({ length: 5 }).map((_, i) => (
                             <Star 
                                key={i} 
                                size={10} 
                                className={cn(i < Math.floor(entry.rating! / 2) ? "text-accent fill-accent" : "text-white/10")} 
                             />
                          ))}
                       </div>
                    )}
                    <span className="font-mono text-[9px] text-white/20 uppercase">
                       Logged at {new Date(entry.watched_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                    </span>
                 </div>
              </div>
            </GlassPanel>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
