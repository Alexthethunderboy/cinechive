'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { NAV_ITEMS, SPRING_CONFIG } from '@/lib/design-tokens';
import { Calendar, Star, Play, History, Repeat } from 'lucide-react';
import { useEffect, useState, useRef, useMemo } from 'react';
import { cn, formatUsername } from '@/lib/utils';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { AnimatePresence } from 'framer-motion';
import { Home, Search, Globe, PlusSquare, Activity, Archive, Settings, LogOut, Film, Music, User, Menu, ChevronDown, Layers, Zap, Bell, MoreVertical, ChevronLeft, ChevronRight, Users, X } from 'lucide-react';
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
import { CLIENT_EVENTS } from '@/lib/client-events';
import { capTo99Plus, getNotificationCountSummary } from '@/lib/notification-utils';

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

function NotificationIndicator({ count, pulse = true }: { count: number; pulse?: boolean }) {
  if (count <= 0) return null;
  const urgent = count >= 10;
  return (
    <div className="absolute -top-1 -right-1">
      {urgent ? (
        <div className={cn(
          "flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-vibe-rose border-2 border-black text-[8px] font-bold text-white shadow-lg",
          pulse && "animate-pulse"
        )}>
          {count > 99 ? '99+' : count}
        </div>
      ) : (
        <div className={cn(
          "h-2.5 w-2.5 rounded-full bg-vibe-rose border border-black shadow-md",
          pulse && "animate-pulse"
        )} />
      )}
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
  const accountMenuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  // Close account menu and notification center on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (accountMenuRef.current && !accountMenuRef.current.contains(e.target as Node)) {
        setShowAccountMenu(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifCenter(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside as any);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside as any);
    };
  }, []);

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

    window.addEventListener(CLIENT_EVENTS.refreshNotifications, fetchData);
    return () => {
      supabase.removeChannel(channel);
      window.removeEventListener(CLIENT_EVENTS.refreshNotifications, fetchData);
    };
  }, [user]);

  // Combined count for the badge
  useEffect(() => {
    const summary = getNotificationCountSummary(algoNotifs.length, socialNotifs);
    setNotifCount(summary.total);
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
            <div key={item.href} className="relative">
              <Link href={item.href}>
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
                    <div 
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setShowNotifCenter(!showNotifCenter);
                      }}
                      className="px-2 py-0.5 rounded-full bg-vibe-rose/10 border border-vibe-rose/20 text-[10px] font-bold text-vibe-rose hover:bg-vibe-rose/20 transition-colors cursor-pointer"
                    >
                      {capTo99Plus(notifCount)}
                    </div>
                  )}

                  {isActive && (
                    <motion.div layoutId="sidebar-active" className="absolute left-0 w-1 h-6 bg-white rounded-full" />
                  )}
                </div>
              </Link>

              {/* Notification Center — rendered OUTSIDE the Link to avoid nested <a> */}
              {item.label === 'Activity' && (
                <div ref={notifRef}>
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
            </div>
          );
        })}
      </nav>

      <div className="p-4 mt-auto">
        {user ? (
            <div ref={accountMenuRef} className="relative group">
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
                        className="flex items-center gap-3 px-3 py-2.5 text-xs text-white/50 hover:text-white hover:bg-white/5 rounded-xl transition-all font-metadata tracking-widest"
                      >
                        <User size={14} />
                        View Profile
                      </Link>
                      <Link 
                        href="/profile/settings"
                        onClick={() => setShowAccountMenu(false)}
                        className="flex items-center gap-3 px-3 py-2.5 text-xs text-white/50 hover:text-white hover:bg-white/5 rounded-xl transition-all font-metadata tracking-widest"
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
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-xs text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all font-metadata tracking-widest"
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
                    avatarMode={user.profile?.avatar_mode}
                    avatarCharacter={user.profile?.avatar_character}
                    avatarAnimation={user.profile?.avatar_animation}
                    size="md"
                    style={user.profile?.primary_style as ClassificationName || 'Atmospheric'}
                  />

                  <div className="flex-1 min-w-0 z-10">
                    <p className="text-xs font-heading font-black text-white tracking-tighter italic">
                      {formatUsername(user.profile?.display_name || user.profile?.username) || 'User'}
                    </p>
                    <p className="text-[9px] text-white/30 font-mono tracking-[0.2em] mt-0.5">
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
              <span className="font-heading font-bold text-xs tracking-widest">Sign in</span>
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
  const [showPeekMenu, setShowPeekMenu] = useState(false);
  const [showCustomize, setShowCustomize] = useState(false);
  const [inlineSearchOpen, setInlineSearchOpen] = useState(false);
  const [density, setDensity] = useState<'full' | 'compact' | 'icon'>('full');
  const [reduceMotion, setReduceMotion] = useState(false);
  const [largeTargets, setLargeTargets] = useState(false);
  const [pinnedAction, setPinnedAction] = useState<'search' | 'community' | 'vault'>('search');
  const [customOrder, setCustomOrder] = useState<string[]>([]);
  const [isHiddenByScroll, setIsHiddenByScroll] = useState(false);
  const [showNotifCenter, setShowNotifCenter] = useState(false);
  const [algoNotifs, setAlgoNotifs] = useState<CommunityNotification[]>([]);
  const [socialNotifs, setSocialNotifs] = useState<any[]>([]);
  const [notifCount, setNotifCount] = useState(0);
  const longPressTimer = useRef<number | null>(null);
  const lastScrollY = useRef(0);
  const notifRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  // Close popovers on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifCenter(false);
      }
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setInlineSearchOpen(false);
      }
      if (showPeekMenu || showCustomize) {
        const target = e.target as Node;
        if (!(target as Element)?.closest?.('[data-nav-root="mobile"]')) {
          setShowPeekMenu(false);
          setShowCustomize(false);
        }
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside as any);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside as any);
    };
  }, [showPeekMenu, showCustomize]);

  // Load preferences on mount
  useEffect(() => {
    const saved = localStorage.getItem('cinechive-nav-minimized');
    if (saved === 'true') setIsMinimized(true);
    const savedOrder = localStorage.getItem('cinechive-nav-order');
    const savedPinned = localStorage.getItem('cinechive-nav-pinned') as 'search' | 'community' | 'vault' | null;
    const savedReduceMotion = localStorage.getItem('cinechive-reduce-motion');
    const savedLargeTargets = localStorage.getItem('cinechive-large-targets');

    if (savedOrder) {
      try {
        const parsed = JSON.parse(savedOrder);
        if (Array.isArray(parsed)) setCustomOrder(parsed);
      } catch {
        // ignore malformed local storage
      }
    }
    if (savedPinned) setPinnedAction(savedPinned);
    if (savedReduceMotion === 'true') setReduceMotion(true);
    if (savedLargeTargets === 'true') setLargeTargets(true);
  }, []);

  // Persist state on change
  useEffect(() => {
    localStorage.setItem('cinechive-nav-minimized', String(isMinimized));
  }, [isMinimized]);
  useEffect(() => {
    localStorage.setItem('cinechive-nav-order', JSON.stringify(customOrder));
  }, [customOrder]);
  useEffect(() => {
    localStorage.setItem('cinechive-nav-pinned', pinnedAction);
  }, [pinnedAction]);
  useEffect(() => {
    localStorage.setItem('cinechive-reduce-motion', String(reduceMotion));
  }, [reduceMotion]);
  useEffect(() => {
    localStorage.setItem('cinechive-large-targets', String(largeTargets));
  }, [largeTargets]);

  // Route-aware hide/show for content-heavy pages
  useEffect(() => {
    const lockVisibleRoutes = ['/community', '/profile/settings', '/login', '/signup'];
    if (lockVisibleRoutes.some((r) => pathname.startsWith(r))) {
      setIsHiddenByScroll(false);
      return;
    }
    const main = document.querySelector('main');
    if (!main) return;
    const onScroll = () => {
      const y = (main as HTMLElement).scrollTop;
      if (y > lastScrollY.current && y > 120) setIsHiddenByScroll(true);
      else setIsHiddenByScroll(false);
      lastScrollY.current = y;
    };
    main.addEventListener('scroll', onScroll, { passive: true });
    return () => main.removeEventListener('scroll', onScroll);
  }, [pathname]);

  // Adaptive density by width + route complexity
  useEffect(() => {
    const setAdaptive = () => {
      const w = window.innerWidth;
      const routeCompact = pathname.startsWith('/media') || pathname.startsWith('/profile/settings');
      if (w <= 340) setDensity('icon');
      else if (w <= 390 || routeCompact) setDensity('compact');
      else setDensity('full');
    };
    setAdaptive();
    window.addEventListener('resize', setAdaptive);
    return () => window.removeEventListener('resize', setAdaptive);
  }, [pathname]);

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
    window.addEventListener(CLIENT_EVENTS.refreshNotifications, fetchData);
    return () => window.removeEventListener(CLIENT_EVENTS.refreshNotifications, fetchData);
  }, [user]);

  useEffect(() => {
    const summary = getNotificationCountSummary(algoNotifs.length, socialNotifs);
    setNotifCount(summary.total);
  }, [algoNotifs, socialNotifs]);

  const handleMarkAsRead = async (id: string) => {
    await markNotificationAsReadAction(id);
    setSocialNotifs(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  const quietHours = useMemo(() => {
    const hour = new Date().getHours();
    return hour >= 23 || hour < 7;
  }, []);

  const contextActions = useMemo(() => {
    if (pathname.startsWith('/media')) {
      return [
        { id: 'save', label: 'Save', href: `${pathname}?action=save#media-actions` },
        { id: 'journal', label: 'Journal', href: `${pathname}?action=journal#media-actions` },
      ];
    }
    if (pathname.startsWith('/community')) {
      return [
        { id: 'compose', label: 'Compose', href: '#compose' },
        { id: 'activity', label: 'Alerts', href: '/activity' },
      ];
    }
    if (pathname.startsWith('/vault')) {
      return [
        { id: 'new', label: 'New List', href: '/vault' },
        { id: 'search', label: 'Find', href: '/search' },
      ];
    }
    return [
      { id: 'search', label: 'Search', href: '/search' },
      { id: 'discover', label: 'Discover', href: '/discover' },
    ];
  }, [pathname]);

  const navItems = useMemo(() => {
    const filtered = NAV_ITEMS.filter(item => {
      if (['Community', 'Activity', 'Library', 'People', 'Discover'].includes(item.label)) return !!user;
      return true;
    });
    if (customOrder.length > 0) {
      const indexByHref = new Map(customOrder.map((h, i) => [h, i]));
      filtered.sort((a, b) => (indexByHref.get(a.href) ?? 999) - (indexByHref.get(b.href) ?? 999));
    }
    return filtered;
  }, [user, customOrder]);

  const primaryItems = navItems.slice(0, 5);
  const overflowItems = navItems.slice(5);

  const triggerHaptic = () => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(8);
  };

  const handleLongPressStart = () => {
    if (longPressTimer.current) window.clearTimeout(longPressTimer.current);
    longPressTimer.current = window.setTimeout(() => {
      setShowCustomize(true);
      setShowPeekMenu(false);
      triggerHaptic();
    }, 550);
  };
  const handleLongPressEnd = () => {
    if (longPressTimer.current) {
      window.clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const moveItem = (href: string, delta: number) => {
    const current: string[] = [...navItems.map((i) => i.href as string)];
    const idx = current.indexOf(href);
    if (idx < 0) return;
    const target = idx + delta;
    if (target < 0 || target >= current.length) return;
    [current[idx], current[target]] = [current[target], current[idx]];
    setCustomOrder(current);
  };

  const tapTarget = largeTargets ? 'min-w-[48px] min-h-[48px]' : 'min-w-[44px] min-h-[44px]';
  const motionTransition = reduceMotion ? { duration: 0 } : undefined;

  // Hide bottom nav on auth pages
  if (pathname === '/login' || pathname === '/signup') return null;

  return (
    <>
      {/* Inline search expansion */}
      <AnimatePresence>
        {inlineSearchOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={motionTransition}
            className="md:hidden fixed bottom-[calc(env(safe-area-inset-bottom)+78px)] left-3 right-3 z-[60] p-2 bg-black/95 backdrop-blur-xl border border-white/10 rounded-2xl"
          >
            <div ref={searchRef}>
              <EverythingBar />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    <div
      data-nav-root="mobile"
      className={cn(
        "md:hidden fixed left-0 right-0 z-50 px-3 pointer-events-none transition-transform duration-300",
        isHiddenByScroll ? "translate-y-28" : "translate-y-0"
      )}
      style={{ bottom: 'max(10px, env(safe-area-inset-bottom))' }}
    >
      <div className="flex justify-center w-full">
        <motion.nav 
          initial={false}
          animate={{ 
            height: isMinimized ? '50px' : density === 'icon' ? '60px' : density === 'compact' ? '64px' : '68px', 
            width: isMinimized ? '50px' : density === 'icon' ? 'min(340px, 94vw)' : 'min(430px, 94vw)', 
            borderRadius: isMinimized ? '24px' : '36px' 
          }}
          drag="y"
          dragConstraints={{ top: 0, bottom: 0 }}
          dragElastic={0.2}
          onDragEnd={(_, info) => {
            if (info.offset.y > 40 && !isMinimized) setIsMinimized(true);
            if (info.offset.y < -40 && isMinimized) setIsMinimized(false);
          }}
          transition={motionTransition}
          className="glass border border-white/10 flex items-center justify-between p-2 overflow-visible shadow-2xl relative pointer-events-auto cursor-grab active:cursor-grabbing"
        >
          {/* contextual actions */}
          {!isMinimized && density !== 'icon' && (
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 flex gap-2">
              {contextActions.slice(0, 2).map((a) => (
                <Link
                  key={a.id}
                  href={a.href}
                  className="px-2.5 py-1 rounded-full bg-black/80 border border-white/10 text-[9px] uppercase tracking-widest text-white/70 hover:text-white"
                  onClick={triggerHaptic}
                >
                  {a.label}
                </Link>
              ))}
            </div>
          )}

          <AnimatePresence mode="wait">
            {isMinimized ? (
              <motion.button
                key="min"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={motionTransition}
                onPointerDown={handleLongPressStart}
                onPointerUp={handleLongPressEnd}
                onPointerLeave={handleLongPressEnd}
                onClick={() => {
                  setShowPeekMenu(!showPeekMenu);
                  triggerHaptic();
                }}
                className="w-full h-full flex items-center justify-center text-white relative"
              >
                <div className="h-3 w-3 rounded-full bg-white/80" />
                <NotificationIndicator count={notifCount} pulse={!quietHours} />
              </motion.button>
            ) : (
              <motion.div
                key="max"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={motionTransition}
                className="flex items-center justify-around w-full px-1"
              >
                {primaryItems.map((item) => {
                  const isActive = pathname === item.href;
                  const Icon = icons[item.icon as keyof typeof icons] || icons.home;

                  return (
                    <div key={item.href} className={cn("relative group p-1 flex items-center justify-center", tapTarget)}>
                      <Link href={item.href} className="flex items-center justify-center">
                        <motion.div whileTap={{ scale: 0.95 }} className={cn(
                          "flex items-center justify-center relative rounded-full px-2 py-1 transition-colors",
                          isActive ? "bg-white/10" : ""
                        )}>
                          <Icon size={20} className={cn(isActive ? "text-white" : "text-white/35")} />
                          {isActive && density !== 'icon' && (
                            <span className="absolute -bottom-4 text-[8px] uppercase tracking-widest text-white/80">
                              {item.label}
                            </span>
                          )}
                          {item.label === 'Activity' && (
                            <div 
                              ref={notifRef}
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setShowNotifCenter(!showNotifCenter);
                                triggerHaptic();
                              }}
                              className="absolute -top-3 -right-3 p-2 z-20"
                            >
                              <NotificationIndicator count={notifCount} pulse={!quietHours} />
                            </div>
                          )}
                        </motion.div>
                      </Link>
                      
                      {/* Notification Center — rendered OUTSIDE the Link */}
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
                    </div>
                  );
                })}

                {/* Search toggle (first-class inline) */}
                <button 
                  onClick={() => {
                    setInlineSearchOpen(!inlineSearchOpen);
                    triggerHaptic();
                  }}
                  className={cn("relative group p-1 flex items-center justify-center", tapTarget)}
                >
                  <motion.div whileTap={{ scale: 0.95 }} className={cn(
                    "flex items-center justify-center rounded-full px-2 py-1",
                    inlineSearchOpen ? "bg-white/10" : ""
                  )}>
                    <Search size={20} className={cn(inlineSearchOpen ? "text-white" : "text-white/35")} />
                  </motion.div>
                </button>
                
                <Link href={user ? "/profile" : "/login"} className={cn("p-1 flex items-center justify-center", tapTarget)}>
                  <motion.div whileTap={{ scale: 0.95 }} className="flex items-center justify-center">
                    <CinematicAvatar 
                      src={user?.profile?.avatar_url} 
                      username={user?.profile?.username || 'User'} 
                      avatarMode={user?.profile?.avatar_mode}
                      avatarCharacter={user?.profile?.avatar_character}
                      avatarAnimation={user?.profile?.avatar_animation}
                      size="sm"
                      showSpotlight={false}
                      style={user?.profile?.primary_style as ClassificationName}
                    />
                  </motion.div>
                </Link>

                {/* overflow in More to avoid edge crowding */}
                {overflowItems.length > 0 && (
                  <div className={cn("relative p-1 flex items-center justify-center", tapTarget)}>
                    <button
                      onClick={() => setShowPeekMenu(!showPeekMenu)}
                      className="text-white/35 hover:text-white"
                      aria-label="More actions"
                    >
                      <MoreVertical size={18} />
                    </button>
                  </div>
                )}

                <motion.button whileTap={{ scale: 0.9 }} onClick={() => setIsMinimized(true)} className={cn("p-1 text-white/25 hover:text-white flex items-center justify-center", tapTarget)}>
                  <ChevronDown size={18} />
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Peek menu */}
          <AnimatePresence>
            {showPeekMenu && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.98 }}
                className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 w-[min(92vw,360px)] rounded-2xl border border-white/10 bg-black/95 p-3"
              >
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: 'Search', href: '/search' },
                    { label: 'Community', href: '/community' },
                    { label: 'Library', href: '/vault' },
                  ].map((a) => (
                    <Link key={a.label} href={a.href} onClick={() => { setShowPeekMenu(false); setIsMinimized(false); }} className="h-11 rounded-xl border border-white/10 bg-white/5 text-[10px] uppercase tracking-widest text-white/75 flex items-center justify-center">
                      {a.label}
                    </Link>
                  ))}
                </div>
                {overflowItems.length > 0 && (
                  <div className="mt-3 border-t border-white/10 pt-3 flex flex-wrap gap-2">
                    {overflowItems.map((item) => (
                      <Link key={item.href} href={item.href} className="px-2 py-1 rounded-lg bg-white/5 text-[10px] text-white/70">
                        {item.label}
                      </Link>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* customization mode */}
          <AnimatePresence>
            {showCustomize && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 w-[min(94vw,420px)] rounded-2xl border border-white/10 bg-black/95 p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-white/60">Customize Bar</p>
                  <button onClick={() => setShowCustomize(false)} className="text-white/50 hover:text-white">
                    <X size={16} />
                  </button>
                </div>

                <div className="space-y-2">
                  {navItems.map((item) => (
                    <div key={item.href} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                      <span className="text-xs text-white/80">{item.label}</span>
                      <div className="flex items-center gap-2">
                        <button onClick={() => moveItem(item.href, -1)} className="text-white/60 hover:text-white" aria-label={`Move ${item.label} up`}>
                          <ChevronLeft size={14} />
                        </button>
                        <button onClick={() => moveItem(item.href, 1)} className="text-white/60 hover:text-white" aria-label={`Move ${item.label} down`}>
                          <ChevronRight size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {(['search', 'community', 'vault'] as const).map((p) => (
                    <button
                      key={p}
                      onClick={() => setPinnedAction(p)}
                      className={cn(
                        "h-10 rounded-lg text-[10px] uppercase tracking-widest border",
                        pinnedAction === p ? "bg-white text-black border-white" : "bg-white/5 text-white/70 border-white/10"
                      )}
                    >
                      Pin {p}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setLargeTargets((v) => !v)}
                    className={cn("h-10 rounded-lg border text-[10px] uppercase tracking-widest", largeTargets ? "bg-white text-black border-white" : "bg-white/5 text-white/70 border-white/10")}
                  >
                    {largeTargets ? 'Large Targets On' : 'Large Targets'}
                  </button>
                  <button
                    onClick={() => setReduceMotion((v) => !v)}
                    className={cn("h-10 rounded-lg border text-[10px] uppercase tracking-widest", reduceMotion ? "bg-white text-black border-white" : "bg-white/5 text-white/70 border-white/10")}
                  >
                    {reduceMotion ? 'Reduce Motion On' : 'Reduce Motion'}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.nav>
      </div>
    </div>
    </>
  );
}
