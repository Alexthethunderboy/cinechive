'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import GlassPanel from '@/components/ui/GlassPanel';
import { Layers, Plus, ExternalLink, Globe, Lock, MoreHorizontal, Film } from 'lucide-react';
import { cn, formatDate } from '@/lib/utils';
import Image from 'next/image';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

interface CineList {
  id: string;
  title: string;
  description: string | null;
  is_public: boolean;
  cover_url: string | null;
  created_at: string;
  items_count: number;
}

interface CineListsProps {
  userId: string;
  isOwnProfile?: boolean;
}

export default function CineLists({ userId, isOwnProfile }: CineListsProps) {
  const [lists, setLists] = useState<CineList[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchLists() {
      const supabase = createClient();
      const { data, error } = await (supabase.from('cine_lists') as any)
        .select(`
           *,
           cine_list_items(count)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (!error && data) {
         setLists(data.map((l: any) => ({
            ...l,
            items_count: l.cine_list_items[0]?.count || 0
         })));
      }
      setIsLoading(false);
    }
    fetchLists();
  }, [userId]);

  if (isLoading) {
    return (
      <div className="py-20 flex justify-center">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-12">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="font-display text-4xl font-bold text-white uppercase italic tracking-tighter">Curated <span className="text-accent underline decoration-white/10 underline-offset-8">Selections</span></h2>
          <p className="font-metadata text-[10px] text-white/20 uppercase tracking-[0.2em] italic">Thematic archives and shared recommendations</p>
        </div>
        {isOwnProfile && (
           <button className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-white text-black font-heading text-sm font-bold hover:bg-white/90 hover:scale-105 transition-all shadow-xl">
              <Plus size={18} />
              New List
           </button>
        )}
      </div>

      {lists.length === 0 ? (
        <div className="py-24 text-center space-y-6 border border-dashed border-white/5 rounded-3xl bg-white/2">
           <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto text-white/20 border border-white/5 shadow-inner">
              <Layers size={32} />
           </div>
           <div className="max-w-[200px] mx-auto">
              <p className="text-sm font-heading text-white font-bold mb-1">No collections found</p>
              <p className="text-[10px] font-metadata text-white/20 uppercase tracking-widest leading-relaxed">This cinephile hasn't curated any public lists yet</p>
           </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {lists.map((list, index) => (
            <motion.div
              key={list.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Link href={`/curations/${list.id}`}>
                 <div className="group relative aspect-video rounded-2xl overflow-hidden border border-white/5 bg-white/3 shadow-2xl hover:border-accent/40 transition-all duration-500">
                    {list.cover_url ? (
                       <Image src={list.cover_url} alt={list.title} fill className="object-cover group-hover:scale-110 transition-transform duration-700 opacity-60 group-hover:opacity-100" />
                    ) : (
                       <div className="w-full h-full bg-linear-to-tr from-white/5 via-transparent to-transparent flex items-center justify-center p-6 text-center">
                          <Film size={40} className="text-white/10 group-hover:text-accent/20 transition-colors" />
                       </div>
                    )}
                    
                    <div className="absolute inset-0 bg-linear-to-t from-black via-black/20 to-transparent" />
                    
                    <div className="absolute top-4 right-4 flex gap-2">
                       {list.is_public ? (
                          <div className="p-1 px-2 rounded-md bg-white/10 border border-white/10 backdrop-blur-md flex items-center gap-1.5 font-metadata text-[8px] text-white/60 uppercase tracking-widest">
                             <Globe size={10} />
                             Public
                          </div>
                       ) : (
                          <div className="p-1 px-2 rounded-md bg-rose-500/10 border border-rose-500/20 backdrop-blur-md flex items-center gap-1.5 font-metadata text-[8px] text-rose-500 uppercase tracking-widest">
                             <Lock size={10} />
                             Private
                          </div>
                       )}
                    </div>

                    <div className="absolute bottom-6 left-6 right-6">
                       <h3 className="font-heading text-2xl font-bold text-white mb-2 leading-none group-hover:text-accent transition-colors">
                          {list.title}
                       </h3>
                       <div className="flex items-center justify-between gap-4">
                          <p className="font-metadata text-[10px] text-white/40 uppercase tracking-widest leading-relaxed line-clamp-1 flex-1">
                             {list.description || "Experimental cinema collection"}
                          </p>
                          <span className="font-display text-sm text-accent lowercase">[{list.items_count} titles]</span>
                       </div>
                    </div>
                 </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
