'use client';

import { Info, DollarSign } from 'lucide-react';
import GlassPanel from '@/components/ui/GlassPanel';
import { DetailedMedia } from '@/lib/api/mapping';

interface MediaInfoProps {
  media: DetailedMedia;
}

export default function MediaInfo({ media }: MediaInfoProps) {
  return (
    <div className="space-y-12">
      <div className="space-y-6">
        <h2 className="font-heading text-lg md:text-2xl tracking-tighter flex items-center gap-2 text-white/50" style={{ fontVariant: 'small-caps' }}>
          <Info size={16} className="text-white/30 md:w-[18px] md:h-[18px]" />
          Feature Overview
        </h2>
        <p className="text-base md:text-xl text-muted leading-relaxed font-heading opacity-90">
          {media.overview}
        </p>
      </div>

      {/* Media Stats */}
      {media.stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {media.stats.map(stat => (
            <GlassPanel key={stat.label} className="p-6 border-white/5 bg-white/5">
              <span className="font-display text-2xl block">{stat.value}</span>
              <span className="font-data text-[10px] uppercase text-muted tracking-widest">{stat.label}</span>
            </GlassPanel>
          ))}
        </div>
      )}

      {/* Financial Context */}
      {(media.business?.budget !== undefined || media.business?.revenue !== undefined) && (
        <div className="space-y-6 pt-12 border-t border-white/5">
          <h2 className="font-heading text-lg md:text-2xl tracking-tighter flex items-center gap-2 text-white/50">
            <DollarSign size={18} className="text-white/30" />
            Box Office
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <GlassPanel className="p-6 md:p-8 border-white/5 bg-white/5 group hover:bg-white/10 transition-all">
              <span className="font-data text-[9px] md:text-[10px] uppercase text-muted tracking-widest block mb-1">Production Budget</span>
              <span className="font-display text-xl md:text-3xl text-white">
                {media.business?.budget && media.business.budget > 0 
                  ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(media.business.budget)
                  : 'Unknown'
                }
              </span>
            </GlassPanel>
            <GlassPanel className="p-6 md:p-8 border-white/5 bg-white/5 group hover:bg-white/10 transition-all">
              <span className="font-data text-[9px] md:text-[10px] uppercase text-muted tracking-widest block mb-1">Box Office Revenue</span>
              <span className="font-display text-xl md:text-3xl text-accent">
                {media.business?.revenue && media.business.revenue > 0 
                  ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(media.business.revenue)
                  : 'Unknown'
                }
              </span>
            </GlassPanel>
          </div>
        </div>
      )}
    </div>
  );
}
