import 'server-only';

import webPush from 'web-push';
import type { SharedMedia } from '@/lib/shared-media-store';
import {
  deletePushSubscription,
  notificationDeliveryKey,
  readPushSubscriptions,
  type StoredPushSubscription,
} from '@/lib/media-notification-store';
import { runUpstashCommand } from '@/lib/upstash-rest';

const DELIVERY_TTL_SECONDS = 60 * 60 * 24 * 90;
const RETRY_DELAYS_MS = [0, 300, 1_200];

export interface NotificationDeliveryResult {
  enabled: boolean;
  titles: number;
  sent: number;
  failed: number;
}

function mediaLabel(item: SharedMedia) {
  if (item.media_type === 'movie') return item.release_year ? `Movie · ${item.release_year}` : 'Movie';
  return item.season_number === null ? 'TV series' : `TV series · Season ${item.season_number}`;
}

function siteUrl() {
  const configured = process.env.CINECHIVE_SITE_URL?.trim();
  if (configured) return configured.replace(/\/$/, '');
  return 'https://cinechive.vercel.app';
}

function exactMediaUrl(item: SharedMedia) {
  return `${siteUrl()}/shared/${encodeURIComponent(item.id)}`;
}

async function claimDelivery(key: string) {
  return runUpstashCommand<'OK' | null>(['SET', key, 'sending', 'NX', 'EX', 120]);
}

async function completeDelivery(key: string) {
  await runUpstashCommand<'OK'>(['SET', key, 'sent', 'EX', DELIVERY_TTL_SECONDS]);
}

async function releaseDelivery(key: string) {
  await runUpstashCommand<number>(['DEL', key]);
}

async function retry<T>(operation: () => Promise<T>) {
  let lastError: unknown;
  for (const delay of RETRY_DELAYS_MS) {
    if (delay > 0) await new Promise((resolve) => setTimeout(resolve, delay));
    try {
      return await operation();
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
}

function configureWebPush() {
  const publicKey = process.env.WEB_PUSH_VAPID_PUBLIC_KEY?.trim();
  const privateKey = process.env.WEB_PUSH_VAPID_PRIVATE_KEY?.trim();
  const subject = process.env.WEB_PUSH_VAPID_SUBJECT?.trim();
  if (!publicKey || !privateKey || !subject) return false;
  webPush.setVapidDetails(subject, publicKey, privateKey);
  return true;
}

async function sendPush(item: SharedMedia, subscription: StoredPushSubscription) {
  // A brother who subscribes after the bootstrap import should never receive
  // a backlog of historical titles.
  if (new Date(item.created_at) < new Date(subscription.createdAt)) return 'skipped' as const;

  const key = notificationDeliveryKey('push', item.id, subscription.endpoint);
  if (await claimDelivery(key) !== 'OK') return 'skipped' as const;

  try {
    await retry(() => webPush.sendNotification(subscription, JSON.stringify({
      title: `New on CineChive: ${item.title}`,
      body: `${mediaLabel(item)} — tap to open this exact title.`,
      icon: item.poster_url ?? '/app-logo.png',
      badge: '/favicon.ico',
      tag: `shared-media-${item.id}`,
      url: exactMediaUrl(item),
    }), { TTL: 60 * 60 * 24, urgency: 'normal' }));
    await completeDelivery(key);
    return 'sent' as const;
  } catch (error) {
    const statusCode = typeof error === 'object' && error && 'statusCode' in error
      ? Number(error.statusCode)
      : null;
    if (statusCode === 404 || statusCode === 410) {
      await deletePushSubscription(subscription.endpoint);
    }
    await releaseDelivery(key);
    return 'failed' as const;
  }
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;',
  })[character] ?? character);
}

async function sendEmail(item: SharedMedia) {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const recipient = process.env.MEDIA_NOTIFICATION_EMAIL?.trim();
  const from = process.env.MEDIA_NOTIFICATION_FROM?.trim();
  if (!apiKey || !recipient || !from) return 'skipped' as const;

  const key = notificationDeliveryKey('email', item.id, recipient);
  if (await claimDelivery(key) !== 'OK') return 'skipped' as const;

  try {
    const url = exactMediaUrl(item);
    await retry(async () => {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'Idempotency-Key': `cinechive-new-media/${item.id}`,
        },
        body: JSON.stringify({
          from,
          to: [recipient],
          subject: `New on CineChive: ${item.title}`,
          text: `${item.title}\n${mediaLabel(item)}\n\nOpen this title: ${url}`,
          html: `<h1>${escapeHtml(item.title)}</h1><p>${escapeHtml(mediaLabel(item))}</p><p><a href="${url}">Open this title on CineChive</a></p>`,
        }),
        signal: AbortSignal.timeout(8_000),
      });
      if (!response.ok) throw new Error(`Email provider returned ${response.status}`);
    });
    await completeDelivery(key);
    return 'sent' as const;
  } catch {
    await releaseDelivery(key);
    return 'failed' as const;
  }
}

export async function notifyNewSharedMedia(items: SharedMedia[]): Promise<NotificationDeliveryResult> {
  if (process.env.MEDIA_NOTIFICATIONS_ENABLED?.trim().toLowerCase() !== 'true' || items.length === 0) {
    return { enabled: false, titles: items.length, sent: 0, failed: 0 };
  }

  const pushConfigured = configureWebPush();
  const subscriptions = pushConfigured ? await readPushSubscriptions() : [];
  const outcomes = await Promise.all(items.flatMap((item) => [
    ...subscriptions.map((subscription) => sendPush(item, subscription)),
    sendEmail(item),
  ]));

  return {
    enabled: true,
    titles: items.length,
    sent: outcomes.filter((outcome) => outcome === 'sent').length,
    failed: outcomes.filter((outcome) => outcome === 'failed').length,
  };
}
