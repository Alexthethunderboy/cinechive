'use client';

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2 } from 'lucide-react';
import { createCollectionAction } from '@/lib/collection-actions';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuth } from '@/components/providers/AuthProvider';
import { createLocalCollection } from '@/lib/local-archive';

interface NewCollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NewCollectionModal({ isOpen, onClose }: NewCollectionModalProps) {
  const { isLocalMode } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;

    setIsLoading(true);
    try {
      if (isLocalMode) createLocalCollection({ title, description });
      else await createCollectionAction({ title, description, isPublic });
      toast.success("Collection created successfully");
      setTitle('');
      setDescription('');
      setIsPublic(false);
      onClose();
      router.refresh();
    } catch (error) {
      console.error("Failed to create collection:", error);
      toast.error("Failed to create collection");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen || typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[90] cursor-pointer bg-black/80 backdrop-blur-sm"
          />
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="new-collection-title"
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 focus:outline-none sm:p-6"
          >
            <div className="max-h-[calc(100dvh-2rem)] w-full max-w-lg overflow-y-auto rounded-3xl border border-white/10 bg-[#0A0A0A] shadow-2xl">
              <div className="p-8">
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <h2 id="new-collection-title" className="font-heading text-4xl text-white uppercase italic tracking-tighter leading-none mb-1">
                      New Collection
                    </h2>
                    <p className="font-metadata text-[10px] text-white/30 uppercase tracking-widest">Create a custom editorial volume</p>
                  </div>
                  <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                    <X size={20} className="text-white/40" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <label className="font-metadata text-[9px] text-white/40 uppercase tracking-[0.2em] px-1">
                      Title
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g., Noir Masterpieces"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:outline-none focus:border-white/30 transition-all font-heading text-xl placeholder:text-white/10"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="font-metadata text-[9px] text-white/40 uppercase tracking-[0.2em] px-1">
                      Description (Optional)
                    </label>
                    <textarea
                      placeholder="Describe the vibe of this collection..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={3}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:outline-none focus:border-white/30 transition-all font-metadata text-xs placeholder:text-white/10 resize-none"
                    />
                  </div>

                  <div className={cn("flex items-center gap-3 py-2", isLocalMode && "opacity-60")}>
                    <button
                      type="button"
                      disabled={isLocalMode}
                      onClick={() => setIsPublic(!isPublic)}
                      className={cn(
                        "w-10 h-10 rounded-xl border transition-all flex items-center justify-center",
                        isPublic ? "bg-white text-black border-white" : "bg-white/5 text-white/20 border-white/10"
                      )}
                    >
                      {isPublic ? '✓' : ''}
                    </button>
                    <div>
                      <p className="font-metadata text-[10px] text-white uppercase tracking-widest">Public Collection</p>
                      <p className="font-metadata text-[8px] text-white/20 uppercase tracking-widest">
                        {isLocalMode ? 'Public links require a server; this collection stays private' : 'Allow others to see this curation'}
                      </p>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading || !title}
                    className="w-full bg-white text-black py-4 rounded-2xl font-metadata text-xs uppercase tracking-[0.3em] font-bold hover:bg-white/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isLoading ? <Loader2 size={16} className="animate-spin" /> : "Create Collection"}
                  </button>
                </form>
              </div>
            </div>
          </motion.div>
        </>
    </AnimatePresence>,
    document.body,
  );
}
