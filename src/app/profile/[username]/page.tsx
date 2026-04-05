import { getProfileByUsername } from '@/lib/onboarding-actions';
import { getFollowStatusAction, getFollowCountsAction } from '@/lib/social-actions';
import ProfileDashboard from '@/components/profile/ProfileDashboard';
import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { formatUsername } from '@/lib/utils';

interface ProfilePageProps {
  params: { username: string };
}

export async function generateMetadata({ params }: ProfilePageProps): Promise<Metadata> {
  const { username } = await params;
  const displayUsername = formatUsername(username);
  return {
    title: `${displayUsername} | CineChive Profile`,
    description: `Check out ${displayUsername}'s cinematic library and style profile on CineChive.`,
  };
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { username } = await params;
  
  // Fetch profile data
  const data = await getProfileByUsername(username);
  
  if (!data) {
    notFound();
  }

  // Check auth and follow status
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const isOwnProfile = user?.id === data.profile.id;

  // Social stats
  const [followStatus, followCounts] = await Promise.all([
    isOwnProfile ? Promise.resolve(false) : getFollowStatusAction(data.profile.id),
    getFollowCountsAction(data.profile.id)
  ]);

  return (
    <ProfileDashboard 
      user={user} 
      profile={data.profile} 
      stats={data.stats}
      entries={data.entries}
      onboardingTastes={data.onboardingTastes}
      isOwnProfile={isOwnProfile}
      initialFollowStatus={!!followStatus}
      followCounts={followCounts}
    />
  );
}
