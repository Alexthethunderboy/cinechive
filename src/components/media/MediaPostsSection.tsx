'use client';

import { useEffect, useState } from 'react';
import { Loader2, MessageSquare } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { getPostsByMediaAction } from '@/lib/media-social-actions';
import { formatDate, formatUsername } from '@/lib/utils';

interface MediaPostsSectionProps {
  mediaId: string;
  mediaType: string;
}

export default function MediaPostsSection({ mediaId, mediaType }: MediaPostsSectionProps) {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const data = await getPostsByMediaAction(mediaId, mediaType);
        if (!cancelled) setPosts(data);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [mediaId, mediaType]);

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <MessageSquare className="text-accent" />
        <h2 className="font-display text-3xl tracking-tighter uppercase italic text-white">Posts Using This Media</h2>
      </div>

      {loading ? (
        <div className="py-12 flex items-center justify-center">
          <Loader2 className="animate-spin text-accent" size={28} />
        </div>
      ) : posts.length === 0 ? (
        <div className="py-10 text-center border border-dashed border-white/10 rounded-card bg-white/5">
          <p className="font-heading text-white/40 italic">No posts attached yet. Be the first to share one in Community.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {posts.map((post, idx) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.03 }}
              className="p-4 rounded-2xl border border-white/10 bg-white/5 space-y-3"
            >
              <div className="flex items-center justify-between gap-2">
                <Link href={`/profile/${formatUsername(post.username)}`} className="text-sm font-heading text-white hover:text-accent">
                  @{formatUsername(post.username)}
                </Link>
                <span className="font-metadata text-[10px] text-white/40 uppercase tracking-widest">{formatDate(post.created_at)}</span>
              </div>
              <p className="text-white/85 font-heading text-sm leading-relaxed whitespace-pre-wrap">{post.content}</p>
              {post.media_refs?.length > 0 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {post.media_refs.slice(0, 4).map((m: any, i: number) => (
                    <Link key={`${post.id}-${i}`} href={`/media/${m.type}/${m.id}`} className="relative w-14 aspect-2/3 rounded-md overflow-hidden border border-white/10 bg-white/5 shrink-0">
                      {m.posterUrl ? (
                        <Image src={m.posterUrl} alt={m.title || 'media poster'} fill className="object-cover" />
                      ) : null}
                    </Link>
                  ))}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
