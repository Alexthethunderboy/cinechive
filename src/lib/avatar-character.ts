export type AvatarMode = 'image' | 'character';
export type AvatarCharacter = 'cyber-noir' | 'retro-anime' | 'space-drifter' | 'mystic-director';
export type AvatarAnimation = 'float' | 'pulse' | 'orbit';

type CharacterConfig = {
  label: string;
  glyph: string;
  gradient: string;
  accent: string;
};

export const AVATAR_CHARACTER_CONFIG: Record<AvatarCharacter, CharacterConfig> = {
  'cyber-noir': {
    label: 'Cyber Noir',
    glyph: 'N',
    gradient: 'linear-gradient(135deg, #0f172a 0%, #312e81 50%, #0f766e 100%)',
    accent: '#22d3ee',
  },
  'retro-anime': {
    label: 'Retro Anime',
    glyph: 'A',
    gradient: 'linear-gradient(135deg, #7c2d12 0%, #b91c1c 45%, #f59e0b 100%)',
    accent: '#f97316',
  },
  'space-drifter': {
    label: 'Space Drifter',
    glyph: 'S',
    gradient: 'linear-gradient(135deg, #111827 0%, #1d4ed8 45%, #7c3aed 100%)',
    accent: '#60a5fa',
  },
  'mystic-director': {
    label: 'Mystic Director',
    glyph: 'D',
    gradient: 'linear-gradient(135deg, #1f2937 0%, #6d28d9 45%, #db2777 100%)',
    accent: '#c084fc',
  },
};

export const AVATAR_CHARACTER_OPTIONS: AvatarCharacter[] = [
  'cyber-noir',
  'retro-anime',
  'space-drifter',
  'mystic-director',
];

export const AVATAR_ANIMATION_OPTIONS: AvatarAnimation[] = ['float', 'pulse', 'orbit'];

export function sanitizeAvatarMode(value?: string | null): AvatarMode {
  return value === 'character' ? 'character' : 'image';
}

export function sanitizeAvatarCharacter(value?: string | null): AvatarCharacter {
  if (value && value in AVATAR_CHARACTER_CONFIG) {
    return value as AvatarCharacter;
  }
  return 'cyber-noir';
}

export function sanitizeAvatarAnimation(value?: string | null): AvatarAnimation {
  if (value === 'pulse' || value === 'orbit') return value;
  return 'float';
}
