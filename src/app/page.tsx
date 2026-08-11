import { Metadata } from 'next';
import ClientHome from '@/components/home/ClientHome';

export const metadata: Metadata = {
  title: "Cinema | Home",
  description: "Your personalized cinematic feed, curated by style and community activity.",
};

export default function Home() {
  return <ClientHome />;
}
