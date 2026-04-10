'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, MessageSquare, Repeat2, ExternalLink, Users, Globe, UserPlus, Sparkles, MoreHorizontal, Trash2, Edit3, X, Loader2 } from 'lucide-react';
import GlassPanel from '@/components/ui/GlassPanel';
import { ClassificationName, CLASSIFICATION_COLORS, MEDIA_TYPE_LABELS } from '@/lib/design-tokens';
import { cn, formatDate, formatUsername } from '@/lib/utils';
import Image from 'next/image';
import Link from 'next/link';
import { reArchiveMediaAction } from '@/lib/actions';
import { deleteDispatchAction, updateDispatchAction } from '@/lib/social-dispatch-actions';
import { toast } from 'sonner';
import ReactionButton from '@/components/social/ReactionButton';
import CommentDrawer from '@/components/social/CommentDrawer';
import CommunityComposer from './CommunityComposer';
import CinematicAvatar from '@/components/layout/CinematicAvatar';

type FeedLane = 'for_you' | 'following' | 'latest';

interface ClientCommunityProps {
  initialFeed: any[];
  initialFollowingFeed: any[];
  initialGlobalFeedError?: boolean;
  initialFollowingFeedError?: boolean;
  preferredStyles?: string[];
  suggestedPeople?: Array<{ id: string; username: string; display_name: string | null }>;
  userId: string | null;
  user: any;
  profile: any;
}

export default function ClientCommunity({
  initialFeed,
  initialFollowingFeed,
  initialGlobalFeedError = false,
  initialFollowingFeedError = false,
  preferredStyles = [],
  suggestedPeople = [],
  userId,
  user,
  profile
}: ClientCommunityProps) {
  const router = useRouter();
  const [activeLane, setActiveLane] = useState<FeedLane>('for_you');
  const [density, setDensity] = useState<'comfortable' | 'compact'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('community-density') as 'comfortable' | 'compact') || 'comfortable';
    }
    return 'comfortable';
  });
  const [liveMode, setLiveMode] = useState(true);
  const [lastUpdatedAt, setLastUpdatedAt] = useState(Date.now());
  const [nowTick, setNowTick] = useState(Date.now());
  const [globalFeed, setGlobalFeed] = useState(initialFeed);
  const [followingFeed, setFollowingFeed] = useState(initialFollowingFeed);
  const [globalFeedError, setGlobalFeedError] = useState(initialGlobalFeedError);
  const [followingFeedError, setFollowingFeedError] = useState(initialFollowingFeedError);

  // Comment Drawer State
  const [activeCommentPost, setActiveCommentPost] = useState<{ id: string, type: string } | null>(null);

  const forYouBase = useMemo(() => {
    const ranked = [...globalFeed];
    return ranked.sort((a, b) => {
      const aHeat = (a.reaction_count || 0) + (a.repost_count || 0) * 2 + (preferredStyles.includes(a.classification || a.vibe || '') ? 2 : 0);
      const bHeat = (b.reaction_count || 0) + (b.repost_count || 0) * 2 + (preferredStyles.includes(b.classification || b.vibe || '') ? 2 : 0);
      return bHeat - aHeat;
    });
  }, [globalFeed, preferredStyles]);
  const latestBase = useMemo(
    () => [...globalFeed].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
    [globalFeed]
  );
  const baseFeed = activeLane === 'following' ? followingFeed : activeLane === 'latest' ? latestBase : forYouBase;
  const feed = baseFeed;
  const hasFetchError = activeLane === 'following' ? followingFeedError : globalFeedError;
  const isFollowingEmpty = activeLane === 'following' && followingFeed.length === 0;

  // Edit Post State
  const [editingPost, setEditingPost] = useState<any | null>(null);

  async function handleReArchive(originalId: string, type?: 'entry' | 'dispatch' | 'screening') {
    try {
      const result = await reArchiveMediaAction({ originalEntryId: originalId, type });
      if (!result?.success) {
        toast.error('Unable to repost right now');
        return null;
      }
      toast.success(result.reposted ? 'Reposted' : 'Repost removed');
      return result;
    } catch {
      toast.error('Authentication required');
      return null;
    }
  }

  async function handleDeletePost(postId: string) {
    if (!confirm('Are you sure you want to delete this post?')) return;
    try {
      const res = await deleteDispatchAction(postId);
      if (res.success) {
        setGlobalFeed((prev) => prev.filter((p) => p.id !== postId));
        setFollowingFeed((prev) => prev.filter((p) => p.id !== postId));
        toast.success('Post deleted');
      } else {
        toast.error(res.error || 'Failed to delete');
      }
    } catch {
      toast.error('Failed to delete post');
    }
  }

  const handleComposerPublish = (newPost: any) => {
    setGlobalFeedError(false);
    setGlobalFeed((prev) => [newPost, ...prev]);
    setLastUpdatedAt(Date.now());
  };

  const handlePostUpdated = (updatedPost: any) => {
    const update = (list: any[]) => list.map((p) => (p.id === updatedPost.id ? { ...p, ...updatedPost } : p));
    setGlobalFeed((prev) => update(prev));
    setFollowingFeed((prev) => update(prev));
  };

  const feedSummary = useMemo(
    () => ({
      global: globalFeed.length,
      following: followingFeed.length,
    }),
    [globalFeed.length, followingFeed.length]
  );
  const repostedByFollowingTotal = useMemo(
    () => feed.reduce((acc, p) => acc + Number(p.reposted_by_following_count || 0), 0),
    [feed]
  );
  const newSince = useMemo(
    () => feed.filter((p) => Date.now() - new Date(p.created_at).getTime() < 1000 * 60 * 30).length,
    [feed]
  );

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('community-density', density);
    }
  }, [density]);

  useEffect(() => {
    if (!liveMode) return;
    const timer = window.setInterval(() => {
      setLastUpdatedAt(Date.now());
      router.refresh();
    }, 45000);
    return () => window.clearInterval(timer);
  }, [liveMode, router]);

  useEffect(() => {
    const timer = window.setInterval(() => setNowTick(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="pb-10 md:pb-20 max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
      {/* Edit Modal */}
      <AnimatePresence>
        {editingPost && (
          <EditPostModal 
            post={editingPost} 
            onClose={() => setEditingPost(null)} 
            onUpdated={handlePostUpdated}
          />
        )}
      </AnimatePresence>
      {/* Header */}
      <header className="sticky top-0 z-40 pt-4 sm:pt-5 md:pt-6 pb-3 sm:pb-4 px-1 sm:px-2 md:px-0 mb-4 sm:mb-6 md:mb-10 bg-black/80 backdrop-blur-xl border-b border-white/10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="flex items-center justify-between w-full md:w-auto">
            <div>
              <h1 className="font-heading text-2xl sm:text-3xl md:text-5xl tracking-tighter italic text-white drop-shadow-sm leading-none mb-1">
                Community <span className="text-white/40">feed</span>
              </h1>
            </div>
            <Link
              href="/people"
              className="md:hidden flex items-center justify-center w-9 h-9 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
            >
              <UserPlus size={16} />
            </Link>
          </div>

          <div className="flex items-center gap-2 sm:gap-4 justify-between md:justify-end">
            {/* Tab Toggle */}
            <div className="flex gap-1 p-1 rounded-full bg-white/10 border border-white/5 overflow-x-auto scrollbar-hide max-w-full">
              {([
                { id: 'for_you' as FeedLane, label: 'For You', icon: Sparkles },
                { id: 'following' as FeedLane, label: 'Following', icon: Users },
                { id: 'latest' as FeedLane, label: 'Latest', icon: Globe },
              ] as const).map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveLane(id)}
                  className={cn(
                    'relative flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-full font-heading text-[11px] sm:text-xs tracking-wider transition-all duration-300 whitespace-nowrap',
                    activeLane === id
                      ? 'text-black'
                      : 'text-white/60 hover:text-white'
                  )}
                >
                  {activeLane === id && (
                    <motion.div
                      layoutId="tab-pill"
                      className="absolute inset-0 bg-white rounded-full"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-1.5 font-bold">
                    <Icon size={13} />
                    {label}
                    <span className="text-[10px] opacity-70">
                      ({id === 'following' ? feedSummary.following : feedSummary.global})
                    </span>
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

      <div className="mb-4 sm:mb-5 sticky top-[78px] sm:top-[92px] z-30 bg-black/70 backdrop-blur-md border border-white/10 rounded-2xl px-2.5 sm:px-3 py-2 flex flex-wrap items-center gap-1.5 sm:gap-2">
        <span className="text-[10px] uppercase tracking-widest text-white/50">
          {newSince} new
        </span>
        <span className="text-[10px] uppercase tracking-widest text-white/50">
          {repostedByFollowingTotal} reposted by people you follow
        </span>
        <span className="text-[10px] uppercase tracking-widest text-white/35">
          Updated {Math.max(0, Math.floor((nowTick - lastUpdatedAt) / 1000))}s ago
        </span>
        <button
          onClick={() => {
            setLastUpdatedAt(Date.now());
            router.refresh();
          }}
          className="ml-auto px-2.5 sm:px-3 py-1 rounded-full border border-white/10 text-[10px] uppercase tracking-widest text-white/70 hover:text-white"
        >
          Refresh
        </button>
        <button
          onClick={() => setLiveMode((v) => !v)}
          className={cn(
            "px-3 py-1 rounded-full border text-[10px] uppercase tracking-widest",
            liveMode ? "border-emerald-500/40 text-emerald-300" : "border-white/15 text-white/60"
          )}
        >
          {liveMode ? 'Live' : 'Paused'}
        </button>
        <button
          onClick={() => setDensity((d) => (d === 'comfortable' ? 'compact' : 'comfortable'))}
          className="px-3 py-1 rounded-full border border-white/10 text-[10px] uppercase tracking-widest text-white/70"
        >
          {density === 'comfortable' ? 'Comfortable' : 'Compact'}
        </button>
      </div>

      {/* Feed Area */}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_300px] gap-4 sm:gap-6 px-0 sm:px-1 md:px-0">
        <div>
        <div className="lg:hidden mb-4 flex gap-3 overflow-x-auto scrollbar-hide">
          <div className="min-w-[220px] rounded-2xl border border-white/10 bg-white/3 p-3">
            <p className="text-[10px] uppercase tracking-widest text-white/50 mb-2">People to follow</p>
            {suggestedPeople.slice(0, 3).map((p) => (
              <Link key={p.id} href={`/profile/${formatUsername(p.username)}`} className="block text-xs text-white/80 py-0.5 hover:text-white">
                {formatUsername(p.display_name || p.username)}
              </Link>
            ))}
          </div>
          <div className="min-w-[220px] rounded-2xl border border-white/10 bg-white/3 p-3">
            <p className="text-[10px] uppercase tracking-widest text-white/50 mb-2">Top discussions</p>
            {feed
              .slice()
              .sort((a: any, b: any) => (b.comment_count || 0) - (a.comment_count || 0))
              .slice(0, 3)
              .map((p: any) => (
                <button key={p.id} onClick={() => setActiveCommentPost({ id: p.id, type: p.activity_type })} className="block w-full text-left text-xs text-white/75 py-0.5 hover:text-white truncate">
                  {p.content || p.title || 'Post'}
                </button>
              ))}
          </div>
        </div>
        <AnimatePresence mode="wait">
          {hasFetchError ? (
            <motion.div
              key="error-state"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="py-20 flex flex-col items-center text-center"
            >
              <div className="w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mb-6">
                <X className="text-rose-300" size={24} />
              </div>
              <p className="font-heading text-2xl tracking-tighter italic text-white/70 mb-2">
                Could not load feed
              </p>
              <p className="font-metadata text-[10px] text-white/30 tracking-widest mb-8 max-w-xs leading-relaxed">
                This looks like a temporary fetch issue. Try refreshing.
              </p>
              <button
                onClick={() => router.refresh()}
                className="px-6 py-3 rounded-full bg-white text-black font-heading text-xs tracking-widest hover:bg-white/90 transition-colors font-bold shadow-lg"
              >
                Retry
              </button>
            </motion.div>
          ) : isFollowingEmpty ? (
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
              key={activeLane}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-6 md:space-y-8"
            >
              <CommunityComposer user={user} profile={profile} onPublished={handleComposerPublish} />
            {feed.map((post, index) => (
              <FeedPost
                key={`${activeLane}-${post.id}`}
                post={post}
                index={index}
                preferredStyles={preferredStyles}
                onReArchive={handleReArchive}
                onOpenComments={(id, type) => setActiveCommentPost({ id, type })}
                onDelete={handleDeletePost}
                onEdit={setEditingPost}
                onUpdated={handlePostUpdated}
                density={density}
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
                Use the composer to publish the first post.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
        </div>

        <aside className="hidden lg:flex flex-col gap-3 sticky top-[160px] h-fit">
          <div className="rounded-2xl border border-white/10 bg-white/3 p-4">
            <p className="text-[10px] uppercase tracking-widest text-white/50 mb-3">People to follow</p>
            {suggestedPeople.slice(0, 4).map((p) => (
              <Link key={p.id} href={`/profile/${formatUsername(p.username)}`} className="block text-xs text-white/80 py-1 hover:text-white">
                {formatUsername(p.display_name || p.username)}
              </Link>
            ))}
            <Link href="/people" className="inline-block mt-2 text-[10px] uppercase tracking-widest text-white/60 hover:text-white">View all</Link>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/3 p-4">
            <p className="text-[10px] uppercase tracking-widest text-white/50 mb-3">Top discussions</p>
            {feed
              .slice()
              .sort((a: any, b: any) => (b.comment_count || 0) - (a.comment_count || 0))
              .slice(0, 3)
              .map((p: any) => (
                <button key={p.id} onClick={() => setActiveCommentPost({ id: p.id, type: p.activity_type })} className="block w-full text-left text-xs text-white/75 py-1 hover:text-white truncate">
                  {p.content || p.title || 'Post'}
                </button>
              ))}
          </div>
        </aside>
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

function EditPostModal({ post, onClose, onUpdated }: { post: any; onClose: () => void; onUpdated: (post: any) => void }) {
  const [content, setContent] = useState(post.content || '');
  const [vibe, setVibe] = useState<ClassificationName>(post.classification as ClassificationName || 'Atmospheric');
  const [isPending, startTransition] = useTransition();

  const handleUpdate = () => {
    startTransition(async () => {
      const res = await updateDispatchAction(post.id, { content, classification: vibe });
      if (res.success) {
        onUpdated({
          ...post,
          content,
          classification: vibe,
        });
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
  onUpdated,
  density,
  currentUserId
}: {
  post: any;
  index: number;
  preferredStyles: string[];
  onReArchive: (id: string, type?: 'entry' | 'dispatch' | 'screening') => Promise<any>;
  onOpenComments: (id: string, type: string) => void;
  onDelete: (id: string) => void;
  onEdit: (post: any) => void;
  onUpdated: (post: any) => void;
  density: 'comfortable' | 'compact';
  currentUserId: string | null;
}) {
  const resolvedClassification = (post.classification || post.vibe || 'Atmospheric') as ClassificationName;
  const isPreferred = preferredStyles.includes(resolvedClassification);
  const accentColor = CLASSIFICATION_COLORS[resolvedClassification];
  const isOwner = currentUserId === post.user_id;

  const [showOptions, setShowOptions] = useState(false);

  // Check if post is editable (15 mins)
  const canEdit = isOwner && (post.activity_type === 'dispatch' || post.activity_type === 're_archive') && (
    (Date.now() - new Date(post.created_at).getTime()) < 15 * 60 * 1000
  );

  const activityType = post.activity_type === 'dispatch'
        ? 'dispatch'
        : post.activity_type === 'screening'
          ? 'screening'
          : 'entry';
  const [repostCount, setRepostCount] = useState(post.repost_count || 0);
  const [hasReposted, setHasReposted] = useState(!!post.has_reposted);
  const [repostedByFollowingCount, setRepostedByFollowingCount] = useState(post.reposted_by_following_count || 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.07, 0.5), duration: 0.5 }}
    >
      <article
        className={cn(
          'transition-all bg-white/2 border backdrop-blur-md rounded-2xl md:rounded-3xl relative group overflow-hidden',
          density === 'comfortable' ? 'p-4 md:p-6' : 'p-3 md:p-4',
          isPreferred
            ? 'border-white/20 shadow-[0_4px_40px_rgba(255,255,255,0.03)]'
            : 'border-white/5 hover:border-white/10 hover:bg-white/4'
        )}
      >
        {/* Context Badge (Industry Standard above avatar) */}
        <div className="flex items-center gap-2 mb-3 px-1">
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
          {(post.is_mutual || post.follows_you || (post.comment_count || 0) >= 5) && (
            <div className="ml-auto flex items-center gap-1.5">
              {post.is_mutual && <span className="text-[8px] px-2 py-0.5 rounded-full bg-white/10 text-white/70 uppercase tracking-widest">Mutual</span>}
              {!post.is_mutual && post.follows_you && <span className="text-[8px] px-2 py-0.5 rounded-full bg-white/10 text-white/70 uppercase tracking-widest">Follows you</span>}
              {(post.comment_count || 0) >= 5 && <span className="text-[8px] px-2 py-0.5 rounded-full bg-white/10 text-white/70 uppercase tracking-widest">Frequent reviewer</span>}
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
                style={resolvedClassification}
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
            {post.activity_type === 'dispatch' ? (
              <p className="text-white/90 text-[15px] md:text-base font-heading leading-relaxed whitespace-pre-wrap">{post.content}</p>
            ) : post.comment && (
              <p className="text-white/80 font-heading leading-relaxed text-[15px]">{post.comment}</p>
            )}

            {repostedByFollowingCount > 0 && (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-[9px] uppercase tracking-widest text-white/60">
                <Repeat2 size={11} />
                Reposted by {repostedByFollowingCount} you follow
              </div>
            )}

            {/* Media Attachment */}
            {post.activity_type === 'dispatch' && post.media_refs?.length > 0 ? (
               <div className="flex gap-3 overflow-x-auto pb-2 pt-2 scrollbar-hide -mx-1 px-1">
                  {post.media_refs.map((m: any, i: number) => (
                    <Link key={i} href={`/media/${m.type}/${m.id}`} className="w-[96px] sm:w-[110px] shrink-0 block">
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
                  <div className="flex gap-3 sm:gap-4 p-2 sm:p-2.5 pr-3 sm:pr-4 rounded-2xl bg-white/3 border border-white/5 hover:bg-white/6 hover:border-white/15 transition-all group/media cursor-pointer">
                    <div className="relative w-[62px] sm:w-[72px] aspect-2/3 shrink-0 rounded-xl overflow-hidden bg-white/5 shadow-md">
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
                      <span className="font-heading text-sm sm:text-base font-bold text-white truncate drop-shadow-sm">{post.title}</span>
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
                onClick={async () => {
                  const repostType = post.activity_type === 'dispatch' ? 'dispatch' : post.activity_type === 'screening' ? 'screening' : 'entry';
                  const result = await onReArchive(post.id, repostType);
                  if (!result?.success) return;
                  setHasReposted(!!result.reposted);
                  setRepostCount(result.repostCount || 0);
                  setRepostedByFollowingCount(result.repostedByFollowingCount || 0);
                }}
                className={cn(
                  "flex items-center gap-2 transition-colors text-[11px] font-metadata tracking-widest font-bold group/btn py-2 ml-auto",
                  hasReposted ? "text-white" : "text-white/40 hover:text-white"
                )}
              >
                <div className={cn("p-1.5 rounded-full transition-colors", hasReposted ? "bg-white/15" : "bg-white/5 group-hover/btn:bg-white/10")}>
                  <Repeat2 size={14} />
                </div>
                <span className="hidden sm:inline">Repost</span>
                <span>{repostCount}</span>
              </button>
              <button
                onClick={() => {
                  const seed = post.content ? `Repost with note:\n\n"${post.content}"\n\n` : 'Repost with note:\n\n';
                  window.dispatchEvent(new CustomEvent('community-repost-note', { detail: { text: seed } }));
                }}
                className="flex items-center gap-2 text-white/35 hover:text-white transition-colors text-[11px] font-metadata tracking-widest font-bold group/btn py-2"
              >
                <div className="p-1.5 rounded-full bg-white/5 group-hover/btn:bg-white/10 transition-colors">
                  <Edit3 size={14} />
                </div>
                <span className="hidden sm:inline">Repost + note</span>
              </button>
            </div>
            {/* Comment Previews */}
            {post.recent_comments && post.recent_comments.length > 0 && (
              <div className="mt-2 space-y-1.5 pt-3 border-t border-white/5">
                {post.recent_comments.map((c: any) => (
                  <div key={c.id} className="text-[12px] sm:text-[13px] font-heading leading-snug">
                    <span className="font-bold text-white/90 mr-2">{c.username}</span>
                    <span className="text-white/60">{c.body}</span>
                  </div>
                ))}
                {(post.comment_count || 0) > 2 && (
                  <button
                    onClick={() => onOpenComments(post.id, activityType)}
                    className="inline-flex items-center gap-2 text-[11px] text-white/40 hover:text-white transition-colors font-metadata tracking-widest font-bold mt-2"
                  >
                    View all {post.comment_count} comments
                    <span className="px-2 py-0.5 rounded-full bg-white/10 text-[9px] uppercase">
                      {(post.comment_count || 0) - (post.recent_comments?.length || 0)} new replies
                    </span>
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
