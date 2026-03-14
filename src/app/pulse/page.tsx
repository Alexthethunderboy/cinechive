import { getPulseFeed } from '@/lib/actions';
import ClientPulse from '@/components/pulse/ClientPulse';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

import { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Pulse",
  description: "Synchronize with the collection frequencies of your network.",
};

export default async function PulsePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?returnTo=/pulse');
  }

  const feed = await getPulseFeed();
  
  return <ClientPulse initialFeed={feed} />;
}
