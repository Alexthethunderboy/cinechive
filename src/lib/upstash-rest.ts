import 'server-only';

const STORE_TIMEOUT_MS = 10_000;

function getUpstashCredentials() {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim().replace(/\/$/, '');
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();

  if (Boolean(url) !== Boolean(token)) {
    throw new Error('Upstash storage requires both REST environment variables');
  }

  return url && token ? { url, token } : null;
}

export function hasUpstashStorage() {
  return getUpstashCredentials() !== null;
}

export async function runUpstashCommand<T>(command: unknown[]): Promise<T> {
  const credentials = getUpstashCredentials();
  if (!credentials) throw new Error('Upstash storage is not configured');

  const response = await fetch(credentials.url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${credentials.token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(command),
    cache: 'no-store',
    signal: AbortSignal.timeout(STORE_TIMEOUT_MS),
  });
  const payload = await response.json().catch(() => null) as { result?: T; error?: string } | null;

  if (!response.ok || !payload || payload.error) {
    throw new Error(`Upstash request failed with status ${response.status}`);
  }

  return payload.result as T;
}
