'use client';

import { motion } from 'framer-motion';
import { User, Settings, MapPin, Calendar, Layers, Activity, Sparkles, ExternalLink, LogOut } from 'lucide-react';
import GlassPanel from '@/components/ui/GlassPanel';
import { ClassificationName, CLASSIFICATION_COLORS,  } from '@/lib/design-tokens';
import { formatDate, formatUsername } from '@/lib/utils';
import Image from 'next/image';
import Link from 'next/link';
import { signOut } from '@/app/auth/actions';

interface ClientProfileProps {
  user: any;
  profile: any;
  stats: {
    entriesCount: number;
    topCinematographer?: string;
    topComposer?: string;
    mostLoggedSound?: string;
    formatPreference?: string;
    vibeDistribution?: Record<ClassificationName, number>;
  };
  recentEntries: any[];
  pinnedMedia?: any[];
}

export default function ClientProfile({ user, profile, stats, recentEntries, pinnedMedia = [] }: ClientProfileProps) {
  // Cinematic Aura logic: Determine dominant vibe for background
  const dominantVibe = useMemo(() => {
    if (stats.vibeDistribution) {
      return Object.entries(stats.vibeDistribution).sort((a,b) => b[1] - a[1])[0]?.[0] as ClassificationName;
    }
    return recentEntries[0]?.classification as ClassificationName || 'Chill';
  }, [stats.vibeDistribution, recentEntries]);

  const auraColor = CLASSIFICATION_COLORS[dominantVibe] || '#8B5CF6';

  return (
    <div className="relative min-h-screen overflow-hidden">
       {/* Cinematic Aura Background */}
       <motion.div 
         initial={{ opacity: 0 }}
         animate={{ 
           opacity: [0.1, 0.2, 0.1],
           scale: [1, 1.1, 1],
           backgroundColor: auraColor 
         }}
         transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
         className="absolute -top-1/4 -left-1/4 w-[150%] h-[150%] blur-[120px] rounded-full -z-10 pointer-events-none"
       />

       <div className="py-10 md:py-16 px-6 md:px-10 max-w-6xl mx-auto relative z-10">
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
                     {profile.display_name || formatUsername(profile.username).toUpperCase()}
                  </h1>
                  <span className="font-data text-xs text-muted uppercase tracking-[0.3em] font-bold mt-2 block">
                    Cinema Curator — @{formatUsername(profile.username)}
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
            <Layers className="text-white/60 mb-4" size={32} />
            <span className="font-display text-4xl mb-1">{stats.entriesCount}</span>
            <span className="font-data text-[10px] text-muted uppercase tracking-widest">Films Collected</span>
         </GlassPanel>

         <GlassPanel className="p-8 flex flex-col items-center justify-center text-center bg-white/10 border-white/10 border shadow-2xl">
            <Activity className="text-accent mb-4" size={32} />
            <span className="font-display text-xl mb-1 truncate w-full">{stats.topCinematographer || 'Roger Deakins'}</span>
            <span className="font-data text-[10px] text-muted uppercase tracking-widest">Top Cinematographer</span>
         </GlassPanel>

         <GlassPanel className="p-8 flex flex-col items-center justify-center text-center bg-white/5 border-white/5">
            <Sparkles className="text-vibe-cyan mb-4" size={32} />
            <span className="font-display text-xl mb-1">{stats.mostLoggedSound || 'Dolby Atmos'}</span>
            <span className="font-data text-[10px] text-muted uppercase tracking-widest">Most Logged Sound</span>
         </GlassPanel>

         <GlassPanel className="p-8 flex flex-col items-center justify-center text-center bg-white/5 border-white/5">
            <MapPin className="text-vibe-violet mb-4" size={32} />
            <span className="font-display text-xl mb-1">{stats.formatPreference || '70mm IMAX'}</span>
            <span className="font-data text-[10px] text-muted uppercase tracking-widest">Format Preference</span>
         </GlassPanel>
      </section>

      {/* 35mm Vault: Pinned Media */}
      <section className="mb-20">
         <div className="flex items-center justify-between mb-8">
            <h2 className="font-display text-3xl italic tracking-tighter uppercase">The 35mm Vault</h2>
            <div className="h-px flex-1 bg-white/5 ml-6" />
         </div>

         <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {(pinnedMedia.length > 0 ? pinnedMedia : recentEntries.slice(0, 4)).map((media, i) => (
              <motion.div
                key={media.id}
                whileHover={{ scale: 1.05, y: -10 }}
                className="relative group"
              >
                <Link href={`/media/${media.media_type}/${media.media_id}`}>
                  <div className="relative aspect-2/3 rounded-card overflow-hidden border border-white/20 shadow-2xl glass-card">
                    {media.poster_url && (
                      <Image 
                        src={media.poster_url} 
                        alt={media.title} 
                        fill 
                        className="object-cover transition-transform duration-700 group-hover:scale-110" 
                      />
                    )}
                    <div className="absolute inset-0 bg-linear-to-t from-black via-black/20 to-transparent" />
                    
                    {/* Technical Format Tag */}
                    <div className="absolute top-3 right-3 px-2 py-1 rounded-inner bg-black/60 border border-white/10 backdrop-blur-md">
                       <span className="font-data text-[8px] font-bold text-white uppercase tracking-widest">
                          {i % 2 === 0 ? '70MM' : 'IMAX'}
                       </span>
                    </div>

                    <div className="absolute bottom-4 left-4 right-4">
                       <h3 className="font-display text-xl italic text-white line-clamp-2 leading-tight">{media.title}</h3>
                    </div>
                  </div>
                </Link>
                
                {/* Custom Glassmorphism Border */}
                <div className="absolute -inset-px rounded-[21px] bg-linear-to-br from-white/30 to-transparent -z-10 group-hover:from-white/60 transition-all" />
              </motion.div>
            ))}
         </div>
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
    </div>
  );
}

import { cn } from '@/lib/utils';
import { useMemo } from 'react';
