'use server';

import { createClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

const AUTH_DOMAIN = 'enterarchive.com';
const SERVICE_UNAVAILABLE_MESSAGE =
  'Account services are temporarily unavailable. You can still browse and search the archive.';

// Username must only contain alphanumeric, dots, underscores, hyphens
const USERNAME_REGEX = /^[a-zA-Z0-9._-]+$/;

function usernameToEmail(username: string) {
  return `${username.toLowerCase()}@${AUTH_DOMAIN}`;
}

function legacyUsernameToEmail(username: string) {
  return `u.${username.toLowerCase()}@${AUTH_DOMAIN}`;
}

function formatAuthError(error: { message: string }, username: string, email: string) {
  let message = error.message;
  if (message.includes(email)) {
    message = message.replace(email, username);
  }
  return message
    .replace(/email address/gi, 'Username')
    .replace(/email/gi, 'Username');
}

function getSafeReturnPath(raw: FormDataEntryValue | null): string {
  const value = typeof raw === 'string' ? raw : '';
  if (!value.startsWith('/')) return '/';
  if (value.startsWith('//')) return '/';
  if (value.startsWith('/login') || value.startsWith('/signup') || value.startsWith('/auth')) return '/';
  return value;
}

export async function signUp(formData: FormData) {
  const returnTo = getSafeReturnPath(formData.get('returnTo'));
  const username = (formData.get('username') as string)?.trim();
  const password = formData.get('password') as string;

  if (!username || !password) {
    return { error: 'Username and password are required.' };
  }

  // Server-side username format validation (defence in depth)
  if (!USERNAME_REGEX.test(username)) {
    return { error: 'Username can only contain letters, numbers, dots, underscores, and hyphens.' };
  }

  if (password.length < 6) {
    return { error: 'Password must be at least 6 characters.' };
  }

  if (!isSupabaseConfigured()) {
    return { error: SERVICE_UNAVAILABLE_MESSAGE };
  }

  const email = usernameToEmail(username);

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
        },
      },
    });

    if (error) {
      return { error: formatAuthError(error, username, email) };
    }
  } catch {
    return { error: SERVICE_UNAVAILABLE_MESSAGE };
  }

  // Profile row is created automatically by the DB trigger (on_auth_user_created).
  // No manual insert needed here — that caused a duplicate key violation.

  revalidatePath('/', 'layout');
  redirect(returnTo);
}

export async function login(formData: FormData) {
  const returnTo = getSafeReturnPath(formData.get('returnTo'));
  const username = (formData.get('username') as string)?.trim();
  const password = formData.get('password') as string;

  if (!username || !password) {
    return { error: 'Username and password are required.' };
  }

  if (!isSupabaseConfigured()) {
    return { error: SERVICE_UNAVAILABLE_MESSAGE };
  }

  // 1. Try standard email (new users)
  const email = usernameToEmail(username);
  try {
    const supabase = await createClient();
    let authRes = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    // 2. If it fails, try legacy u.email (existing users)
    if (authRes.error) {
      const legacyEmail = legacyUsernameToEmail(username);
      const legacyRes = await supabase.auth.signInWithPassword({
        email: legacyEmail,
        password,
      });

      if (!legacyRes.error) {
        authRes = legacyRes;
      }
    }

    if (authRes.error) {
      return { error: formatAuthError(authRes.error, username, email) };
    }
  } catch {
    return { error: SERVICE_UNAVAILABLE_MESSAGE };
  }

  revalidatePath('/', 'layout');
  redirect(returnTo);
}

export async function signOut() {
  try {
    if (isSupabaseConfigured()) {
      const supabase = await createClient();
      await supabase.auth.signOut();
    }
  } catch {
    // The local session is unusable when the backend is down; still return to login.
  }
  revalidatePath('/', 'layout');
  redirect('/login');
}
