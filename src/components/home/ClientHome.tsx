'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, Calendar, Layers, Search, Sparkles, Users, ChevronRight, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import GlassPanel from '@/components/ui/GlassPanel';
import Link from 'next/link';
import Image from 'next/image';
import { TrendingFeed } from '../cinema/TrendingFeed';
import ReleaseRadar from '../cinema/ReleaseRadar';
import OnboardingModal from '@/components/onboarding/OnboardingModal';

type DiscoveryMode = 'broadcast' | 'radar';

export interface ClientHomeProps {
  user?: any;
}

export default function ClientHome({ user }: ClientHomeProps) {
  const [activeView, setActiveView] = useState<DiscoveryMode>('broadcast');
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);
  
  // Show onboarding modal for new users who haven't completed it
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    if (user && user.profile && user.profile.onboarding_completed === false) {
      setShowOnboarding(true);
    }
  }, [user]);

  useEffect(() => {
    const scrollContainer = document.querySelector('main');
    if (!scrollContainer) return;

    const handleScroll = () => {
      const currentScrollY = scrollContainer.scrollTop;
      
      // Show if scrolling up, hide if scrolling down
      if (currentScrollY > lastScrollY.current && currentScrollY > 100) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }
      
      lastScrollY.current = currentScrollY;
    };

    scrollContainer.addEventListener('scroll', handleScroll, { passive: true });
    return () => scrollContainer.removeEventListener('scroll', handleScroll);
  }, []);

  const discoveryModes: { id: DiscoveryMode, label: string, icon: any, color: string }[] = [
    { id: 'broadcast', label: 'New and Trending', icon: Flame, color: 'text-white' },
    { id: 'radar', label: 'Release Radar', icon: Calendar, color: 'text-vibe-violet' },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      {/* Refined Header - Animated on scroll */}
      <motion.header 
        initial={false}
        animate={{ 
          y: isVisible ? 0 : -100,
          opacity: isVisible ? 1 : 0
        }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="px-4 md:px-10 pt-4 md:pt-12 mb-2 md:mb-8 flex items-center justify-between sticky top-0 md:relative bg-black/50 md:bg-transparent backdrop-blur-xl md:backdrop-blur-none z-40"
        style={{ pointerEvents: isVisible ? 'auto' : 'none' }}
      >
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="flex items-center gap-4 md:gap-6"
        >
          <img 
            src="/app-logo.png" 
            alt="CineChive Logo" 
            className="w-10 h-10 md:hidden object-contain brightness-110 drop-shadow-xl" 
          />
          <div className="space-y-0.5">
            <h1 className="font-heading text-fluid-h2 md:text-fluid-h1 tracking-tighter text-white italic leading-none">
              CINE <span className="text-white/20 not-italic ml-0.5">CHIVE</span>
            </h1>
            <p className="text-[8px] md:text-[10px] uppercase tracking-[0.3em] text-muted font-bold opacity-30">
              Editorial discovery
            </p>
          </div>
        </motion.div>
      </motion.header>

      {/* Discovery Perspective Toggle */}
      <motion.div 
        initial={{ y: 0, opacity: 1 }}
        animate={{ 
          y: isVisible ? 0 : -100,
          opacity: isVisible ? 1 : 0
        }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="flex justify-center mb-6 md:mb-12 px-4 sticky top-24 z-50 pointer-events-none"
      >
        <div className="glass p-1 md:p-1.5 rounded-full flex items-center gap-1 shadow-2xl relative overflow-hidden group pointer-events-auto">
          <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
          
          {discoveryModes.map((mode) => {
            const isActive = activeView === mode.id;
            const IconComponent = mode.icon;
            
            return (
              <button
                key={mode.id}
                onClick={() => setActiveView(mode.id)}
                className={cn(
                  "relative flex items-center gap-2 px-4 py-1.5 md:px-6 md:py-2 rounded-full transition-all duration-500 z-10",
                  isActive ? "text-white" : "text-white/30 hover:text-white/60"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="active-mode-pill"
                    className="absolute inset-0 bg-white/10 border border-white/10 rounded-full shadow-inner"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                
                <IconComponent size={12} className={cn("md:w-3.5 md:h-3.5", isActive ? `${mode.color} scale-110` : "scale-100")} />

                <span className="font-metadata font-bold text-[10px] md:text-xs">
                  {mode.label}
                </span>

                {isActive && (
                  <motion.div
                    layoutId="active-dot-home"
                    className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-white rounded-full blur-[1px]"
                  />
                )}
              </button>
            );
          })}
        </div>
      </motion.div>

      <div className="relative z-10 flex-1 px-4 md:px-0">
        {activeView === 'broadcast' && (
           <TrendingFeed isVisible={isVisible} />
        )}

        {activeView === 'radar' && (
           <ReleaseRadar />
        )}
      </div>

      {/* Onboarding Flow for New Users */}
      {showOnboarding && (
        <OnboardingModal onComplete={() => setShowOnboarding(false)} />
      )}
    </div>
  );
}
