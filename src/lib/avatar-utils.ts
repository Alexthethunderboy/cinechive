import { CLASSIFICATION_STYLE_COLORS, ClassificationName } from './design-tokens';

/**
 * A simple deterministic hash function for string seeds.
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

/**
 * Get a deterministic "Vibe" based on a seed.
 * Returns colors and styles for the CinematicAvatar generator.
 */
export function getCinematicVibe(seed: string | null | undefined, username: string) {
  const actualSeed = seed || username;
  const hash = hashString(actualSeed);
  
  const styles: ClassificationName[] = [
    'Noir', 'Visceral', 'Melancholic', 'Atmospheric', 
    'Avant-Garde', 'Provocative', 'Legacy', 'Essential'
  ];
  
  // Deterministic style selection
  const primaryStyle = styles[hash % styles.length];
  const secondaryStyle = styles[(hash + 3) % styles.length];
  const tertiaryStyle = styles[(hash + 7) % styles.length];
  
  const primaryColor = CLASSIFICATION_STYLE_COLORS[primaryStyle];
  const secondaryColor = CLASSIFICATION_STYLE_COLORS[secondaryStyle];
  const tertiaryColor = CLASSIFICATION_STYLE_COLORS[tertiaryStyle];
  
  // Deterministic angles and positions
  const angle = hash % 360;
  const x = (hash % 100);
  const y = ((hash >> 4) % 100);
  
  return {
    primaryColor,
    secondaryColor,
    tertiaryColor,
    primaryStyle,
    angle,
    center: { x, y },
    // Derived CSS gradient
    gradient: `radial-gradient(circle at ${x}% ${y}%, ${primaryColor} 0%, ${secondaryColor} 50%, ${tertiaryColor} 100%)`
  };
}
