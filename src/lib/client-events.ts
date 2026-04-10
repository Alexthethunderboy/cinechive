export const CLIENT_EVENTS = {
  refreshNotifications: 'refresh-notifications',
} as const;

export function emitRefreshNotifications() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(CLIENT_EVENTS.refreshNotifications));
}

