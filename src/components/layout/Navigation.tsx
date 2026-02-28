'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { NAV_ITEMS, SPRING_CONFIG } from '@/lib/design-tokens';
import { cn } from '@/lib/utils';
import { Home, Search, PlusSquare, Activity, Archive, Settings, LogOut, Film, Music, User, Menu, ChevronDown } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { signOut } from '@/app/auth/actions';
import { useEffect, useState, useRef } from 'react';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { AnimatePresence } from 'framer-motion';

const icons = {
  home: Home,
  search: Search,
  plus: PlusSquare,
  activity: Activity,
  archive: Archive,
  film: Film,
  user: User,
};

export function Sidebar() {
  const pathname = usePathname();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user));
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  return (
    <aside
      className="hidden md:flex flex-col w-64 h-full shrink-0 glass border-r border-border-glass z-50"
    >
      <div className="p-8">
        <h1 className="font-display text-2xl tracking-tighter text-white italic">
          CINECHIVE
        </h1>
      </div>

      <nav className="flex-1 px-4 space-y-1">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          const Icon = icons[item.icon as keyof typeof icons];

          return (
            <Link key={item.href} href={item.href}>
              <div className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-inner transition-all group relative",
                isActive 
                  ? "text-white bg-white/5" 
                  : "text-muted hover:text-white hover:bg-white/5"
              )}>
                <Icon size={20} className={cn(
                  "transition-transform group-hover:scale-110",
                   isActive && "text-white"
                )} />
                <span className="font-heading font-medium tracking-tight">
                  {item.label}
                </span>

                {isActive && (
                  <motion.div
                    layoutId="active-sidebar"
                    className="absolute left-0 w-1 h-6 bg-white rounded-full"
                    transition={SPRING_CONFIG.default}
                  />
                )}
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="p-6 mt-auto space-y-4">
        {user ? (
          <>
            <div className="flex items-center gap-3 px-4 py-3 text-muted hover:text-white transition-colors cursor-pointer group">
              <Settings size={20} className="group-hover:rotate-45 transition-transform" />
              <span className="font-heading font-medium text-sm">Settings</span>
            </div>
            
            <button 
              onClick={() => signOut()}
              className="w-full flex items-center gap-3 px-4 py-3 text-muted hover:text-rose-400 transition-colors cursor-pointer group border-t border-white/5 pt-6 bg-transparent"
            >
              <LogOut size={20} />
              <span className="font-heading font-medium text-sm">Logout</span>
            </button>
          </>
        ) : (
          <Link href="/login">
            <div className="flex items-center gap-3 px-4 py-3 text-white hover:text-white/80 transition-colors cursor-pointer group border-t border-white/5 pt-6 bg-transparent">
              <User size={20} />
              <span className="font-heading font-medium text-sm uppercase tracking-widest">Sign In</span>
            </div>
          </Link>
        )}
      </div>
    </aside>
  );
}

export function BottomNav() {
  const pathname = usePathname();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  return (
    <div className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[90vw] max-w-sm">
      <motion.nav 
        initial={false}
        animate={{ 
          height: isMinimized ? '48px' : '72px',
          width: isMinimized ? '48px' : '100%',
          borderRadius: isMinimized ? '24px' : '36px'
        }}
        className="glass border border-white/10 flex items-center justify-between p-2 overflow-hidden shadow-2xl relative"
      >
        <AnimatePresence mode="wait">
          {isMinimized ? (
            <motion.button
              key="min"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMinimized(false)}
              className="w-full h-full flex items-center justify-center text-accent"
            >
              <Menu size={20} />
            </motion.button>
          ) : (
            <motion.div
              key="max"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex items-center justify-between w-full px-4"
            >
              {NAV_ITEMS.map((item) => {
                const isActive = pathname === item.href;
                const Icon = icons[item.icon as keyof typeof icons];

                return (
                  <Link key={item.href} href={item.href} className="relative group p-2">
                    <Icon size={20} className={cn(isActive ? "text-accent" : "text-white/50")} />
                    {isActive && (
                      <motion.div 
                        layoutId="nav-glow" 
                        className="absolute inset-0 bg-accent/20 blur-lg -z-10 rounded-full" 
                      />
                    )}
                  </Link>
                );
              })}
              
              <Link href={user ? "/profile" : "/login"} className="p-2">
                <User size={20} className={cn(pathname === "/profile" ? "text-accent" : "text-white/50")} />
              </Link>

              <button 
                onClick={() => setIsMinimized(true)}
                className="p-2 text-white/20 hover:text-white"
              >
                <ChevronDown size={18} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>
    </div>
  );
}
