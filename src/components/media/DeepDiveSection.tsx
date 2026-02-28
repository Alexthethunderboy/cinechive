'use client';

import { motion } from 'framer-motion';
import { Database } from 'lucide-react';
import TriviaModule from './TriviaModule';
import ScriptViewer from './ScriptViewer';
import TechnicalLab from './TechnicalLab';
import { TriviaItem, TechnicalSpecs } from '@/lib/services/DeepDataService';
import { ScriptInfo } from '@/lib/services/ScriptService';

interface DeepMetadata {
  trivia: TriviaItem[];
  specs: TechnicalSpecs;
  scripts: ScriptInfo[];
}

interface DeepDiveSectionProps {
  tmdbId: string;
  title: string;
  data: DeepMetadata;
}

export default function DeepDiveSection({ tmdbId, title, data }: DeepDiveSectionProps) {
  const hasData = data.trivia.length > 0 || data.scripts.length > 0 || Object.keys(data.specs).length > 0;

  if (!hasData) return null;

  return (
    <section className="mt-20 border-t border-white/5 pt-20 space-y-24">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-4">
          <div className="flex items-center gap-3 font-data text-[10px] uppercase tracking-[0.4em] text-accent">
            <div className="w-8 h-px bg-accent/40" />
            CineChive Guide
          </div>
          <h2 className="font-display text-4xl md:text-6xl uppercase italic tracking-tighter">
            Deep Dive <span className="text-white/20">Explorer</span>
          </h2>
        </div>
        <div className="flex items-center gap-4 text-muted/40 font-data text-[10px] uppercase tracking-widest">
          <Database size={14} />
          <span>Verified Production Data</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
        {/* Main Content: Trivia & Scripts */}
        <div className="lg:col-span-8 space-y-24">
          <TriviaModule trivia={data.trivia} />
          <ScriptViewer tmdbId={tmdbId} title={title} scripts={data.scripts} />
        </div>

        {/* Sidebar: Technical Lab */}
        <div className="lg:col-span-4">
          <div className="sticky top-24 space-y-8">
            <div className="p-1 rounded-card bg-linear-to-b from-white/10 to-transparent">
              <div className="bg-background rounded-card p-6 space-y-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                  <span className="font-data text-[10px] uppercase tracking-widest text-white/60">Production Specs</span>
                </div>
                <TechnicalLab specs={data.specs} />
              </div>
            </div>

            <div className="p-6 rounded-card border border-white/5 bg-surface/20">
              <span className="font-data text-[9px] uppercase tracking-widest text-muted block mb-4">Film Details</span>
              <div className="space-y-3">
                 <div className="flex justify-between items-center text-xs">
                    <span className="text-muted/60">Edition</span>
                    <span className="font-heading text-white/40">Collector's Edition</span>
                 </div>
                 <div className="flex justify-between items-center text-xs">
                    <span className="text-muted/60">Integrity</span>
                    <span className="font-heading text-accent/60">Verified</span>
                 </div>
                 <div className="flex justify-between items-center text-xs">
                    <span className="text-muted/60">Deep Linked</span>
                    <span className="font-heading text-white/40">Yes</span>
                 </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
