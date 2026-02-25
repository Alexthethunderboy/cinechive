'use client';

import { useState, useTransition, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Film, Search, Flame, Loader2 } from 'lucide-react';
import { BentoGrid, BentoItem } from '@/components/ui/BentoGrid';
import MediaCard from '@/components/ui/MediaCard';
import GlassPanel from '@/components/ui/GlassPanel';
import { cn } from '@/lib/utils';
import { UnifiedMedia } from '@/lib/api/mapping';
import { ClassificationName, CLASSIFICATION_COLORS, MEDIA_TYPE_LABELS } from '@/lib/design-tokens';
import { unifiedSearchAction } from '@/lib/actions';
import EverythingBar from '@/components/search/EverythingBar';
import { TrendingFeed } from './TrendingFeed';

interface ClientCinemaProps {
  initialTrending: (UnifiedMedia & { span: any })[];
}

export default function ClientCinema({ initialTrending }: ClientCinemaProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<(UnifiedMedia & { span: any })[]>([]);
  const [isPending, startTransition] = useTransition();

  const displayItems = query.length >= 2 ? results : initialTrending;

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }

    const timer = setTimeout(() => {
      startTransition(async () => {
        try {
          const data = await unifiedSearchAction(query, 'video');
          setResults(data.map((item, i) => ({
            ...item,
            span: i % 4 === 0 || i % 4 === 3 ? 'large' : 'tall'
          })));
        } catch (error) {
          console.error("Cinema search failed:", error);
        }
      });
    }, 400);

    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div className="min-h-screen py-10 md:py-16 px-6 md:px-10 pb-24 md:pb-16 max-w-7xl mx-auto">
      <header className="mb-12">
        <motion.div
           initial={{ opacity: 0, x: -20 }}
           animate={{ opacity: 1, x: 0 }}
           className="mb-8"
        >
          <h1 className="font-display text-4xl md:text-6xl tracking-tighter mb-4">
            CINEMA <span className="text-white/60 italic">& TV</span>
          </h1>
          <p className="text-muted max-w-xl">
             The archive of visual storytelling. From blockbuster cinema to high-order television and deep-dive documentaries.
          </p>
        </motion.div>

        <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
          <EverythingBar />
        </div>
      </header>

      <section className="mt-8">
        <TrendingFeed />
      </section>
    </div>
  );
}
