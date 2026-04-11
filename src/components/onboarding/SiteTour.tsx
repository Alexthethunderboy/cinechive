'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { X, ChevronRight, ChevronLeft, Check } from 'lucide-react';

interface Step {
  id: string;
  title: string;
  descriptionDesktop: string;
  descriptionMobile: string;
  targetId?: string;
}

const STEPS: Step[] = [
  {
    id: 'welcome',
    title: 'Welcome to CineChive',
    descriptionDesktop: 'A place to explore cinema, share recommendations, and manage your personal movie library.',
    descriptionMobile: 'A place to explore cinema, share recommendations, and manage your personal movie library.',
  },
  {
    id: 'media-tabs',
    title: 'Media Explorer',
    descriptionDesktop: 'Filter the feed by Movies, TV Series, Anime, or Animation to find exactly what you are looking for.',
    descriptionMobile: 'Filter the feed by Movies, TV Series, Anime, or Animation to find exactly what you are looking for.',
    targetId: 'home-media-tabs',
  },
  {
    id: 'discovery-modes',
    title: 'Discovery Modes',
    descriptionDesktop: 'Switch between trending titles and the Release Radar to see upcoming theater dates.',
    descriptionMobile: 'Switch between trending titles and the Release Radar to see upcoming theater dates.',
    targetId: 'home-discovery-modes',
  },
  {
    id: 'discover',
    title: 'Global Discover',
    descriptionDesktop: 'Find your next favorite movie by exploring curated collections and deep metadata in the sidebar.',
    descriptionMobile: 'Tap the Globe icon in your floating bar to explore curated collections and deep metadata.',
    targetId: 'nav-discover',
  },
  {
    id: 'community',
    title: 'Community Feed',
    descriptionDesktop: 'Join the conversation and see what other curators are recommending in the community sidebar.',
    descriptionMobile: 'Share your own vibes and see what curators are recommending from the center of your floating bar.',
    targetId: 'nav-community',
  },
  {
    id: 'library',
    title: 'Your Library',
    descriptionDesktop: 'Manage your saved movies, watchlist, and custom lists from your personal library tab.',
    descriptionMobile: 'Manage your saved movies, watchlist, and custom lists from your personal library in the floating bar.',
    targetId: 'nav-library',
  },
  {
    id: 'search',
    title: 'Universal Search',
    descriptionDesktop: 'Quickly find any movie, collection, or person using the search bar at the top of your sidebar.',
    descriptionMobile: 'Instantly find any movie, collection, or person using the search button in your floating bar.',
    targetId: 'nav-search',
  },
];

export function SiteTour() {
  const [currentStep, setCurrentStep] = useState(-1); // -1 = not started
  const [hasSeenTour, setHasSeenTour] = useState(true); // default to true to avoid flashing
  const [spotlightRect, setSpotlightRect] = useState<DOMRect | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const seen = localStorage.getItem('cinechive_tour_complete');
    if (!seen) {
      setHasSeenTour(false);
      // Start tour with a slight delay
      setTimeout(() => {
        setCurrentStep(0);
        document.documentElement.classList.add('site-tour-active');
      }, 1000);
    }
  }, []);

  const completeTour = useCallback(() => {
    localStorage.setItem('cinechive_tour_complete', 'true');
    setHasSeenTour(true);
    setCurrentStep(-1);
    document.documentElement.classList.remove('site-tour-active');
  }, []);

  const updateSpotlight = useCallback(() => {
    if (currentStep < 0 || currentStep >= STEPS.length) {
      setSpotlightRect(null);
      return;
    }

    const step = STEPS[currentStep];
    if (!step.targetId) {
      setSpotlightRect(null);
      return;
    }

    // Determine the prioritized ID based on device mode
    const primaryId = isMobile ? `${step.targetId}-mobile` : `${step.targetId}-sidebar`;
    const fallbackId = isMobile ? `${step.targetId}-sidebar` : `${step.targetId}-mobile`;

    const el = document.getElementById(step.targetId) || 
             document.getElementById(primaryId) || 
             document.getElementById(fallbackId);

    if (el) {
      setSpotlightRect(el.getBoundingClientRect());
    } else {
      setSpotlightRect(null);
    }
  }, [currentStep]);

  useEffect(() => {
    updateSpotlight();
    window.addEventListener('resize', updateSpotlight);
    return () => window.removeEventListener('resize', updateSpotlight);
  }, [updateSpotlight]);

  if (hasSeenTour || currentStep === -1) return null;

  const step = STEPS[currentStep];

  return (
    <div className="fixed inset-0 z-[100] pointer-events-none overflow-hidden">
      {/* Dim Overlay */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 pointer-events-auto backdrop-blur-[2px]"
        style={{
          clipPath: spotlightRect 
            ? `polygon(0% 0%, 0% 100%, ${spotlightRect.left}px 100%, ${spotlightRect.left}px ${spotlightRect.top}px, ${spotlightRect.right}px ${spotlightRect.top}px, ${spotlightRect.right}px ${spotlightRect.bottom}px, ${spotlightRect.left}px ${spotlightRect.bottom}px, ${spotlightRect.left}px 100%, 100% 100%, 100% 0%)`
            : 'none'
        }}
      />

      {/* Spotlight Border */}
      {spotlightRect && (
        <motion.div
          initial={false}
          animate={{
            top: spotlightRect.top - 4,
            left: spotlightRect.left - 4,
            width: spotlightRect.width + 8,
            height: spotlightRect.height + 8,
          }}
          className="absolute border-2 border-white rounded-xl shadow-[0_0_30px_rgba(255,255,255,0.3)] z-[101]"
        />
      )}

      {/* Card */}
      <div className="absolute inset-0 flex items-center justify-center p-6">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: -20 }}
          onPan={(e, info) => {
            if (info.offset.y > 100) {
              completeTour();
            }
          }}
          className="w-full max-w-sm glass bg-black/80 border border-white/10 rounded-3xl p-5 sm:p-8 pointer-events-auto shadow-2xl relative touch-none"
        >
          <button 
            onClick={completeTour}
            className="absolute top-4 right-4 p-2 text-white/30 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>

          <div className="space-y-4">
            <div className="flex items-center justify-between w-full">
              <div className="inline-flex px-3 py-1 rounded-full bg-white/5 text-[10px] uppercase tracking-widest text-white/40">
                Guide — Step {currentStep + 1} of {STEPS.length}
              </div>
              <div className="flex gap-1">
                {STEPS.map((_, i) => (
                  <div 
                    key={i} 
                    className={cn(
                      "w-1 h-1 rounded-full transition-all",
                      i === currentStep ? "bg-accent w-3" : "bg-white/10"
                    )} 
                  />
                ))}
              </div>
            </div>
            
            <h3 className="text-2xl font-heading font-bold text-white tracking-tight">
              {step.title}
            </h3>
            
            <p className="text-sm text-white/60 leading-relaxed font-metadata">
              {isMobile ? step.descriptionMobile : step.descriptionDesktop}
            </p>

            <div className="pt-8 flex items-center justify-between">
              <button
                onClick={() => currentStep > 0 && setCurrentStep(currentStep - 1)}
                disabled={currentStep === 0}
                className={cn(
                  "flex items-center gap-2 text-white/40 hover:text-white transition-all text-xs",
                  currentStep === 0 ? "opacity-0 invisible" : "visible"
                )}
              >
                <ChevronLeft size={14} /> Back
              </button>

              <button
                onClick={() => {
                  if (currentStep < STEPS.length - 1) {
                    setCurrentStep(currentStep + 1);
                  } else {
                    completeTour();
                  }
                }}
                className="flex items-center gap-2 px-4 py-2 bg-white text-black rounded-lg font-bold text-xs hover:scale-105 transition-transform whitespace-nowrap shadow-[0_0_20px_rgba(255,255,255,0.1)]"
              >
                {currentStep === STEPS.length - 1 ? (
                  <>Finish <Check size={14} /></>
                ) : (
                  <>Next <ChevronRight size={14} /></>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
