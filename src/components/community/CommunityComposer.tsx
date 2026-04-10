'use client';

import { useState, useTransition, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, 
  Film, 
  X, 
  Search, 
  PlusCircle,
  Loader2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import GlassPanel from '@/components/ui/GlassPanel';
import { ClassificationName } from '@/lib/design-tokens';
import { cn } from '@/lib/utils';
import { createDispatchAction } from '@/lib/social-dispatch-actions';
import { toast } from 'sonner';
import CinematicAvatar from '../profile/CinematicAvatar';
import { MediaFetcher, MediaFetcherError } from '@/lib/api/MediaFetcher';
import Image from 'next/image';
import { emitRefreshNotifications } from '@/lib/client-events';

interface CommunityComposerProps {
  user: any;
  profile: any;
  onPublished?: (post: any) => void;
}

export default function CommunityComposer({ user, profile, onPublished }: CommunityComposerProps) {
  const [content, setContent] = useState('');
  const [isPending, startTransition] = useTransition();
  const [isFocused, setIsFocused] = useState(false);
  const [showMediaSearch, setShowMediaSearch] = useState(false);
  
  // Media Attachment State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedMedia, setSelectedMedia] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [mediaSearchError, setMediaSearchError] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [content]);

  useEffect(() => {
    const handleRepostWithNote = (event: Event) => {
      const custom = event as CustomEvent<{ text?: string }>;
      const seededText = custom.detail?.text || '';
      setIsFocused(true);
      setContent(seededText);
      setTimeout(() => textareaRef.current?.focus(), 10);
    };
    window.addEventListener('community-repost-note', handleRepostWithNote as EventListener);
    return () => window.removeEventListener('community-repost-note', handleRepostWithNote as EventListener);
  }, []);

  // Media Search Logic
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.length > 2) {
        setIsSearching(true);
        setMediaSearchError(null);
        try {
          const results = await MediaFetcher.searchMedia(searchQuery);
          setSearchResults(results.slice(0, 15));
        } catch (e) {
          if (e instanceof MediaFetcherError && e.status === 401) {
            setMediaSearchError('Media search is unavailable right now.');
          } else {
            setMediaSearchError('Failed to search media right now.');
          }
          setSearchResults([]);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSearchResults([]);
        setMediaSearchError(null);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handlePost = () => {
    if (!content.trim() && selectedMedia.length === 0) return;

    startTransition(async () => {
      const result = await createDispatchAction({
        content,
        classification: undefined,
        mediaRefs: selectedMedia.map(m => ({
          id: m.id,
          type: m.type,
          title: m.displayTitle,
          posterUrl: m.posterUrl
        }))
      });

      if (result.success) {
        onPublished?.({
          id: crypto.randomUUID(),
          activity_type: 'dispatch',
          user_id: user?.id,
          username: profile?.username,
          avatar_url: profile?.avatar_url,
          content,
          classification: null,
          media_refs: selectedMedia.map((m) => ({
            id: m.id,
            type: m.type,
            title: m.displayTitle,
            posterUrl: m.posterUrl,
          })),
          created_at: new Date().toISOString(),
          reaction_count: 0,
          has_reacted: false,
          comment_count: 0,
          recent_comments: [],
        });
        toast.success('Post published');
        emitRefreshNotifications();
        setContent('');
        setSelectedMedia([]);
        setIsFocused(false);
      } else {
        toast.error(result.error || 'Failed to publish');
      }
    });
  };

  const addMedia = (media: any) => {
    if (selectedMedia.length >= 6) {
       toast.error('Limit: 6 films per post');
       return;
    }
    if (!selectedMedia.find(m => m.id === media.id)) {
      setSelectedMedia([...selectedMedia, media]);
    }
    setSearchQuery('');
    setSearchResults([]);
    setShowMediaSearch(false);
  };

  const removeMedia = (id: string) => {
    setSelectedMedia(selectedMedia.filter(m => m.id !== id));
  };

  const moveMedia = (id: string, direction: -1 | 1) => {
    const current = [...selectedMedia];
    const idx = current.findIndex((m) => m.id === id);
    if (idx < 0) return;
    const target = idx + direction;
    if (target < 0 || target >= current.length) return;
    [current[idx], current[target]] = [current[target], current[idx]];
    setSelectedMedia(current);
  };

  return (
    <div id="compose" className="mb-6 sm:mb-10 group/composer">
      <GlassPanel 
        className={cn(
          "transition-all duration-300 relative rounded-3xl",
          isFocused 
            ? "p-3 sm:p-4 md:p-5 bg-white/[0.035] border-white/15 shadow-[0_8px_30px_rgba(0,0,0,0.35)] ring-0" 
            : "p-3 sm:p-4 md:p-5 bg-white/[0.02] border-white/10 hover:border-white/15"
        )}
      >
        <div className="flex items-start gap-3 md:gap-4 relative z-10 w-full">
          <div className="shrink-0 pt-0.5">
            <CinematicAvatar 
              src={profile?.avatar_url} 
              username={profile?.username} 
              size="md" 
              style={'Atmospheric' as ClassificationName}
              className="transition-all duration-500 shadow-xl"
            />
          </div>

          <div className="flex-1 min-w-0">
            <div className="relative w-full">
              <textarea
                ref={textareaRef}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onFocus={() => setIsFocused(true)}
                placeholder={content ? "" : "Share your thoughts on your current archive..."}
                className="w-full bg-transparent border-none focus:ring-0 text-white font-heading text-base sm:text-lg md:text-xl placeholder:text-white/20 resize-none min-h-[52px] sm:min-h-[56px] max-h-[500px] transition-all relative z-10 leading-relaxed tracking-wide pt-1 overflow-x-hidden wrap-break-word whitespace-pre-wrap"
              />
            </div>
          </div>
        </div>

        {/* Selected Media: Film Strip Strips */}
        <div className="relative z-10 w-full mt-1.5">
          <AnimatePresence>
            {selectedMedia.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="flex gap-2.5 overflow-x-auto pb-3 pt-1.5 justify-start items-center"
              >
                {selectedMedia.map((m, i) => (
                  <motion.div 
                    key={m.id}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: i * 0.05 }}
                    className="relative group/strip shrink-0"
                  >
                    <div className="w-[78px] md:w-[94px] aspect-2/3 rounded-xl overflow-hidden border border-white/10 shadow-xl relative bg-black/40">
                      {m.posterUrl && <Image src={m.posterUrl} alt="" fill className="object-cover group-hover/strip:scale-105 transition-transform duration-500" />}
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/strip:opacity-100 transition-opacity flex flex-col items-center justify-center backdrop-blur-sm gap-2">
                         <div className="flex gap-1">
                           <button onClick={() => moveMedia(m.id, -1)} className="p-1.5 rounded-full bg-black/60 text-white/80 hover:text-white">
                             <ChevronLeft size={12} />
                           </button>
                           <button onClick={() => moveMedia(m.id, 1)} className="p-1.5 rounded-full bg-black/60 text-white/80 hover:text-white">
                             <ChevronRight size={12} />
                           </button>
                         </div>
                         <button onClick={() => removeMedia(m.id)} className="p-2.5 rounded-full bg-rose-500 hover:bg-rose-600 text-white shadow-2xl transition-transform hover:scale-110 active:scale-95">
                            <X size={14} />
                         </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
                {selectedMedia.length < 6 && (
                  <button 
                    onClick={() => setShowMediaSearch(true)}
                    className="w-[78px] md:w-[94px] aspect-2/3 rounded-xl border border-dashed border-white/20 flex flex-col items-center justify-center text-white/50 hover:text-white hover:border-white/50 hover:bg-white/5 transition-all gap-1.5 shadow-sm"
                  >
                     <div className="p-2 rounded-full bg-white/5 group-hover:bg-white/20 transition-colors">
                       <PlusCircle size={18} />
                     </div>
                     <span className="text-[9px] font-bold uppercase tracking-widest">Attach</span>
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Composer Tools */}
        <div className="relative z-20 w-full mt-1.5">
          <div className="pt-3 mt-1.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 sm:gap-4 relative before:content-[''] before:absolute before:top-0 before:left-0 before:right-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative z-40">
                <button 
                  onClick={() => {
                    setShowMediaSearch(!showMediaSearch);
                  }}
                  className={cn(
                    "group min-h-11 flex items-center gap-2 px-3 py-2 rounded-[12px] transition-all font-metadata text-[10px] uppercase tracking-widest font-bold border overflow-hidden relative",
                    selectedMedia.length > 0 
                      ? "bg-white/10 text-white border-white/25" 
                      : "bg-white/[0.04] border-white/15 text-white/70 hover:text-white hover:border-white/25"
                  )}
                >
                  <Film size={14} className="transition-all duration-300 relative z-10 text-white/70" />
                  <span className="relative z-10">Attach Film</span>
                </button>

                {/* Media Search Modal */}
                <AnimatePresence>
                  {showMediaSearch && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute bottom-full left-1/2 -translate-x-1/2 sm:left-0 sm:right-auto sm:translate-x-0 mb-3 bg-black backdrop-blur-3xl border border-white/10 rounded-3xl w-[min(92vw,340px)] shadow-[0_15px_50px_rgba(0,0,0,0.7)] z-50 overflow-hidden"
                    >
                          <div className="p-3 border-b border-white/10 bg-white/5 flex items-center gap-3 relative overflow-hidden">
                            <div className="absolute inset-0 bg-linear-to-r from-accent/5 to-vibe-teal/5" />
                            <Search size={16} className="text-white/40 relative z-10" />
                            <input 
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              placeholder="Search movies..."
                              autoFocus
                              className="bg-transparent border-none focus:ring-0 text-sm text-white placeholder:text-white/30 p-0 w-full font-heading relative z-10"
                            />
                          </div>
                          <div className="max-h-[320px] overflow-y-auto scrollbar-hide py-2">
                            {isSearching ? (
                              <div className="p-10 flex flex-col items-center gap-4">
                                 <Loader2 className="animate-spin text-accent/40" size={32} />
                                 <span className="font-metadata text-[9px] uppercase tracking-widest text-white/40 font-bold">Accessing Archives</span>
                              </div>
                            ) : mediaSearchError ? (
                              <div className="p-8 text-center flex flex-col items-center gap-2">
                                <span className="text-[10px] text-amber-200/80 uppercase tracking-[0.18em] font-bold">
                                  {mediaSearchError}
                                </span>
                                <span className="text-[9px] text-white/35 uppercase tracking-[0.18em]">
                                  You can still publish text posts.
                                </span>
                              </div>
                            ) : searchResults.length > 0 ? (
                              searchResults.map(m => (
                                <button
                                  key={m.id}
                                  onClick={() => addMedia(m)}
                                  className="w-full px-4 py-3 flex gap-4 hover:bg-white/10 transition-colors text-left group/result border-b border-white/5 last:border-0"
                                >
                                  <div className="w-12 aspect-2/3 shrink-0 rounded-lg overflow-hidden bg-white/5 border border-white/10 shadow-sm relative">
                                    {m.posterUrl && <Image src={m.posterUrl} alt="" fill className="object-cover" />}
                                  </div>
                                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                                    <p className="text-[13px] font-bold text-white/90 truncate font-heading group-hover/result:text-white transition-colors tracking-wide leading-tight">{m.displayTitle}</p>
                                    <div className="flex items-center gap-2 mt-1.5">
                                      <span className="text-[8px] text-accent font-metadata uppercase tracking-widest font-bold px-1.5 py-0.5 rounded-md bg-accent/10 border border-accent/20">{m.type}</span>
                                      <span className="text-[9px] text-white/40 uppercase font-metadata tracking-widest font-bold">{m.releaseDate?.split('-')[0]}</span>
                                    </div>
                                  </div>
                                  <PlusCircle size={16} className="text-white/20 group-hover/result:text-white/60 transition-all self-center" />
                                </button>
                              ))
                            ) : searchQuery.length > 2 ? (
                              <div className="p-10 text-center flex flex-col items-center gap-3">
                                 <Search size={24} className="text-white/20" />
                                 <span className="text-[10px] text-white/30 uppercase tracking-[0.2em] font-bold">Entry not found</span>
                              </div>
                            ) : (
                              <div className="p-10 text-center flex flex-col items-center gap-3">
                                 <Film size={28} className="text-white/10" />
                                 <span className="text-[10px] text-white/30 uppercase tracking-[0.2em] font-black">Search Movies</span>
                              </div>
                            )}
                          </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-end mt-2 sm:mt-0 pt-2.5 sm:pt-0 relative flex-wrap sm:flex-nowrap">
               <button 
                 onClick={handlePost}
                 disabled={isPending || (!content.trim() && selectedMedia.length === 0)}
                 className="relative group min-h-11 flex items-center justify-center gap-2 px-6 sm:px-8 py-2.5 rounded-[14px] bg-white text-black font-metadata font-black text-[11px] uppercase tracking-widest hover:bg-white/90 disabled:opacity-40 disabled:grayscale transition-all shadow-xl overflow-hidden min-w-[120px] sm:min-w-[130px]"
               >
                 {isPending ? <Loader2 size={16} className="animate-spin relative z-10" /> : <Send size={15} className="relative z-10" />}
                 <span className="relative z-10">Publish</span>
               </button>
            </div>
          </div>
        </div>
      </GlassPanel>
    </div>
  );
}
