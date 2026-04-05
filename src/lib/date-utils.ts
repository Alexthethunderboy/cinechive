import { format, formatDistanceToNow, isAfter, isBefore, subDays, startOfToday } from 'date-fns';

export type AnimeSeason = 'WINTER' | 'SPRING' | 'SUMMER' | 'FALL';

export function getNextSeason(): { season: AnimeSeason; year: number } {
  const now = new Date();
  const month = now.getMonth(); // 0-indexed
  const year = now.getFullYear();

  const nextDate = new Date();
  nextDate.setMonth(now.getMonth() + 3);
  
  const nextMonth = nextDate.getMonth();
  const nextYear = nextDate.getFullYear();

  let season: AnimeSeason = 'WINTER';
  if (nextMonth >= 3 && nextMonth <= 5) season = 'SPRING';
  else if (nextMonth >= 6 && nextMonth <= 8) season = 'SUMMER';
  else if (nextMonth >= 9 && nextMonth <= 11) season = 'FALL';
  else season = 'WINTER';

  return { season, year: nextYear };
}

export function formatCountdown(date: string | Date | null): string {
  if (!date) return 'Transmission Pending';
  const targetDate = new Date(date);
  const today = startOfToday();
  
  if (isBefore(targetDate, today)) {
    // If released in the last 30 days, it's "In Cinemas" or "Now Airing"
    const thirtyDaysAgo = subDays(today, 30);
    if (isAfter(targetDate, thirtyDaysAgo)) {
      return 'In Cinemas Now';
    }
    return 'Released';
  }
  
  const distance = formatDistanceToNow(targetDate, { addSuffix: true });
  return distance.replace('about ', '').replace('in ', '').replace('In ', '');
}

export function getStatusBadge(date: string | Date | null, type: string): string {
  if (!date) return 'Planned';
  const targetDate = new Date(date);
  const today = startOfToday();
  
  if (isBefore(targetDate, today)) {
     const thirtyDaysAgo = subDays(today, 30);
     if (isAfter(targetDate, thirtyDaysAgo)) {
        return type === 'movie' ? 'In Cinemas' : 'Now Airing';
     }
     return 'Released';
  }
  
  return 'Coming Soon';
}

export function formatDateBadge(date: string | Date | null): { day: string; month: string } {
  if (!date) return { day: '??', month: 'TBA' };
  const d = new Date(date);
  return {
    day: format(d, 'dd'),
    month: format(d, 'MMM').toUpperCase()
  };
}
