import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { getArchetypePageAction } from '@/lib/actions';
import { MediaFetcher } from '@/lib/api/MediaFetcher';
import { ArchetypeFeed } from '@/components/cinema/ArchetypeFeed';
import { CLASSIFICATION_COLORS } from '@/lib/design-tokens';
import type { ClassificationName } from '@/lib/design-tokens';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const archetype = MediaFetcher.ARCHETYPE_MAP[slug];
  if (!archetype) return { title: 'Not Found' };
  return {
    title: `${archetype.label} — Discover`,
    description: archetype.description,
  };
}

export default async function ArchetypePage({ params }: Props) {
  const { slug } = await params;
  const archetype = MediaFetcher.ARCHETYPE_MAP[slug];
  if (!archetype) notFound();

  const { movies, tv } = await getArchetypePageAction(slug);

  const accentColor = CLASSIFICATION_COLORS[archetype.label as ClassificationName] || '#ffffff';

  return (
    <div className="min-h-screen pb-32">
      {/* Header */}
      <header className="px-6 md:px-10 pt-12 mb-16">
        <Link
          href="/discover"
          className="inline-flex items-center gap-2 text-white/30 hover:text-white font-metadata text-xs uppercase tracking-widest transition-colors mb-10 group"
        >
          <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
          Discover
        </Link>

        <div className="flex items-end justify-between">
          <div>
            <p className="font-metadata text-xs uppercase tracking-[0.4em] text-white/30 mb-3">
              Archetype
            </p>
            <h1
              className="font-heading text-5xl md:text-9xl tracking-tighter italic uppercase leading-none"
              style={{ color: accentColor }}
            >
              {archetype.label}
            </h1>
            <p className="mt-4 text-white/50 font-metadata max-w-xl leading-relaxed text-sm">
              {archetype.description}
            </p>
          </div>
        </div>
      </header>

      <ArchetypeFeed 
        slug={slug} 
        initialMovies={movies} 
        initialTv={tv} 
      />
    </div>
  );
}

export async function generateStaticParams() {
  return Object.keys(MediaFetcher.ARCHETYPE_MAP).map((slug) => ({ slug }));
}
