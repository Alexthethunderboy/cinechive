'use client';

import { motion } from 'framer-motion';
import GlassPanel from '@/components/ui/GlassPanel';
import { Film, Play, Info, Sparkles, Quote } from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import Link from 'next/link';

interface ProfileSpotlightProps {
  media: {
    id: string;
    type: string;
    title: string;
    posterUrl: string | null;
    caption?: string | null;
  } | null;
}

export default function ProfileSpotlight({ media }: ProfileSpotlightProps) {
  if (!media) return null;

  return (
    <section className="mb-24 relative overflow-hidden rounded-3xl group">
      {/* Dynamic Background Backdrop */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-3xl" />
        {media.posterUrl && (
          <Image 
            src={media.posterUrl} 
            alt={media.title} 
            fill 
            className="object-cover opacity-20 scale-125 saturate-0 group-hover:scale-110 transition-transform duration-1000" 
          />
        )}
      </div>

      <GlassPanel className="p-0 border-white/5 bg-transparent overflow-hidden">
        <div className="flex flex-col md:flex-row min-h-[400px]">
          {/* Visual Side */}
          <div className="relative w-full md:w-1/3 aspect-2/3 md:aspect-auto overflow-hidden">
            {media.posterUrl ? (
              <Image src={media.posterUrl} alt={media.title} fill className="object-cover" />
            ) : (
              <div className="w-full h-full bg-surface-hover flex items-center justify-center">
                <Film size={48} className="text-white/10" />
              </div>
            )}
            <div className="absolute inset-0 bg-linear-to-r from-transparent via-transparent to-black/80 hidden md:block" />
            <div className="absolute inset-0 bg-linear-to-t from-black/80 via-transparent to-transparent md:hidden" />
          </div>

          {/* Text Side */}
          <div className="flex-1 p-8 md:p-16 flex flex-col justify-center relative">
            <div className="absolute top-8 right-8 flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/20">
               <Sparkles size={12} className="text-accent animate-pulse" />
               <span className="font-metadata text-[10px] text-accent uppercase tracking-widest font-bold">Featured Selection</span>
            </div>

            <div className="max-w-xl space-y-6">
              <div className="space-y-4">
                <h2 className="font-display text-5xl md:text-7xl font-bold text-white tracking-tighter leading-none italic uppercase">
                  {media.title}
                </h2>
                <div className="flex items-center gap-3 font-data text-[10px] text-white/40 uppercase tracking-widest">
                  <span className="px-2 py-0.5 rounded border border-white/10">{media.type}</span>
                  <span>•</span>
                  <span>Currently Spotlighting</span>
                </div>
              </div>

              {media.caption && (
                <div className="relative pl-8">
                  <Quote className="absolute top-0 left-0 text-accent/20 w-8 h-8 -z-10" />
                  <p className="font-sans text-lg text-white/80 leading-relaxed italic">
                    "{media.caption}"
                  </p>
                </div>
              )}

              <div className="flex flex-wrap gap-4 pt-4">
                <Link href={`/media/${media.type}/${media.id}`}>
                  <button className="flex items-center gap-2.5 px-8 py-3 rounded-full bg-white text-black font-heading text-sm font-bold hover:bg-white/90 hover:scale-105 transition-all shadow-2xl">
                    <Play size={18} fill="currentColor" />
                    Deep Dive
                  </button>
                </Link>
                <button className="p-3 rounded-full bg-white/10 border border-white/10 hover:bg-white/20 transition-all text-white backdrop-blur-md">
                   <Info size={20} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </GlassPanel>
    </section>
  );
}
