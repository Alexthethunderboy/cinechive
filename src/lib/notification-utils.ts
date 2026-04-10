export interface NotificationCountSummary {
  cinema: number;
  socialUnread: number;
  total: number;
}

export function capTo99Plus(value: number): string {
  if (value > 99) return '99+';
  return String(Math.max(0, value));
}

export function getNotificationCountSummary(
  cinemaCount: number,
  socialNotifications: Array<{ is_read?: boolean }>
): NotificationCountSummary {
  const socialUnread = socialNotifications.filter((n) => !n.is_read).length;
  return {
    cinema: cinemaCount,
    socialUnread,
    total: cinemaCount + socialUnread,
  };
}

