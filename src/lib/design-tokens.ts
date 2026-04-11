/**
 * CineChive Design Tokens
 * "Cinematic Slate" — centralized professional design constants
 */

export type ClassificationName =
  | 'Essential'
  | 'Avant-Garde'
  | 'Melancholic'
  | 'Atmospheric'
  | 'Legacy'
  | 'Provocative'
  | 'Visceral'
  | 'Noir';

export const CLASSIFICATION_COLORS: Record<ClassificationName, string> = {
  'Essential': '#FFFFFF', // Pure White
  'Avant-Garde': '#D4D4D8',
  'Melancholic': '#A1A1AA',
  'Atmospheric': '#71717A',
  'Legacy': '#E4E4E7',
  'Provocative': '#F4F4F5',
  'Visceral': '#FAFAFA',
  'Noir': '#3F3F46',
} as const;

/**
 * Rich, saturated colors used for the background gradients of cinematic styles.
 * Separate from CLASSIFICATION_COLORS so feed badges are unaffected.
 */
export const CLASSIFICATION_STYLE_COLORS: Record<ClassificationName, string> = {
  'Noir':        '#1a0a2e', // deep indigo-violet
  'Visceral':    '#7f1d1d', // deep crimson
  'Melancholic': '#1e3a5f', // deep ocean blue
  'Atmospheric': '#0f2a1e', // deep forest green
  'Avant-Garde': '#2d1b69', // electric violet
  'Provocative': '#4a0d0d', // dark blood red
  'Legacy':      '#2a1f0f', // aged amber
  'Essential':   '#111111', // near-black
} as const;

export const BRAND_COLORS = {
  background: '#000000', // Pure Black
  accent: '#FFFFFF',     // White Accent
  muted: '#71717A',
} as const;

export const SPRING_CONFIG = {
  default: { type: 'spring' as const, stiffness: 400, damping: 25 },
  hero: { type: 'spring' as const, stiffness: 300, damping: 30 },
  gentle: { type: 'spring' as const, stiffness: 200, damping: 20 },
  snappy: { type: 'spring' as const, stiffness: 500, damping: 30 },
};

export const MEDIA_TYPE_LABELS = {
  movie: 'Movies',
  tv: 'TV Shows',
  documentary: 'Documentaries',
} as const;

export const NAV_ITEMS = [
  { label: 'Movies', href: '/', icon: 'home' },
  { label: 'Community', href: '/community', icon: 'zap' },
  { label: 'People', href: '/people', icon: 'user' },
  { label: 'Activity', href: '/notifications', icon: 'activity' },
  { label: 'Discover', href: '/discover', icon: 'globe' },
  { label: 'Library', href: '/vault', icon: 'layers' },
] as const;

export const MOBILE_PADDINGS = {
  gutter: '1.25rem', // 20px
  sectionGap: '2.5rem', // 40px
  cardRadius: '12px',
} as const;

export const TYPOGRAPHY = {
  fluid: {
    h1: 'clamp(2.5rem, 8vw, 4.5rem)',
    h2: 'clamp(2rem, 6vw, 3.5rem)',
    h3: 'clamp(1.5rem, 4vw, 2.5rem)',
    body: 'max(16px, 1rem)', // Prevent iOS zoom
  }
} as const;
