const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? '';
const supabaseEnabled = process.env.NEXT_PUBLIC_SUPABASE_ENABLED === 'true';
const supabaseDisabled = process.env.NEXT_PUBLIC_SUPABASE_DISABLED === 'true' || !supabaseEnabled;

export const SUPABASE_REQUEST_TIMEOUT_MS = 3_000;

export function getSupabaseConfig() {
  return {
    url: supabaseUrl,
    anonKey: supabaseAnonKey,
  };
}

export function isSupabaseConfigured() {
  if (supabaseDisabled || !supabaseUrl || !supabaseAnonKey) return false;

  try {
    const url = new URL(supabaseUrl);
    return url.protocol === 'https:' || url.hostname === 'localhost' || url.hostname === '127.0.0.1';
  } catch {
    return false;
  }
}

export class SupabaseUnavailableError extends Error {
  constructor(message = 'Supabase is not configured or has been disabled.') {
    super(message);
    this.name = 'SupabaseUnavailableError';
  }
}

export function assertSupabaseConfigured() {
  if (!isSupabaseConfigured()) throw new SupabaseUnavailableError();
}

export function resolveSupabasePublicUrl(path: string | null | undefined, bucket = 'avatars') {
  if (!path) return null;
  if (/^data:image\/(?:png|jpe?g|webp|gif);base64,/i.test(path)) return path;
  if (/^https?:\/\//i.test(path)) {
    try {
      const existingUrl = new URL(path);
      if (supabaseUrl && existingUrl.hostname.endsWith('.supabase.co') && existingUrl.pathname.startsWith('/storage/')) {
        return `${supabaseUrl}${existingUrl.pathname}${existingUrl.search}`;
      }
    } catch {
      return null;
    }
    return path;
  }
  if (!supabaseUrl) return null;
  if (path.startsWith('/storage/v1/object/public/')) return `${supabaseUrl}${path}`;
  return `${supabaseUrl}/storage/v1/object/public/${bucket}/${path.replace(/^\/+/, '')}`;
}
