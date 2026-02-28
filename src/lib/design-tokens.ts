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
  'Essential': '#D4AF37', // Soft Gold
  'Avant-Garde': '#A1A1AA',
  'Melancholic': '#71717A',
  'Atmospheric': '#52525B',
  'Legacy': '#D4AF37',   // Soft Gold
  'Provocative': '#E5E7EB',
  'Visceral': '#F3F4F6',
  'Noir': '#18181B',
} as const;

export const BRAND_COLORS = {
  background: '#0A0A0B', // Deep Charcoal
  accent: '#D4AF37',     // Soft Gold
  muted: '#71717A',
} as const;

export const SPRING_CONFIG = {
  default: { type: 'spring' as const, stiffness: 400, damping: 25 },
  hero: { type: 'spring' as const, stiffness: 300, damping: 30 },
  gentle: { type: 'spring' as const, stiffness: 200, damping: 20 },
  snappy: { type: 'spring' as const, stiffness: 500, damping: 30 },
};

export const MEDIA_TYPE_LABELS = {
  movie: 'Cinema',
  tv: 'Television',
  documentary: 'Documentary',
} as const;

export const NAV_ITEMS = [
  { label: 'Cinema', href: '/', icon: 'home' },
  { label: 'Pulse', href: '/pulse', icon: 'activity' },
  { label: 'Library', href: '/collections', icon: 'archive' },
] as const;
