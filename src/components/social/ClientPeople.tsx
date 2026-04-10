'use client';

import { useState, useTransition, useEffect, useMemo } from 'react';
import { Search, UserPlus, Sparkles, Loader2, Users, ArrowUpRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import GlassPanel from '@/components/ui/GlassPanel';
import { cn, formatUsername } from '@/lib/utils';
import { searchUsersAction, getSuggestedUsersAction, FollowUser } from '@/lib/social-actions';
import FollowButton from '@/components/social/FollowButton';
import Link from 'next/link';
import CinematicAvatar from '@/components/layout/CinematicAvatar';
import { ClassificationName } from '@/lib/design-tokens';

interface ClientPeopleProps {
  initialSuggestions: FollowUser[];
  initialFollowers: FollowUser[];
  initialFollowing: FollowUser[];
}

type PeopleTab = 'suggested' | 'followers' | 'following' | 'search';

export default function ClientPeople({ initialSuggestions, initialFollowers, initialFollowing }: ClientPeopleProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<FollowUser[]>([]);
  const [isSearching, startSearching] = useTransition();
  const [activeTab, setActiveTab] = useState<PeopleTab>('suggested');
  const [suggestions, setSuggestions] = useState(initialSuggestions);
  const [followers, setFollowers] = useState(initialFollowers);
  const [following, setFollowing] = useState(initialFollowing);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim().length >= 2) {
        handleSearch();
        setActiveTab('search');
      } else {
        setSearchResults([]);
        if (activeTab === 'search') setActiveTab('suggested');
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery, activeTab]);
  const visibleUsers = useMemo(
    () => activeTab === 'search' ? searchResults : activeTab === 'followers' ? followers : activeTab === 'following' ? following : suggestions,
    [activeTab, searchResults, followers, following, suggestions]
  );

  const handleFollowStateChange = (user: FollowUser, isFollowing: boolean) => {
    if (isFollowing) {
      setFollowing((prev) => (prev.some((u) => u.id === user.id) ? prev : [user, ...prev]));
      setSuggestions((prev) => prev.filter((u) => u.id !== user.id));
    } else {
      setFollowing((prev) => prev.filter((u) => u.id !== user.id));
      setSuggestions((prev) => (prev.some((u) => u.id === user.id) ? prev : [user, ...prev]));
    }
  };


  async function handleSearch() {
    startSearching(async () => {
      const results = await searchUsersAction(searchQuery);
      setSearchResults(results);
    });
  }

  return (
    <div className="pt-6 pb-20 md:py-16 max-w-4xl mx-auto px-4 md:px-10">
      {/* Header */}
      <header className="mb-12">
        <h1 className="font-heading text-4xl md:text-7xl tracking-tighter mb-4 italic">
          Find <span className="text-accent">cinephiles</span>
        </h1>
        <p className="text-white/40 font-metadata text-xs tracking-widest leading-relaxed max-w-xl">
          Discover critics, collectors, and creators sharing your cinematic style.
        </p>
      </header>

      <div className="flex gap-2 mb-6 overflow-x-auto scrollbar-hide">
        {[
          { id: 'suggested' as PeopleTab, label: `Suggested (${suggestions.length})` },
          { id: 'followers' as PeopleTab, label: `Followers (${followers.length})` },
          { id: 'following' as PeopleTab, label: `Following (${following.length})` },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={cn(
              "px-4 py-2 rounded-full text-[10px] uppercase tracking-widest font-metadata border whitespace-nowrap transition-colors",
              activeTab === t.id ? "bg-white text-black border-white" : "bg-white/5 text-white/50 border-white/10 hover:text-white"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Search Bar */}
      <div className="relative mb-16">
        <div className="relative">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20" size={20} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by username or name..."
            className="w-full bg-white/5 border border-white/10 rounded-full py-5 pl-14 pr-14 text-lg font-heading focus:outline-none focus:border-accent/40 focus:bg-white/10 transition-all placeholder:text-white/10"
          />
          {isSearching && (
            <div className="absolute right-6 top-1/2 -translate-y-1/2">
              <Loader2 className="animate-spin text-accent" size={20} />
            </div>
          )}
        </div>

      </div>

      {/* Suggested Users */}
      <section className="space-y-8">
        <div className="flex items-center gap-4">
          <Sparkles className="text-accent" size={20} />
          <h2 className="font-heading text-2xl tracking-tighter italic text-white/80">
            {activeTab === 'search' ? 'Search results' : activeTab === 'followers' ? 'Your followers' : activeTab === 'following' ? 'People you follow' : 'Suggested for you'}
          </h2>
          <div className="h-px flex-1 bg-white/5" />
        </div>

        <div className="flex flex-col gap-4">
          {visibleUsers.length > 0 ? (
            visibleUsers.map((user) => (
              <UserCard
                key={user.id}
                user={user}
                variant={activeTab === 'search' ? 'search' : 'suggestion'}
                onFollowChange={handleFollowStateChange}
              />
            ))
          ) : (
            <div className="py-12 text-center text-white/20 font-heading italic tracking-widest bg-white/2 border border-white/5 rounded-3xl">
              {activeTab === 'search' ? 'No users found' : 'No users to show in this tab yet'}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

// ─── User Card Component ──────────────────────────────────────────────────────

function UserCard({
  user,
  variant,
  onFollowChange,
}: {
  user: FollowUser;
  variant: 'search' | 'suggestion';
  onFollowChange: (user: FollowUser, isFollowing: boolean) => void;
}) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-6 rounded-[32px] bg-white/3 border border-white/5 hover:border-white/10 transition-all group relative overflow-hidden">
      {/* Background Spectral Glow */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 blur-[60px] -z-10 group-hover:bg-accent/10 transition-colors" />

      <div className="flex items-start md:items-center gap-5 min-w-0 flex-1">
        <Link href={`/profile/${formatUsername(user.username)}`} className="shrink-0">
          <CinematicAvatar 
            src={user.avatar_url} 
            username={user.username} 
            size="lg" 
            seed={user.id}
          />
        </Link>
        
        <div className="min-w-0 flex-1 space-y-1.5">
          <Link href={`/profile/${formatUsername(user.username)}`} className="inline-flex items-center gap-1.5 group/link max-w-full">
            <h3 className="font-heading text-xl md:text-2xl text-white group-hover/link:text-accent transition-colors leading-none">
              {formatUsername(user.display_name || user.username)}
            </h3>
            <ArrowUpRight size={16} className="text-white/20 group-hover/link:text-accent transition-colors shrink-0" />
          </Link>
          
          <p className="font-metadata text-[10px] text-white/30 tracking-widest italic block">
            @{formatUsername(user.username)}
          </p>
          
          {user.bio && (
            <p className="font-heading text-xs md:text-sm text-white/60 leading-relaxed max-w-2xl">
              {user.bio}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center justify-end shrink-0 pt-2 md:pt-0">
        <FollowButton 
          targetUserId={user.id} 
          size="md"
          className="w-full md:w-auto"
          refreshOnSuccess={false}
          onFollowChange={(isFollowing) => onFollowChange(user, isFollowing)}
        />
      </div>
    </div>
  );
}
