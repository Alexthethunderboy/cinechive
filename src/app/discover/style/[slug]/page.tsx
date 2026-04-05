import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { getStylePageAction } from '@/lib/actions';
import { MediaFetcher } from '@/lib/api/MediaFetcher';
import { StyleFeed } from '@/components/cinema/StyleFeed';
import { CLASSIFICATION_COLORS } from '@/lib/design-tokens';
import type { ClassificationName } from '@/lib/design-tokens';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const styleData = MediaFetcher.STYLE_MAP[slug];
  if (!styleData) return { title: 'Not Found' };
  return {
    title: `${styleData.label} — Style Discover`,
    description: styleData.description,
  };
}

export default async function StylePage({ params }: Props) {
  const { slug } = await params;
  const styleData = MediaFetcher.STYLE_MAP[slug];
  if (!styleData) notFound();

  const { movies, tv } = await getStylePageAction(slug);

  const accentColor = CLASSIFICATION_COLORS[styleData.label as ClassificationName] || '#ffffff';

  return (
    <div className="min-h-screen pb-32">
      {/* Header */}
      <header className="px-4 md:px-10 pt-6 md:pt-12 mb-8 md:mb-16">
        <Link
          href="/discover"
          className="inline-flex items-center gap-2 text-white/30 hover:text-white font-metadata text-xs uppercase tracking-widest transition-colors mb-6 md:mb-10 group"
        >
          <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
          Discover
        </Link>

        <div className="flex items-end justify-between">
          <div>
            <p className="font-metadata text-xs uppercase tracking-[0.4em] text-white/30 mb-3">
              Style
            </p>
            <h1
              className="font-heading text-5xl md:text-9xl tracking-tighter italic uppercase leading-none"
              style={{ color: accentColor }}
            >
              {styleData.label}
            </h1>
            <p className="mt-4 text-white/50 font-metadata max-w-xl leading-relaxed text-sm">
              {styleData.description}
            </p>
          </div>
        </div>
      </header>

      <StyleFeed 
        slug={slug} 
        initialMovies={movies} 
        initialTv={tv} 
      />
    </div>
  );
}

export async function generateStaticParams() {
  return Object.keys(MediaFetcher.STYLE_MAP).map((slug) => ({ slug }));
}
