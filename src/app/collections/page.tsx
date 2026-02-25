import { getVaultEntries } from '@/lib/actions';
import ClientCollections from '@/components/collections/ClientCollections';

export default async function CollectionsPage() {
  const entries = await getVaultEntries();
  
  return <ClientCollections initialEntries={entries} />;
}
