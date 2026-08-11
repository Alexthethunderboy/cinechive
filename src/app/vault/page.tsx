import VaultClient from '@/components/vault/VaultClient';

export const metadata = {
  title: 'The Vault',
  description: 'Your personal collection and library of films, series, and anime.',
};

export default function VaultPage() {
  return (
    <VaultClient 
      initialCollections={[]}
      initialSavedMedia={[]}
    />
  );
}
