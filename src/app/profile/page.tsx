'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import LocalProfileDashboard from '@/components/profile/LocalProfileDashboard';

export default function ProfilePage() {
  const { user, loading, isLocalMode } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isLocalMode && user?.profile?.username) {
      router.replace(`/profile/${user.profile.username}`);
    }
  }, [isLocalMode, loading, router, user]);

  if (isLocalMode) return <LocalProfileDashboard />;

  if (loading || user) {
    return <div className="flex min-h-[60vh] items-center justify-center"><Loader2 className="animate-spin text-white/30" /></div>;
  }

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 text-center">
      <h1 className="font-heading text-3xl text-white">Sign in to view your synced profile</h1>
      <Link href="/login?returnTo=/profile" className="mt-6 rounded-full bg-white px-6 py-3 text-xs font-bold text-black">Sign in</Link>
    </div>
  );
}
