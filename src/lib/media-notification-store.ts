import 'server-only';

import { createHash } from 'node:crypto';
import { runUpstashCommand } from '@/lib/upstash-rest';

const PUSH_SUBSCRIPTIONS_KEY = 'cinechive:push-subscriptions:v1';

export interface StoredPushSubscription {
  endpoint: string;
  expirationTime: number | null;
  keys: {
    auth: string;
    p256dh: string;
  };
  createdAt: string;
}

function endpointKey(endpoint: string) {
  return createHash('sha256').update(endpoint).digest('hex');
}

export async function savePushSubscription(subscription: StoredPushSubscription) {
  await runUpstashCommand<number>([
    'HSET',
    PUSH_SUBSCRIPTIONS_KEY,
    endpointKey(subscription.endpoint),
    JSON.stringify(subscription),
  ]);
}

export async function deletePushSubscription(endpoint: string) {
  await runUpstashCommand<number>(['HDEL', PUSH_SUBSCRIPTIONS_KEY, endpointKey(endpoint)]);
}

export async function readPushSubscriptions(): Promise<StoredPushSubscription[]> {
  const raw = await runUpstashCommand<Record<string, string> | string[]>(['HGETALL', PUSH_SUBSCRIPTIONS_KEY]);
  const values = Array.isArray(raw)
    ? raw.filter((_, index) => index % 2 === 1)
    : Object.values(raw ?? {});

  return values.flatMap((value) => {
    try {
      const parsed = JSON.parse(value) as Partial<StoredPushSubscription>;
      if (
        typeof parsed.endpoint !== 'string' ||
        !parsed.endpoint.startsWith('https://') ||
        typeof parsed.keys?.auth !== 'string' ||
        typeof parsed.keys?.p256dh !== 'string' ||
        typeof parsed.createdAt !== 'string'
      ) {
        return [];
      }
      return [{
        endpoint: parsed.endpoint,
        expirationTime: typeof parsed.expirationTime === 'number' ? parsed.expirationTime : null,
        keys: { auth: parsed.keys.auth, p256dh: parsed.keys.p256dh },
        createdAt: parsed.createdAt,
      }];
    } catch {
      return [];
    }
  });
}

export function notificationDeliveryKey(channel: 'push' | 'email', mediaId: string, recipient: string) {
  const recipientHash = createHash('sha256').update(recipient).digest('hex').slice(0, 24);
  return `cinechive:notification:${channel}:${mediaId}:${recipientHash}`;
}
