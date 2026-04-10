import { getSuggestedUsersAction, getFollowersAction, getFollowingAction } from '@/lib/social-actions';
import ClientPeople from '@/components/social/ClientPeople';
import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Find Cinephiles | CineChive',
  description: 'Discover other collectors, critics, and cinephiles on CineChive.',
};

export default async function PeoplePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?returnTo=/people');
  }

  const [suggestions, followers, following] = await Promise.all([
    getSuggestedUsersAction(),
    getFollowersAction(user.id),
    getFollowingAction(user.id),
  ]);

  return (
    <ClientPeople
      initialSuggestions={suggestions}
      initialFollowers={followers}
      initialFollowing={following}
    />
  );
}
