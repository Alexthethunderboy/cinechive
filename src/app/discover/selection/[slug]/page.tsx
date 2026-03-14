import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { getSelectionPageAction } from '@/lib/actions';
import { MediaFetcher } from '@/lib/api/MediaFetcher';
import { DiscoveryCard } from '@/components/cinema/DiscoveryCard';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const selection = MediaFetcher.SELECTIONS.find((s) => s.slug === slug);
  if (!selection) return { title: 'Not Found' };
  return {
    title: `${selection.title} — Selections`,
    description: selection.description,
  };
}

export default async function SelectionPage({ params }: Props) {
  const { slug } = await params;
  const meta = MediaFetcher.SELECTIONS.find((s) => s.slug === slug);
  if (!meta) notFound();

  const data = await getSelectionPageAction(slug);
  if (!data) notFound();

  return (
    <div className="min-h-screen pb-32">
      {/* Header */}
      <header className="px-6 md:px-10 pt-12 mb-16 border-b border-white/5 pb-12">
        <Link
          href="/discover"
          className="inline-flex items-center gap-2 text-white/30 hover:text-white font-metadata text-xs uppercase tracking-widest transition-colors mb-10 group"
        >
          <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
          Discover
        </Link>

        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-px bg-white/20" />
          <span className="font-metadata text-white/30 text-xs uppercase tracking-widest">
            Curated Selection
          </span>
        </div>

        <h1 className="font-heading text-7xl md:text-9xl tracking-tighter italic uppercase leading-none text-white mb-4">
          {data.title}
        </h1>
        <p className="text-white/50 font-metadata max-w-2xl leading-relaxed text-sm uppercase tracking-wide">
          {data.description}
        </p>
      </header>

      {/* Grid */}
      <section className="px-6 md:px-10">
        <div className="flex items-center gap-2 mb-8">
          <Sparkles size={14} className="text-white/20" />
          <span className="font-metadata text-[11px] text-white/20 uppercase tracking-widest">
            {data.movies.results.length} films
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {data.movies.results.map((item, i) => (
            <DiscoveryCard key={item.sourceId} media={item} index={i} />
          ))}
        </div>
      </section>
    </div>
  );
}

export async function generateStaticParams() {
  return MediaFetcher.SELECTIONS.map((s) => ({ slug: s.slug }));
}
