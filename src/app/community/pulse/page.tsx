import { getCommunityFeed } from '@/lib/feed-actions';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import PulseFeed from '@/components/community/PulseFeed';

export default async function PulsePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?returnTo=/community/pulse');
  }

  const { feed } = await getCommunityFeed(false);
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();

  return (
    <PulseFeed initialFeed={feed} userId={user.id} profile={profile} />
  );
}
