'use client';

import { useEffect } from 'react';
import { AlertTriangle, Home, RefreshCcw } from 'lucide-react';
import GlassPanel from '@/components/ui/GlassPanel';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Global Error Caught:', error);
  }, [error]);

  return (
    <div className="min-h-[70vh] w-full flex items-center justify-center p-6">
      <GlassPanel className="max-w-md w-full p-8 text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center mx-auto">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        </div>
        
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-white tracking-tight">System Error</h2>
          <p className="text-gray-400 text-sm">
            We encountered an unexpected anomaly in the archive. 
          </p>
        </div>

        <div className="flex gap-4">
            <button
              onClick={() => reset()}
              className="flex-1 flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white border border-white/20 py-2.5 rounded-xl font-medium transition-colors"
            >
              <RefreshCcw size={16} />
              Re-initialize
            </button>
            
            <button
              onClick={() => window.location.href = '/'}
              className="flex-1 flex items-center justify-center gap-2 bg-white text-black hover:bg-white/90 py-2.5 rounded-xl font-medium transition-colors"
            >
              <Home size={16} />
              Return Home
            </button>
        </div>
      </GlassPanel>
    </div>
  );
}
