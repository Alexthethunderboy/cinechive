import Link from 'next/link';
import GlassPanel from '@/components/ui/GlassPanel';

export default function NotFound() {
  return (
    <div className="min-h-[70vh] w-full flex items-center justify-center p-6">
      <GlassPanel className="max-w-md w-full p-8 text-center space-y-6">
        <div className="text-[120px] font-black leading-none bg-gradient-to-b from-white/80 to-white/10 text-transparent bg-clip-text tracking-tighter mix-blend-overlay">
          404
        </div>
        
        <div className="space-y-2">
          <h2 className="text-xl font-medium text-white">Transmission Lost</h2>
          <p className="text-gray-400 text-sm">
            The cinematic record you are searching for does not exist in this archive. It may have been relocated or completely redacted.
          </p>
        </div>

        <div className="pt-4">
          <Link href="/">
            <button className="w-full bg-white text-black hover:bg-white/90 py-3 rounded-xl font-bold transition-colors">
              Return to Nexus
            </button>
          </Link>
        </div>
      </GlassPanel>
    </div>
  );
}
