'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, Download, FolderHeart, Loader2, Share2, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { DiscoveryCard } from '@/components/cinema/DiscoveryCard';
import { useAuth } from '@/components/providers/AuthProvider';
import { getCollectionDetailsAction } from '@/lib/collection-actions';
import {
  deleteLocalCollection,
  getLocalCollection,
  removeLocalMediaFromCollection,
  useLocalArchive,
} from '@/lib/local-archive';
import type { UniversalMedia } from '@/lib/api/UniversalTransformer';

interface CollectionItemView {
  id: string;
  media_id: string;
  media_type: string;
  title: string;
  poster_url: string | null;
  year: number | null;
}

interface CollectionView {
  id: string;
  title: string;
  description?: string | null;
  collection_items: CollectionItemView[];
}

export default function CollectionDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { isLocalMode } = useAuth();
  const archive = useLocalArchive();
  const [remoteCollection, setRemoteCollection] = useState<CollectionView | null>(null);
  const [loading, setLoading] = useState(!isLocalMode);
  const localCollection = useMemo(() => getLocalCollection(params.id, archive), [archive, params.id]);
  const collection = isLocalMode ? localCollection : remoteCollection;

  useEffect(() => {
    if (isLocalMode) {
      return;
    }
    let cancelled = false;
    getCollectionDetailsAction(params.id)
      .then((value) => { if (!cancelled) setRemoteCollection(value as CollectionView | null); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [isLocalMode, params.id]);

  const exportCollection = () => {
    if (!collection) return;
    const payload = JSON.stringify({
      cinechiveCollectionVersion: 1,
      title: collection.title,
      description: collection.description,
      items: collection.collection_items,
    }, null, 2);
    const blob = new Blob([payload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${collection.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'cinechive-collection'}.json`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Collection exported');
  };

  const shareCollection = async () => {
    if (!collection) return;
    const text = [
      `CineChive collection: ${collection.title}`,
      collection.description,
      ...collection.collection_items.map((item: CollectionItemView) => `• ${item.title}`),
    ].filter(Boolean).join('\n');
    try {
      if (navigator.share) await navigator.share({ title: collection.title, text });
      else {
        await navigator.clipboard.writeText(text);
        toast.success('Collection summary copied');
      }
    } catch (error) {
      if ((error as Error).name !== 'AbortError') toast.error('Could not share this collection');
    }
  };

  const handleDelete = () => {
    if (!isLocalMode || !collection) return;
    if (!window.confirm(`Delete “${collection.title}”?`)) return;
    deleteLocalCollection(collection.id);
    toast.success('Collection deleted');
    router.push('/vault');
  };

  if (loading) {
    return <div className="flex min-h-[60vh] items-center justify-center"><Loader2 className="animate-spin text-white/30" /></div>;
  }

  if (!collection) {
    return (
      <div className="flex min-h-[65vh] flex-col items-center justify-center px-6 text-center">
        <FolderHeart size={40} className="mb-5 text-white/15" />
        <h1 className="font-heading text-3xl text-white">Collection not found</h1>
        <Link href="/vault" className="mt-6 rounded-full bg-white px-6 py-3 text-xs font-bold text-black">Back to Library</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-20 px-4 md:px-10 max-w-7xl mx-auto">
      {isLocalMode && (
        <div className="mb-8 rounded-2xl border border-emerald-300/20 bg-emerald-300/8 px-4 py-3 text-xs text-emerald-100/80">
          Local collection · You can share a text summary or export a file. A durable public link requires a backend.
        </div>
      )}

      <header className="mb-12">
        <Link href="/vault" className="inline-flex items-center gap-2 text-[10px] font-metadata text-white/30 hover:text-white uppercase tracking-widest transition-colors mb-6">
          <ChevronLeft size={14} /> Back to Library
        </Link>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="max-w-2xl">
            <h1 className="font-heading text-5xl md:text-7xl tracking-tighter text-white italic uppercase leading-none mb-4">{collection.title}</h1>
            <p className="text-white/60 font-metadata text-xs uppercase tracking-widest leading-relaxed">{collection.description || 'A curated cinematic archive.'}</p>
          </div>
          {isLocalMode && (
            <div className="flex flex-wrap items-center gap-3">
              <button onClick={shareCollection} className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 font-metadata text-[10px] uppercase tracking-widest text-white hover:bg-white/10"><Share2 size={14} /> Share summary</button>
              <button onClick={exportCollection} className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 font-metadata text-[10px] uppercase tracking-widest text-white hover:bg-white/10"><Download size={14} /> Export</button>
              <button onClick={handleDelete} aria-label="Delete collection" className="rounded-full border border-rose-500/20 bg-rose-500/10 p-2 text-rose-400 hover:bg-rose-500/20"><Trash2 size={16} /></button>
            </div>
          )}
        </div>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {collection.collection_items?.length ? collection.collection_items.map((item: CollectionItemView, index: number) => (
          <div key={item.id} className="relative group/item">
            <DiscoveryCard media={toMedia(item)} index={index} />
            {isLocalMode && (
              <button
                onClick={() => removeLocalMediaFromCollection(collection.id, item.id)}
                aria-label={`Remove ${item.title} from collection`}
                className="absolute bottom-3 right-3 z-40 rounded-full border border-white/10 bg-black/80 p-2 text-white/50 opacity-100 transition-all hover:text-rose-300 md:opacity-0 md:group-hover/item:opacity-100"
              >
                <X size={14} />
              </button>
            )}
          </div>
        )) : (
          <div className="col-span-full py-20 flex flex-col items-center text-center opacity-30">
            <FolderHeart size={40} className="mb-6" />
            <h3 className="font-heading text-2xl mb-2 uppercase italic">No items yet</h3>
            <p className="font-metadata text-[10px] uppercase tracking-widest max-w-xs">Open a title, choose Save, then add it to this collection.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function toMedia(item: CollectionItemView): UniversalMedia {
  const mediaType = item.media_type === 'documentary' ? 'movie' : item.media_type;
  return {
    id: item.media_id,
    sourceId: item.media_id,
    type: mediaType,
    source: mediaType === 'anime' ? 'anilist' : 'tmdb',
    displayTitle: item.title,
    posterUrl: item.poster_url,
    backdropUrl: null,
    releaseYear: item.year,
    releaseDate: null,
    status: null,
    overview: '',
    genres: [],
    classification: 'Atmospheric',
    rating: { average: 0, count: 0, showBadge: false },
    popularity: 0,
  } as UniversalMedia;
}
