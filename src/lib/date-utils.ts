import { format, formatDistanceToNow, isAfter, startOfToday } from 'date-fns';

export type AnimeSeason = 'WINTER' | 'SPRING' | 'SUMMER' | 'FALL';

export function getNextSeason(): { season: AnimeSeason; year: number } {
  const now = new Date();
  const month = now.getMonth(); // 0-indexed
  const year = now.getFullYear();

  /**
   * Winter: Jan, Feb, Mar
   * Spring: Apr, May, Jun
   * Summer: Jul, Aug, Sep
   * Fall: Oct, Nov, Dec
   * 
   * To get the "Next" season, we add 3 months
   */
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
  if (!date) return 'TBA';
  const targetDate = new Date(date);
  if (!isAfter(targetDate, startOfToday())) return 'Coming Soon';
  
  return `In ${formatDistanceToNow(targetDate)}`;
}

export function formatDateBadge(date: string | Date | null): { day: string; month: string } {
  if (!date) return { day: '??', month: 'TBA' };
  const d = new Date(date);
  return {
    day: format(d, 'dd'),
    month: format(d, 'MMM').toUpperCase()
  };
}
