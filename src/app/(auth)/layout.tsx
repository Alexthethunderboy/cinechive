import type { Metadata } from 'next';
import MeshGradient from '@/components/ui/MeshGradient';

export const metadata: Metadata = {
  title: {
    default: 'CineChive | Sign In',
    template: '%s | CineChive',
  },
};

/**
 * Isolated layout for auth pages (/login, /signup).
 * Renders without the sidebar and bottom nav so the auth pages
 * are clean and focused.
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative">
      <MeshGradient />
      <div className="relative z-10 w-full">
        {children}
      </div>
    </div>
  );
}
