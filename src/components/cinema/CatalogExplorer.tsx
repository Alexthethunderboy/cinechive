'use client';

import { motion } from 'framer-motion';
import { BentoGrid, BentoItem } from '@/components/ui/BentoGrid';
import MediaCard from '@/components/ui/MediaCard';
import { UnifiedMedia } from '@/lib/api/mapping';
import GlassPanel from '@/components/ui/GlassPanel';
import { Film, User, Award, BookOpen } from 'lucide-react';

interface CatalogExplorerProps {
  person: {
    name: string;
    biography: string;
    profilePath: string | null;
    knownFor: string;
    birthday?: string;
    placeOfBirth?: string;
  };
  works: UnifiedMedia[];
}

export default function CatalogExplorer({ person, works }: CatalogExplorerProps) {
  return (
    <div className="space-y-16">
      {/* Bio Section */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        <div className="lg:col-span-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative aspect-3/4 rounded-card overflow-hidden border-2 border-white/5 shadow-2x-vibe-violet"
          >
            {person.profilePath ? (
              <img 
                src={`https://image.tmdb.org/t/p/w780${person.profilePath}`} 
                alt={person.name} 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-white/5 flex items-center justify-center">
                <User size={80} className="text-muted/20" />
              </div>
            )}
            <div className="absolute inset-0 bg-linear-to-t from-black via-transparent to-transparent" />
            <div className="absolute bottom-6 left-6">
              <h1 className="font-display text-4xl md:text-5xl tracking-tighter text-white">{person.name.toUpperCase()}</h1>
              <p className="font-data text-xs text-white/60 uppercase tracking-widest mt-2">{person.knownFor}</p>
            </div>
          </motion.div>
          
          <div className="mt-8 space-y-4">
            {person.birthday && (
              <div className="flex justify-between border-b border-white/5 pb-2">
                <span className="font-data text-[10px] text-muted uppercase">Born</span>
                <span className="font-heading text-sm">{person.birthday}</span>
              </div>
            )}
            {person.placeOfBirth && (
              <div className="flex justify-between border-b border-white/5 pb-2">
                <span className="font-data text-[10px] text-muted uppercase">Location</span>
                <span className="font-heading text-sm text-right max-w-[200px]">{person.placeOfBirth}</span>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-8 space-y-8">
           <div className="space-y-4">
              <h2 className="font-heading text-2xl tracking-tight flex items-center gap-3">
                <BookOpen size={20} className="text-vibe-cyan" />
                Dossier
              </h2>
              <p className="text-lg text-muted leading-relaxed font-heading opacity-90">
                {person.biography || "Cinema records for this individual are currently being curated. Biography data pending."}
              </p>
           </div>

           <div className="grid grid-cols-3 gap-4">
              <Stat value={works.length} label="Works" />
              <Stat value="Top 1%" label="Curatory Stature" />
              <Stat value={<Award size={20} />} label="Distinction" />
           </div>
        </div>
      </section>

      {/* Bento Catalog */}
      <section>
        <div className="flex items-center gap-3 mb-10">
          <Film size={24} className="text-white/60" />
          <h2 className="font-heading text-3xl tracking-tight">The {person.name.split(' ')[0]} Catalog</h2>
        </div>

        <BentoGrid>
          {works.map((work, idx) => {
            const span = idx % 5 === 0 ? 'feature' : idx % 5 === 1 ? 'tall' : 'medium';
            return (
              <BentoItem key={work.id} span={span}>
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.05 }}
                  className="w-full h-full"
                >
                  <MediaCard {...work} />
                </motion.div>
              </BentoItem>
            );
          })}
        </BentoGrid>
      </section>
    </div>
  );
}

function Stat({ value, label }: { value: any, label: string }) {
  return (
    <GlassPanel className="p-6 border-white/5 bg-white/5 flex flex-col items-center justify-center text-center">
       <span className="font-display text-3xl mb-1">{value}</span>
       <span className="font-data text-[10px] uppercase text-muted tracking-widest">{label}</span>
    </GlassPanel>
  );
}
