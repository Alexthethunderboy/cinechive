'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, Calendar, Layers, Activity, Sparkles, LogOut, ChevronRight, User, Heart, BookOpen, LucideIcon } from 'lucide-react';
import GlassPanel from '@/components/ui/GlassPanel';
import { ClassificationName, CLASSIFICATION_STYLE_COLORS } from '@/lib/design-tokens';
import { cn, formatDate, formatUsername } from '@/lib/utils';
import Image from 'next/image';
import Link from 'next/link';
import { signOut } from '@/app/auth/actions';
import FollowButton from '@/components/social/FollowButton';
import { calculateTasteMatchAction, CompatibilityScore } from '@/lib/social-intelligence';
import CinematicAvatar from '@/components/layout/CinematicAvatar';
import { usePathname, useRouter } from 'next/navigation';

// Tab Components
import ActivityHub from './ActivityHub';
import VaultDisplay from './VaultDisplay';
import CineJournal from '../social/CineJournal';
import CineLists from '../social/CineLists';
import ProfileSpotlight from './ProfileSpotlight';
import ProfileEmptyState from './ProfileEmptyState';

interface ProfileDashboardProps {
  user: { id: string } | null;
  profile: {
    id: string;
    username: string;
    display_name: string | null;
    avatar_url: string | null;
    avatar_seed?: string | null;
    avatar_mode?: 'image' | 'character' | null;
    avatar_character?: string | null;
    avatar_animation?: 'float' | 'pulse' | 'orbit' | null;
    created_at: string;
    bio?: string | null;
    spotlight_media_id?: string | null;
    spotlight_media_type?: string | null;
    spotlight_caption?: string | null;
  };
  onboardingTastes: Array<{ category: string; value: string; display_name?: string | null }>;
  entries: Array<{
    id: string;
    external_id?: string;
    media_id?: string;
    media_type: string;
    title: string;
    poster_url?: string | null;
    created_at?: string;
    classification?: string | null;
  }>;
  stats: {
    entriesCount: number;
    topAuteur?: string | null;
    primaryStyle?: string | null;
    vibeDistribution?: Record<string, number>;
  };
  isOwnProfile?: boolean;
  initialFollowStatus?: boolean;
  followCounts?: { followers: number; following: number };
  followers?: Array<{ id: string; username: string; display_name: string | null; avatar_url: string | null }>;
  following?: Array<{ id: string; username: string; display_name: string | null; avatar_url: string | null }>;
}

export default function ProfileDashboard({ 
  user, 
  profile, 
  onboardingTastes, 
  entries, 
  stats,
  isOwnProfile = true,
  initialFollowStatus = false,
  followCounts = { followers: 0, following: 0 },
  followers = [],
  following = [],
}: ProfileDashboardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const validTabs = ['overview', 'activity', 'library', 'journal', 'lists'] as const;
  type ProfileTab = (typeof validTabs)[number];
  const [activeTab, setActiveTab] = useState<ProfileTab>('overview');
  const [matchScore, setMatchScore] = useState<CompatibilityScore | null>(null);
  const [liveFollowCounts, setLiveFollowCounts] = useState(followCounts);
  const [openConnections, setOpenConnections] = useState<'followers' | 'following' | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const tab = (new URLSearchParams(window.location.search).get('tab') || '').toLowerCase();
    if ((validTabs as readonly string[]).includes(tab)) {
      setActiveTab(tab as ProfileTab);
    }
  }, []);

  useEffect(() => {
    if (!isOwnProfile && user?.id) {
       calculateTasteMatchAction(user.id, profile.id).then(setMatchScore);
    }
  }, [user?.id, profile.id, isOwnProfile]);

  useEffect(() => {
    setLiveFollowCounts(followCounts);
  }, [followCounts]);

  // Ambient Background Theme (Determined by top style)
  const styleName = (stats.primaryStyle || 'Noir') as ClassificationName;
  const styleColor = CLASSIFICATION_STYLE_COLORS[styleName] || '#1a0a2e';

  // Build a lookup map once for spotlight and future profile media refs.
  const entryByExternalId = useMemo(() => {
    const map = new Map<string, ProfileDashboardProps['entries'][number]>();
    entries.forEach((e) => {
      if (e.external_id) map.set(e.external_id, e);
      if (e.media_id) map.set(e.media_id, e);
    });
    return map;
  }, [entries]);

  const spotlightMedia = useMemo(() => {
    if (!profile.spotlight_media_id) return null;
    const matched = entryByExternalId.get(profile.spotlight_media_id);
    return {
      id: profile.spotlight_media_id,
      type: profile.spotlight_media_type || 'movie',
      title: matched?.title || 'Spotlight',
      posterUrl: matched?.poster_url || null,
      caption: profile.spotlight_caption,
    };
  }, [profile.spotlight_media_id, profile.spotlight_media_type, profile.spotlight_caption, entryByExternalId]);

  const handleTabChange = (tab: ProfileTab) => {
    setActiveTab(tab);
    const current = typeof window !== 'undefined' ? window.location.search : '';
    const params = new URLSearchParams(current);
    params.set('tab', tab);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const completion = useMemo(() => {
    const checklist = [
      !!profile.avatar_url || !!profile.avatar_seed || profile.avatar_mode === 'character',
      !!profile.bio && profile.bio.trim().length > 0,
      !!profile.spotlight_media_id,
      entries.length > 0,
    ];
    const done = checklist.filter(Boolean).length;
    return Math.round((done / checklist.length) * 100);
  }, [profile.avatar_url, profile.avatar_seed, profile.avatar_mode, profile.bio, profile.spotlight_media_id, entries.length]);

  const handleTabKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>, tab: ProfileTab) => {
    const idx = validTabs.indexOf(tab);
    if (e.key === 'ArrowRight') {
      const next = validTabs[(idx + 1) % validTabs.length];
      handleTabChange(next);
    }
    if (e.key === 'ArrowLeft') {
      const prev = validTabs[(idx - 1 + validTabs.length) % validTabs.length];
      handleTabChange(prev);
    }
  };

  const recentEntries = entries.slice(0, 4);
  const previewActivityEntries = useMemo(() => entries.slice(0, 6), [entries]);
  const tabMeta: Record<ProfileTab, { label: string; icon: LucideIcon }> = {
    overview: { label: 'Overview', icon: Layers },
    activity: { label: 'Activity', icon: Activity },
    library: { label: 'Library', icon: BookOpen },
    journal: { label: 'Journal', icon: User },
    lists: { label: 'Lists', icon: Heart }
  };

  return (
    <div className="relative min-h-screen overflow-hidden pb-32">
       {/* Ambient Dynamic Background */}
       <motion.div 
         initial={{ opacity: 0 }}
         animate={{ opacity: [0.05, 0.12, 0.05], scale: [1, 1.05, 1] }}
         transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
         style={{ backgroundColor: styleColor }}
         className="fixed inset-0 blur-[120px] rounded-full -z-10 pointer-events-none"
       />

       <div className="pt-8 pb-10 md:py-20 px-4 md:px-10 max-w-6xl mx-auto relative z-10">
          
          {/* Main Identity Section */}
          <header className="mb-14 md:mb-20">
            <div className="flex flex-col md:flex-row gap-8 md:gap-12 items-center md:items-start text-center md:text-left w-full">
              
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative shrink-0"
              >
                <CinematicAvatar 
                  src={profile.avatar_url} 
                  username={profile.username} 
                  seed={profile.avatar_seed}
                  avatarMode={profile.avatar_mode}
                  avatarCharacter={profile.avatar_character}
                  avatarAnimation={profile.avatar_animation}
                  size="xl" 
                  style={styleName} 
                />
              </motion.div>

              <div className="flex-1 space-y-6 w-full">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 md:gap-6">
                     <div className="space-y-2">
                        <h1 className="font-display text-4xl md:text-6xl tracking-tight text-white font-bold">
                           {formatUsername(profile.display_name || profile.username)}
                        </h1>
                        <div className="flex items-center justify-center md:justify-start gap-4 mt-2">
                           <div className="flex gap-4 text-xs font-metadata uppercase tracking-widest text-white/40">
                              <button onClick={() => setOpenConnections('followers')} className="hover:text-white transition-colors cursor-pointer">
                                <strong className="text-white">{liveFollowCounts.followers}</strong> Followers
                              </button>
                              <button onClick={() => setOpenConnections('following')} className="hover:text-white transition-colors cursor-pointer">
                                <strong className="text-white">{liveFollowCounts.following}</strong> Following
                              </button>
                           </div>
                        </div>
                     </div>
                     
                     <div className="flex flex-wrap justify-center md:justify-end gap-2.5 shrink-0">
                        {!isOwnProfile && matchScore && (
                           <div className="flex items-center gap-3 px-4 py-2 bg-accent/5 border border-accent/20 rounded-2xl group cursor-help relative overflow-hidden">
                             <div className="absolute inset-0 bg-accent/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                             <Sparkles size={14} className="text-accent animate-pulse" />
                             <div>
                               <p className="font-metadata text-[8px] uppercase tracking-widest text-white/40 leading-none mb-1">Taste Match</p>
                               <p className="font-display text-sm font-bold text-accent leading-none">{matchScore.score}% <span className="text-[10px] text-white/60 font-normal ml-1">— {matchScore.label}</span></p>
                             </div>
                           </div>
                        )}

                        {isOwnProfile ? (
                           <>
                             <Link href="/profile/settings">
                               <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-black font-heading text-sm font-bold hover:bg-white/90 hover:scale-105 transition-all shadow-xl">
                                 <Settings size={18} />
                                 Manage Profile
                               </button>
                             </Link>
                             <button 
                               onClick={() => signOut()}
                               className="p-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-rose-500/10 hover:border-rose-500/20 hover:text-rose-400 transition-all text-muted backdrop-blur-md"
                             >
                               <LogOut size={20} />
                             </button>
                           </>
                        ) : (
                           <FollowButton 
                             targetUserId={profile.id} 
                             initialFollowing={initialFollowStatus}
                           />
                        )}
                     </div>
                   </div>

                  {profile.bio && (
                    <p className="text-lg text-white/70 max-w-2xl font-heading leading-relaxed mx-auto md:mx-0">
                      {profile.bio}
                    </p>
                  )}

                  <div className="flex flex-wrap justify-center md:justify-start gap-6 text-muted font-heading text-sm">
                    <div className="flex items-center gap-2">
                        <Calendar size={16} className="opacity-60" />
                        <span>Joined {formatDate(profile.created_at)}</span>
                    </div>
                  </div>

                  {isOwnProfile && (
                    <div className="max-w-sm mx-auto md:mx-0">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] uppercase tracking-widest text-white/40 font-metadata">Profile completion</span>
                        <span className="text-[10px] uppercase tracking-widest text-white/70 font-metadata">{completion}%</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${completion}%` }}
                          className="h-full bg-linear-to-r from-accent to-white/70"
                        />
                      </div>
                    </div>
                  )}
              </div>
            </div>
          </header>

          {/* New Phase 6 Features */}
          <ProfileSpotlight media={spotlightMedia} />

          {/* Navigation Tabs */}
          <div className="sticky top-20 z-30 mb-10 md:mb-16">
            <div role="tablist" aria-label="Profile sections" className="flex items-center gap-2 p-1.5 glass border-white/10 rounded-3xl w-full md:w-fit md:mx-auto overflow-x-auto scrollbar-hide">
            {(validTabs).map((tab) => {
              const Icon = tabMeta[tab].icon;
              return (
              <button
                key={tab}
                id={`tab-${tab}`}
                role="tab"
                aria-selected={activeTab === tab}
                aria-controls={`panel-${tab}`}
                tabIndex={activeTab === tab ? 0 : -1}
                onClick={() => handleTabChange(tab)}
                onKeyDown={(e) => handleTabKeyDown(e, tab)}
                className={cn(
                  "px-4 sm:px-6 py-2.5 sm:py-3 rounded-2xl font-display text-[11px] sm:text-sm font-bold tracking-tight transition-all relative overflow-hidden uppercase italic shrink-0",
                  activeTab === tab ? "text-white bg-white/10 shadow-inner" : "text-white/30 hover:text-white/60"
                )}
              >
                <span className="inline-flex items-center gap-1.5">
                  <Icon size={14} className="opacity-80" />
                  {tabMeta[tab].label}
                </span>
                {activeTab === tab && (
                  <motion.div layoutId="profile-tab-glow" className="absolute inset-0 bg-accent/5 blur-xl pointer-events-none" />
                )}
              </button>
              );
            })}
            </div>
          </div>

          <AnimatePresence mode="wait">
             <motion.div
               id={`panel-${activeTab}`}
               role="tabpanel"
               aria-labelledby={`tab-${activeTab}`}
               key={activeTab}
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               exit={{ opacity: 0, y: -20 }}
               transition={{ duration: 0.3 }}
             >
                {activeTab === 'overview' && (
                  <div className="space-y-10">
                    <section className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                      <GlassPanel className="p-5 md:p-6 bg-white/5 border-white/10 text-center">
                        <Layers size={18} className="text-white/40 mx-auto mb-2" />
                        <p className="font-display text-2xl md:text-3xl text-white">{stats.entriesCount}</p>
                        <p className="font-data text-[9px] uppercase tracking-widest text-white/40">Library Total</p>
                      </GlassPanel>
                      <GlassPanel className="p-5 md:p-6 bg-white/5 border-white/10 text-center">
                        <Heart size={18} className="text-rose-400/60 mx-auto mb-2" />
                        <p className="font-display text-lg md:text-xl text-white">{stats.primaryStyle || 'Unclassified'}</p>
                        <p className="font-data text-[9px] uppercase tracking-widest text-white/40">Primary Style</p>
                      </GlassPanel>
                      <GlassPanel className="p-5 md:p-6 bg-white/5 border-white/10 text-center">
                        <User size={18} className="text-white/40 mx-auto mb-2" />
                        <p className="font-display text-sm md:text-base text-white truncate">{stats.topAuteur || 'Not enough data'}</p>
                        <p className="font-data text-[9px] uppercase tracking-widest text-white/40">Creator Pick</p>
                      </GlassPanel>
                      <GlassPanel className="p-5 md:p-6 bg-white/5 border-white/10 text-center">
                        <Activity size={18} className="text-accent/70 mx-auto mb-2" />
                        <p className="font-display text-2xl md:text-3xl text-white">{entries.length}</p>
                        <p className="font-data text-[9px] uppercase tracking-widest text-white/40">Logged Entries</p>
                      </GlassPanel>
                    </section>

                    <section className="space-y-5">
                      <div className="flex items-center justify-between">
                        <h3 className="font-heading text-xl md:text-2xl italic uppercase tracking-tight text-white/80">Recent Activity</h3>
                        <button onClick={() => handleTabChange('activity')} className="font-data text-[9px] uppercase tracking-widest text-white/50 hover:text-white">
                          View all
                        </button>
                      </div>
                      {entries.length === 0 ? (
                        <ProfileEmptyState
                          icon={Activity}
                          title="No Activity Yet"
                          body="Start logging titles to build your profile story."
                          ctaLabel="Discover titles"
                          ctaHref="/discover"
                        />
                      ) : (
                        <ActivityHub entries={previewActivityEntries} />
                      )}
                    </section>

                    <section className="space-y-5">
                      <div className="flex items-center justify-between">
                        <h3 className="font-heading text-xl md:text-2xl italic uppercase tracking-tight text-white/80">Library Preview</h3>
                        <button onClick={() => handleTabChange('library')} className="font-data text-[9px] uppercase tracking-widest text-white/50 hover:text-white">
                          Open library
                        </button>
                      </div>
                      {recentEntries.length === 0 ? (
                        <ProfileEmptyState
                          icon={BookOpen}
                          title="No Saved Titles"
                          body="Curate your first picks to shape recommendations."
                          ctaLabel="Browse media"
                          ctaHref="/discover"
                        />
                      ) : (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {recentEntries.map((entry) => (
                            <Link key={entry.id} href={`/media/${entry.media_type}/${entry.media_id || entry.external_id}`} className="group block">
                              <div className="relative aspect-2/3 rounded-2xl overflow-hidden border border-white/10 bg-white/5">
                                {entry.poster_url ? (
                                  <Image src={entry.poster_url} alt={entry.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                                ) : null}
                                <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/90 to-transparent p-2">
                                  <p className="font-heading text-[11px] text-white truncate">{entry.title}</p>
                                </div>
                              </div>
                            </Link>
                          ))}
                        </div>
                      )}
                    </section>
                  </div>
                )}
                {activeTab === 'activity' && <ActivityHub entries={entries} />}
                {activeTab === 'library' && <VaultDisplay entries={entries} onboardingTastes={onboardingTastes} stats={stats} />}
                {activeTab === 'journal' && <CineJournal userId={profile.id} isOwnProfile={isOwnProfile} />}
                {activeTab === 'lists' && <CineLists userId={profile.id} isOwnProfile={isOwnProfile} />}
             </motion.div>
          </AnimatePresence>

          <AnimatePresence>
            {openConnections && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm p-4 flex items-center justify-center"
                onClick={() => setOpenConnections(null)}
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.96, y: 16 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96, y: 16 }}
                  className="w-full max-w-lg rounded-3xl border border-white/10 bg-black/95 p-5 space-y-3"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-heading text-xl italic text-white">
                      {openConnections === 'followers' ? 'Followers' : 'Following'}
                    </h3>
                    <button className="text-white/50 hover:text-white" onClick={() => setOpenConnections(null)}>
                      <ChevronRight size={16} className="rotate-45" />
                    </button>
                  </div>
                  <div className="max-h-[60vh] overflow-y-auto space-y-2">
                    {(openConnections === 'followers' ? followers : following).map((person) => (
                      <Link
                        key={person.id}
                        href={`/profile/${formatUsername(person.username)}`}
                        onClick={() => setOpenConnections(null)}
                        className="flex items-center gap-3 rounded-2xl px-3 py-2 bg-white/5 border border-white/10 hover:border-white/20"
                      >
                        <CinematicAvatar
                          src={person.avatar_url}
                          username={person.username}
                          size="sm"
                        />
                        <span className="text-white">{formatUsername(person.display_name || person.username)}</span>
                      </Link>
                    ))}
                    {(openConnections === 'followers' ? followers : following).length === 0 && (
                      <p className="text-white/40 text-sm">No users yet.</p>
                    )}
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

       </div>
    </div>
  );
}
