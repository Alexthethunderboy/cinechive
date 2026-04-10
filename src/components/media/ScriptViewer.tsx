'use client';

import { motion } from 'framer-motion';
import { FileText, ExternalLink } from 'lucide-react';
import GlassPanel from '@/components/ui/GlassPanel';
import { ScriptInfo } from '@/lib/services/ScriptService';

interface ScriptViewerProps {
  tmdbId: string;
  title: string;
  scripts: ScriptInfo[];
}

export default function ScriptViewer({ scripts }: ScriptViewerProps) {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-3xl uppercase italic tracking-tighter flex items-center gap-3">
          <FileText className="text-accent" />
          Script References
        </h3>
        <span className="font-data text-[10px] text-muted uppercase tracking-[0.3em]">
          Community Links
        </span>
      </div>

      <GlassPanel className="p-8 border-dashed border-white/10 overflow-hidden relative group">
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
          <FileText size={120} />
        </div>

        <div className="relative z-10 space-y-6">
          <div className="max-w-xl">
            <h4 className="font-heading text-xl text-white mb-2">Director's Script Vault</h4>
            <p className="text-muted text-sm leading-relaxed">
              Explore possible screenplay sources. Links are best-effort suggestions and may not always contain a full script.
            </p>
          </div>

          <div className="flex flex-wrap gap-4">
            {scripts.map((script) => (
              <a 
                key={script.source} 
                href={script.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="block"
              >
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-6 py-3 rounded-inner bg-white/5 border border-white/10 hover:border-accent/40 hover:bg-white/10 transition-all flex items-center gap-3"
                >
                  <span className="font-data text-[10px] uppercase tracking-widest font-bold text-accent">
                    {script.source}
                  </span>
                  <ExternalLink size={14} className="text-white/40" />
                </motion.button>
              </a>
            ))}

          </div>

          <div className="pt-4 flex items-center gap-4 text-[10px] font-data text-muted/60 uppercase tracking-widest">
            <span className="flex items-center gap-1"><div className="w-1 h-1 rounded-full bg-accent" /> PDF FORMAT</span>
            <span className="flex items-center gap-1"><div className="w-1 h-1 rounded-full bg-accent" /> COMMUNITY SOURCES</span>
            <span className="flex items-center gap-1"><div className="w-1 h-1 rounded-full bg-accent" /> UNVERIFIED LINKS</span>
          </div>
        </div>
      </GlassPanel>
    </div>
  );
}
