'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

const AUTH_DOMAIN = 'enterarchive.com';

function usernameToEmail(username: string) {
  // Sanitize: only alphanumeric, dots, underscores, and hyphens allowed in email local-part
  const sanitized = username.toLowerCase().replace(/[^a-z0-9._-]/g, '');
  return `${sanitized}@${AUTH_DOMAIN}`;
}

function formatAuthError(error: { message: string }, username: string, email: string) {
  let message = error.message;
  // Replace the internal email with the username in the error message
  if (message.includes(email)) {
    message = message.replace(email, username);
  }
  // Replace references to "email" with "username" to keep the experience seamless
  return message.replace(/email address/gi, 'Username').replace(/email/gi, 'Username');
}

export async function signUp(formData: FormData) {
  const supabase = await createClient();
  const username = (formData.get('username') as string)?.trim();
  const password = formData.get('password') as string;
  const dob = formData.get('dob') as string;

  if (!username || !password || !dob) {
    return { error: 'Username, password, and date of birth are required' };
  }

  const email = usernameToEmail(username);

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        username: username,
        dob: dob,
      },
    },
  });

  if (error) {
    return { error: formatAuthError(error, username, email) };
  }

  // Create profile entry
  if (data.user) {
    const { error: profileError } = await (supabase
      .from('profiles') as any)
      .insert({
        id: data.user.id,
        username: username,
        date_of_birth: dob,
      });

    if (profileError) {
      console.error('Error creating profile:', profileError);
    }
  }

  return { success: true };
}

export async function login(formData: FormData) {
  const supabase = await createClient();
  const username = (formData.get('username') as string)?.trim();
  const password = formData.get('password') as string;

  if (!username || !password) {
    return { error: 'Username and password are required' };
  }

  const email = usernameToEmail(username);

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: formatAuthError(error, username, email) };
  }

  redirect('/');
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}
