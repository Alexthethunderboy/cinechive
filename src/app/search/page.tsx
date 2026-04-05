'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { globalSearchAction } from '@/lib/actions';
import { motion } from 'framer-motion';
import EverythingBar from '@/components/search/EverythingBar';
import { DiscoveryCard } from '@/components/cinema/DiscoveryCard';
import { Film, Tv, Users, Loader2, Search } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

function SearchContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';

  const { data: results, isLoading } = useQuery({
    queryKey: ['globalSearch', query],
    queryFn: () => globalSearchAction(query),
    enabled: query.length >= 2,
  });

  return (
    <div className="pt-6 pb-20 px-4 md:px-16 space-y-6 md:space-y-12">
      <div className="max-w-6xl mx-auto space-y-4">
        <EverythingBar />
        {query && (
          <p className="text-white/40 font-metadata text-xs pl-2">
            Showing results for: <span className="text-white underline decoration-white/20">{query}</span>
          </p>
        )}
      </div>

      {isLoading ? (
        <div className="w-full flex flex-col items-center justify-center py-24 opacity-50 space-y-6">
          <Loader2 className="w-12 h-12 animate-spin text-white" />
          <p className="font-heading text-2xl tracking-tighter italic uppercase text-white/40">Searching Library...</p>
        </div>
      ) : !query || (results && results.movies.length === 0 && results.tv.length === 0 && results.people.length === 0) ? (
        <div className="w-full flex flex-col items-center justify-center py-24 text-center space-y-6">
          <Search size={48} className="text-white/5" />
          <div className="space-y-4">
            <h2 className="font-heading text-4xl md:text-5xl tracking-tighter italic uppercase text-white/40">No Results Found</h2>
            <p className="font-metadata text-xs text-white/20 uppercase tracking-widest">We couldn't find any records for "{query}".</p>
          </div>
        </div>
      ) : (
        <div className="space-y-24">
          {/* Movies Section */}
          {results?.movies && results.movies.length > 0 && (
            <div className="space-y-8">
              <h2 className="font-heading text-3xl tracking-tighter flex items-center gap-4 uppercase italic text-white/60">
                <Film className="w-6 h-6" />
                Movies
              </h2>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
                {results.movies.map((item, i) => (
                  <DiscoveryCard key={item.sourceId} media={item} index={i} />
                ))}
              </div>
            </div>
          )}

          {/* TV Shows Section */}
          {results?.tv && results.tv.length > 0 && (
            <div className="space-y-8">
              <h2 className="font-heading text-3xl tracking-tighter flex items-center gap-4 uppercase italic text-white/40">
                <Tv className="w-6 h-6" />
                TV Shows
              </h2>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
                {results.tv.map((item, i) => (
                  <DiscoveryCard key={item.sourceId} media={item} index={i} />
                ))}
              </div>
            </div>
          )}

          {/* People Section */}
          {results?.people && results.people.length > 0 && (
            <div className="space-y-8">
              <h2 className="font-heading text-3xl tracking-tighter flex items-center gap-4 uppercase italic text-white/20">
                <Users className="w-6 h-6" />
                People
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                {results.people.map((person, i) => (
                  <motion.div
                    key={person.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="group"
                  >
                    <Link href={`/media/person/${person.id}`}>
                      <div className="aspect-3/4 rounded-card overflow-hidden relative border border-white/10 group-hover:border-accent/40 transition-all bg-white/5">
                        {person.profileUrl ? (
                          <Image
                            src={person.profileUrl}
                            alt={person.name}
                            fill
                            className="object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-white/5">
                            <Users size={32} />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-linear-to-t from-black/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="absolute bottom-4 left-4 right-4 translate-y-2 group-hover:translate-y-0 transition-transform">
                          <p className="font-heading text-sm text-white truncate">{person.name}</p>
                          <p className="font-metadata text-[10px] text-white/40 uppercase truncate">{person.knownFor}</p>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="w-full flex flex-col items-center justify-center py-24 opacity-50 space-y-6">
        <Loader2 className="w-12 h-12 animate-spin text-white" />
        <p className="font-heading text-2xl tracking-tighter italic uppercase text-white/40">Searching Library...</p>
      </div>
    }>
      <SearchContent />
    </Suspense>
  );
}
