'use client';

import { useEffect } from 'react';
import { AlertTriangle, Home, RefreshCcw } from 'lucide-react';
import GlassPanel from '@/components/ui/GlassPanel';

export default function MediaError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Media Details Error Caught:', error);
  }, [error]);

  return (
    <div className="min-h-[50vh] w-full flex items-center justify-center p-6">
      <GlassPanel className="max-w-lg w-full p-8 text-center space-y-6 bg-black/60 backdrop-blur-xl border-white/10">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-white tracking-tight">Signal Interrupted</h2>
          <p className="text-gray-400 text-sm">
            We could not establish a connection to the data terminal for this media entry. The external APIs may be experiencing turbulence.
          </p>
        </div>

        <div className="flex gap-4">
          <button
            onClick={() => reset()}
            className="flex-1 flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white border border-white/20 py-2.5 rounded-xl font-medium transition-colors"
          >
            <RefreshCcw size={16} />
            Retry
          </button>
          
          <button
            onClick={() => window.location.href = '/'}
            className="flex-1 flex items-center justify-center gap-2 bg-white text-black hover:bg-white/90 py-2.5 rounded-xl font-medium transition-colors"
          >
            <Home size={16} />
            Home
          </button>
        </div>
      </GlassPanel>
    </div>
  );
}
