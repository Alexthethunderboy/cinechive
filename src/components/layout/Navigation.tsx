'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { NAV_ITEMS, SPRING_CONFIG } from '@/lib/design-tokens';
import { Calendar, Star, Play, History, Repeat } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';
import { cn, formatUsername } from '@/lib/utils';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { AnimatePresence } from 'framer-motion';
import { Home, Search, Globe, PlusSquare, Activity, Archive, Settings, LogOut, Film, Music, User, Menu, ChevronDown, Layers, Zap, Bell, MoreVertical, ChevronRight, Users } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { signOut } from '@/app/auth/actions';
import { getAlgorithmicNotifications, CommunityNotification } from '@/lib/community-actions';
import { getSocialNotificationsAction, markNotificationAsReadAction } from '@/lib/social-notification-actions';
import { CommunityNotificationCenter } from '@/components/community/CommunityNotificationCenter';
import EverythingBar from '@/components/search/EverythingBar';
import { useAuth } from '@/components/providers/AuthProvider';
import Image from 'next/image';
import CinematicAvatar from '../profile/CinematicAvatar';
import { ClassificationName } from '@/lib/design-tokens';

const icons = {
  home: Home,
  search: Search,
  globe: Globe,
  plus: PlusSquare,
  activity: Activity,
  archive: Archive,
  film: Film,
  user: User,
  zap: Zap,
  bell: Bell,
  layers: Layers,
  rewatch: Repeat,
};

function NotificationIndicator({ count }: { count: number }) {
  if (count === 0) return null;
  return (
    <div className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-vibe-rose border-2 border-black text-[8px] font-bold text-white shadow-lg">
      {count}
    </div>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [showNotifCenter, setShowNotifCenter] = useState(false);
  const [algoNotifs, setAlgoNotifs] = useState<CommunityNotification[]>([]);
  const [socialNotifs, setSocialNotifs] = useState<any[]>([]);
  const [notifCount, setNotifCount] = useState(0);


  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      const [algo, social] = await Promise.all([
        getAlgorithmicNotifications(),
        getSocialNotificationsAction()
      ]);
      setAlgoNotifs(algo.notifications);
      setSocialNotifs(social);
    };

    fetchData();

    // Set up Realtime listener for Social Notifications
    const supabase = createClient();
    const channel = supabase
      .channel(`social-notifs-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        async (payload) => {
          const freshSocial = await getSocialNotificationsAction();
          setSocialNotifs(freshSocial);
          // Optional: Toast or Sound effect
        }
      )
      .subscribe();

    window.addEventListener('refresh-notifications', fetchData);
    return () => {
      supabase.removeChannel(channel);
      window.removeEventListener('refresh-notifications', fetchData);
    };
  }, [user]);

  // Combined count for the badge
  useEffect(() => {
    const unreadSocial = socialNotifs.filter(n => !n.is_read).length;
    setNotifCount(algoNotifs.length + unreadSocial);
  }, [algoNotifs, socialNotifs]);

  const handleMarkAsRead = async (id: string) => {
    await markNotificationAsReadAction(id);
    setSocialNotifs(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  // Hide sidebar on auth pages
  if (pathname === '/login' || pathname === '/signup') return null;

  return (
    <aside className="hidden md:flex flex-col w-64 h-full shrink-0 glass border-r border-border-glass z-50">
      <div className="p-10 flex flex-col items-center relative">
        <Link href="/" className="group relative">
          <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="relative">
            <div className="absolute inset-0 bg-white/20 blur-2xl rounded-full scale-150 opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
            <img 
              src="/app-logo.png" 
              alt="CineChive Logo" 
              className="w-14 h-14 object-contain brightness-110 drop-shadow-[0_0_15px_rgba(255,255,255,0.2)] md:grayscale md:brightness-90 group-hover:grayscale-0 group-hover:brightness-110 transition-all duration-700" 
            />
          </motion.div>
        </Link>
      </div>

      <div className="px-6 mb-8">
        <EverythingBar isSidebar />
      </div>

      <nav className="flex-1 px-4 space-y-1">
        {NAV_ITEMS.filter(item => {
          if (['Community', 'Activity', 'Library', 'People', 'Discover'].includes(item.label)) return !!user;
          return true;
        }).map((item) => {
          const isActive = pathname === item.href;
          const Icon = icons[item.icon as keyof typeof icons] || icons.home;

          return (
            <Link key={item.href} href={item.href}>
              <div className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-inner transition-all group relative",
                isActive 
                  ? "text-white bg-white/5" 
                  : "text-muted hover:text-white hover:bg-white/5"
              )}>
                <div className="relative">
                  <Icon size={20} className={cn(
                    "transition-transform group-hover:scale-110",
                     isActive && "text-white"
                  )} />
                </div>
                <span className="font-heading font-medium tracking-tight text-sm flex-1">
                  {item.label}
                </span>

                {item.label === 'Activity' && notifCount > 0 && (
                  <div className="relative">
                    <button 
                      onClick={(e) => {
                        e.preventDefault();
                        setShowNotifCenter(!showNotifCenter);
                      }}
                      className="px-2 py-0.5 rounded-full bg-vibe-rose/10 border border-vibe-rose/20 text-[10px] font-bold text-vibe-rose hover:bg-vibe-rose/20 transition-colors"
                    >
                      {notifCount}
                    </button>
                    
                    <AnimatePresence>
                      {showNotifCenter && (
                        <CommunityNotificationCenter 
                          algorithmicNotifications={algoNotifs}
                          socialNotifications={socialNotifs}
                          onClose={() => setShowNotifCenter(false)}
                          onMarkAsRead={handleMarkAsRead}
                          position="sidebar"
                        />
                      )}
                    </AnimatePresence>
                  </div>
                )}

                {isActive && (
                  <motion.div layoutId="sidebar-active" className="absolute left-0 w-1 h-6 bg-white rounded-full" />
                )}
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 mt-auto">
        {user ? (
            <div className="relative group">
              <AnimatePresence>
                {showAccountMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute bottom-full left-0 w-full mb-3 glass border border-white/10 rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-50"
                  >
                    {/* Projector Beam Effect */}
                    <div className="absolute inset-0 bg-conic-gradient from-white/10 via-transparent to-transparent opacity-20 pointer-events-none" />
                    
                    <div className="p-2 space-y-1 relative z-10">
                      <Link 
                        href="/profile" 
                        onClick={() => setShowAccountMenu(false)}
                        className="flex items-center gap-3 px-3 py-2.5 text-xs text-white/50 hover:text-white hover:bg-white/5 rounded-xl transition-all font-metadata uppercase tracking-widest"
                      >
                        <User size={14} />
                        View Profile
                      </Link>
                      <Link 
                        href="/profile/settings"
                        onClick={() => setShowAccountMenu(false)}
                        className="flex items-center gap-3 px-3 py-2.5 text-xs text-white/50 hover:text-white hover:bg-white/5 rounded-xl transition-all font-metadata uppercase tracking-widest"
                      >
                        <Settings size={14} />
                        Preferences
                      </Link>
                      <div className="h-px bg-white/5 mx-2 my-1" />
                      <button 
                        onClick={() => {
                          setShowAccountMenu(false);
                          signOut();
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-xs text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all font-metadata uppercase tracking-widest"
                      >
                        <LogOut size={14} />
                        Sign Out
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <button
                onClick={() => setShowAccountMenu(!showAccountMenu)}
                className="w-full text-left relative"
              >
                {/* Film Strip Aesthetics */}
                <div className="absolute -left-4 top-0 bottom-0 w-1 flex flex-col gap-1 py-1 opacity-20">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="w-full h-1.5 bg-white/40 rounded-sm" />
                  ))}
                </div>

                <div className={cn(
                  "flex items-center gap-3.5 p-2 rounded-2xl transition-all duration-500 border relative group overflow-hidden",
                  showAccountMenu ? "bg-white/5 border-white/20 shadow-2xl" : "hover:bg-white/5 border-transparent"
                )}>
                  {/* Atmospheric Glow */}
                  <div className="absolute inset-0 bg-linear-to-tr from-white/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                  
                  <CinematicAvatar 
                    src={user.profile?.avatar_url} 
                    username={user.profile?.username || 'User'} 
                    size="md"
                    style={user.profile?.primary_style as ClassificationName || 'Atmospheric'}
                  />

                  <div className="flex-1 min-w-0 z-10">
                    <p className="text-xs font-heading font-black text-white uppercase tracking-tighter italic">
                      {formatUsername(user.profile?.display_name || user.profile?.username) || 'User'}
                    </p>
                    <p className="text-[9px] text-white/30 font-mono uppercase tracking-[0.2em] mt-0.5">
                      {user.profile?.username ? `${formatUsername(user.profile.username)}` : 'Archive'}
                    </p>
                  </div>
                  
                  <motion.div 
                    animate={{ rotate: showAccountMenu ? 180 : 0 }}
                    className="text-white/20 mr-1"
                  >
                     <ChevronDown size={14} />
                  </motion.div>
                </div>
              </button>
            </div>
        ) : (
          <Link href="/login">
            <div className="flex items-center gap-2.5 px-4 py-3 bg-white text-black rounded-card hover:bg-white/90 transition-all group shadow-xl">
              <User size={18} className="group-hover:scale-110 transition-transform" />
              <span className="font-heading font-bold text-xs uppercase tracking-widest">Sign In</span>
            </div>
          </Link>
        )}
      </div>
    </aside>
  );
}

export function BottomNav() {
  const pathname = usePathname();
  const { user } = useAuth();
  const [isMinimized, setIsMinimized] = useState(false);
  const [showNotifCenter, setShowNotifCenter] = useState(false);
  const [algoNotifs, setAlgoNotifs] = useState<CommunityNotification[]>([]);
  const [socialNotifs, setSocialNotifs] = useState<any[]>([]);
  const [notifCount, setNotifCount] = useState(0);


  // Load state on mount
  useEffect(() => {
    const saved = localStorage.getItem('cinechive-nav-minimized');
    if (saved === 'true') setIsMinimized(true);
  }, []);

  // Persist state on change
  useEffect(() => {
    localStorage.setItem('cinechive-nav-minimized', String(isMinimized));
  }, [isMinimized]);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      const [algo, social] = await Promise.all([
        getAlgorithmicNotifications(),
        getSocialNotificationsAction()
      ]);
      setAlgoNotifs(algo.notifications);
      setSocialNotifs(social);
    };

    fetchData();
    window.addEventListener('refresh-notifications', fetchData);
    return () => window.removeEventListener('refresh-notifications', fetchData);
  }, [user]);

  useEffect(() => {
    const unreadSocial = socialNotifs.filter(n => !n.is_read).length;
    setNotifCount(algoNotifs.length + unreadSocial);
  }, [algoNotifs, socialNotifs]);

  const handleMarkAsRead = async (id: string) => {
    await markNotificationAsReadAction(id);
    setSocialNotifs(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  // Hide bottom nav on auth pages
  if (pathname === '/login' || pathname === '/signup') return null;

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 px-4 pb-safe pointer-events-none mb-6">
      <div className="flex justify-center w-full">
        <motion.nav 
          initial={false}
          animate={{ 
            height: isMinimized ? '48px' : '72px', 
            width: isMinimized ? '48px' : 'min(420px, 92vw)', 
            borderRadius: isMinimized ? '24px' : '36px' 
          }}
          drag="y"
          dragConstraints={{ top: 0, bottom: 0 }}
          dragElastic={0.2}
          onDragEnd={(_, info) => {
            if (info.offset.y > 40 && !isMinimized) setIsMinimized(true);
            if (info.offset.y < -40 && isMinimized) setIsMinimized(false);
          }}
          className="glass border border-white/10 flex items-center justify-between p-2 overflow-hidden shadow-2xl relative pointer-events-auto cursor-grab active:cursor-grabbing"
        >
          <AnimatePresence mode="wait">
            {isMinimized ? (
              <motion.button key="min" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsMinimized(false)} className="w-full h-full flex items-center justify-center text-white">
                <Menu size={20} />
              </motion.button>
            ) : (
              <motion.div key="max" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="flex items-center justify-around w-full px-2">
                {NAV_ITEMS.filter(item => {
                  if (['Community', 'Activity', 'Library', 'People', 'Discover'].includes(item.label)) return !!user;
                  return true;
                }).map((item) => {
                  const isActive = pathname === item.href;
                  const Icon = icons[item.icon as keyof typeof icons] || icons.home;

                  return (
                    <Link key={item.href} href={item.href} className="relative group p-1.5 md:p-2 min-w-[36px] md:min-w-[44px] flex items-center justify-center">
                      <motion.div whileTap={{ scale: 0.95 }} className="flex items-center justify-center relative">
                        <Icon size={20} className={cn(isActive ? "text-white" : "text-white/30")} />
                        {item.label === 'Activity' && (
                          <div 
                            onClick={(e) => {
                              e.preventDefault();
                              setShowNotifCenter(!showNotifCenter);
                            }}
                            className="absolute -top-4 -right-4 p-4 z-20"
                          >
                            <NotificationIndicator count={notifCount} />
                          </div>
                        )}
                      </motion.div>
                      
                      {item.label === 'Activity' && (
                        <AnimatePresence>
                          {showNotifCenter && (
                            <CommunityNotificationCenter 
                              algorithmicNotifications={algoNotifs}
                              socialNotifications={socialNotifs}
                              onClose={() => setShowNotifCenter(false)}
                              onMarkAsRead={handleMarkAsRead}
                              position="bottom"
                            />
                          )}
                        </AnimatePresence>
                      )}
                      {isActive && (
                        <motion.div layoutId="active-dot-nav" className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-white rounded-full" />
                      )}
                    </Link>
                  );
                })}
                
                <Link href={user ? "/profile" : "/login"} className="p-1.5 md:p-2 min-w-[36px] md:min-w-[44px] flex items-center justify-center">
                  <motion.div whileTap={{ scale: 0.95 }} className="flex items-center justify-center">
                    <CinematicAvatar 
                      src={user?.profile?.avatar_url} 
                      username={user?.profile?.username || 'User'} 
                      size="sm"
                      showSpotlight={false}
                      style={user?.profile?.primary_style as ClassificationName}
                    />
                  </motion.div>
                </Link>

                <motion.button whileTap={{ scale: 0.9 }} onClick={() => setIsMinimized(true)} className="p-1.5 md:p-2 text-white/20 hover:text-white min-w-[36px] md:min-w-[44px] flex items-center justify-center">
                  <ChevronDown size={18} />
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.nav>
      </div>
    </div>
  );
}
