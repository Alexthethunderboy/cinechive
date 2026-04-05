import { getSharedCollectionAction } from '@/lib/actions';
import { notFound } from 'next/navigation';
import { DiscoveryCard } from '@/components/cinema/DiscoveryCard';
import { User, Sparkles } from 'lucide-react';
import Image from 'next/image';

interface PageProps {
  params: Promise<{ token: string }>;
}

export default async function SharedCollectionPage({ params }: PageProps) {
  const { token } = await params;
  const collection = await getSharedCollectionAction(token);

  if (!collection) {
    return notFound();
  }

  const profile = collection.profiles;

  return (
    <div className="min-h-screen pt-24 pb-20 px-4 md:px-10 max-w-7xl mx-auto">
      <header className="mb-16 text-center">
        <div className="flex flex-col items-center mb-10">
          <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white/10 mb-4 bg-white/5">
            {profile?.avatar_url ? (
              <Image 
                src={profile.avatar_url} 
                alt={profile.username} 
                width={64} 
                height={64} 
                className="object-cover"
              />
            ) : (
                <div className="w-full h-full flex items-center justify-center text-white/20">
                  <User size={32} />
                </div>
            )}
          </div>
          <p className="font-metadata text-[10px] uppercase tracking-[0.3em] text-white/40 mb-2">
            A Curation by <span className="text-white hover:text-accent transition-colors cursor-pointer">@{profile?.username}</span>
          </p>
          <div className="h-px w-12 bg-white/10" />
        </div>

        <h1 className="font-heading text-6xl md:text-8xl tracking-tighter text-white italic uppercase leading-none mb-6">
          {collection.title}
        </h1>
        <p className="text-white/60 font-metadata text-xs uppercase tracking-widest max-w-2xl mx-auto leading-relaxed">
          {collection.description || "An exclusive cinematic editorial volume."}
        </p>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
        {collection.collection_items && collection.collection_items.map((item: any, idx: number) => (
          <DiscoveryCard 
            key={item.id} 
            media={{
              id: item.media_id,
              sourceId: item.media_id.split('-')[1] || item.media_id,
              type: item.media_type,
              displayTitle: item.title,
              posterUrl: item.poster_url,
              releaseYear: item.year,
              source: 'tmdb',
              overview: '',
              genres: [],
              classification: 'Atmospheric',
              rating: { average: 0, count: 0, showBadge: false },
              popularity: 0,
            } as any} 
            index={idx} 
          />
        ))}
        
        {/* Call to Action */}
        <div className="col-span-full mt-24 text-center">
          <div className="p-12 rounded-3xl bg-white/5 border border-white/10 max-w-xl mx-auto">
            <Sparkles className="mx-auto mb-6 text-accent" size={32} />
            <h3 className="font-heading text-3xl text-white mb-4 italic uppercase tracking-tight">Create your own archives</h3>
            <p className="font-metadata text-[10px] text-white/40 uppercase tracking-widest mb-8 leading-relaxed">
              Join Enterchive to curate personal editorial volumes, save your favorites, and share them with the world.
            </p>
            <a 
              href="/signup" 
              className="inline-block bg-white text-black px-8 py-3 rounded-full font-metadata text-[10px] uppercase tracking-[0.3em] font-bold hover:bg-white/90 transition-all"
            >
              Sign Up for Free
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
