'use client';

import React from 'react';
import { Share2 } from 'lucide-react';
import { toast } from 'sonner';

interface ShareButtonProps {
  shareToken?: string;
  title: string;
}

export default function ShareButton({ shareToken, title }: ShareButtonProps) {
  const handleShare = async () => {
    if (!shareToken) {
      toast.error("Sharing not enabled for this collection");
      return;
    }

    const shareUrl = `${window.location.origin}/share/collection/${shareToken}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `CineChive Collection: ${title}`,
          url: shareUrl,
        });
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          copyToClipboard(shareUrl);
        }
      }
    } else {
      copyToClipboard(shareUrl);
    }
  };

  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url).then(() => {
      toast.success("Share link copied to clipboard");
    }).catch(() => {
      toast.error("Failed to copy link");
    });
  };

  return (
    <button 
      onClick={handleShare}
      className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2 rounded-full font-metadata text-[10px] uppercase tracking-widest text-white transition-all group"
    >
      <Share2 size={14} className="group-hover:scale-110 transition-transform" /> Share
    </button>
  );
}
