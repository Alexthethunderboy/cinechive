import { timingSafeEqual } from 'node:crypto';
import { deletePushSubscription, savePushSubscription } from '@/lib/media-notification-store';

export const runtime = 'nodejs';

interface SubscriptionBody {
  setup_code?: unknown;
  subscription?: unknown;
  endpoint?: unknown;
}

function sameOrigin(request: Request) {
  const origin = request.headers.get('origin');
  const host = request.headers.get('host');
  if (!origin || !host) return false;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

function hasValidSetupCode(value: unknown) {
  const expectedCode = process.env.MEDIA_NOTIFICATION_SETUP_CODE?.trim();
  if (!expectedCode || typeof value !== 'string') return false;
  const expected = Buffer.from(expectedCode);
  const supplied = Buffer.from(value.trim());
  return expected.length === supplied.length && timingSafeEqual(expected, supplied);
}

function parseSubscription(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const candidate = value as {
    endpoint?: unknown;
    expirationTime?: unknown;
    keys?: { auth?: unknown; p256dh?: unknown };
  };
  if (
    typeof candidate.endpoint !== 'string' ||
    !candidate.endpoint.startsWith('https://') ||
    candidate.endpoint.length > 2_048 ||
    typeof candidate.keys?.auth !== 'string' ||
    candidate.keys.auth.length > 512 ||
    typeof candidate.keys?.p256dh !== 'string' ||
    candidate.keys.p256dh.length > 512
  ) {
    return null;
  }

  return {
    endpoint: candidate.endpoint,
    expirationTime: typeof candidate.expirationTime === 'number' ? candidate.expirationTime : null,
    keys: { auth: candidate.keys.auth, p256dh: candidate.keys.p256dh },
    createdAt: new Date().toISOString(),
  };
}

export async function POST(request: Request) {
  if (process.env.MEDIA_NOTIFICATIONS_ENABLED?.trim().toLowerCase() !== 'true') {
    return Response.json({ error: 'Notifications are not enabled' }, { status: 503 });
  }
  if (!sameOrigin(request)) {
    return Response.json({ error: 'Invalid request origin' }, { status: 403 });
  }

  const body = await request.json().catch(() => null) as SubscriptionBody | null;
  if (!body || !hasValidSetupCode(body.setup_code)) {
    return Response.json({ error: 'The family notification code is incorrect' }, { status: 401 });
  }
  const subscription = parseSubscription(body.subscription);
  if (!subscription) {
    return Response.json({ error: 'The push subscription is invalid' }, { status: 400 });
  }

  await savePushSubscription(subscription);
  return Response.json({ subscribed: true }, { status: 201 });
}

export async function DELETE(request: Request) {
  if (!sameOrigin(request)) {
    return Response.json({ error: 'Invalid request origin' }, { status: 403 });
  }
  const body = await request.json().catch(() => null) as SubscriptionBody | null;
  if (!body || typeof body.endpoint !== 'string' || !body.endpoint.startsWith('https://')) {
    return Response.json({ error: 'A valid endpoint is required' }, { status: 400 });
  }

  await deletePushSubscription(body.endpoint);
  return Response.json({ subscribed: false });
}
