'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ChevronRight, Loader2, Film, Palette, Users } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { ClassificationName, CLASSIFICATION_STYLE_COLORS } from '@/lib/design-tokens';
import { saveOnboardingTastes, OnboardingSelection } from '@/lib/onboarding-actions';
import { toast } from 'sonner';

// ─── Seed Data ──────────────────────────────────────────────────────────────

const SEED_FILMS = [
  { value: '278',   display_name: 'The Shawshank Redemption', poster_url: 'https://image.tmdb.org/t/p/w342/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg' },
  { value: '238',   display_name: 'The Godfather',            poster_url: 'https://image.tmdb.org/t/p/w342/3bhkrj58Vtu7enYsLori8zvHwEY.jpg' },
  { value: '27205', display_name: 'Inception',                poster_url: 'https://image.tmdb.org/t/p/w342/ljsZTbVsrQSqZgWeep2B1QiDKuh.jpg' },
  { value: '550',   display_name: 'Fight Club',               poster_url: 'https://image.tmdb.org/t/p/w342/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg' },
  { value: '157336',display_name: 'Interstellar',             poster_url: 'https://image.tmdb.org/t/p/w342/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg' },
  { value: '122',   display_name: 'The Lord of the Rings',    poster_url: 'https://image.tmdb.org/t/p/w342/rCzpDGLbOoPwLjy3OAm5NUPOTrC.jpg' },
  { value: '11',    display_name: 'Star Wars',                poster_url: 'https://image.tmdb.org/t/p/w342/6FfCtAuVAW8XJjZ7eWeLibRLWTw.jpg' },
  { value: '13',    display_name: 'Forrest Gump',             poster_url: 'https://image.tmdb.org/t/p/w342/arw2vcBveWOVZr6pxd9XTd1TdQa.jpg' },
  { value: '424',   display_name: "Schindler's List",         poster_url: 'https://image.tmdb.org/t/p/w342/sF1U4EUQS8YHUYjNl3pMGNIQyr0.jpg' },
  { value: '389',   display_name: '12 Angry Men',             poster_url: 'https://image.tmdb.org/t/p/w342/ow3wq89wM8qd5X7hWKxiRfsFf9C.jpg' },
  { value: '4935',  display_name: "Howl's Moving Castle",     poster_url: 'https://image.tmdb.org/t/p/w342/NPQBCaHHYoMgCGnUoIxm7dvhYkk.jpg' },
  { value: '244786',display_name: 'Whiplash',                 poster_url: 'https://image.tmdb.org/t/p/w342/7fn624j5lj3xTme2SgiLCeuedmO.jpg' },
  { value: '372058',display_name: 'Your Name.',               poster_url: 'https://image.tmdb.org/t/p/w342/q719jXXEzOoYaps6babgKnONONX.jpg' },
  { value: '37165', display_name: "The Truman Show",          poster_url: 'https://image.tmdb.org/t/p/w342/vuza0WqY239yBXOadKlGwJsZJFE.jpg' },
  { value: '769',   display_name: 'Goodfellas',               poster_url: 'https://image.tmdb.org/t/p/w342/aKuFiU82s5ISJpGZp7YkIr3kCUd.jpg' },
  { value: '807',   display_name: 'Se7en',                    poster_url: 'https://image.tmdb.org/t/p/w342/egS4BCgHoOfZdVjY7GFxNjYpbAE.jpg' },
];

const SEED_GENRES: { value: string; label: string; desc: string; style: ClassificationName }[] = [
  { value: '878',   label: 'Sci-Fi',      desc: 'Reality-bending, futuristic, atmospheric.', style: 'Atmospheric' },
  { value: '9648',  label: 'Mystery',     desc: 'Enigmatic, shadowy, noir-inspired.',       style: 'Noir' },
  { value: '28',    label: 'Action',      desc: 'High-octane, visceral, physical.',        style: 'Visceral' },
  { value: '18',    label: 'Drama',       desc: 'Deeply human, emotional, melancholic.',    style: 'Melancholic' },
  { value: '16',    label: 'Animation',   desc: 'Vibrant, imaginative, avant-garde.',      style: 'Avant-Garde' },
  { value: '27',    label: 'Horror',      desc: 'Unsettling, provocative, intense.',        style: 'Provocative' },
  { value: '37',    label: 'Western',     desc: 'Classic tales of history and legacy.',     style: 'Legacy' },
  { value: '35',    label: 'Comedy',      desc: 'Essential, light-hearted, timeless.',      style: 'Essential' },
];

const SEED_CREATORS = [
  { value: 'christopher-nolan',   display_name: 'Christopher Nolan',   role: 'Director',  poster_url: 'https://image.tmdb.org/t/p/w185/xuAIuYSmsUzKlUMBFGVZaWsY3DZ.jpg' },
  { value: 'stanley-kubrick',     display_name: 'Stanley Kubrick',      role: 'Director',  poster_url: 'https://image.tmdb.org/t/p/w185/uwCflRFfNFsRCs1MniPm9myhJpE.jpg' },
  { value: 'martin-scorsese',     display_name: 'Martin Scorsese',      role: 'Director',  poster_url: 'https://image.tmdb.org/t/p/w185/9U9Y5GQuWX3EZy39B8nkk4NY01S.jpg' },
  { value: 'david-fincher',       display_name: 'David Fincher',        role: 'Director',  poster_url: 'https://image.tmdb.org/t/p/w185/tpEczFclQZeKAiCeKZZ0adRvtfz.jpg' },
  { value: 'wes-anderson',        display_name: 'Wes Anderson',         role: 'Director',  poster_url: 'https://image.tmdb.org/t/p/w185/8nNgBMaOXekM6WfL7toZSqSRWPD.jpg' },
  { value: 'denis-villeneuve',    display_name: 'Denis Villeneuve',     role: 'Director',  poster_url: 'https://image.tmdb.org/t/p/w185/HkSKSsHdJonOdl2MWXLH9TmMEy.jpg' },
  { value: 'hayao-miyazaki',      display_name: 'Hayao Miyazaki',       role: 'Director',  poster_url: 'https://image.tmdb.org/t/p/w185/oBLFcmNQxWmB4SLJ8bDd3FVcIBf.jpg' },
  { value: 'wong-kar-wai',        display_name: 'Wong Kar-wai',         role: 'Director',  poster_url: 'https://image.tmdb.org/t/p/w185/mL4zqpS6qlYunlZBDG3jfsCLFdi.jpg' },
  { value: 'hans-zimmer',         display_name: 'Hans Zimmer',          role: 'Composer',  poster_url: 'https://image.tmdb.org/t/p/w185/4SpIkGCLCPbFJQVjMlOmLUWyQaM.jpg' },
  { value: 'ennio-morricone',     display_name: 'Ennio Morricone',      role: 'Composer',  poster_url: 'https://image.tmdb.org/t/p/w185/9SDSDvUuHhxrUXPZnODonq9KGMH.jpg' },
  { value: 'jonny-greenwood',     display_name: 'Jonny Greenwood',      role: 'Composer',  poster_url: 'https://image.tmdb.org/t/p/w185/5APGMEuDNBbpkKBHvJYn4aYxTSC.jpg' },
  { value: 'meryl-streep',        display_name: 'Meryl Streep',         role: 'Actor',     poster_url: 'https://image.tmdb.org/t/p/w185/0MJIMoJPfY0sgvroFEaJNQ7HfxQ.jpg' },
  { value: 'daniel-day-lewis',    display_name: 'Daniel Day-Lewis',     role: 'Actor',     poster_url: 'https://image.tmdb.org/t/p/w185/iLQpXZm9jSEMHXPa7m2y8h6VEuZ.jpg' },
  { value: 'cate-blanchett',      display_name: 'Cate Blanchett',       role: 'Actor',     poster_url: 'https://image.tmdb.org/t/p/w185/45w7DQFnWv2oJJ06sfANTGXtpZB.jpg' },
  { value: 'joaquin-phoenix',     display_name: 'Joaquin Phoenix',      role: 'Actor',     poster_url: 'https://image.tmdb.org/t/p/w185/nXMzvVF6A1y6AHZa9HkwSo7b1dG.jpg' },
  { value: 'tilda-swinton',       display_name: 'Tilda Swinton',        role: 'Actor',     poster_url: 'https://image.tmdb.org/t/p/w185/bMvJwObP4u3YeyfTPMhEgEJmfqy.jpg' },
];

// ─── Step Config ─────────────────────────────────────────────────────────────

type StepId = 0 | 1 | 2;

const STEPS = [
  { id: 0, label: 'The Favorites', hint: 'Select 3+ films that define your cinematic taste.', icon: <Film size={18} /> },
  { id: 1, label: 'The Genres',    hint: 'Choose your structural anchors.',            icon: <Palette size={18} /> },
  { id: 2, label: 'The Creators',    hint: 'Who are the filmmakers you follow?', icon: <Users size={18} /> },
];

// ─── Component ───────────────────────────────────────────────────────────────

interface OnboardingModalProps {
  onComplete: () => void;
  onSkip: () => void;
}

export default function OnboardingModal({ onComplete, onSkip }: OnboardingModalProps) {
  const [step, setStep] = useState<StepId>(0);
  const [selectedFilms,    setSelectedFilms]    = useState<Set<string>>(new Set());
  const [selectedGenres,   setSelectedGenres]   = useState<Set<string>>(new Set());
  const [selectedCreators, setSelectedCreators] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [attemptedNext, setAttemptedNext] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);

  const currentStep = STEPS[step];

  // Dominant style color from currently selected genres
  const firstGenreId = Array.from(selectedGenres)[0];
  const firstGenre = SEED_GENRES.find(g => g.value === firstGenreId);
  const styleColor = firstGenre ? CLASSIFICATION_STYLE_COLORS[firstGenre.style] : '#1a0a2e';

  function toggle(set: Set<string>, val: string, setter: (s: Set<string>) => void) {
    const next = new Set(set);
    next.has(val) ? next.delete(val) : next.add(val);
    setter(next);
  }

  function handleNext() {
    setAttemptedNext(true);
    if (!canProceed) return;
    if (step < 2) {
      setAttemptedNext(false);
      setStep((s) => (s + 1) as StepId);
    } else {
      handleFinish();
    }
  }

  function handleFinish() {
    startTransition(async () => {
      const selections: OnboardingSelection[] = [
        ...Array.from(selectedFilms).map((v) => {
          const film = SEED_FILMS.find((f) => f.value === v)!;
          return { category: 'movie' as const, value: v, display_name: film.display_name, poster_url: film.poster_url };
        }),
        ...Array.from(selectedGenres).map((v) => {
          const g = SEED_GENRES.find((gen) => gen.value === v)!;
          return {
            category: 'genre' as const,
            value: v,
            display_name: g.label,
          };
        }),
        ...Array.from(selectedCreators).map((v) => {
          const c = SEED_CREATORS.find((cr) => cr.value === v)!;
          return { category: 'creator' as const, value: v, display_name: c.display_name, poster_url: c.poster_url };
        }),
      ];

      const result = await saveOnboardingTastes(selections);
      if (result?.error) {
        setSubmitError(result.error as string);
        toast.error('Could not save your preferences. Try again.');
      } else {
        setSubmitError(null);
        toast.success('Curator profile updated.');
        onComplete();
      }
    });
  }

  const canProceed =
    step === 0 ? selectedFilms.size >= 3 :
    step === 1 ? selectedGenres.size >= 1 :
                 selectedCreators.size >= 1;

  useEffect(() => {
    dialogRef.current?.focus();
  }, []);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && !isPending) {
        onSkip();
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isPending, onSkip]);

  const remainingCount =
    step === 0 ? Math.max(0, 3 - selectedFilms.size) :
    step === 1 ? Math.max(0, 1 - selectedGenres.size) :
                 Math.max(0, 1 - selectedCreators.size);

  return (
    <AnimatePresence>
      <motion.div
        key="onboarding-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8"
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/90 backdrop-blur-2xl" />

        {/* Animated Style Background */}
        <motion.div
          key={styleColor}
          animate={{ opacity: [0.12, 0.22, 0.12], scale: [1, 1.06, 1] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
          style={{ backgroundColor: styleColor }}
          className="absolute inset-0 blur-[160px] pointer-events-none"
        />

        {/* Modal */}
        <motion.div
          key="onboarding-modal"
          initial={{ opacity: 0, scale: 0.94, y: 24 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: -16 }}
          transition={{ type: 'spring', stiffness: 260, damping: 28 }}
          className="relative z-10 w-full max-w-4xl max-h-[90vh] flex flex-col bg-black border border-white/10 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-xl"
          role="dialog"
          aria-modal="true"
          aria-labelledby="onboarding-title"
          tabIndex={-1}
          ref={dialogRef}
        >
          {/* Header */}
          <div className="px-8 pt-8 pb-6 border-b border-white/5 shrink-0">
            <p className="font-data text-[10px] tracking-[0.3em] text-white/30 mb-1">
              The Casting Call — Step {step + 1} of 3
            </p>
            <h2 id="onboarding-title" className="font-display text-3xl md:text-5xl italic tracking-tighter text-white">
              {currentStep.label}
            </h2>
            <p className="font-heading text-sm text-white/50 mt-1">{currentStep.hint}</p>

            {/* Step indicators */}
            <div className="flex gap-2 mt-5">
              {STEPS.map((s) => (
                <motion.div
                  key={s.id}
                  animate={{ width: step === s.id ? 32 : 8 }}
                  className={cn(
                    'h-1 rounded-full transition-colors',
                    s.id <= step ? 'bg-white' : 'bg-white/15'
                  )}
                />
              ))}
            </div>
          </div>

          {/* Content area */}
          <div className="flex-1 overflow-y-auto px-6 md:px-8 py-6">
            <AnimatePresence mode="wait">

              {/* Step 0 — Films */}
              {step === 0 && (
                <motion.div
                  key="step-films"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25 }}
                  className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-3"
                >
                  {SEED_FILMS.map((film) => {
                    const selected = selectedFilms.has(film.value);
                    return (
                      <motion.button
                        key={film.value}
                        onClick={() => toggle(selectedFilms, film.value, setSelectedFilms)}
                        whileTap={{ scale: 0.93 }}
                        whileHover={{ scale: 1.04, y: -3 }}
                        className="relative aspect-[2/3] rounded-lg overflow-hidden group focus:outline-none"
                        aria-pressed={selected}
                        aria-label={`${selected ? 'Selected' : 'Select'} ${film.display_name}`}
                      >
                        {film.poster_url && (
                          <Image src={film.poster_url} alt={film.display_name} fill className="object-cover" />
                        )}
                        <div className={cn(
                          'absolute inset-0 transition-all duration-200',
                          selected
                            ? 'bg-white/10 ring-2 ring-white ring-offset-1 ring-offset-black/50'
                            : 'bg-black/40 group-hover:bg-black/20'
                        )} />
                        {selected && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute top-2 right-2 w-5 h-5 bg-white rounded-full flex items-center justify-center shadow-lg"
                          >
                            <Check size={10} className="text-black" strokeWidth={3} />
                          </motion.div>
                        )}
                      </motion.button>
                    );
                  })}
                </motion.div>
              )}

              {/* Step 1 — Genres */}
              {step === 1 && (
                <motion.div
                  key="step-genres"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25 }}
                  className="grid grid-cols-2 md:grid-cols-4 gap-4"
                >
                  {SEED_GENRES.map((genre) => {
                    const selected = selectedGenres.has(genre.value);
                    const styleBaseColor = CLASSIFICATION_STYLE_COLORS[genre.style];
                    return (
                      <motion.button
                        key={genre.value}
                        onClick={() => toggle(selectedGenres, genre.value, setSelectedGenres)}
                        whileTap={{ scale: 0.95 }}
                        whileHover={{ scale: 1.02 }}
                        className={cn(
                          'relative p-5 rounded-xl text-left transition-all duration-200 border focus:outline-none',
                          selected
                            ? 'border-white/40 bg-white/10'
                            : 'border-white/8 bg-white/3 hover:border-white/20'
                        )}
                        style={selected ? { boxShadow: `0 0 24px ${styleBaseColor}60` } : {}}
                        aria-pressed={selected}
                        aria-label={`${selected ? 'Selected' : 'Select'} ${genre.label}`}
                      >
                        <div
                          className="absolute inset-0 rounded-xl opacity-30 pointer-events-none transition-opacity"
                          style={{ background: `radial-gradient(circle at top left, ${styleBaseColor}, transparent 60%)` }}
                        />
                        <p className="font-display text-xl italic text-white relative">{genre.label}</p>
                        <p className="font-heading text-[10px] text-white/50 mt-1 leading-snug relative">{genre.desc}</p>
                        {selected && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute top-3 right-3 w-5 h-5 bg-white rounded-full flex items-center justify-center"
                          >
                            <Check size={10} className="text-black" strokeWidth={3} />
                          </motion.div>
                        )}
                      </motion.button>
                    );
                  })}
                </motion.div>
              )}

              {/* Step 2 — Creators */}
              {step === 2 && (
                <motion.div
                  key="step-creators"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25 }}
                  className="grid grid-cols-2 md:grid-cols-5 gap-4"
                >
                  {SEED_CREATORS.map((creator) => {
                    const selected = selectedCreators.has(creator.value);
                    return (
                      <motion.button
                        key={creator.value}
                        onClick={() => toggle(selectedCreators, creator.value, setSelectedCreators)}
                        whileTap={{ scale: 0.94 }}
                        whileHover={{ scale: 1.04, y: -2 }}
                        className="flex flex-col items-center gap-2 group focus:outline-none"
                        aria-pressed={selected}
                        aria-label={`${selected ? 'Selected' : 'Select'} ${creator.display_name}`}
                      >
                        <div className={cn(
                          'relative w-16 h-16 md:w-20 md:h-20 rounded-full overflow-hidden border-2 transition-all duration-200',
                          selected ? 'border-white shadow-[0_0_20px_rgba(255,255,255,0.3)]' : 'border-white/15 group-hover:border-white/40'
                        )}>
                          {creator.poster_url && (
                            <Image src={creator.poster_url} alt={creator.display_name} fill className="object-cover" />
                          )}
                          {selected && (
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="absolute inset-0 bg-white/20 flex items-center justify-center"
                            >
                              <Check size={16} className="text-white" strokeWidth={2.5} />
                            </motion.div>
                          )}
                        </div>
                        <div className="text-center">
                          <p className={cn(
                            'font-display text-sm md:text-base font-bold leading-tight transition-colors',
                            selected ? 'text-white' : 'text-white/60'
                          )}>{creator.display_name}</p>
                          <p className="font-data text-[9px] tracking-widest text-white/30 mt-0.5">{creator.role}</p>
                        </div>
                      </motion.button>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer */}
          <div className="px-8 py-6 border-t border-white/5 flex items-center justify-between shrink-0">
            <div className="space-y-1">
              <div className="font-data text-[10px] text-white/30 tracking-widest">
              {step === 0 && `${selectedFilms.size} selected`}
              {step === 1 && `${selectedGenres.size} selected`}
              {step === 2 && `${selectedCreators.size} selected`}
              </div>
              {remainingCount > 0 && (
                <p className="font-data text-[10px] text-amber-300/80 tracking-widest uppercase">
                  Select {remainingCount} more to continue
                </p>
              )}
              {attemptedNext && !canProceed && (
                <p className="font-data text-[10px] text-rose-300/80 tracking-widest uppercase">
                  Complete this step before continuing
                </p>
              )}
              {submitError && (
                <p className="font-data text-[10px] text-rose-300/90 tracking-widest uppercase">
                  {submitError}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              {step > 0 && (
                <button
                  onClick={() => {
                    setAttemptedNext(false);
                    setStep((s) => (s - 1) as StepId);
                  }}
                  disabled={isPending}
                  className="px-4 py-2 rounded-full text-white/70 border border-white/20 hover:bg-white/10 transition-colors disabled:opacity-50"
                >
                  Back
                </button>
              )}
              <button
                onClick={onSkip}
                disabled={isPending}
                className="px-4 py-2 rounded-full text-white/50 border border-white/10 hover:text-white/80 hover:border-white/20 transition-colors disabled:opacity-50"
              >
                Skip for now
              </button>
              <motion.button
                onClick={handleNext}
                disabled={isPending}
                whileHover={!isPending ? { scale: 1.04 } : {}}
                whileTap={!isPending ? { scale: 0.97 } : {}}
                className={cn(
                  'flex items-center gap-2 px-6 py-3 rounded-full font-heading text-sm font-semibold transition-all duration-200',
                  canProceed && !isPending
                    ? 'bg-white text-black hover:bg-white/90'
                    : 'bg-white/10 text-white/50'
                )}
              >
                {isPending ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Saving...
                  </>
                ) : step < 2 ? (
                  <>
                    Continue
                    <ChevronRight size={14} />
                  </>
                ) : (
                  'Enter CineChive'
                )}
              </motion.button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
