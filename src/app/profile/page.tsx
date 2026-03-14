import { getCurrentUser, getVaultEntries } from '@/lib/actions';
import ClientProfile from '@/components/profile/ClientProfile';
import { redirect } from 'next/navigation';

import { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Frequencies | Profile",
  description: "Personal settings and cinematic identity.",
};

export default async function ProfilePage() {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect('/login');
  }

  const recentEntries = await getVaultEntries();
  
  // Calculate some simple stats for the UI
  const entriesCount = recentEntries.length;

  return (
    <ClientProfile 
      user={user} 
      profile={user.profile} 
      stats={{ entriesCount }}
      recentEntries={recentEntries}
    />
  );
}
