import { getCollectionDetailsAction } from '@/lib/actions';
import { notFound } from 'next/navigation';
import { DiscoveryCard } from '@/components/cinema/DiscoveryCard';
import { Trash2, ChevronLeft, FolderHeart } from 'lucide-react';
import Link from 'next/link';
import ShareButton from '@/components/vault/ShareButton';
import { toCanonicalMediaId } from '@/lib/media-identity';
import { UniversalMedia } from '@/lib/api/UniversalTransformer';

interface PageProps {
  params: Promise<{ id: string }>;
}

interface CollectionItem {
  id: string;
  media_id: string;
  media_type: UniversalMedia['type'];
  title: string;
  poster_url: string | null;
  year: number | null;
}

export default async function CollectionDetailPage({ params }: PageProps) {
  const { id } = await params;
  const collection = await getCollectionDetailsAction(id);

  if (!collection) {
    return notFound();
  }

  return (
    <div className="min-h-screen pt-24 pb-20 px-4 md:px-10 max-w-7xl mx-auto">
      <header className="mb-12">
        <Link 
          href="/vault" 
          className="inline-flex items-center gap-2 text-[10px] font-metadata text-white/30 hover:text-white uppercase tracking-widest transition-colors mb-6"
        >
          <ChevronLeft size={14} /> Back to Vault
        </Link>
        
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="max-w-2xl">
            <h1 className="font-heading text-5xl md:text-7xl tracking-tighter text-white italic uppercase leading-none mb-4">
              {collection.title}
            </h1>
            <p className="text-white/60 font-metadata text-xs uppercase tracking-widest leading-relaxed">
              {collection.description || "A curated cinematic archive."}
            </p>
          </div>
          
          <div className="flex items-center gap-3">
             <ShareButton shareToken={collection.share_token} title={collection.title} />
             <button className="flex items-center justify-center bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 p-2 rounded-full text-rose-500 transition-all">
               <Trash2 size={16} />
             </button>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {collection.collection_items && collection.collection_items.length > 0 ? (
          collection.collection_items.map((item: CollectionItem, idx: number) => (
            <DiscoveryCard 
              key={item.id} 
              media={{
                id: toCanonicalMediaId({ id: item.media_id, type: item.media_type }),
                sourceId: toCanonicalMediaId({ id: item.media_id, type: item.media_type }),
                type: item.media_type,
                displayTitle: item.title,
                posterUrl: item.poster_url,
                backdropUrl: null,
                releaseYear: item.year,
                releaseDate: null,
                status: null,
                // These are required by DiscoveryCard but might be missing, 
                // so we provide defaults to avoid breakage
                source: 'tmdb',
                overview: '',
                genres: [],
                classification: 'Atmospheric',
                rating: { average: 0, count: 0, showBadge: false },
                popularity: 0,
              } as UniversalMedia}
              index={idx} 
            />
          ))
        ) : (
          <div className="col-span-full py-20 flex flex-col items-center text-center opacity-30">
            <FolderHeart size={40} className="mb-6" />
            <h3 className="font-heading text-2xl mb-2 uppercase italic">No items yet</h3>
            <p className="font-metadata text-[10px] uppercase tracking-widest max-w-xs">Start adding films to this curation to build your archive.</p>
          </div>
        )}
      </div>
    </div>
  );
}
