'use client';

import { motion } from 'framer-motion';
import GlassPanel from '@/components/ui/GlassPanel';
import { Music, Play, ExternalLink, Sparkles, Disc } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MusicSectionProps {
  soundtrack?: {
    title: string;
    artist: string;
    scene?: string;
    spotifyUrl?: string;
  }[];
  composers?: {
    id: string;
    name: string;
    profilePath: string | null;
  }[];
}

export default function MusicSection({ soundtrack, composers }: MusicSectionProps) {
  return (
    <div className="space-y-12">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-3xl tracking-tighter uppercase italic text-white flex items-center gap-3">
          <Music className="text-accent" />
          Sonic Signature
        </h2>
      </div>

      {/* Composers */}
      {composers && composers.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {composers.map((composer, i) => (
            <motion.div
              key={composer.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <GlassPanel className="p-4 flex items-center gap-4 bg-white/5 border-white/10">
                <div className="relative w-16 h-16 rounded-inner overflow-hidden border border-white/5">
                  {composer.profilePath ? (
                    <img
                      src={composer.profilePath}
                      alt={composer.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-accent/20 flex items-center justify-center text-accent">
                      <Disc size={24} />
                    </div>
                  )}
                </div>
                <div>
                  <h4 className="font-heading text-lg text-white leading-tight">{composer.name}</h4>
                  <p className="font-data text-[10px] text-muted uppercase tracking-widest">Original Score</p>
                </div>
              </GlassPanel>
            </motion.div>
          ))}
        </div>
      )}

      {/* Soundtrack / Scenes */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-6">
          <Sparkles size={16} className="text-accent" />
          <h3 className="font-heading text-xl text-white/80">Scene Sync & Soundtrack</h3>
        </div>

        {soundtrack && soundtrack.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            {soundtrack.map((track, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <GlassPanel className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white/5 border-white/5 hover:bg-white/10 transition-all group">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3">
                      <span className="font-display text-xl text-white group-hover:text-accent transition-colors">{track.title}</span>
                      <span className="text-muted opacity-40">—</span>
                      <span className="font-heading text-muted">{track.artist}</span>
                    </div>
                    {track.scene && (
                      <p className="font-sans text-sm text-white/40 italic leading-relaxed">
                        &quot;{track.scene}&quot;
                      </p>
                    )}
                  </div>
                  
                  {track.spotifyUrl && (
                    <a 
                      href={track.spotifyUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#1DB954]/10 text-[#1DB954] border border-[#1DB954]/20 hover:bg-[#1DB954] hover:text-black transition-all font-data text-[10px] uppercase tracking-widest"
                    >
                      <Play size={12} fill="currentColor" />
                      Spotify
                    </a>
                  )}
                </GlassPanel>
              </motion.div>
            ))}
          </div>
        ) : (
          <GlassPanel className="p-12 text-center border-dashed border-white/10 bg-white/5">
            <p className="font-heading text-white/20 italic mb-4">
              Detailed scene-by-scene tracking is being analyzed.
            </p>
            <button className="px-6 py-2 rounded-full border border-accent/20 text-accent font-data text-[10px] uppercase tracking-widest hover:bg-accent hover:text-black transition-all">
              Contribute Track Findings
            </button>
          </GlassPanel>
        )}
      </div>
    </div>
  );
}
