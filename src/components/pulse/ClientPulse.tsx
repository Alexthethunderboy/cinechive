'use client';

import { motion } from 'framer-motion';
import { Activity, MessageSquare, Repeat2, Heart, ExternalLink } from 'lucide-react';
import GlassPanel from '@/components/ui/GlassPanel';
import { ClassificationName, CLASSIFICATION_COLORS, MEDIA_TYPE_LABELS } from '@/lib/design-tokens';
import { cn, formatDate, formatUsername } from '@/lib/utils';
import Image from 'next/image';
import Link from 'next/link';
import { reArchiveMediaAction } from '@/lib/actions';
import { toast } from 'sonner';

interface ClientPulseProps {
  initialFeed: any[];
}

export default function ClientPulse({ initialFeed }: ClientPulseProps) {
  async function handleReArchive(originalId: string, classification: ClassificationName) {
    try {
      const result = await reArchiveMediaAction({
        originalEntryId: originalId,
        classification: classification
      });
      // The action throws an error right now, but we can catch it or if it returns an object we handle it
      toast.success("Added to library");
    } catch (error) {
      console.error("Collection failed:", error);
      toast.error("Authentication required");
    }
  }

  return (
    <div className="py-10 md:py-16 max-w-3xl mx-auto px-4 md:px-10">
      <header className="mb-12 flex items-center justify-between">
        <div>
          <h1 className="font-heading text-4xl md:text-7xl tracking-tighter mb-2 italic uppercase">COLLECTIVE <span className="text-white/40">PULSE</span></h1>
          <p className="text-white/60 font-metadata text-xs flex items-center gap-2 uppercase tracking-widest">
             <span className="w-2 h-2 rounded-full bg-accent opacity-50" />
             Real-time cinematic activity from your network
          </p>
        </div>
        
        <GlassPanel className="p-3 bg-accent/5 border-white/5 flex gap-1">
           <div className="w-8 h-8 rounded-full bg-accent/5 flex items-center justify-center text-white">
              <Activity size={16} />
           </div>
        </GlassPanel>
      </header>

      <div className="space-y-8">
        {initialFeed.length > 0 ? initialFeed.map((post, index) => (
          <motion.div
            key={post.id}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.6 }}
          >
            <GlassPanel className="p-4 md:p-6 border-white/10 hover:border-white/20 transition-all bg-accent/5 relative group overflow-visible">
               {post.activity_type === 're_archive' && (
                 <div className="absolute -top-3 left-6 px-3 py-1 rounded-full bg-accent text-black font-metadata text-[8px] uppercase font-bold tracking-[0.2em] flex items-center gap-2 shadow-xl border border-accent/20">
                    <Repeat2 size={10} />
                    Collected
                 </div>
               )}

               {post.activity_type === 'echo' && (
                 <div className="absolute -top-3 left-6 px-3 py-1 rounded-full bg-vibe-cyan text-black font-metadata text-[8px] uppercase font-bold tracking-[0.2em] flex items-center gap-2 shadow-xl border border-vibe-cyan/20">
                    <MessageSquare size={10} />
                    Echoed from Deep Dive
                 </div>
               )}

               <div className="flex gap-4 md:gap-6">
                  {/* User Avatar */}
                  <div className="shrink-0">
                     <div className="relative w-12 h-12">
                        {post.avatar_url ? (
                          <Image 
                            src={post.avatar_url} 
                            alt={post.username} 
                            fill 
                            className="rounded-full object-cover border-2 border-white/10"
                          />
                        ) : (
                          <div className="w-full h-full rounded-full bg-surface-hover border-2 border-white/10 flex items-center justify-center font-bold text-muted">
                            {formatUsername(post.username)?.[0]?.toUpperCase() || '?'}
                          </div>
                        )}
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-background border border-white/10 flex items-center justify-center text-[10px]">
                           {[post.classification as ClassificationName]}
                        </div>
                     </div>
                  </div>

                  <div className="flex-1 space-y-4">
                     {/* Post Header */}
                     <div className="flex items-center justify-between">
                        <div>
                           <span className="font-heading text-white text-sm md:text-base block leading-none">{post.username || 'Cinephile'}</span>
                           <span className="font-data text-[10px] text-muted">{formatDate(post.created_at)}</span>
                        </div>
                        <div 
                          className="px-3 py-1 rounded-inner font-data text-[9px] font-bold uppercase tracking-wider"
                          style={{ 
                            backgroundColor: `${CLASSIFICATION_COLORS[post.classification as ClassificationName]}15`, 
                            color: CLASSIFICATION_COLORS[post.classification as ClassificationName], 
                            border: `1px solid ${CLASSIFICATION_COLORS[post.classification as ClassificationName]}30` 
                          }}
                        >
                          {post.classification}
                        </div>
                     </div>

                     {/* Content */}
                     {post.activity_type === 'echo' ? (
                       <div className="relative p-4 rounded-inner bg-accent/5 border border-accent/20 italic text-white/90 font-heading leading-relaxed">
                          <span className="absolute -top-3 -left-2 text-4xl text-accent/20">"</span>
                          {post.content}
                          <span className="absolute -bottom-6 -right-2 text-4xl text-accent/20 rotate-180">"</span>
                       </div>
                     ) : post.comment && (
                       <p className="text-white/80 font-heading leading-relaxed">
                          {post.comment}
                       </p>
                     )}

                     {/* Media Preview */}
                     <Link href={`/media/${post.media_type}/${post.media_id}`}>
                      <div className="flex gap-4 p-3 rounded-inner bg-accent/5 border border-white/5 hover:border-white/20 transition-all cursor-pointer group/media">
                          <motion.div 
                            layoutId={`poster-${post.id}-${post.media_id}`}
                            className="relative w-16 aspect-2/3 shrink-0 rounded-sm overflow-hidden bg-surface"
                          >
                            {post.poster_url && (
                              <Image src={post.poster_url} alt={post.title} fill className="object-cover group-hover/media:scale-110 transition-transform duration-500" />
                            )}
                          </motion.div>
                          <div className="flex flex-col justify-center">
                            <span className="font-data text-[8px] text-accent uppercase tracking-widest mb-1">
                              {MEDIA_TYPE_LABELS[post.media_type as keyof typeof MEDIA_TYPE_LABELS] || post.media_type}
                            </span>
                            <span className="font-display text-base text-white italic">{post.title}</span>
                            <span className="font-data text-[10px] text-muted flex items-center gap-1 mt-1">
                                View Details <ExternalLink size={10} />
                            </span>
                          </div>
                      </div>
                     </Link>

                     <div className="flex items-center gap-6 pt-2">
                        <button className="flex items-center gap-2 text-muted transition-colors text-xs font-data group/btn hover:text-white">
                           <MessageSquare size={16} className="group-hover/btn:scale-125 transition-transform" />
                           <span>0</span>
                        </button>
                        
                        <button 
                          onClick={() => handleReArchive(post.original_entry_id || post.id, post.classification as ClassificationName)}
                          className="flex items-center gap-2 text-muted transition-colors text-xs font-data group/btn hover:text-white"
                        >
                           <Repeat2 size={16} className="group-hover/btn:scale-125 transition-transform" />
                           <span>0</span>
                        </button>
 
                        <button className="flex items-center gap-2 text-muted transition-colors text-xs font-data group/btn hover:text-white">
                           <Heart size={16} className="group-hover/btn:scale-125 transition-transform" />
                           <span>0</span>
                        </button>
                     </div>
                  </div>
               </div>

               {/* Classification Background Accent */}
               <div 
                 className="absolute top-0 right-0 w-32 h-32 blur-[80px] -z-10 opacity-10 pointer-events-none transition-opacity group-hover:opacity-20"
                 style={{ backgroundColor: CLASSIFICATION_COLORS[post.classification as ClassificationName] }}
               />
            </GlassPanel>
          </motion.div>
        )) : (
          <div className="py-20 text-center flex flex-col items-center">
             <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-6">
                <Activity className="text-white/20" size={32} />
             </div>
             <p className="font-heading text-2xl tracking-tighter italic uppercase text-white/50 mb-2">The pulse is silent</p>
             <p className="font-metadata text-xs text-white/30 uppercase tracking-widest">Start collecting to project your frequency.</p>
          </div>
        )}
      </div>
    </div>
  );
}
