'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, MapPin, Calendar, Layers, Activity, Sparkles, LogOut, ChevronRight, User, Heart } from 'lucide-react';
import GlassPanel from '@/components/ui/GlassPanel';
import { ClassificationName, CLASSIFICATION_STYLE_COLORS } from '@/lib/design-tokens';
import { cn, formatDate, formatUsername } from '@/lib/utils';
import Image from 'next/image';
import Link from 'next/link';
import { signOut } from '@/app/auth/actions';
import FollowButton from '@/components/social/FollowButton';
import { calculateTasteMatchAction, CompatibilityScore } from '@/lib/social-intelligence';
import CinematicAvatar from '@/components/layout/CinematicAvatar';

// Tab Components
import ActivityHub from './ActivityHub';
import VaultDisplay from './VaultDisplay';
import CineJournal from '../social/CineJournal';
import CineLists from '../social/CineLists';
import ProfileSpotlight from './ProfileSpotlight';

interface ProfileDashboardProps {
  user: any;
  profile: any;
  onboardingTastes: any[];
  entries: any[];
  stats: {
    entriesCount: number;
    topAuteur?: string | null;
    primaryStyle?: string | null;
    vibeDistribution?: Record<string, number>;
  };
  isOwnProfile?: boolean;
  initialFollowStatus?: boolean;
  followCounts?: { followers: number; following: number };
}

export default function ProfileDashboard({ 
  user, 
  profile, 
  onboardingTastes, 
  entries, 
  stats,
  isOwnProfile = true,
  initialFollowStatus = false,
  followCounts = { followers: 0, following: 0 }
}: ProfileDashboardProps) {
  const [activeTab, setActiveTab] = useState<'activity' | 'library' | 'journal' | 'lists'>('activity');
  const [matchScore, setMatchScore] = useState<CompatibilityScore | null>(null);

  useEffect(() => {
    if (!isOwnProfile && user?.id) {
       calculateTasteMatchAction(user.id, profile.id).then(setMatchScore);
    }
  }, [user?.id, profile.id, isOwnProfile]);

  // Ambient Background Theme (Determined by top style)
  const styleName = (stats.primaryStyle || 'Noir') as ClassificationName;
  const styleColor = CLASSIFICATION_STYLE_COLORS[styleName] || '#1a0a2e';

  // Map spotlight data
  const spotlightMedia = profile.spotlight_media_id ? {
    id: profile.spotlight_media_id,
    type: profile.spotlight_media_type,
    title: entries.find(e => e.external_id === profile.spotlight_media_id)?.title || 'Spotlight',
    posterUrl: entries.find(e => e.external_id === profile.spotlight_media_id)?.poster_url || null,
    caption: profile.spotlight_caption
  } : null;

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
          <header className="mb-20">
            <div className="flex flex-col md:flex-row gap-8 md:gap-12 items-center md:items-start text-center md:text-left w-full">
              
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative shrink-0"
              >
                <CinematicAvatar 
                  src={profile.avatar_url} 
                  username={profile.username} 
                  size="xl" 
                  style={styleName} 
                />
              </motion.div>

              <div className="flex-1 space-y-6 w-full">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                     <div className="space-y-2">
                        <h1 className="font-display text-4xl md:text-6xl tracking-tight text-white font-bold">
                           {formatUsername(profile.display_name || profile.username)}
                        </h1>
                        <div className="flex items-center justify-center md:justify-start gap-4 mt-2">
                           <div className="flex gap-4 text-xs font-metadata uppercase tracking-widest text-white/40">
                              <span className="hover:text-white transition-colors cursor-pointer"><strong className="text-white">{followCounts.followers}</strong> Followers</span>
                              <span className="hover:text-white transition-colors cursor-pointer"><strong className="text-white">{followCounts.following}</strong> Following</span>
                           </div>
                        </div>
                     </div>
                     
                     <div className="flex flex-wrap justify-center md:justify-end gap-3 shrink-0">
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
                        <MapPin size={16} className="text-accent" />
                        <span>Online</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Calendar size={16} className="opacity-60" />
                        <span>Joined {formatDate(profile.created_at)}</span>
                    </div>
                  </div>
              </div>
            </div>
          </header>

          {/* New Phase 6 Features */}
          <ProfileSpotlight media={spotlightMedia} />

          {/* Navigation Tabs */}
          <div className="flex flex-wrap items-center justify-center gap-4 mb-20 p-2 glass border-white/5 rounded-3xl w-fit mx-auto">
            {(['activity', 'library', 'journal', 'lists'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "px-8 py-3 rounded-2xl font-display text-sm font-bold tracking-tight transition-all relative overflow-hidden uppercase italic",
                  activeTab === tab ? "text-white bg-white/10 shadow-inner" : "text-white/30 hover:text-white/60"
                )}
              >
                {tab}
                {activeTab === tab && (
                  <motion.div layoutId="profile-tab-glow" className="absolute inset-0 bg-accent/5 blur-xl pointer-events-none" />
                )}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
             <motion.div
               key={activeTab}
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               exit={{ opacity: 0, y: -20 }}
               transition={{ duration: 0.3 }}
             >
                {activeTab === 'activity' && <ActivityHub entries={entries} />}
                {activeTab === 'library' && <VaultDisplay entries={entries} onboardingTastes={onboardingTastes} stats={stats} />}
                {activeTab === 'journal' && <CineJournal userId={profile.id} isOwnProfile={isOwnProfile} />}
                {activeTab === 'lists' && <CineLists userId={profile.id} isOwnProfile={isOwnProfile} />}
             </motion.div>
          </AnimatePresence>

       </div>
    </div>
  );
}
