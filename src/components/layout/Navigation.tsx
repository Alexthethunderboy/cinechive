'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { NAV_ITEMS, SPRING_CONFIG } from '@/lib/design-tokens';
import { useEffect, useState, useRef } from 'react';
import { cn, formatUsername } from '@/lib/utils';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { AnimatePresence } from 'framer-motion';
import { Home, Search, Globe, PlusSquare, Activity, Archive, Settings, LogOut, Film, Music, User, Menu, ChevronDown, Layers, Zap, Bell, MoreVertical } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { signOut } from '@/app/auth/actions';
import { getAlgorithmicNotifications, PulseNotification } from '@/lib/pulse-actions';
import { PulseNotificationCenter } from '@/components/pulse/PulseNotificationCenter';
import EverythingBar from '@/components/search/EverythingBar';
import { useAuth } from '@/components/providers/AuthProvider';
import Image from 'next/image';

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
};

function NotificationIndicator({ count }: { count: number }) {
  if (count === 0) return null;
  return (
    <div className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-vibe-rose border-2 border-black text-[8px] font-bold text-white shadow-lg">
      {count > 9 ? '9+' : count}
    </div>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [notifCount, setNotifCount] = useState(0);

  useEffect(() => {
    if (user) {
      getAlgorithmicNotifications().then(notifs => setNotifCount(notifs.length));
    }
  }, [user]);

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
          if (item.label === 'Pulse' || item.label === 'Activity' || item.label === 'Library') return !!user;
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
                  <div className="px-2 py-0.5 rounded-full bg-vibe-rose/10 border border-vibe-rose/20 text-[10px] font-bold text-vibe-rose">
                    {notifCount}
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
          <div className="relative">
            <AnimatePresence>
              {showAccountMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute bottom-full left-0 w-full mb-2 glass border border-white/10 rounded-card overflow-hidden shadow-2xl z-50"
                >
                  <div className="p-2 space-y-1">
                    <Link 
                      href="/profile" 
                      onClick={() => setShowAccountMenu(false)}
                      className="flex items-center gap-3 px-3 py-2 text-sm text-muted hover:text-white hover:bg-white/5 rounded-inner transition-colors"
                    >
                      <User size={16} />
                      View Profile
                    </Link>
                    <button 
                      onClick={() => setShowAccountMenu(false)}
                      className="w-full flex items-center gap-3 px-3 py-2 text-sm text-muted hover:text-white hover:bg-white/5 rounded-inner transition-colors"
                    >
                      <Settings size={16} />
                      Settings
                    </button>
                    <div className="h-px bg-white/5 mx-2 my-1" />
                    <button 
                      onClick={() => {
                        setShowAccountMenu(false);
                        signOut();
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 text-sm text-rose-400 hover:bg-rose-500/10 rounded-inner transition-colors"
                    >
                      <LogOut size={16} />
                      Logout
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <button
              onClick={() => setShowAccountMenu(!showAccountMenu)}
              className={cn(
                "w-full flex items-center gap-2.5 p-1.5 rounded-card transition-all border",
                showAccountMenu ? "bg-white/10 border-white/20" : "hover:bg-white/5 border-transparent"
              )}
            >
              <div className="relative w-9 h-9 rounded-full overflow-hidden border border-white/10 bg-surface-hover shrink-0">
                {user.profile?.avatar_url ? (
                  <Image src={user.profile.avatar_url} alt={user.profile.username} fill className="object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-vibe-violet/20 text-vibe-violet font-display text-xs">
                    {formatUsername(user.profile?.username)?.[0]?.toUpperCase() || '?'}
                  </div>
                )}
              </div>
              <div className="flex-1 text-left min-w-0">
                <p className="text-xs font-heading font-bold text-white truncate">
                  {user.profile?.display_name || formatUsername(user.profile?.username) || 'User'}
                </p>
                <p className="text-[10px] text-muted uppercase tracking-widest truncate">
                  {user.profile?.username ? `@${formatUsername(user.profile.username)}` : 'Profile'}
                </p>
              </div>
              <MoreVertical size={16} className="text-muted/50" />
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
    if (user) {
      getAlgorithmicNotifications().then(notifs => setNotifCount(notifs.length));
    }
  }, [user]);

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 px-4 pb-safe pointer-events-none mb-6">
      <div className="flex justify-center w-full">
        <motion.nav 
          initial={false}
          animate={{ 
            height: isMinimized ? '48px' : '72px', 
            width: isMinimized ? '48px' : '320px', 
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
              <motion.div key="max" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="flex items-center justify-between w-full px-4">
                {NAV_ITEMS.filter(item => {
                  if (item.label === 'Pulse' || item.label === 'Activity' || item.label === 'Library') return !!user;
                  return true;
                }).map((item) => {
                  const isActive = pathname === item.href;
                  const Icon = icons[item.icon as keyof typeof icons] || icons.home;

                  return (
                    <Link key={item.href} href={item.href} className="relative group p-2 min-w-[44px] min-h-[44px] flex items-center justify-center">
                      <motion.div whileTap={{ scale: 0.95 }} className="flex items-center justify-center relative">
                        <Icon size={20} className={cn(isActive ? "text-white" : "text-white/30")} />
                        {item.label === 'Activity' && <NotificationIndicator count={notifCount} />}
                      </motion.div>
                      {isActive && (
                        <motion.div layoutId="active-dot-nav" className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-white rounded-full" />
                      )}
                    </Link>
                  );
                })}
                
                <Link href={user ? "/profile" : "/login"} className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center">
                  <motion.div whileTap={{ scale: 0.95 }} className="flex items-center justify-center">
                    <div className={cn("w-8 h-8 rounded-full overflow-hidden border transition-all", pathname === "/profile" ? "border-white" : "border-white/10")}>
                      {user?.profile?.avatar_url ? (
                        <Image src={user.profile.avatar_url} alt="Profile" width={32} height={32} className="object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-white/5 text-white/50">
                          <User size={16} />
                        </div>
                      )}
                    </div>
                  </motion.div>
                </Link>

                <motion.button whileTap={{ scale: 0.9 }} onClick={() => setIsMinimized(true)} className="p-2 text-white/20 hover:text-white min-w-[44px] min-h-[44px] flex items-center justify-center">
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
