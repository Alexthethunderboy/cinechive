'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Users } from 'lucide-react';

interface PersonResultCardProps {
  person: {
    id: string | number;
    name: string;
    profileUrl?: string | null;
    knownFor?: string | null;
  };
  variant?: 'compact' | 'full';
}

export default function PersonResultCard({ person, variant = 'full' }: PersonResultCardProps) {
  if (variant === 'compact') {
    return (
      <Link href={`/media/person/${person.id}`} className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition-colors">
        <div className="relative w-10 h-10 rounded-full overflow-hidden border border-white/10 bg-white/5 shrink-0">
          {person.profileUrl ? (
            <Image src={person.profileUrl} alt={person.name} fill className="object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white/30">
              <Users size={14} />
            </div>
          )}
        </div>
        <div className="min-w-0">
          <p className="font-heading text-sm truncate">{person.name}</p>
          <p className="text-[10px] text-white/40 uppercase tracking-widest truncate">{person.knownFor || 'Cast & crew'}</p>
        </div>
      </Link>
    );
  }

  return (
    <Link href={`/media/person/${person.id}`} className="group block">
      <div className="aspect-3/4 rounded-card overflow-hidden relative border border-white/10 group-hover:border-accent/40 transition-all bg-white/5">
        {person.profileUrl ? (
          <Image
            src={person.profileUrl}
            alt={person.name}
            fill
            className="object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white/5">
            <Users size={32} />
          </div>
        )}
        <div className="absolute inset-0 bg-linear-to-t from-black/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="absolute bottom-4 left-4 right-4 translate-y-2 group-hover:translate-y-0 transition-transform">
          <p className="font-heading text-sm text-white truncate">{person.name}</p>
          <p className="font-metadata text-[10px] text-white/40 uppercase truncate">{person.knownFor}</p>
        </div>
      </div>
    </Link>
  );
}
