'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Loader2, 
  Plus, 
  Check, 
  FolderHeart, 
  Bookmark,
  ChevronRight,
  PlusCircle
} from 'lucide-react';
import { 
  getUserCollectionsAction, 
  addMediaToCollectionAction, 
  toggleArchiveMediaAction,
  getIsInVaultAction,
  createCollectionAction
} from '@/lib/actions';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface SaveMediaDialogProps {
  isOpen: boolean;
  onClose: () => void;
  media: any;
}

export default function SaveMediaDialog({ isOpen, onClose, media }: SaveMediaDialogProps) {
  const [collections, setCollections] = useState<any[]>([]);
  const [isVault, setIsVault] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isTogglingVault, setIsTogglingVault] = useState(false);
  const [addingId, setAddingId] = useState<string | null>(null);
  
  // Inline creation state
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [isCreatingLoading, setIsCreatingLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, media.id]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [cols, vaultStatus] = await Promise.all([
        getUserCollectionsAction(),
        getIsInVaultAction(media.id)
      ]);
      setCollections(cols);
      setIsVault(vaultStatus);
    } catch (error) {
      console.error("Failed to load save data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleVault = async () => {
    setIsTogglingVault(true);
    try {
      const result = await toggleArchiveMediaAction({
        mediaId: media.id,
        mediaType: media.type,
        title: media.displayTitle || media.title,
        posterUrl: media.posterUrl,
      });
      if ('error' in result) throw new Error(result.error as string);
      
      setIsVault(result.status === 'added');
      toast.success(result.status === 'added' ? "Saved to Vault" : "Removed from Vault");
      if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(10);
      window.dispatchEvent(new CustomEvent('refresh-notifications'));
    } catch (error) {
      toast.error("Failed to update vault");
    } finally {
      setIsTogglingVault(false);
    }
  };

  const handleAddToCollection = async (collectionId: string) => {
    setAddingId(collectionId);
    try {
      await addMediaToCollectionAction(collectionId, media);
      toast.success(`Added to collection`);
      if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(10);
      window.dispatchEvent(new CustomEvent('refresh-notifications'));
      // We don't close immediately to allow multiple additions
    } catch (error) {
      toast.error("Failed to add to collection");
    } finally {
      setAddingId(null);
    }
  };

  const handleCreateCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    setIsCreatingLoading(true);
    try {
      const newCol = await createCollectionAction({ title: newTitle });
      toast.success("Collection created");
      setCollections([newCol, ...collections]);
      setNewTitle('');
      setIsCreating(false);
      // Auto-add the media to the new collection
      await handleAddToCollection(newCol.id);
    } catch (error) {
      toast.error("Failed to create collection");
    } finally {
      setIsCreatingLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] cursor-pointer"
          />
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 40 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 40 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-[400px] z-[110] focus:outline-none"
          >
            <div className="bg-[#0D0D0D] border border-white/10 rounded-[32px] overflow-hidden shadow-[0_32px_64px_-16px_rgba(0,0,0,0.8)]">
              {/* Media Preview Header */}
              <div className="p-6 pb-0 flex items-center gap-4">
                 <div className="relative w-16 h-24 rounded-xl overflow-hidden bg-white/5 border border-white/10 shrink-0">
                    {media.posterUrl && <img src={media.posterUrl} className="w-full h-full object-cover" alt="" />}
                 </div>
                 <div className="flex-1 min-w-0">
                    <h3 className="font-heading text-xl text-white uppercase italic tracking-tight truncate leading-tight">
                      {media.displayTitle || media.title}
                    </h3>
                    <p className="font-metadata text-[10px] text-white/30 uppercase tracking-widest mt-1">
                      {media.releaseYear || media.type}
                    </p>
                 </div>
                 <button onClick={onClose} className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors">
                   <X size={16} className="text-white/40" />
                 </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Vault Toggle Card */}
                <button 
                  onClick={handleToggleVault}
                  disabled={isTogglingVault}
                  className={cn(
                    "w-full flex items-center justify-between p-5 rounded-2xl border transition-all duration-500 group",
                    isVault 
                      ? "bg-white border-white text-black" 
                      : "bg-white/5 border-white/10 text-white hover:bg-white/10"
                  )}
                >
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
                      isVault ? "bg-black/5" : "bg-white/5 group-hover:bg-white/10"
                    )}>
                      {isTogglingVault ? (
                        <Loader2 size={20} className="animate-spin" />
                      ) : (
                        <Bookmark size={20} className={cn(isVault ? "fill-current" : "")} />
                      )}
                    </div>
                    <div className="text-left">
                      <p className="font-metadata text-[11px] font-bold uppercase tracking-widest leading-none mb-1">
                        {isVault ? 'Saved to Vault' : 'Save to Vault'}
                      </p>
                      <p className={cn("font-metadata text-[9px] uppercase tracking-widest opacity-40")}>
                        {isVault ? 'Item archived' : 'Add to personal archive'}
                      </p>
                    </div>
                  </div>
                  {isVault && <Check size={18} className="text-black" />}
                </button>

                {/* Collections Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between px-1">
                    <h4 className="font-metadata text-[10px] text-white/40 uppercase tracking-[0.2em]">Add to Collection</h4>
                    <button 
                      onClick={() => setIsCreating(true)}
                      className="text-[10px] font-metadata text-accent uppercase tracking-widest flex items-center gap-1 hover:opacity-70 transition-opacity"
                    >
                      <PlusCircle size={12} /> New
                    </button>
                  </div>

                  <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1 custom-scrollbar">
                    {isCreating && (
                      <motion.form 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        onSubmit={handleCreateCollection}
                        className="flex gap-2 p-2 bg-accent/10 border border-accent/20 rounded-xl mb-3"
                      >
                         <input 
                           autoFocus
                           type="text" 
                           placeholder="Collection name..." 
                           value={newTitle}
                           onChange={(e) => setNewTitle(e.target.value)}
                           className="flex-1 bg-transparent text-[11px] font-metadata text-white placeholder:text-white/20 focus:outline-none px-1"
                         />
                         <button 
                           type="submit" 
                           disabled={isCreatingLoading || !newTitle.trim()}
                           className="p-1 px-3 bg-white text-black rounded-lg text-[10px] font-bold font-metadata uppercase"
                         >
                           {isCreatingLoading ? <Loader2 size={12} className="animate-spin" /> : 'Create'}
                         </button>
                      </motion.form>
                    )}

                    {isLoading ? (
                      <div className="py-8 flex flex-col items-center justify-center opacity-20">
                        <Loader2 size={20} className="animate-spin mb-2" />
                      </div>
                    ) : collections.length > 0 ? (
                      collections.map((col) => (
                        <button
                          key={col.id}
                          onClick={() => handleAddToCollection(col.id)}
                          disabled={addingId === col.id}
                          className="w-full flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 transition-all group"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/20 group-hover:text-white/40 transition-colors">
                              <FolderHeart size={16} />
                            </div>
                            <span className="font-metadata text-[11px] text-white/60 group-hover:text-white transition-colors uppercase tracking-widest font-bold truncate max-w-[180px]">
                              {col.title}
                            </span>
                          </div>
                          {addingId === col.id ? (
                            <Loader2 size={14} className="animate-spin text-white/40" />
                          ) : (
                            <Plus size={14} className="text-white/10 group-hover:text-white transition-colors" />
                          )}
                        </button>
                      ))
                    ) : !isCreating && (
                      <div className="py-8 text-center opacity-20">
                        <p className="font-metadata text-[9px] uppercase tracking-widest">No curations yet</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="p-4 border-t border-white/5 bg-white/[0.02]">
                <p className="font-metadata text-[8px] text-white/20 uppercase tracking-[0.2em] text-center">
                  CineChive • Personal Archive System
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
