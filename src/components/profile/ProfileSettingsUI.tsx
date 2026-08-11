'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, 
  Shield, 
  Settings as SettingsIcon, 
  Trash2, 
  Check, 
  X, 
  Camera, 
  Info,
  ChevronLeft,
  Loader2,
  Lock,
  Eye,
  Activity,
  RefreshCw,
  Upload
} from 'lucide-react';
import GlassPanel from '@/components/ui/GlassPanel';
import CinematicAvatar from './CinematicAvatar';
import { createClient } from '@/lib/supabase/client';
import { updateProfile, deleteAccount, clearHistory } from '@/app/actions/profile-actions';
import LetterboxdImporter from './LetterboxdImporter';
import { cn, formatUsername } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import Link from 'next/link';
import { useAuth } from '@/components/providers/AuthProvider';
import {
  clearLocalHistory,
  exportLocalArchive,
  importLocalArchive,
  resetLocalArchive,
  resizeAvatarForLocalStorage,
  updateLocalProfile,
  updateLocalSettings,
  useLocalArchive,
} from '@/lib/local-archive';
import {
  AVATAR_ANIMATION_OPTIONS,
  AVATAR_CHARACTER_CONFIG,
  AVATAR_CHARACTER_OPTIONS,
  sanitizeAvatarAnimation,
  sanitizeAvatarCharacter,
  sanitizeAvatarMode,
} from '@/lib/avatar-character';

interface ProfileSettingsUIProps {
  profile?: {
    id: string;
    username?: string | null;
    display_name?: string | null;
    bio?: string | null;
    avatar_url?: string | null;
    avatar_seed?: string | null;
    avatar_mode?: string | null;
    avatar_character?: string | null;
    avatar_animation?: string | null;
  };
}

type SettingsTab = 'identity' | 'account' | 'preferences';

const EMPTY_PROFILE = {
  id: 'pending',
  username: 'curator',
  display_name: '',
  bio: '',
  avatar_url: '',
  avatar_seed: '',
  avatar_mode: 'character',
  avatar_character: 'cyber-noir',
  avatar_animation: 'float',
};

export default function ProfileSettingsUI({ profile }: ProfileSettingsUIProps) {
  const router = useRouter();
  const { user, isLocalMode } = useAuth();
  const localArchive = useLocalArchive();
  const resolvedProfile = profile || (isLocalMode ? localArchive.profile : user?.profile) || EMPTY_PROFILE;
  const [activeTab, setActiveTab] = useState<SettingsTab>('identity');
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  // Form State
  const [username, setUsername] = useState(resolvedProfile.username || 'curator');
  const [displayName, setDisplayName] = useState(resolvedProfile.display_name || '');
  const [bio, setBio] = useState(resolvedProfile.bio || '');
  const [avatarUrl, setAvatarUrl] = useState(resolvedProfile.avatar_url || '');
  const [avatarSeed, setAvatarSeed] = useState(resolvedProfile.avatar_seed || '');
  const [avatarMode, setAvatarMode] = useState(sanitizeAvatarMode(resolvedProfile.avatar_mode));
  const [avatarCharacter, setAvatarCharacter] = useState(sanitizeAvatarCharacter(resolvedProfile.avatar_character));
  const [avatarAnimation, setAvatarAnimation] = useState(sanitizeAvatarAnimation(resolvedProfile.avatar_animation));
  const [isUploading, setIsUploading] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(localArchive.settings.reduced_motion);
  const [compactView, setCompactView] = useState(localArchive.settings.compact_view);

  useEffect(() => {
    setUsername(resolvedProfile.username || 'curator');
    setDisplayName(resolvedProfile.display_name || '');
    setBio(resolvedProfile.bio || '');
    setAvatarUrl(resolvedProfile.avatar_url || '');
    setAvatarSeed(resolvedProfile.avatar_seed || '');
    setAvatarMode(sanitizeAvatarMode(resolvedProfile.avatar_mode));
    setAvatarCharacter(sanitizeAvatarCharacter(resolvedProfile.avatar_character));
    setAvatarAnimation(sanitizeAvatarAnimation(resolvedProfile.avatar_animation));
  }, [resolvedProfile]);

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      if (isLocalMode) {
        const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '') || 'local-curator';
        updateLocalProfile({
          username: cleanUsername,
          display_name: displayName.trim(),
          bio: bio.trim(),
          avatar_url: avatarUrl,
          avatar_seed: avatarSeed,
          avatar_mode: avatarMode,
          avatar_character: avatarCharacter,
          avatar_animation: avatarAnimation,
        });
        setUsername(cleanUsername);
        toast.success('Local profile updated');
        return;
      }

      const result = await updateProfile({
        display_name: displayName,
        bio: bio,
        avatar_url: avatarUrl,
        avatar_seed: avatarSeed,
        avatar_mode: avatarMode,
        avatar_character: avatarCharacter,
        avatar_animation: avatarAnimation,
      });
      
      if (result.success) {
        toast.success('Profile updated successfully');
        router.refresh();
      } else {
        toast.error(result.error || 'Failed to update profile');
      }
    } catch {
      toast.error('An unexpected error occurred');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    setIsSaving(true);
    try {
      if (isLocalMode) {
        resetLocalArchive();
        toast.success('Local archive reset');
        setShowDeleteConfirm(false);
        router.push('/');
        return;
      }
      const result = await deleteAccount();
      if (result?.error) {
        toast.error(result.error);
        setIsSaving(false);
      }
    } catch {
      toast.error('Failed to delete account');
      setIsSaving(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      if (isLocalMode) {
        const dataUrl = await resizeAvatarForLocalStorage(file);
        setAvatarUrl(dataUrl);
        setAvatarMode('image');
        toast.success('Avatar ready. Save changes to keep it.');
        return;
      }

      if (file.size > 5 * 1024 * 1024) throw new Error('Avatar must be under 5MB');
      const supabase = createClient();
      const fileExt = file.name.split('.').pop();
      const fileName = `${resolvedProfile.id}/${Math.random().toString(36).substring(2)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      setAvatarUrl(fileName);
      setAvatarMode('image');
      toast.success('Avatar uploaded successfully');
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Failed to upload image');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveAvatar = () => {
    setAvatarUrl('');
    toast.info('Returned to default avatar');
  };

  const handleRegenerateSeed = () => {
    const newSeed = Math.random().toString(36).substring(7);
    setAvatarSeed(newSeed);
    toast.success('New vibe generated');
  };

  const handleExport = () => {
    const blob = new Blob([exportLocalArchive()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `cinechive-local-archive-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Archive exported');
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!window.confirm('Replace the local archive in this browser with the selected backup?')) return;
    try {
      importLocalArchive(await file.text());
      toast.success('Archive imported');
      router.push('/profile');
    } catch {
      toast.error('That file is not a valid CineChive archive');
    }
  };

  const tabs = [
    { id: 'identity', label: 'Identity', icon: User },
    { id: 'account', label: 'Account', icon: Shield },
    { id: 'preferences', label: 'Preferences', icon: SettingsIcon },
  ];

  if (!isLocalMode && !user && !profile) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 text-center">
        <h1 className="font-heading text-3xl text-white">Sign in to manage your synced profile</h1>
        <Link href="/login?returnTo=/profile/settings" className="mt-6 rounded-full bg-white px-6 py-3 text-xs font-bold text-black">Sign in</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 pt-10 px-3 sm:px-4 md:px-10 max-w-5xl mx-auto">
      <div className="mb-8 sm:mb-10 flex items-center gap-3 sm:gap-4">
        <button 
          onClick={() => router.back()}
          className="p-2 rounded-full hover:bg-white/10 transition-colors text-white/60 hover:text-white"
        >
          <ChevronLeft size={24} />
        </button>
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-display font-bold text-white tracking-tight">Settings</h1>
          <p className="text-white/40 font-heading text-xs sm:text-sm">Manage your profile and account preferences</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar Nav */}
        <aside className="w-full md:w-64 space-y-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as SettingsTab)}
              className={cn(
                "w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 font-heading text-sm font-bold",
                activeTab === tab.id 
                  ? "bg-white text-black shadow-xl scale-[1.02]" 
                  : "bg-white/5 text-white/40 hover:bg-white/10 hover:text-white/80"
              )}
            >
              <tab.icon size={20} />
              {tab.label}
            </button>
          ))}
        </aside>

        {/* Main Panel */}
        <div className="flex-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <GlassPanel className="p-6 md:p-10 bg-white/5 border-white/10 shadow-2xl overflow-hidden relative">
                {activeTab === 'identity' && (
                  <div className="space-y-8">
                    <div className="flex flex-col md:flex-row gap-10 items-start">
                      <div className="flex flex-col items-center gap-6">
                        <div className="relative group">
                          <CinematicAvatar 
                            src={avatarUrl}
                            username={resolvedProfile.username || 'curator'}
                            seed={avatarSeed}
                            avatarMode={avatarMode}
                            avatarCharacter={avatarCharacter}
                            avatarAnimation={avatarAnimation}
                            size="xl"
                          />
                          
                          <label className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-full cursor-pointer">
                            <input 
                              type="file" 
                              className="hidden" 
                              accept="image/*,.gif,.webp"
                              onChange={handleAvatarUpload}
                              disabled={isUploading}
                            />
                            {isUploading ? (
                              <Loader2 size={32} className="text-white animate-spin" />
                            ) : (
                              <Camera size={32} className="text-white" />
                            )}
                          </label>
                        </div>

                        <div className="flex flex-col gap-2 w-full">
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              onClick={() => setAvatarMode('image')}
                              className={cn(
                                'px-3 py-2 rounded-xl border text-xs font-heading font-bold transition-all',
                                avatarMode === 'image'
                                  ? 'bg-white text-black border-white'
                                  : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                              )}
                            >
                              Upload Mode
                            </button>
                            <button
                              onClick={() => setAvatarMode('character')}
                              className={cn(
                                'px-3 py-2 rounded-xl border text-xs font-heading font-bold transition-all',
                                avatarMode === 'character'
                                  ? 'bg-white text-black border-white'
                                  : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                              )}
                            >
                              Character Mode
                            </button>
                          </div>
                           <button 
                            onClick={() => document.getElementById('avatar-upload')?.click()}
                            className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white/80 font-heading text-sm font-bold hover:bg-white/10 transition-all"
                          >
                            <Upload size={16} />
                            Upload Custom
                          </button>
                          
                          <div className="flex gap-2">
                             <button 
                              onClick={handleRegenerateSeed}
                              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white/60 font-heading text-xs font-bold hover:bg-white/10 hover:text-white transition-all"
                            >
                              <RefreshCw size={14} />
                              Regen Vibe
                            </button>
                            
                            {avatarUrl && (
                              <button 
                                onClick={handleRemoveAvatar}
                                className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 transition-all"
                                title="Remove Custom Avatar"
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        </div>
                        <input id="avatar-upload" type="file" className="hidden" accept="image/*,.gif,.webp" onChange={handleAvatarUpload} />
                      </div>
                      
                      <div className="flex-1 w-full space-y-6">
                        {avatarMode === 'character' && (
                          <div className="space-y-4 p-4 rounded-xl border border-white/10 bg-white/5">
                            <div>
                              <p className="text-xs font-data uppercase tracking-widest text-white/40 font-bold mb-2">Character preset</p>
                              <div className="grid grid-cols-2 gap-2">
                                {AVATAR_CHARACTER_OPTIONS.map((option) => (
                                  <button
                                    key={option}
                                    onClick={() => setAvatarCharacter(option)}
                                    className={cn(
                                      'px-3 py-2 rounded-lg border text-xs font-heading font-bold transition-all',
                                      avatarCharacter === option
                                        ? 'bg-white text-black border-white'
                                        : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                                    )}
                                  >
                                    {AVATAR_CHARACTER_CONFIG[option].label}
                                  </button>
                                ))}
                              </div>
                            </div>
                            <div>
                              <p className="text-xs font-data uppercase tracking-widest text-white/40 font-bold mb-2">Animation style</p>
                              <div className="flex gap-2 flex-wrap">
                                {AVATAR_ANIMATION_OPTIONS.map((option) => (
                                  <button
                                    key={option}
                                    onClick={() => setAvatarAnimation(option)}
                                    className={cn(
                                      'px-3 py-1.5 rounded-lg border text-xs font-heading font-bold transition-all capitalize',
                                      avatarAnimation === option
                                        ? 'bg-white text-black border-white'
                                        : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                                    )}
                                  >
                                    {option}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                        {isLocalMode && (
                          <div className="space-y-2">
                            <label className="text-xs font-data uppercase tracking-widest text-white/40 font-bold">Username</label>
                            <input
                              value={username}
                              onChange={(e) => setUsername(e.target.value)}
                              placeholder="local-curator"
                              className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-3 text-white font-heading focus:outline-none focus:ring-2 focus:ring-white/20 transition-all"
                            />
                          </div>
                        )}
                        <div className="space-y-2">
                          <label className="text-xs font-data uppercase tracking-widest text-white/40 font-bold">Display Name</label>
                          <input 
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            placeholder="Your name"
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-3 text-white font-heading focus:outline-none focus:ring-2 focus:ring-white/20 transition-all"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <label className="text-xs font-data uppercase tracking-widest text-white/40 font-bold">Bio</label>
                          <textarea 
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                            placeholder="Write a short bit about yourself..."
                            rows={4}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-3 text-white font-heading focus:outline-none focus:ring-2 focus:ring-white/20 transition-all resize-none"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="pt-6 border-t border-white/10 flex justify-end">
                      <button 
                        onClick={handleSaveProfile}
                        disabled={isSaving}
                        className="flex items-center gap-2 px-8 py-3 rounded-xl bg-white text-black font-heading font-bold hover:bg-white/90 disabled:opacity-50 transition-all shadow-xl"
                      >
                        {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
                        Save Changes
                      </button>
                    </div>
                  </div>
                )}

                {activeTab === 'account' && (
                  <div className="space-y-10">
                    <div className="space-y-6">
                      <h3 className="text-xl font-display font-bold text-white">Security</h3>
                      <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl flex gap-4">
                        <Info className="text-blue-400 shrink-0" size={20} />
                        <p className="text-sm text-blue-100/70 leading-relaxed font-heading">
                          {isLocalMode
                            ? 'This profile is private to this browser. It uses no password and sends no personal archive data to Supabase.'
                            : 'Your account is protected by your personal password. We use high-grade encryption to ensure your data stays private.'}
                        </p>
                      </div>
                      
                      <div className="space-y-4">
                         <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
                            <div className="flex items-center gap-4">
                               <div className="p-2.5 rounded-lg bg-white/5 text-white/60">
                                  <Lock size={18} />
                               </div>
                               <div>
                                  <p className="font-heading text-sm font-bold text-white">{isLocalMode ? 'Local identity' : 'Authentication'}</p>
                                  <p className="text-xs text-white/30">{isLocalMode ? 'Stored on this device' : `${formatUsername(resolvedProfile.username)}@enterarchive.com`}</p>
                               </div>
                            </div>
                            {!isLocalMode && <button className="text-xs font-data uppercase tracking-widest text-white/40 hover:text-white transition-colors font-bold">Change</button>}
                         </div>
                      </div>
                    </div>

                    {isLocalMode ? (
                      <div className="pt-10 border-t border-white/10 space-y-5">
                        <div>
                          <h3 className="text-xl font-display font-bold text-white">Backup & transfer</h3>
                          <p className="mt-2 text-sm text-white/40">Export a JSON backup to move this browser archive manually. Imports replace the current local archive.</p>
                        </div>
                        <div className="flex flex-col gap-3 sm:flex-row">
                          <button onClick={handleExport} className="rounded-xl bg-white px-6 py-3 font-heading text-sm font-bold text-black">Export archive</button>
                          <label className="cursor-pointer rounded-xl border border-white/10 bg-white/5 px-6 py-3 text-center font-heading text-sm font-bold text-white hover:bg-white/10">
                            Import archive
                            <input type="file" accept="application/json,.json" className="hidden" onChange={handleImport} />
                          </label>
                        </div>
                      </div>
                    ) : (
                      <div className="pt-10 border-t border-white/10 space-y-6">
                        <LetterboxdImporter />
                      </div>
                    )}

                    <div className="pt-10 border-t border-white/10 space-y-6">
                      <h3 className="text-xl font-display font-bold text-rose-400">Danger Zone</h3>
                      <p className="text-sm text-white/40 font-heading">Actions here are permanent and cannot be undone.</p>
                      
                      <div className="flex flex-col sm:flex-row gap-4">
                        <button 
                          onClick={async () => {
                            if (confirm('Are you sure you want to clear your entire history?')) {
                              if (isLocalMode) clearLocalHistory();
                              else await clearHistory();
                              toast.success('History cleared');
                            }
                          }}
                          className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-heading font-bold hover:bg-white/10 transition-all"
                        >
                          <Activity size={18} />
                          Clear All Logs
                        </button>
                        
                        {!showDeleteConfirm ? (
                          <button 
                            onClick={() => setShowDeleteConfirm(true)}
                            className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 font-heading font-bold hover:bg-rose-500/20 transition-all"
                          >
                            <Trash2 size={18} />
                            {isLocalMode ? 'Reset Local Archive' : 'Delete Account'}
                          </button>
                        ) : (
                          <div className="flex flex-1 items-center gap-3">
                             <button 
                              onClick={handleDeleteAccount}
                              className="flex-1 px-4 py-3 rounded-xl bg-rose-500 text-white font-heading font-bold hover:bg-rose-600 transition-all shadow-xl"
                            >
                              Final Confirmation ({isLocalMode ? 'Reset' : 'Delete'})
                            </button>
                            <button 
                              onClick={() => setShowDeleteConfirm(false)}
                              className="p-3 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all"
                            >
                              <X size={20} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'preferences' && (
                  <div className="space-y-8">
                    <div className="space-y-6">
                      <h3 className="text-xl font-display font-bold text-white">Interface</h3>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between p-5 bg-white/5 rounded-2xl border border-white/5">
                           <div className="flex items-center gap-4">
                              <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400">
                                 <Activity size={20} />
                              </div>
                              <div>
                                 <p className="font-heading text-sm font-bold text-white">Reduced Motion</p>
                                 <p className="text-xs text-white/30">Minimize animations across the app</p>
                              </div>
                           </div>
                           <button
                             onClick={() => {
                               const next = !reducedMotion;
                               setReducedMotion(next);
                               localStorage.setItem('cinechive-reduce-motion', String(next));
                               if (isLocalMode) updateLocalSettings({ reduced_motion: next });
                             }}
                             aria-pressed={reducedMotion}
                             className={cn('w-12 h-6 rounded-full relative transition-colors', reducedMotion ? 'bg-white' : 'bg-white/10')}
                           >
                              <span className={cn('absolute top-1 w-4 h-4 rounded-full transition-all', reducedMotion ? 'left-7 bg-black' : 'left-1 bg-white/40')} />
                           </button>
                        </div>

                        <div className="flex items-center justify-between p-5 bg-white/5 rounded-2xl border border-white/5">
                           <div className="flex items-center gap-4">
                              <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400">
                                 <Eye size={20} />
                              </div>
                              <div>
                                 <p className="font-heading text-sm font-bold text-white">Compact View</p>
                                 <p className="text-xs text-white/30">Show more information at once</p>
                              </div>
                           </div>
                           <button
                             onClick={() => {
                               const next = !compactView;
                               setCompactView(next);
                               if (isLocalMode) updateLocalSettings({ compact_view: next });
                             }}
                             aria-pressed={compactView}
                             className={cn('w-12 h-6 rounded-full relative transition-colors', compactView ? 'bg-white' : 'bg-white/10')}
                           >
                              <span className={cn('absolute top-1 w-4 h-4 rounded-full transition-all', compactView ? 'left-7 bg-black' : 'left-1 bg-white/40')} />
                           </button>
                        </div>
                      </div>
                    </div>

                    <div className="p-6 bg-white/5 rounded-2xl border border-white/5 flex gap-5 items-center">
                       <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center text-white/40">
                          <SettingsIcon size={24} />
                       </div>
                       <div className="flex-1">
                          <p className="font-heading text-sm font-bold text-white">More preferences coming soon</p>
                          <p className="text-xs text-white/30">We&apos;re building more ways for you to customize your experience.</p>
                       </div>
                    </div>
                  </div>
                )}
              </GlassPanel>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
