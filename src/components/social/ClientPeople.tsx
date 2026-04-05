'use client';

import { useState, useTransition, useEffect } from 'react';
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
}

export default function ClientPeople({ initialSuggestions }: ClientPeopleProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<FollowUser[]>([]);
  const [isSearching, startSearching] = useTransition();
  const [suggestions] = useState(initialSuggestions);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim().length >= 2) {
        handleSearch();
      } else {
        setSearchResults([]);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

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
        <h1 className="font-heading text-4xl md:text-7xl tracking-tighter mb-4 italic uppercase">
          FIND <span className="text-accent">CINEPHILES</span>
        </h1>
        <p className="text-white/40 font-metadata text-xs uppercase tracking-widest leading-relaxed max-w-xl">
          Discover critics, collectors, and creators sharing your cinematic style.
        </p>
      </header>

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

        {/* Search Results Dropdown-style or section */}
        <AnimatePresence>
          {searchQuery.length >= 2 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-4 space-y-3"
            >
              {searchResults.length > 0 ? (
                searchResults.map((user) => (
                  <UserCard key={user.id} user={user} variant="search" />
                ))
              ) : !isSearching && (
                <div className="p-8 text-center text-white/20 font-heading italic uppercase tracking-widest border border-dashed border-white/10 rounded-3xl">
                  No match found
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Suggested Users */}
      <section className="space-y-8">
        <div className="flex items-center gap-4">
          <Sparkles className="text-accent" size={20} />
          <h2 className="font-display text-2xl tracking-tight uppercase font-bold text-white/80">
            Suggested for You
          </h2>
          <div className="h-px flex-1 bg-white/5" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {suggestions.length > 0 ? (
            suggestions.map((user) => (
              <UserCard key={user.id} user={user} variant="suggestion" />
            ))
          ) : (
            <div className="col-span-full py-12 text-center text-white/20 font-heading italic uppercase tracking-widest bg-white/2 border border-white/5 rounded-3xl">
              Check back later for suggested cinephiles
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

// ─── User Card Component ──────────────────────────────────────────────────────

function UserCard({ user, variant }: { user: FollowUser; variant: 'search' | 'suggestion' }) {
  return (
    <div className="flex items-center justify-between gap-4 py-4 px-5 rounded-3xl bg-white/3 border border-white/5 hover:border-white/10 transition-all group">
      <div className="flex items-center gap-4 min-w-0">
        <Link href={`/profile/${formatUsername(user.username)}`}>
          <CinematicAvatar 
            src={user.avatar_url} 
            username={user.username} 
            size="lg" 
          />
        </Link>
        
        <div className="min-w-0">
          <Link href={`/profile/${formatUsername(user.username)}`} className="flex items-center gap-1.5 group/link">
            <h3 className="font-heading text-lg text-white group-hover/link:text-accent transition-colors truncate">
              {formatUsername(user.display_name || user.username)}
            </h3>
            <ArrowUpRight size={14} className="text-white/20 group-hover/link:text-accent transition-colors" />
          </Link>
          <p className="font-metadata text-[10px] text-white/30 uppercase tracking-widest mb-1 italic">
            @{formatUsername(user.username)}
          </p>
          {user.bio && (
            <p className="font-heading text-xs text-white/40 truncate max-w-[200px]">
              {user.bio}
            </p>
          )}
        </div>
      </div>

      <FollowButton 
        targetUserId={user.id} 
        size="sm"
        className="shrink-0"
      />
    </div>
  );
}
