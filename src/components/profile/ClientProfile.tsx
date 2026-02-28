'use client';

import { motion } from 'framer-motion';
import { User, Settings, MapPin, Calendar, Archive, Activity, Sparkles, ExternalLink, LogOut } from 'lucide-react';
import GlassPanel from '@/components/ui/GlassPanel';
import { ClassificationName, CLASSIFICATION_COLORS,  } from '@/lib/design-tokens';
import { formatDate } from '@/lib/utils';
import Image from 'next/image';
import Link from 'next/link';
import { signOut } from '@/app/auth/actions';

interface ClientProfileProps {
  user: any;
  profile: any;
  stats: {
    entriesCount: number;
    vibeDistribution?: Record<ClassificationName, number>;
  };
  recentEntries: any[];
}

export default function ClientProfile({ user, profile, stats, recentEntries }: ClientProfileProps) {
  return (
    <div className="py-10 md:py-16 px-6 md:px-10 max-w-6xl mx-auto">
      {/* Profile Header */}
      <header className="mb-16">
        <div className="flex flex-col md:flex-row gap-10 items-start md:items-end">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative"
          >
            <div className="w-32 h-32 md:w-48 md:h-48 rounded-full overflow-hidden border-4 border-white/5 relative bg-surface-hover">
               {profile.avatar_url ? (
                 <Image src={profile.avatar_url} alt={profile.username} fill className="object-cover" />
               ) : (
                 <div className="w-full h-full flex items-center justify-center text-4xl font-display text-muted">
                    {profile.username[0].toUpperCase()}
                 </div>
               )}
            </div>
            <motion.div 
              whileHover={{ rotate: 15 }}
              className="absolute -bottom-2 -right-2 w-12 h-12 bg-vibe-violet rounded-full border-4 border-background flex items-center justify-center shadow-xl"
            >
               <Sparkles size={20} className="text-white" />
            </motion.div>
          </motion.div>

          <div className="flex-1 space-y-4">
             <div className="flex items-center justify-between">
                <div>
                  <h1 className="font-display text-4xl md:text-6xl tracking-tighter leading-none italic">
                     {profile.display_name || profile.username.toUpperCase()}
                  </h1>
                  <span className="font-data text-xs text-muted uppercase tracking-[0.3em] font-bold mt-2 block">
                    Cinema Curator — @{profile.username}
                  </span>
                </div>
                
                <div className="flex gap-3">
                   <button className="p-3 rounded-inner bg-white/5 border border-white/5 hover:bg-white/10 transition-all text-muted hover:text-white">
                      <Settings size={20} />
                   </button>
                   <button 
                    onClick={() => signOut()}
                    className="p-3 rounded-inner bg-white/5 border border-white/5 hover:bg-white/10 transition-all text-muted hover:text-rose-400"
                   >
                      <LogOut size={20} />
                   </button>
                </div>
             </div>

             <div className="flex flex-wrap gap-6 pt-4">
                <div className="flex items-center gap-2 text-muted font-heading text-sm">
                   <MapPin size={16} className="text-vibe-cyan" />
                   <span>Neural Network</span>
                </div>
                <div className="flex items-center gap-2 text-muted font-heading text-sm">
                   <Calendar size={16} className="text-white/60" />
                   <span>Joined {formatDate(profile.created_at)}</span>
                </div>
             </div>

             {profile.bio && (
               <p className="font-heading text-lg text-white/70 max-w-2xl leading-relaxed">
                  {profile.bio}
               </p>
             )}
          </div>
        </div>
      </header>

      {/* Stats Grid */}
      <section className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-16">
         <GlassPanel className="p-8 flex flex-col items-center justify-center text-center bg-white/5 border-white/5">
            <Archive className="text-white/60 mb-4" size={32} />
            <span className="font-display text-4xl mb-1">{stats.entriesCount}</span>
            <span className="font-data text-[10px] text-muted uppercase tracking-widest">Films Collected</span>
         </GlassPanel>

         <GlassPanel className="p-8 col-span-1 md:col-span-3 bg-white/5 border-white/5 relative overflow-hidden group">
            <div className="relative z-10 flex flex-col h-full">
               <div className="flex items-center gap-3 mb-6">
                  <Activity className="text-vibe-cyan" size={20} />
                  <span className="font-data text-[10px] text-muted uppercase tracking-widest">Cinematic Mood Distribution</span>
               </div>
               
               <div className="flex-1 flex items-end gap-2 h-20">
                  {/* Mock bar chart for vibes - could be tied to real data if calculated */}
                  {['Mind-Expanding', 'Hype', 'Melancholic', 'Chill', 'Nostalgic', 'Chaotic', 'Euphoric', 'Dark'].map((vibe, i) => (
                    <div key={vibe} className="flex-1 flex flex-col items-center gap-2 group/bar">
                       <motion.div 
                        initial={{ height: 0 }}
                        animate={{ height: `${20 + Math.random() * 60}%` }}
                        className="w-full rounded-t-sm transition-all group-hover/bar:brightness-125"
                        style={{ backgroundColor: CLASSIFICATION_COLORS[vibe as ClassificationName] }}
                       />
                       <span className="text-lg opacity-40 group-hover/bar:opacity-100 transition-opacity">{[vibe as ClassificationName]}</span>
                    </div>
                  ))}
               </div>
            </div>
            
            {/* Background Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-linear-to-r from-vibe-violet/5 to-vibe-cyan/5 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
         </GlassPanel>
      </section>

      {/* Content Tabs */}
      <section>
         <div className="flex items-center gap-8 border-b border-white/5 mb-10 overflow-x-auto pb-4 scrollbar-hide">
            {['RECENT ENTRIES', 'FILM LIBRARY', 'CINEMA PULSE'].map((tab, i) => (
              <button key={tab} className={cn(
                "font-data text-[10px] uppercase font-bold tracking-[0.2em] whitespace-nowrap transition-all relative pb-2",
                i === 0 ? "text-white" : "text-muted hover:text-white"
              )}>
                 {tab}
                 {i === 0 && (
                   <motion.div layoutId="profile-tab" className="absolute bottom-0 left-0 right-0 h-[2px] bg-vibe-violet" />
                 )}
              </button>
            ))}
         </div>

         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recentEntries.length > 0 ? recentEntries.slice(0, 6).map((entry, index) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Link href={`/media/${entry.media_type}/${entry.media_id}`}>
                  <GlassPanel className="p-4 bg-white/5 border-white/5 hover:border-white/10 transition-all group h-full flex flex-col">
                    <div className="relative aspect-video rounded-inner overflow-hidden mb-4 bg-surface-hover">
                       {entry.poster_url && (
                         <Image src={entry.poster_url} alt={entry.title} fill className="object-cover group-hover:scale-110 transition-transform duration-700" />
                       )}
                       <div className="absolute inset-0 bg-linear-to-t from-black/80 via-transparent to-transparent" />
                       <div className="absolute bottom-3 left-3 flex items-center gap-2">
                          <span className="text-xl">{[entry.classification as ClassificationName]}</span>
                          <span className="font-data text-[8px] uppercase font-bold tracking-widest text-white shadow-sm">
                            {entry.classification}
                          </span>
                       </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-heading text-lg group-hover:text-white/60 transition-colors line-clamp-1">{entry.title}</h3>
                      <p className="font-data text-[10px] text-muted uppercase mt-1">Logged {formatDate(entry.created_at)}</p>
                    </div>
                  </GlassPanel>
                </Link>
              </motion.div>
            )) : (
              <div className="col-span-full py-20 text-center opacity-30 border-2 border-dashed border-white/5 rounded-card">
                 <p className="font-heading text-xl italic text-muted">No cinema entries yet.</p>
              </div>
            )}
         </div>
      </section>
    </div>
  );
}

import { cn } from '@/lib/utils';
