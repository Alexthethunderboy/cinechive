'use client';

import { createBrowserClient } from '@supabase/ssr';
import type { Database } from './database.types';
import { assertSupabaseConfigured, getSupabaseConfig } from './config';
import { supabaseFetch } from './fetch';

let client: ReturnType<typeof createBrowserClient<Database>> | undefined;

export function createClient() {
  if (client) return client;
  assertSupabaseConfigured();
  const { url, anonKey } = getSupabaseConfig();

  client = createBrowserClient<Database>(
    url,
    anonKey,
    { global: { fetch: supabaseFetch } },
  );

  return client;
}
