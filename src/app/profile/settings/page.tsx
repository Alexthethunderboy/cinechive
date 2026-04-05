import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import ProfileSettingsUI from '@/components/profile/ProfileSettingsUI';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Settings | CineChive",
  description: "Manage your profile and account preferences.",
};

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profile) {
    redirect('/login');
  }

  return (
    <div className="bg-black min-h-screen text-white">
      <ProfileSettingsUI profile={profile} />
    </div>
  );
}
