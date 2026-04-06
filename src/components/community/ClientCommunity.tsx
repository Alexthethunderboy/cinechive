'use client';

import { useState, useTransition, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, MessageSquare, Repeat2, Heart, ExternalLink, Users, Globe, UserPlus, Sparkles, Film, MoreHorizontal, Trash2, Edit3, X, Zap, Loader2 } from 'lucide-react';
import GlassPanel from '@/components/ui/GlassPanel';
import { ClassificationName, CLASSIFICATION_COLORS, CLASSIFICATION_STYLE_COLORS, MEDIA_TYPE_LABELS } from '@/lib/design-tokens';
import { cn, formatDate, formatUsername } from '@/lib/utils';
import Image from 'next/image';
import Link from 'next/link';
import { getCommunityFeed } from '@/lib/actions';
import { reArchiveMediaAction } from '@/lib/actions';
import { deleteDispatchAction, updateDispatchAction } from '@/lib/social-dispatch-actions';
import { toast } from 'sonner';
import ReactionButton from '@/components/social/ReactionButton';
import CommentDrawer from '@/components/social/CommentDrawer';
import CommunityComposer from './CommunityComposer';
import CinematicAvatar from '@/components/layout/CinematicAvatar';

type FeedTab = 'global' | 'following';

interface ClientCommunityProps {
  initialFeed: any[];
  initialFollowingFeed: any[];
  preferredStyles?: string[];
  userId: string | null;
  user: any;
  profile: any;
}

export default function ClientCommunity({
  initialFeed,
  initialFollowingFeed,
  preferredStyles = [],
  userId,
  user,
  profile
}: ClientCommunityProps) {
  const [activeTab, setActiveTab] = useState<FeedTab>('global');
  const [globalFeed] = useState(initialFeed);
  const [followingFeed] = useState(initialFollowingFeed);
  const [isPending, startTransition] = useTransition();

  // Comment Drawer State
  const [activeCommentPost, setActiveCommentPost] = useState<{ id: string, type: string } | null>(null);

  const feed = activeTab === 'following' ? followingFeed : globalFeed;
  const isFollowingEmpty = activeTab === 'following' && followingFeed.length === 0;

  // Edit Post State
  const [editingPost, setEditingPost] = useState<any | null>(null);

  async function handleReArchive(originalId: string, classification: ClassificationName, type?: 'entry' | 'dispatch') {
    try {
      await reArchiveMediaAction({ originalEntryId: originalId, classification, type });
      toast.success('Reposted to feed');
      window.dispatchEvent(new CustomEvent('refresh-notifications'));
    } catch {
      toast.error('Authentication required');
    }
  }

  async function handleDeletePost(postId: string) {
    if (!confirm('Are you sure you want to delete this post?')) return;
    try {
      const res = await deleteDispatchAction(postId);
      if (res.success) {
        toast.success('Post deleted');
      } else {
        toast.error(res.error || 'Failed to delete');
      }
    } catch {
      toast.error('Failed to delete post');
    }
  }

  return (
    <div className="pb-10 md:pb-20 max-w-2xl mx-auto md:px-0">
      {/* Edit Modal */}
      <AnimatePresence>
        {editingPost && (
          <EditPostModal 
            post={editingPost} 
            onClose={() => setEditingPost(null)} 
          />
        )}
      </AnimatePresence>
      {/* Header */}
      <header className="sticky top-0 z-40 pt-6 pb-4 px-4 md:px-0 mb-6 md:mb-10 bg-black/80 backdrop-blur-xl border-b border-white/10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="flex items-center justify-between w-full md:w-auto">
            <div>
              <h1 className="font-heading text-3xl md:text-5xl tracking-tighter italic text-white drop-shadow-sm leading-none mb-1">
                Community <span className="text-white/40">feed</span>
              </h1>
              <p className="text-white/40 font-metadata text-[9px] flex items-center gap-1.5 tracking-widest font-bold">
                <span className="w-1 h-1 rounded-full bg-green-400 animate-pulse" />
                Live cinematic activity
              </p>
            </div>
            <Link
              href="/people"
              className="md:hidden flex items-center justify-center w-9 h-9 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
            >
              <UserPlus size={16} />
            </Link>
          </div>

          <div className="flex items-center gap-4 justify-between md:justify-end">
            {/* Tab Toggle */}
            <div className="flex gap-1 p-1 rounded-full bg-white/10 border border-white/5">
              {([
                { id: 'global' as FeedTab,    label: 'Global',    icon: Globe },
                { id: 'following' as FeedTab, label: 'Following', icon: Users },
              ] as const).map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={cn(
                    'relative flex items-center gap-2 px-4 py-1.5 rounded-full font-heading text-xs tracking-wider transition-all duration-300',
                    activeTab === id
                      ? 'text-black'
                      : 'text-white/60 hover:text-white'
                  )}
                >
                  {activeTab === id && (
                    <motion.div
                      layoutId="tab-pill"
                      className="absolute inset-0 bg-white rounded-full"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-1.5 font-bold">
                    <Icon size={13} />
                    {label}
                  </span>
                </button>
              ))}
            </div>

            <Link
              href="/people"
              className="hidden md:flex items-center gap-2 px-5 py-2 rounded-full bg-white text-black hover:bg-white/90 transition-all font-heading text-xs tracking-widest font-bold shadow-lg"
            >
              <UserPlus size={14} />
              <span>Find Friends</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Feed Area */}
      <div className="px-4 md:px-0">
        <AnimatePresence mode="wait">
          {isFollowingEmpty ? (
            <motion.div
              key="empty-following"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="py-24 flex flex-col items-center text-center"
            >
              <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-6">
                <Users className="text-white/20" size={32} />
              </div>
              <p className="font-heading text-2xl tracking-tighter italic text-white/60 mb-2">
                No one yet
              </p>
              <p className="font-metadata text-[10px] text-white/30 tracking-widest mb-8 max-w-xs leading-relaxed">
                Follow other cinephiles to see their activity here.
              </p>
              <Link
                href="/people"
                className="px-6 py-3 rounded-full bg-white text-black font-heading text-xs tracking-widest hover:bg-white/90 transition-colors font-bold shadow-lg"
              >
                Find Cinephiles
              </Link>
            </motion.div>
          ) : feed.length > 0 ? (
            <motion.div
              key={activeTab}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-6 md:space-y-8"
            >
              <CommunityComposer user={user} profile={profile} />
            {feed.map((post, index) => (
              <FeedPost
                key={`${activeTab}-${post.id}`}
                post={post}
                index={index}
                preferredStyles={preferredStyles}
                onReArchive={handleReArchive}
                onOpenComments={(id, type) => setActiveCommentPost({ id, type })}
                onDelete={handleDeletePost}
                onEdit={setEditingPost}
                currentUserId={userId}
              />
            ))}
          </motion.div>
          ) : (
            <motion.div
              key="empty-global"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-24 flex flex-col items-center text-center"
            >
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-6">
                <Activity className="text-white/20" size={32} />
              </div>
              <p className="font-heading text-2xl tracking-tighter italic text-white/50 mb-2">
                No activity yet
              </p>
              <p className="font-metadata text-[10px] text-white/30 tracking-widest">
                Start adding to your library to share with the community.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <CommentDrawer 
        isOpen={!!activeCommentPost}
        onClose={() => setActiveCommentPost(null)}
        activityId={activeCommentPost?.id || ''}
        activityType={activeCommentPost?.type || ''}
        userId={userId}
      />
    </div>
  );
}

// ─── Edit Post Modal ─────────────────────────────────────────────────────────

function EditPostModal({ post, onClose }: { post: any; onClose: () => void }) {
  const [content, setContent] = useState(post.content || '');
  const [vibe, setVibe] = useState<ClassificationName>(post.classification as ClassificationName || 'Atmospheric');
  const [isPending, startTransition] = useTransition();

  const handleUpdate = () => {
    startTransition(async () => {
      const res = await updateDispatchAction(post.id, { content, classification: vibe });
      if (res.success) {
        toast.success('Post updated');
        onClose();
      } else {
        toast.error(res.error || 'Failed to update');
      }
    });
  };

  const vibes: ClassificationName[] = [
    'Atmospheric', 'Noir', 'Visceral', 'Avant-Garde', 'Melancholic', 'Legacy', 'Provocative', 'Essential'
  ];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="w-full max-w-xl bg-[#0a0a0a] border border-white/10 rounded-[32px] overflow-hidden shadow-2xl relative"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6 md:p-8 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-white/5 border border-white/10 text-accent">
                <Edit3 size={20} />
              </div>
              <div>
                <h3 className="font-heading text-xl text-white italic tracking-tighter">Edit post</h3>
                <p className="text-[9px] text-white/30 tracking-[0.2em] font-bold">Refine your cinematic thought</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-white/5 text-white/30 hover:text-white transition-all">
              <X size={20} />
            </button>
          </div>

          <div className="space-y-4">
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              className="w-full min-h-[160px] bg-white/3 border border-white/10 rounded-2xl p-5 text-white font-heading text-lg focus:ring-1 focus:ring-accent/20 focus:border-accent/30 transition-all resize-none outline-none"
              placeholder="Refine your thoughts..."
            />

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {vibes.map(v => (
                <button
                  key={v}
                  onClick={() => setVibe(v)}
                  className={cn(
                    "px-3 py-2.5 rounded-xl text-[10px] font-bold tracking-widest transition-all border",
                    vibe === v 
                      ? "bg-white text-black border-white shadow-lg" 
                      : "bg-white/5 border-white/5 text-white/40 hover:bg-white/10 hover:text-white"
                  )}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/5">
            <button onClick={onClose} className="px-6 py-2.5 rounded-xl text-white/40 hover:text-white text-[11px] font-bold tracking-widest transition-all">
              Cancel
            </button>
            <button 
              onClick={handleUpdate}
              disabled={isPending || !content.trim()}
              className="px-8 py-3 rounded-xl bg-white text-black hover:bg-white/90 disabled:opacity-50 text-[11px] font-bold tracking-widest transition-all shadow-xl shadow-white/5 flex items-center gap-2"
            >
              {isPending && <Loader2 className="animate-spin" size={14} />}
              <span>Save Changes</span>
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Formatting Helpers ───────────────────────────────────────────────────────

function FeedPost({
  post,
  index,
  preferredStyles,
  onReArchive,
  onOpenComments,
  onDelete,
  onEdit,
  currentUserId
}: {
  post: any;
  index: number;
  preferredStyles: string[];
  onReArchive: (id: string, classification: ClassificationName, type?: 'entry' | 'dispatch') => void;
  onOpenComments: (id: string, type: string) => void;
  onDelete: (id: string) => void;
  onEdit: (post: any) => void;
  currentUserId: string | null;
}) {
  const isPreferred = preferredStyles.includes(post.classification);
  const accentColor = CLASSIFICATION_COLORS[post.classification as ClassificationName];
  const isOwner = currentUserId === post.user_id;

  const [showOptions, setShowOptions] = useState(false);

  // Check if post is editable (15 mins)
  const canEdit = isOwner && (post.activity_type === 'dispatch' || post.activity_type === 're_archive') && (
    (Date.now() - new Date(post.created_at).getTime()) < 15 * 60 * 1000
  );

  const activityType = post.activity_type === 're_archive' 
    ? 're_archive' 
    : post.activity_type === 'echo' 
      ? 'echo' 
      : post.activity_type === 'dispatch'
        ? 'dispatch'
        : post.activity_type === 'screening'
          ? 'screening'
          : 'entry';

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.07, 0.5), duration: 0.5 }}
    >
      <article
        className={cn(
          'p-4 md:p-6 transition-all bg-white/2 border backdrop-blur-md rounded-2xl md:rounded-3xl relative group overflow-hidden',
          isPreferred
            ? 'border-white/20 shadow-[0_4px_40px_rgba(255,255,255,0.03)]'
            : 'border-white/5 hover:border-white/10 hover:bg-white/4'
        )}
      >
        {/* Context Badge (Industry Standard above avatar) */}
        <div className="flex items-center gap-2 mb-3 px-1">
          {post.activity_type === 're_archive' && (
            <div className="text-white/40 font-metadata text-[9px] font-bold tracking-widest flex items-center gap-1.5">
              <Repeat2 size={12} className="text-white" /> {formatUsername(post.reposter_username)} reposted
            </div>
          )}
          {post.activity_type === 'echo' && (
            <div className="text-vibe-cyan font-metadata text-[9px] font-bold tracking-widest flex items-center gap-1.5">
              <MessageSquare size={12} /> {formatUsername(post.username)} created a note
            </div>
          )}
          {post.activity_type === 'dispatch' && (
            <div className="text-accent font-metadata text-[9px] font-bold tracking-widest flex items-center gap-1.5">
              <Sparkles size={12} /> {formatUsername(post.username)} shared a post
            </div>
          )}
          {post.activity_type === 'screening' && (
            <div className="text-vibe-teal font-metadata text-[9px] font-bold tracking-widest flex items-center gap-1.5">
              <Activity size={12} /> {formatUsername(post.username)} logged a screening
            </div>
          )}
        </div>


        <div className="flex gap-4">
          {/* Avatar */}
          <div className="shrink-0 pt-0.5">
            <Link href={`/profile/${formatUsername(post.username)}`} className="block">
              <CinematicAvatar 
                src={post.avatar_url} 
                username={post.username} 
                size="md" 
                style={post.classification as ClassificationName} 
              />
            </Link>
          </div>

          <div className="flex-1 min-w-0 flex flex-col gap-3">
            {/* Post Header Info */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex flex-col min-w-0">
                <Link href={`/profile/${formatUsername(post.username)}`} className="font-heading text-white text-base hover:text-white/70 transition-colors py-0 leading-none">
                  {formatUsername(post.username) || 'Cinephile'}
                </Link>
                <span className="font-metadata text-[10px] text-white/30 tracking-wider mt-1">{formatDate(post.created_at)}</span>
              </div>
              
              <div className="flex items-center gap-2 shrink-0">
                <div
                  className="px-2 py-0.5 rounded-md font-metadata text-[7px] md:text-[8px] font-bold tracking-widest"
                  style={{
                    backgroundColor: `${accentColor}15`,
                    color: accentColor,
                    border: `1px solid ${accentColor}30`,
                  }}
                >
                  {post.classification}
                </div>

              {/* Options Menu */}
              {isOwner && (
                <div className="relative">
                  <button 
                    onClick={() => setShowOptions(!showOptions)}
                    className="p-1 rounded-lg hover:bg-white/5 text-white/30 hover:text-white transition-all"
                    aria-label="More options"
                  >
                    <MoreHorizontal size={16} />
                  </button>

                  <AnimatePresence>
                    {showOptions && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                        className="absolute right-0 top-full mt-2 w-40 bg-black/95 backdrop-blur-3xl border border-white/10 rounded-2xl p-1.5 z-50 shadow-2xl"
                      >
                        {canEdit && (
                          <button
                            onClick={() => {
                              onEdit(post);
                              setShowOptions(false);
                            }}
                            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-white/10 text-white/70 hover:text-white text-[11px] font-bold uppercase tracking-widest transition-all"
                          >
                            <Edit3 size={14} />
                            <span>Edit</span>
                          </button>
                        )}
                        <button
                          onClick={() => {
                            onDelete(post.id);
                            setShowOptions(false);
                          }}
                          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 text-[11px] font-bold uppercase tracking-widest transition-all"
                        >
                          <Trash2 size={14} />
                          <span>Delete</span>
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </div>

            {/* Post Content */}
            {post.activity_type === 'echo' ? (
              <div className="relative px-5 py-4 mt-1 rounded-2xl bg-white/5 border border-white/10 text-white/90 font-heading text-[15px] leading-relaxed">
                <span className="absolute -top-3 left-2 text-4xl text-white/10 select-none font-serif">"</span>
                <span className="relative z-10">{post.content}</span>
                <span className="absolute -bottom-8 right-2 text-4xl text-white/10 select-none font-serif rotate-180">"</span>
              </div>
            ) : post.activity_type === 'dispatch' ? (
              <p className="text-white/90 text-[15px] md:text-base font-heading leading-relaxed whitespace-pre-wrap">{post.content}</p>
            ) : post.comment && (
              <p className="text-white/80 font-heading leading-relaxed text-[15px]">{post.comment}</p>
            )}

            {/* Media Attachment */}
            {post.activity_type === 'dispatch' && post.media_refs?.length > 0 ? (
               <div className="flex gap-3 overflow-x-auto pb-2 pt-2 scrollbar-hide -mx-1 px-1">
                  {post.media_refs.map((m: any, i: number) => (
                    <Link key={i} href={`/media/${m.type}/${m.id}`} className="w-[110px] shrink-0 block">
                       <div className="relative aspect-2/3 rounded-xl overflow-hidden border border-white/10 hover:border-white/30 transition-all shadow-lg group/subitem bg-white/5">
                          {m.posterUrl && <Image src={m.posterUrl} alt={m.title} fill className="object-cover group-hover/subitem:scale-105 transition-transform duration-500" />}
                          <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/20 to-transparent opacity-100 flex items-end p-3">
                             <p className="text-[10px] font-bold text-white font-heading truncate leading-tight w-full drop-shadow-md">{m.title}</p>
                          </div>
                       </div>
                    </Link>
                  ))}
               </div>
            ) : post.media_id ? (
              <div className="pt-2">
                <Link href={`/media/${post.media_type}/${post.media_id}`} className="block">
                  <div className="flex gap-4 p-2 pr-4 rounded-2xl bg-white/3 border border-white/5 hover:bg-white/6 hover:border-white/15 transition-all group/media cursor-pointer">
                    <div className="relative w-[72px] aspect-2/3 shrink-0 rounded-xl overflow-hidden bg-white/5 shadow-md">
                      {post.poster_url && (
                        <Image
                          src={post.poster_url}
                          alt={post.title}
                          fill
                          className="object-cover group-hover/media:scale-105 transition-transform duration-500"
                        />
                      )}
                    </div>
                    <div className="flex flex-col justify-center min-w-0 py-1">
                      <span className="font-metadata text-[9px] text-white/40 tracking-[0.2em] mb-1.5 font-bold">
                        {MEDIA_TYPE_LABELS[post.media_type as keyof typeof MEDIA_TYPE_LABELS] || post.media_type}
                      </span>
                      <span className="font-heading text-base font-bold text-white truncate drop-shadow-sm">{post.title}</span>
                      <span className="font-metadata text-[10px] text-white/30 flex items-center gap-1.5 mt-2 transition-colors group-hover/media:text-white/60 uppercase tracking-widest font-bold">
                        View details <ExternalLink size={10} />
                      </span>
                    </div>
                  </div>
                </Link>
              </div>
            ) : null}

            {/* Action bar */}
            <div className="flex items-center gap-2 md:gap-6 pt-3 mt-1 border-t border-white/5">
              <ReactionButton 
                activityId={post.id}
                activityType={activityType}
                initialCount={post.reaction_count}
                initialReacted={post.has_reacted}
              />

              <button 
                onClick={() => onOpenComments(post.id, activityType)}
                className="flex items-center gap-2 text-white/40 hover:text-white transition-colors text-[11px] font-metadata tracking-widest font-bold group/btn py-2 ml-4 md:ml-0"
              >
                <div className="p-1.5 rounded-full bg-white/5 group-hover/btn:bg-white/10 transition-colors">
                  <MessageSquare size={14} />
                </div>
                <span>Comment</span>
              </button>

              <button
                onClick={() => {
                  const originalId = post.original_dispatch_id || post.original_entry_id || post.id;
                  const isDispatch = post.activity_type === 'dispatch' || post.original_dispatch_id;
                  onReArchive(originalId, post.classification as ClassificationName, isDispatch ? 'dispatch' : 'entry');
                }}
                className="flex items-center gap-2 text-white/40 hover:text-white transition-colors text-[11px] font-metadata tracking-widest font-bold group/btn py-2 ml-auto"
              >
                <div className="p-1.5 rounded-full bg-white/5 group-hover/btn:bg-white/10 transition-colors">
                  <Repeat2 size={14} />
                </div>
                <span className="hidden sm:inline">Collect</span>
              </button>
            </div>
            {/* Comment Previews */}
            {post.recent_comments && post.recent_comments.length > 0 && (
              <div className="mt-2 space-y-1.5 pt-3 border-t border-white/5">
                {post.recent_comments.map((c: any) => (
                  <div key={c.id} className="text-[13px] font-heading leading-snug">
                    <span className="font-bold text-white/90 mr-2">{c.username}</span>
                    <span className="text-white/60">{c.body}</span>
                  </div>
                ))}
                {(post.comment_count || 0) > 2 && (
                  <button 
                    onClick={() => onOpenComments(post.id, activityType)}
                    className="text-[11px] text-white/40 hover:text-white transition-colors font-metadata tracking-widest font-bold mt-2"
                  >
                    View all {post.comment_count} comments
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Ambient color accent */}
        <div
          className="absolute top-0 right-0 w-64 h-64 blur-[120px] -z-10 opacity-10 transition-opacity pointer-events-none rounded-full"
          style={{ backgroundColor: accentColor }}
        />
      </article>
    </motion.div>
  );
}
