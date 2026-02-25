import { getPulseFeed } from '@/lib/actions';
import ClientPulse from '@/components/pulse/ClientPulse';

export default async function PulsePage() {
  const feed = await getPulseFeed();
  
  return <ClientPulse initialFeed={feed} />;
}
