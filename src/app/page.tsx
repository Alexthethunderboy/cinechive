import { Metadata } from 'next';
import ClientHome from '@/components/home/ClientHome';

export const metadata: Metadata = {
  title: "Cinema | Home",
  description: "Your personalized cinematic feed, curated by deep algorithms and shared frequencies.",
};

export default async function Home() {
  return <ClientHome />;
}
