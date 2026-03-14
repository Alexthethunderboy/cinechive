import { Metadata } from 'next';
import { getVaultEntries } from '@/lib/actions';
import ClientCollections from '@/components/collections/ClientCollections';

export const metadata: Metadata = {
  title: "Library | CineChive",
  description: "Your personal registry of cinematic works and acquired frequencies.",
};

export default async function CollectionsPage() {
  const entries = await getVaultEntries();
  
  return <ClientCollections initialEntries={entries} />;
}
