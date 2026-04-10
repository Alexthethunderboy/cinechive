import { getCommunityFeed } from '@/lib/actions';
import ClientCommunity from '@/components/community/ClientCommunity';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Metadata } from 'next';
import { getSuggestedUsersAction } from '@/lib/social-actions';

export const metadata: Metadata = {
  title: 'Community | CineChive',
  description: 'See what your community is watching and collecting.',
};

export default async function CommunityPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?returnTo=/community');
  }

  // Fetch feeds and profile in parallel
  const [globalResult, followingResult, profileRes, suggestedPeople] = await Promise.all([
    getCommunityFeed(false),
    getCommunityFeed(true),
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    getSuggestedUsersAction(),
  ]);

  return (
    <ClientCommunity
      initialFeed={globalResult.feed}
      initialFollowingFeed={followingResult.feed}
      preferredStyles={globalResult.preferredStyles}
      initialGlobalFeedError={globalResult.hadError}
      initialFollowingFeedError={followingResult.hadError}
      suggestedPeople={suggestedPeople}
      userId={user.id}
      user={user}
      profile={profileRes.data}
    />
  );
}
