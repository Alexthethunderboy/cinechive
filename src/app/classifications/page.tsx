import { Suspense } from 'react';
import Link from 'next/link';
import { Search, Popcorn, Sparkles, AlertTriangle, Shield, HeartPulse, Ghost, Music, ArrowRight } from 'lucide-react';
import GlassPanel from '@/components/ui/GlassPanel';
import { cn } from '@/lib/utils';
import { ClassificationName, CLASSIFICATION_COLORS } from '@/lib/design-tokens';

interface Archetype {
  name: ClassificationName;
  description: string;
  encompasses: string[];
  icon: React.ElementType;
}

const ARCHETYPES: Archetype[] = [
  {
    name: 'Essential',
    description: 'The indisputable classics and monumental achievements in filmmaking.',
    encompasses: ['Animation', 'Documentary'],
    icon: Sparkles,
  },
  {
    name: 'Avant-Garde',
    description: 'Pushing boundaries, defying conventions, and bending reality.',
    encompasses: ['Adventure', 'Fantasy', 'Mystery', 'Sci-Fi'],
    icon: Popcorn,
  },
  {
    name: 'Melancholic',
    description: 'Evocative stories exploring the depths of the human condition and love.',
    encompasses: ['Drama', 'Romance'],
    icon: HeartPulse,
  },
  {
    name: 'Atmospheric',
    description: 'Immersive worlds where the setting is a character itself.',
    encompasses: ['Comedy', 'Music'],
    icon: Search,
  },
  {
    name: 'Legacy',
    description: 'Timeless tales of history, family, and the wild frontier.',
    encompasses: ['Family', 'History', 'TV Movie', 'Western'],
    icon: Shield,
  },
  {
    name: 'Provocative',
    description: 'Tense, gripping, and challenging narratives that keep you on edge.',
    encompasses: ['Thriller'],
    icon: AlertTriangle,
  },
  {
    name: 'Visceral',
    description: 'High-octane, action-packed cinema that demands to be felt.',
    encompasses: ['Action'],
    icon: Sparkles, // Or another suitable icon
  },
  {
    name: 'Noir',
    description: 'Gritty, shadowy tales of crime, horror, and moral ambiguity.',
    encompasses: ['Crime', 'Horror', 'War'],
    icon: Ghost,
  },
];

export const metadata = {
  title: 'Classifications | CineChive',
  description: 'Explore the CineChive taxonomy of cinema.',
};

export default function ClassificationsPage() {
  return (
    <div className="min-h-screen bg-black text-white pb-32">
      {/* Cinematic Header */}
      <header className="px-6 md:px-10 pt-16 md:pt-24 mb-16 flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-white/5 pb-12">
        <div className="max-w-4xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 text-white/40 font-metadata mb-6">
            Classification Taxonomy
          </div>
          <h1 className="font-heading text-5xl md:text-7xl leading-tight tracking-tighter text-white italic">
            CINEMATIC <br />
            <span className="text-white/40 not-italic">CLASSIFICATIONS</span>
          </h1>
          <p className="mt-6 text-white/60 text-base md:text-lg font-metadata max-w-2xl leading-relaxed">
            A curated taxonomy for the dedicated cinephile. We organize films not just by genre, but by their fundamental atmospheric and emotional resonance.
          </p>
        </div>
      </header>

      <main className="px-6 md:px-10 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {ARCHETYPES.map((archetype) => {
            const Icon = archetype.icon;
            const color = CLASSIFICATION_COLORS[archetype.name];

            return (
              <Link key={archetype.name} href={`/search?mood=${encodeURIComponent(archetype.name)}`}>
                <div className="h-full flex flex-col p-6 group rounded-2xl bg-white/5 border border-white/5 hover:border-white/20 transition-all duration-500 relative overflow-hidden cursor-pointer">
                  {/* Subtle Background Glow */}
                  <div 
                    className="absolute -top-24 -right-24 w-48 h-48 rounded-full blur-[80px] opacity-0 group-hover:opacity-10 transition-opacity duration-700 pointer-events-none"
                    style={{ backgroundColor: color }}
                  />

                  <div className="flex items-start justify-between mb-8 z-10">
                    <div 
                      className="p-3 rounded-xl bg-white/5 border border-white/5"
                      style={{ color: color }}
                    >
                      <Icon size={24} />
                    </div>
                    <ArrowRight size={20} className="text-white/20 group-hover:text-white/80 transition-colors transform group-hover:translate-x-1" />
                  </div>

                  <div className="flex-1 z-10">
                    <h2 className="font-heading text-2xl tracking-tight mb-3 text-white">
                      {archetype.name}
                    </h2>
                    <p className="text-white/50 text-sm leading-relaxed mb-6 font-metadata">
                      {archetype.description}
                    </p>
                  </div>

                  <div className="mt-auto pt-6 border-t border-white/5 z-10">
                    <p className="font-metadata text-[10px] text-white/20 mb-3">Encompasses Genres</p>
                    <div className="flex flex-wrap gap-2">
                      {archetype.encompasses.map((genre) => (
                        <span 
                          key={genre}
                          className="px-2.5 py-1 rounded-md bg-white/5 border border-white/5 text-[11px] text-white/40 font-metadata"
                        >
                          {genre}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </main>
    </div>
  );
}
