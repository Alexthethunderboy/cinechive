import { getVaultEntries, getUserCollectionsAction } from '@/lib/actions';
import VaultClient from '@/components/vault/VaultClient';

export const metadata = {
  title: 'The Vault',
  description: 'Your personal collection and library of films, series, and anime.',
};

export default async function VaultPage() {
  const [savedMedia, collections] = await Promise.all([
    getVaultEntries(),
    getUserCollectionsAction(),
  ]);

  return (
    <VaultClient 
      initialCollections={collections} 
      initialSavedMedia={savedMedia} 
    />
  );
}
