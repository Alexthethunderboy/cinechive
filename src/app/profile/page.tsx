import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function ProfileRedirect() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await (supabase
    .from('profiles')
    .select('username')
    .eq('id', user.id)
    .single() as any);

  if (profile?.username) {
    redirect(`/profile/${profile.username}`);
  }

  // Fallback if somehow username is missing, redirect to settings to set it
  redirect('/profile/settings');
}
