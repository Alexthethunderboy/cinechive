'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, MessageSquare, Repeat2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import CinematicAvatar from '@/components/layout/CinematicAvatar';
import { formatUsername } from '@/lib/utils';
import ReactionButton from '@/components/social/ReactionButton';
import RichDispatchContent from './RichDispatchContent';
import CommentDrawer from '@/components/social/CommentDrawer';
import { reArchiveMediaAction } from '@/lib/community-actions';

export default function PulseFeed({ initialFeed, userId, profile }: { initialFeed: any[], userId: string, profile: any }) {
  const router = useRouter();
  const [activeCommentPost, setActiveCommentPost] = useState<{ id: string, type: string } | null>(null);

  async function handleReArchive(originalId: string, type?: 'entry' | 'dispatch' | 'screening') {
    return reArchiveMediaAction({ originalEntryId: originalId, type });
  }

  return (
    <div className="fixed inset-0 bg-black z-[100] overflow-hidden">
      <button 
        onClick={() => router.push('/community')}
        className="absolute top-6 left-6 z-50 p-3 rounded-full bg-black/50 backdrop-blur-md text-white hover:bg-white/20 transition-all border border-white/10"
      >
        <X size={24} />
      </button>

      <div className="h-full w-full snap-y snap-mandatory overflow-y-scroll hide-scrollbar scroll-smooth">
        {initialFeed.map((post, index) => (
          <div key={post.id} className="h-full w-full snap-start snap-always relative flex items-center justify-center bg-black">
            {/* Background Blur if media exists */}
            {post.poster_url && (
              <div className="absolute inset-0 opacity-20 blur-3xl scale-110 pointer-events-none">
                <Image src={post.poster_url} alt="" fill className="object-cover" />
              </div>
            )}
            
            <div className="relative z-10 w-full max-w-lg mx-auto h-[90%] md:h-[80%] bg-[#0a0a0a]/80 backdrop-blur-2xl border border-white/10 rounded-[40px] shadow-2xl flex flex-col p-6 md:p-8">
              {/* Header */}
              <div className="flex items-center gap-4 mb-6">
                <CinematicAvatar src={post.avatar_url} username={post.username} size="lg" style={post.classification || 'Atmospheric'} />
                <div>
                  <h3 className="text-white font-heading text-xl">{formatUsername(post.username)}</h3>
                  <p className="text-white/40 text-xs font-metadata uppercase tracking-widest">{post.activity_type}</p>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto hide-scrollbar">
                {post.activity_type === 'dispatch' ? (
                  <RichDispatchContent content={post.content} />
                ) : (
                  <p className="text-white/90 text-lg font-heading leading-relaxed">{post.comment || 'No comment provided.'}</p>
                )}

                {post.media_id && post.poster_url && (
                  <div className="mt-6 rounded-2xl overflow-hidden border border-white/10 relative aspect-[2/3] w-1/2 mx-auto shadow-2xl">
                    <Image src={post.poster_url} alt={post.title} fill className="object-cover" />
                  </div>
                )}
              </div>

              {/* Action Bar */}
              <div className="mt-6 pt-6 border-t border-white/10 flex items-center justify-between">
                <ReactionButton 
                  activityId={post.id}
                  activityType={post.activity_type === 'dispatch' ? 'dispatch' : post.activity_type === 'screening' ? 'screening' : 'entry'}
                  initialCount={post.reaction_count}
                  initialReacted={post.has_reacted}
                />

                <button 
                  onClick={() => setActiveCommentPost({ id: post.id, type: post.activity_type === 'dispatch' ? 'dispatch' : 'entry' })}
                  className="p-4 rounded-full bg-white/5 hover:bg-white/10 text-white transition-all flex items-center gap-2"
                >
                  <MessageSquare size={20} />
                  <span className="text-xs font-bold tracking-widest uppercase">Comment</span>
                </button>

                <button 
                  onClick={() => handleReArchive(post.id, post.activity_type === 'dispatch' ? 'dispatch' : 'entry')}
                  className="p-4 rounded-full bg-white/5 hover:bg-white/10 text-white transition-all"
                >
                  <Repeat2 size={20} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <CommentDrawer 
        isOpen={!!activeCommentPost}
        onClose={() => setActiveCommentPost(null)}
        activityId={activeCommentPost?.id || ''}
        activityType={activeCommentPost?.type || ''}
        userId={userId}
      />

      <style jsx global>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
