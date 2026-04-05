import { Metadata } from 'next';
import ClientDiscover from '@/components/cinema/ClientDiscover';

export const metadata: Metadata = {
  title: "Discover",
  description: "Browse curated collections of films and series.",
};

export default function DiscoverPage() {
  return <ClientDiscover />;
}
