'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

const AUTH_DOMAIN = 'enterarchive.com';

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

export async function signUp(formData: FormData) {
  const supabase = await createClient();
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

  const email = usernameToEmail(username);

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        username: username,
      },
    },
  });

  if (error) {
    return { error: formatAuthError(error, username, email) };
  }

  // Profile row is created automatically by the DB trigger (on_auth_user_created).
  // No manual insert needed here — that caused a duplicate key violation.

  redirect('/');
}

export async function login(formData: FormData) {
  const supabase = await createClient();
  const username = (formData.get('username') as string)?.trim();
  const password = formData.get('password') as string;

  if (!username || !password) {
    return { error: 'Username and password are required.' };
  }

  // 1. Try standard email (new users)
  const email = usernameToEmail(username);
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

  redirect('/');
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}
