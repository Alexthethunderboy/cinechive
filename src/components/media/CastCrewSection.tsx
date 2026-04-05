'use client';

import { motion } from 'framer-motion';
import { Users, Plus } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { DetailedMedia } from '@/lib/api/mapping';
import { SearchService } from '@/lib/services/SearchService';

interface CastCrewSectionProps {
  media: DetailedMedia;
}

export default function CastCrewSection({ media }: CastCrewSectionProps) {
  const router = useRouter();

  return (
    <>
      {/* Cast Section */}
      {media.cast && media.cast.length > 0 && (
        <div className="space-y-8">
          <h2 className="font-display text-3xl tracking-tighter flex items-center gap-3 uppercase italic text-white">
            <Users className="text-accent" />
            Leading Cast
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
            {media.cast.map((person, i) => (
              <motion.div
                key={i}
                whileHover={{ y: -8 }}
                onMouseEnter={() => SearchService.prefetchCinemaGraph(person.id, 'person')}
                onClick={() => router.push(`/media/person/${person.id}`)}
                className="group cursor-pointer space-y-3"
              >
                <div className="aspect-3/4 rounded-card overflow-hidden relative border border-white/10 group-hover:border-accent/40 transition-all shadow-xl bg-white/5">
                  {person.profileUrl ? (
                    <Image
                      src={person.profileUrl}
                      alt={person.name}
                      fill
                      className="object-cover group-hover:scale-110 transition-all duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white/10 bg-white/5">
                      <div className="flex flex-col items-center gap-2 opacity-20">
                        <Users size={32} />
                        <span className="font-data text-[8px] uppercase tracking-widest">Still Image</span>
                      </div>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-linear-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="px-1">
                  <span className="font-heading text-sm block text-white group-hover:text-accent transition-colors truncate">
                    {person.name}
                  </span>
                  <span className="font-data text-[10px] text-muted uppercase tracking-widest line-clamp-1">
                    {person.role}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Crew Section */}
      {media.crew && media.crew.length > 0 && (
        <div className="space-y-8 pt-8 border-t border-white/5">
          <h2 className="font-display text-3xl tracking-tighter flex items-center gap-3 uppercase italic text-white/60">
            <Plus className="text-accent/40" />
            Key Production
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
            {media.crew.map((person, i) => (
              <motion.div
                key={i}
                whileHover={{ y: -5 }}
                onMouseEnter={() => SearchService.prefetchCinemaGraph(person.id, 'person')}
                onClick={() => router.push(`/media/person/${person.id}`)}
                className="group cursor-pointer space-y-3"
              >
                <div className="aspect-3/4 rounded-card overflow-hidden relative border border-white/5 group-hover:border-accent/20 transition-all bg-white/5 scale-95 opacity-60 group-hover:opacity-100 group-hover:scale-100">
                  {person.profileUrl ? (
                    <Image
                      src={person.profileUrl}
                      alt={person.name}
                      fill
                      className="object-cover transition-all duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white/5 bg-white/5">
                      <span className="font-data text-[10px] uppercase opacity-10">404</span>
                    </div>
                  )}
                </div>
                <div className="px-1">
                  <span className="font-heading text-xs block text-white/50 group-hover:text-white transition-colors truncate">
                    {person.name}
                  </span>
                  <span className="font-data text-[9px] text-muted/40 uppercase tracking-widest line-clamp-1">
                    {person.role}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
