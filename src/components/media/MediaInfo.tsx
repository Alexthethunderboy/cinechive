'use client';

import { useState } from 'react';
import { Info, DollarSign, ExternalLink } from 'lucide-react';
import GlassPanel from '@/components/ui/GlassPanel';
import { DetailedMedia } from '@/lib/api/mapping';
import Image from 'next/image';
import { Tv } from 'lucide-react';

interface MediaInfoProps {
  media: DetailedMedia;
}

export default function MediaInfo({ media }: MediaInfoProps) {
  const [showAllProviders, setShowAllProviders] = useState(false);
  const fallbackWatchUrl =
    media.source === 'tmdb' && media.sourceId
      ? `https://www.themoviedb.org/${media.type === 'tv' ? 'tv' : 'movie'}/${media.sourceId}/watch`
      : null;
  const streamProviders = (media.providers || []).filter((provider) => provider.type === 'flatrate');
  const linkedStreamProviders = streamProviders.filter((provider) => !!(provider.watchUrl || fallbackWatchUrl));
  const visibleProviders = showAllProviders ? linkedStreamProviders : linkedStreamProviders.slice(0, 3);

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

      {/* Where to Watch */}
      <div className="space-y-6 pt-12 border-t border-white/5">
        <h2 className="font-heading text-lg md:text-2xl tracking-tighter flex items-center gap-2 text-white/50">
          <Tv size={18} className="text-white/30" />
          Where to Watch
        </h2>
        <p className="font-metadata text-[10px] uppercase tracking-widest text-white/40">
          Global availability (any region)
        </p>
        {linkedStreamProviders.length > 0 ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {visibleProviders.map((provider) => {
              const providerUrl = provider.watchUrl || fallbackWatchUrl;
              const card = (
                <GlassPanel className="p-4 border-white/5 bg-white/5 hover:bg-white/10 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="relative w-8 h-8 rounded-md overflow-hidden bg-white/10 shrink-0">
                      {provider.logo_path ? (
                        <Image
                          src={provider.logo_path}
                          alt={provider.provider_name}
                          fill
                          className="object-cover"
                        />
                      ) : null}
                    </div>
                    <div className="min-w-0">
                      <span className="font-metadata text-xs text-white/80 block truncate">{provider.provider_name}</span>
                      <span className="font-data text-[9px] uppercase tracking-widest text-white/40">Stream</span>
                    </div>
                    <ExternalLink size={12} className="text-white/30 shrink-0" />
                  </div>
                </GlassPanel>
              );
              return (
                <a
                  key={`${provider.provider_id}-${provider.type}`}
                  href={providerUrl || undefined}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  {card}
                </a>
              );
            })}
            </div>
            {linkedStreamProviders.length > 3 && (
              <button
                onClick={() => setShowAllProviders((prev) => !prev)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/15 bg-white/5 text-xs uppercase tracking-widest text-white/70 hover:text-white hover:border-white/30 transition-colors"
              >
                {showAllProviders ? 'Show Less' : `More (${linkedStreamProviders.length - 3})`}
              </button>
            )}
          </div>
        ) : (
          <GlassPanel className="p-6 border-white/5 bg-white/5">
            <p className="font-metadata text-xs text-muted mb-3">No streaming links are currently available for this title.</p>
            {fallbackWatchUrl && (
              <a
                href={fallbackWatchUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 font-metadata text-[10px] uppercase tracking-widest text-accent hover:underline"
              >
                Check TMDB watch page
                <ExternalLink size={12} />
              </a>
            )}
          </GlassPanel>
        )}
      </div>

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
