import { Metadata } from 'next';
import ClientDiscover from '@/components/cinema/ClientDiscover';

export const metadata: Metadata = {
  title: "Discover",
  description: "Browse the editorial collective of curated cinematic works.",
};

export default function DiscoverPage() {
  return <ClientDiscover />;
}
