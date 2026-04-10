'use client';

import { useState } from 'react';
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
import { cn, formatUsername } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  AVATAR_ANIMATION_OPTIONS,
  AVATAR_CHARACTER_CONFIG,
  AVATAR_CHARACTER_OPTIONS,
  sanitizeAvatarAnimation,
  sanitizeAvatarCharacter,
  sanitizeAvatarMode,
} from '@/lib/avatar-character';

interface ProfileSettingsUIProps {
  profile: any;
}

type SettingsTab = 'identity' | 'account' | 'preferences';

export default function ProfileSettingsUI({ profile }: ProfileSettingsUIProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<SettingsTab>('identity');
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  // Form State
  const [displayName, setDisplayName] = useState(profile.display_name || '');
  const [bio, setBio] = useState(profile.bio || '');
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url || '');
  const [avatarSeed, setAvatarSeed] = useState(profile.avatar_seed || '');
  const [avatarMode, setAvatarMode] = useState(sanitizeAvatarMode(profile.avatar_mode));
  const [avatarCharacter, setAvatarCharacter] = useState(sanitizeAvatarCharacter(profile.avatar_character));
  const [avatarAnimation, setAvatarAnimation] = useState(sanitizeAvatarAnimation(profile.avatar_animation));
  const [isUploading, setIsUploading] = useState(false);

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
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
    } catch (error) {
      toast.error('An unexpected error occurred');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    setIsSaving(true);
    try {
      const result = await deleteAccount();
      if (result?.error) {
        toast.error(result.error);
        setIsSaving(false);
      }
    } catch (e) {
      toast.error('Failed to delete account');
      setIsSaving(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Avatar must be under 5MB');
      return;
    }

    setIsUploading(true);
    const supabase = createClient();
    
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${profile.id}/${Math.random().toString(36).substring(2)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      setAvatarUrl(fileName);
      setAvatarMode('image');
      toast.success('Avatar uploaded successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to upload image');
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

  const tabs = [
    { id: 'identity', label: 'Identity', icon: User },
    { id: 'account', label: 'Account', icon: Shield },
    { id: 'preferences', label: 'Preferences', icon: SettingsIcon },
  ];

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
                            username={profile.username}
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
                          Your account is protected by your personal password. We use high-grade encryption to ensure your data stays private.
                        </p>
                      </div>
                      
                      <div className="space-y-4">
                         <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
                            <div className="flex items-center gap-4">
                               <div className="p-2.5 rounded-lg bg-white/5 text-white/60">
                                  <Lock size={18} />
                               </div>
                               <div>
                                  <p className="font-heading text-sm font-bold text-white">Authentication</p>
                                  <p className="text-xs text-white/30">{formatUsername(profile.username)}@enterarchive.com</p>
                               </div>
                            </div>
                            <button className="text-xs font-data uppercase tracking-widest text-white/40 hover:text-white transition-colors font-bold">Change</button>
                         </div>
                      </div>
                    </div>

                    <div className="pt-10 border-t border-white/10 space-y-6">
                      <h3 className="text-xl font-display font-bold text-rose-400">Danger Zone</h3>
                      <p className="text-sm text-white/40 font-heading">Actions here are permanent and cannot be undone.</p>
                      
                      <div className="flex flex-col sm:flex-row gap-4">
                        <button 
                          onClick={async () => {
                            if (confirm('Are you sure you want to clear your entire history?')) {
                              await clearHistory();
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
                            Delete Account
                          </button>
                        ) : (
                          <div className="flex flex-1 items-center gap-3">
                             <button 
                              onClick={handleDeleteAccount}
                              className="flex-1 px-4 py-3 rounded-xl bg-rose-500 text-white font-heading font-bold hover:bg-rose-600 transition-all shadow-xl"
                            >
                              Final Confirmation (Delete)
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
                           <div className="w-12 h-6 bg-white/10 rounded-full relative cursor-pointer">
                              <div className="absolute left-1 top-1 w-4 h-4 bg-white/40 rounded-full" />
                           </div>
                        </div>

                        <div className="flex items-center justify-between p-5 bg-white/5 rounded-2xl border border-white/5 opacity-50 cursor-not-allowed">
                           <div className="flex items-center gap-4">
                              <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400">
                                 <Eye size={20} />
                              </div>
                              <div>
                                 <p className="font-heading text-sm font-bold text-white">Compact View</p>
                                 <p className="text-xs text-white/30">Show more information at once</p>
                              </div>
                           </div>
                           <div className="w-12 h-6 bg-white/10 rounded-full relative">
                              <div className="absolute left-1 top-1 w-4 h-4 bg-white/40 rounded-full" />
                           </div>
                        </div>
                      </div>
                    </div>

                    <div className="p-6 bg-white/5 rounded-2xl border border-white/5 flex gap-5 items-center">
                       <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center text-white/40">
                          <SettingsIcon size={24} />
                       </div>
                       <div className="flex-1">
                          <p className="font-heading text-sm font-bold text-white">More preferences coming soon</p>
                          <p className="text-xs text-white/30">We're building more ways for you to customize your experience.</p>
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
