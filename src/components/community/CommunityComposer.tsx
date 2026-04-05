'use client';

import { useState, useTransition, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, 
  Sparkles, 
  Film, 
  X, 
  Search, 
  MapPin, 
  Music, 
  Smile,
  PlusCircle,
  Hash,
  Loader2
} from 'lucide-react';
import GlassPanel from '@/components/ui/GlassPanel';
import { ClassificationName, CLASSIFICATION_STYLE_COLORS } from '@/lib/design-tokens';
import { cn, formatUsername } from '@/lib/utils';
import { createDispatchAction } from '@/lib/social-dispatch-actions';
import { toast } from 'sonner';
import CinematicAvatar from '../profile/CinematicAvatar';
import { MediaFetcher } from '@/lib/api/MediaFetcher';
import Image from 'next/image';

interface CommunityComposerProps {
  user: any;
  profile: any;
}

export default function CommunityComposer({ user, profile }: CommunityComposerProps) {
  const [content, setContent] = useState('');
  const [vibe, setVibe] = useState<ClassificationName | 'Atmospheric'>('Atmospheric');
  const [isPending, startTransition] = useTransition();
  const [isFocused, setIsFocused] = useState(false);
  const [showVibePicker, setShowVibePicker] = useState(false);
  const [showMediaSearch, setShowMediaSearch] = useState(false);
  
  // Media Attachment State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedMedia, setSelectedMedia] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [content]);

  // Media Search Logic
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.length > 2) {
        setIsSearching(true);
        try {
          const results = await MediaFetcher.searchMedia(searchQuery);
          setSearchResults(results.slice(0, 15));
        } catch (e) {
          console.error(e);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSearchResults([]);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handlePost = () => {
    if (!content.trim() && selectedMedia.length === 0) return;

    startTransition(async () => {
      const result = await createDispatchAction({
        content,
        classification: vibe !== 'Atmospheric' ? vibe : undefined,
        mediaRefs: selectedMedia.map(m => ({
          id: m.id,
          type: m.type,
          title: m.displayTitle,
          posterUrl: m.posterUrl
        }))
      });

      if (result.success) {
        toast.success('Post published');
        setContent('');
        setSelectedMedia([]);
        setVibe('Atmospheric');
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

  const vibes: (ClassificationName | 'Atmospheric')[] = [
    'Atmospheric', 'Noir', 'Visceral', 'Avant-Garde', 'Melancholic', 'Legacy', 'Provocative', 'Essential'
  ];

  const currentThemeColor = vibe === 'Atmospheric' ? '#ffffff' : CLASSIFICATION_STYLE_COLORS[vibe as ClassificationName];

  return (
    <div className="mb-12 group/composer">
      <GlassPanel 
        className={cn(
          "transition-all duration-700 relative rounded-3xl",
          isFocused 
            ? "p-5 md:p-8 bg-white/4 border-white/20 shadow-[0_8px_40px_rgba(0,0,0,0.5)] ring-1 ring-white/10" 
            : "p-4 md:p-5 bg-white/2 border-white/5 hover:border-white/10"
        )}
      >
        <div className="absolute inset-0 overflow-hidden rounded-3xl pointer-events-none">
          {/* The Spotlight: Dynamic Theme Glow */}
          <div 
            className={cn(
              "absolute inset-0 blur-[120px] transition-all duration-1000",
              isFocused ? "opacity-20 scale-110" : "opacity-5"
            )} 
            style={{ backgroundColor: currentThemeColor }}
          />

          {/* Film Grain Texture Overlay */}
          <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
        </div>

        <div className="flex items-start gap-4 md:gap-5 relative z-10 w-full">
          <div className="shrink-0 pt-1">
            <CinematicAvatar 
              src={profile?.avatar_url} 
              username={profile?.username} 
              size="md" 
              style={vibe as ClassificationName}
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
                className="w-full bg-transparent border-none focus:ring-0 text-white font-heading text-lg md:text-xl placeholder:text-white/20 resize-none min-h-[60px] max-h-[500px] transition-all relative z-10 leading-relaxed tracking-wide pt-1.5 overflow-x-hidden wrap-break-word whitespace-pre-wrap"
              />
              {!isFocused && !content && (
                <div className="absolute right-0 bottom-0 pointer-events-none text-white/10 flex items-center gap-2">
                   <span className="font-metadata text-[9px] uppercase tracking-[0.3em] font-bold">New Post</span>
                   <Sparkles size={24} />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Selected Media: Film Strip Strips */}
        <div className="relative z-10 w-full mt-2">
          <AnimatePresence>
            {selectedMedia.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="flex gap-3 overflow-x-auto pb-4 pt-2 justify-start items-center"
              >
                {selectedMedia.map((m, i) => (
                  <motion.div 
                    key={m.id}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: i * 0.05 }}
                    className="relative group/strip shrink-0"
                  >
                    <div className="w-[84px] md:w-[100px] aspect-2/3 rounded-xl overflow-hidden border border-white/10 shadow-xl relative bg-black/40">
                      {m.posterUrl && <Image src={m.posterUrl} alt="" fill className="object-cover group-hover/strip:scale-105 transition-transform duration-500" />}
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/strip:opacity-100 transition-opacity flex flex-col items-center justify-center backdrop-blur-sm gap-2">
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
                    className="w-[84px] md:w-[100px] aspect-2/3 rounded-xl border border-dashed border-white/20 flex flex-col items-center justify-center text-white/50 hover:text-white hover:border-white/50 hover:bg-white/5 transition-all gap-2 shadow-sm"
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
        <div className="relative z-20 w-full mt-2">
          <AnimatePresence>
            {isFocused && (
              <motion.div
                initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: 10, filter: "blur(4px)" }}
                transition={{ duration: 0.3 }}
                className="pt-4 mt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-5 relative before:content-[''] before:absolute before:top-0 before:left-0 before:right-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent"
              >
                <div className="flex flex-wrap items-center gap-3">
                  <div className="relative z-50">
                    <button 
                      onClick={() => {
                        setShowVibePicker(!showVibePicker);
                        setShowMediaSearch(false);
                      }}
                      className={cn(
                        "group flex items-center gap-2 px-4 py-2.5 rounded-[14px] transition-all font-metadata text-[10px] uppercase tracking-widest font-bold border shadow-md overflow-hidden relative",
                        vibe !== 'Atmospheric' 
                          ? "bg-white/10 text-white border-white/20" 
                          : "bg-white/5 border-white/10 text-white/70 hover:text-white hover:border-white/20"
                      )}
                      style={vibe !== 'Atmospheric' ? { color: currentThemeColor, borderColor: `${currentThemeColor}40`, backgroundColor: `${currentThemeColor}10` } : {}}
                    >
                      <div className={cn("absolute inset-0 opacity-0 group-hover:opacity-100 transition-duration-500 bg-linear-to-r", vibe === 'Atmospheric' ? "from-white/0 via-white/5 to-white/0" : "from-black/0 via-current opacity-10 to-black/0")} />
                      <Hash size={15} className={cn("transition-colors relative z-10", vibe === 'Atmospheric' && "text-vibe-primary group-hover:text-vibe-cyan group-hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]")} />
                      <span className="relative z-10">{vibe}</span>
                    </button>
                    
                    {/* Vibe Picker Dropdown */}
                    <AnimatePresence>
                      {showVibePicker && (
                        <motion.div 
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.95 }}
                          className="absolute bottom-full left-0 mb-3 w-[280px] md:w-[400px] bg-black/95 backdrop-blur-3xl border border-white/10 rounded-2xl p-4 z-100 shadow-2xl shadow-black/80"
                        >
                          {vibes.map(v => (
                            <button
                              key={v}
                              onClick={() => {
                                setVibe(v);
                                setShowVibePicker(false);
                              }}
                              className={cn(
                                "px-3 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all text-left",
                                vibe === v ? "bg-white text-black shadow-md" : "text-white/50 hover:bg-white/10 hover:text-white"
                              )}
                            >
                              {v}
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <div className="relative z-40">
                    <button 
                      onClick={() => {
                        setShowMediaSearch(!showMediaSearch);
                        setShowVibePicker(false);
                      }}
                      className={cn(
                        "group flex items-center gap-2.5 px-4 py-2.5 rounded-[14px] transition-all font-metadata text-[10px] uppercase tracking-widest font-bold border shadow-md overflow-hidden relative",
                        selectedMedia.length > 0 
                          ? "bg-accent/10 text-accent border-accent/40 shadow-[0_0_15px_rgba(255,107,107,0.15)]" 
                          : "bg-white/5 border-white/10 text-white/70 hover:text-white hover:border-white/20"
                      )}
                    >
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-linear-to-r from-accent/0 via-vibe-teal/10 to-accent/0" />
                      <Film size={15} className={cn("transition-all duration-300 relative z-10", selectedMedia.length === 0 && "text-vibe-teal group-hover:text-vibe-primary group-hover:drop-shadow-[0_0_8px_rgba(15,255,150,0.5)]")} />
                      <span className="relative z-10">Attach Film</span>
                    </button>

                    {/* Media Search Modal */}
                    <AnimatePresence>
                      {showMediaSearch && (
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          className="absolute bottom-full left-0 mb-3 bg-black/95 backdrop-blur-3xl border border-white/10 rounded-3xl w-[280px] md:w-[340px] shadow-[0_15px_50px_rgba(0,0,0,0.7)] z-50 overflow-hidden"
                        >
                          <div className="p-3 border-b border-white/10 bg-white/5 flex items-center gap-3 relative overflow-hidden">
                            <div className="absolute inset-0 bg-linear-to-r from-accent/5 to-vibe-teal/5" />
                            <Search size={16} className="text-white/40 relative z-10" />
                            <input 
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              placeholder="Search Directory..."
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
                                 <span className="text-[10px] text-white/30 uppercase tracking-[0.2em] font-black">Search Library</span>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto justify-end mt-4 sm:mt-0 pt-4 sm:pt-0 relative">
                   <button 
                     onClick={() => setIsFocused(false)}
                     className="px-5 py-2.5 rounded-xl text-white/50 hover:text-white hover:bg-white/5 transition-all font-metadata tracking-widest uppercase font-bold text-[10px]"
                   >
                     Cancel
                   </button>
                   <button 
                     onClick={handlePost}
                     disabled={isPending || (!content.trim() && selectedMedia.length === 0)}
                     className="relative group flex items-center justify-center gap-2 px-8 py-3 rounded-[14px] bg-linear-to-r from-accent to-vibe-primary text-black font-metadata font-black text-[11px] uppercase tracking-widest hover:brightness-110 disabled:opacity-40 disabled:grayscale transition-all shadow-xl shadow-accent/20 overflow-hidden min-w-[130px]"
                   >
                     <div className="absolute inset-0 bg-white/20 -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none" />
                     {isPending ? <Loader2 size={16} className="animate-spin relative z-10" /> : <Send size={15} className="relative z-10" />}
                     <span className="relative z-10">Publish</span>
                   </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </GlassPanel>
    </div>
  );
}
