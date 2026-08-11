import {
  getSupabaseConfig,
  isSupabaseConfigured,
  SUPABASE_REQUEST_TIMEOUT_MS,
} from './config';

function combineAbortSignals(signal: AbortSignal | null | undefined, timeoutMs: number) {
  const controller = new AbortController();
  const abortFromCaller = () => controller.abort(signal?.reason);
  const timeout = setTimeout(
    () => controller.abort(new DOMException('Supabase request timed out.', 'TimeoutError')),
    timeoutMs,
  );

  if (signal?.aborted) abortFromCaller();
  else signal?.addEventListener('abort', abortFromCaller, { once: true });

  return {
    signal: controller.signal,
    cleanup() {
      clearTimeout(timeout);
      signal?.removeEventListener('abort', abortFromCaller);
    },
  };
}

export const supabaseFetch: typeof fetch = async (input, init = {}) => {
  const combined = combineAbortSignals(init.signal, SUPABASE_REQUEST_TIMEOUT_MS);

  try {
    return await fetch(input, { ...init, signal: combined.signal });
  } finally {
    combined.cleanup();
  }
};

let healthCheck: Promise<boolean> | null = null;

export function checkSupabaseHealth() {
  if (!isSupabaseConfigured()) return Promise.resolve(false);
  if (healthCheck) return healthCheck;

  const { url, anonKey } = getSupabaseConfig();
  healthCheck = supabaseFetch(`${url}/auth/v1/health`, {
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
    },
    cache: 'no-store',
  })
    .then((response) => response.ok)
    .catch(() => false);

  return healthCheck;
}
