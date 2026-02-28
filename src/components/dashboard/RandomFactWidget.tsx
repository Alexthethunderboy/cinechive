'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lightbulb, RefreshCcw, ArrowRight } from 'lucide-react';
import GlassPanel from '@/components/ui/GlassPanel';
import { getRandomTriviaAction } from '@/lib/actions';
import Link from 'next/link';
import { TriviaItem } from '@/lib/services/DeepDataService';
import { cn } from '@/lib/utils';

export default function RandomFactWidget() {
  const [isMounted, setIsMounted] = useState(false);
  const [data, setData] = useState<{
    movieTitle: string;
    trivia: TriviaItem;
    mediaId: string;
    mediaType: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  async function fetchRandomFact() {
    setLoading(true);
    const result = await getRandomTriviaAction();
    setData(result);
    setLoading(false);
  }

  useEffect(() => {
    setIsMounted(true);
    fetchRandomFact();
  }, []);

  if (!isMounted) return (
     <div className="h-40 animate-pulse bg-white/5 rounded-card" />
  );

  if (!loading && !data) {
    return (
      <GlassPanel className="min-h-[160px] border-white/5 bg-white/2 flex items-center justify-center text-center group w-full relative overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-tr from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 px-8 flex flex-col items-center justify-center w-full"
        >
          <p className="font-heading text-lg md:text-2xl text-white/50 italic lowercase leading-relaxed max-w-2xl">
            "The greatest films are those yet to be collected. <br/> Begin your curatory journey to unlock cinematic insights."
          </p>
        </motion.div>
      </GlassPanel>
    );
  }

  // If still loading and no data yet
  if (loading && !data) {
    return (
      <div className="h-40 animate-pulse bg-white/5 rounded-card" />
    );
  }

  return (
    <GlassPanel className="p-8 border-accent/20 bg-accent/5 overflow-hidden relative group">
      {/* Decorative Lightbulb background */}
      <div className="absolute -right-8 -bottom-8 text-accent/5 -rotate-12 group-hover:text-accent/10 transition-colors duration-700">
        <Lightbulb size={240} />
      </div>

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div className="flex-1 space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center text-accent shadow-[0_0_20px_rgba(251,191,36,0.2)]">
              <Lightbulb size={24} />
            </div>
            <div>
              <h4 className="font-display text-lg md:text-2xl uppercase italic tracking-tight">Cinema Flashback</h4>
              <p className="font-data text-[10px] text-accent/60 uppercase tracking-[0.3em]">Deep Dive Discovery</p>
            </div>
          </div>

          <AnimatePresence mode="wait">
             {loading ? (
                <motion.div 
                  key="loading"
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }} 
                  exit={{ opacity: 0 }}
                  className="space-y-3"
                >
                   <div className="h-4 w-3/4 bg-white/5 rounded-full animate-pulse" />
                   <div className="h-4 w-1/2 bg-white/5 rounded-full animate-pulse" />
                </motion.div>
             ) : (
                <motion.div
                  key={data?.trivia.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.5 }}
                >
                   <p className="font-heading text-base md:text-lg text-white/90 leading-relaxed italic border-l-2 border-accent/40 pl-6 py-2">
                     "{data?.trivia.text}"
                   </p>
                   <div className="mt-4 flex items-center gap-3">
                      <span className="font-data text-[10px] text-muted uppercase tracking-widest">— {data?.movieTitle}</span>
                      <Link 
                        href={`/media/${data?.mediaType}/${data?.mediaId}`}
                        className="text-accent hover:underline font-data text-[9px] uppercase tracking-widest flex items-center gap-1 group/link"
                      >
                         Film Details <ArrowRight size={10} className="group-hover/link:translate-x-1 transition-transform" />
                      </Link>
                   </div>
                </motion.div>
             )}
          </AnimatePresence>
        </div>

        <div className="flex flex-col gap-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={fetchRandomFact}
            disabled={loading}
            className="p-4 rounded-full bg-white/5 border border-white/10 text-white/40 hover:text-accent hover:border-accent/40 transition-all group/refresh"
          >
            <RefreshCcw size={20} className={loading ? "animate-spin" : "group-hover/refresh:rotate-90 transition-transform duration-500"} />
          </motion.button>
          <span className="font-data text-[8px] text-muted/40 uppercase tracking-widest text-center">Randomize Fact</span>
        </div>
      </div>
    </GlassPanel>
  );
}
