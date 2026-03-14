import { Suspense } from 'react';
import AuthForm from '@/components/auth/AuthForm';
import { Loader2 } from 'lucide-react';

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center"><Loader2 className="animate-spin text-white/40" /></div>}>
      <AuthForm mode="login" />
    </Suspense>
  );
}
