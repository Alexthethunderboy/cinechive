import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { isAfter, differenceInDays, startOfToday, isValid } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(date));
}

export function formatUsername(username?: string) {
  if (!username) return '';
  // Systematically strip any leading 'u.' or 'U.' prefix
  return username.replace(/^u\./i, '');
}

export function getReleaseStatus(releaseDateStr: string | null | undefined, type: string) {
  if (!releaseDateStr) return null;
  
  const releaseDate = new Date(releaseDateStr);
  if (!isValid(releaseDate)) return null;
  
  const today = startOfToday();
  
  if (isAfter(releaseDate, today)) {
    return { label: 'Coming Soon', style: 'bg-white text-black' }; // High contrast
  }
  
  const daysSinceRelease = differenceInDays(today, releaseDate);
  
  if (type === 'movie' && daysSinceRelease <= 45) {
    return { label: 'In Cinemas', style: 'bg-accent text-black' }; // Distinct accent
  }
  
  // Default to Streaming if it's past cinematic window or is a TV show
  return { label: 'On Streaming', style: 'bg-black/60 text-white/80 border border-white/20' }; // Subdued
}
