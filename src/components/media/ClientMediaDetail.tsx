'use client';

import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { DetailedMedia } from '@/lib/api/mapping';
import { archiveMediaAction, removeMediaEntryAction } from '@/lib/actions';
import ReviewSection from './ReviewSection';
import MusicSection from './MusicSection';
import DeepDiveSection from './DeepDiveSection';
import { getSeasonEpisodesAction } from '@/lib/actions';
import { useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import Image from 'next/image'; // Keep Image for recommendations if not handled by sub-components
import { Loader2, Play } from 'lucide-react'; // Keep Loader2 and Play for episode section

// New Sub-components
import MediaHero from './MediaHero';
import MediaInfo from './MediaInfo';
import CastCrewSection from './CastCrewSection';
import ReviewForm, { ReviewFormHandle } from './ReviewForm';
import SaveMediaDialog from '../vault/SaveMediaDialog';
import CommunityRating from './CommunityRating';
import FriendActivity from './FriendActivity';
import LogJournalDialog from './LogJournalDialog';

interface ClientMediaDetailProps {
  media: DetailedMedia;
  initialUserEntry?: any;
  deepData?: {
    trivia: any[];
    specs: any;
    scripts: any[];
  };
  user?: any;
}

export default function ClientMediaDetail({ media, initialUserEntry, deepData, user }: ClientMediaDetailProps) {
  const router = useRouter();
  const reviewFormRef = useRef<ReviewFormHandle>(null);
  
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [isJournalOpen, setIsJournalOpen] = useState(false);
  
  // Episode Selection State
  const [selectedSeason, setSelectedSeason] = useState<number>(media.seasons?.[0]?.seasonNumber || 1);
  const [episodes, setEpisodes] = useState<any[]>([]);
  const [isLoadingEpisodes, setIsLoadingEpisodes] = useState(false);

  useEffect(() => {
    if (media.type === 'tv' && selectedSeason && media.source === 'tmdb') {
      setIsLoadingEpisodes(true);
      getSeasonEpisodesAction(Number(media.sourceId), selectedSeason)
        .then(data => {
          setEpisodes(data.episodes || []);
        })
        .catch(console.error)
        .finally(() => setIsLoadingEpisodes(false));
    }
  }, [media.sourceId, media.type, selectedSeason, media.source]);

  async function handleSave(data: { rating: number, comment: string, classification: any }) {
    setIsSaving(true);
    setSaveStatus('idle');
    
    try {
      const result = await archiveMediaAction({
        mediaId: media.id,
        mediaType: media.type,
        title: media.displayTitle,
        posterUrl: media.posterUrl,
        classification: data.classification,
        comment: data.comment || undefined,
        rating: data.rating || undefined,
      });

      if (result && 'error' in result) {
        setSaveStatus('error');
        toast.error((result as { error: string }).error);
        return;
      }

      setSaveStatus('success');
      toast.success("Film registered in your library.");
      window.dispatchEvent(new CustomEvent('refresh-notifications'));
      setTimeout(() => setSaveStatus('idle'), 3000);
      router.refresh(); // Refresh to update initialUserEntry if needed
    } catch (error) {
      console.error(error);
      setSaveStatus('error');
      toast.error("Collection failed.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleRemove() {
    if (!window.confirm("Are you sure you want to remove this from your library?")) return;
    
    setIsSaving(true);
    try {
      const result = await removeMediaEntryAction(media.id, media.type);
      if (result && 'error' in result) {
        toast.error(result.error);
        return;
      }
      toast.success("Removed from library.");
      window.dispatchEvent(new CustomEvent('refresh-notifications'));
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error("Cleanup failed.");
    } finally {
      setIsSaving(false);
    }
  }

  const handleEditEntry = () => {
    reviewFormRef.current?.focus();
  };

  return (
    <div className="pb-20">
      <MediaHero 
        media={media} 
        isSaving={isSaving} 
        saveStatus={saveStatus} 
        isAlreadySaved={!!initialUserEntry}
        onSave={() => reviewFormRef.current?.focus()} 
        onOpenSaveDialog={() => setIsSaveDialogOpen(true)}
        onOpenJournal={() => setIsJournalOpen(true)}
        user={user}
      />

      {/* Details Grid */}
      <section className="px-4 md:px-16 mt-8 md:mt-12 grid grid-cols-1 lg:grid-cols-12 gap-10 md:gap-12">
        {/* Left Col: Info & Vibe */}
        <div className="lg:col-span-8 space-y-12">
          <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-white/5">
              <CommunityRating mediaId={media.id} mediaType={media.type} />
              <FriendActivity mediaId={media.id} mediaType={media.type} />
            </div>
            <MediaInfo media={media} />
          </div>

            {/* Episode Explorer for TV / Anime */}
            {(media.type === 'tv' || media.type === 'anime') && (
              <div className="pt-12 border-t border-white/5 space-y-8">
                 <div className="flex items-end justify-between">
                    <div className="flex flex-col gap-1">
                        <h2 className="font-heading text-2xl tracking-tighter uppercase italic text-white/50">
                          Episode Details
                        </h2>
                        <p className="font-metadata text-xs text-muted/60">Season by season breakdown</p>
                    </div>
                    
                    {/* Season Selector */}
                    {media.seasons && media.seasons.length > 0 && (
                      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none max-w-[50%]">
                         {media.seasons.filter(s => s.seasonNumber > 0).map((s) => (
                           <button
                             key={s.id}
                             onClick={() => setSelectedSeason(s.seasonNumber)}
                             className={cn(
                               "px-4 py-2 rounded-inner font-metadata text-xs whitespace-nowrap transition-all border",
                               selectedSeason === s.seasonNumber 
                                ? "bg-accent border-accent text-black font-bold" 
                                : "bg-white/5 border-white/10 text-white/50 hover:border-white/30"
                             )}
                           >
                             Season {s.seasonNumber}
                           </button>
                         ))}
                      </div>
                    )}
                 </div>

                 {isLoadingEpisodes ? (
                   <div className="h-64 flex items-center justify-center border border-dashed border-white/10 rounded-card bg-white/2">
                      <div className="flex flex-col items-center gap-4">
                         <Loader2 className="animate-spin text-accent" size={32} />
                         <span className="font-data text-[10px] uppercase tracking-widest text-muted">Loading episodes...</span>
                      </div>
                   </div>
                 ) : episodes.length > 0 ? (
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {episodes.map((ep) => (
                        <div key={ep.id} className="p-4 border-white/5 bg-white/3 group hover:bg-white/5 transition-all flex gap-4 overflow-hidden rounded-card">
                           <div className="w-40 aspect-video rounded-inner overflow-hidden relative shrink-0 border border-white/5">
                              {ep.still_path ? (
                                <Image
                                  src={`https://image.tmdb.org/t/p/w300${ep.still_path}`}
                                  alt={ep.name}
                                  fill
                                  className="object-cover group-hover:scale-110 transition-transform duration-700"
                                />
                              ) : (
                                <div className="w-full h-full bg-white/5 flex items-center justify-center text-white/10">
                                   <Play size={16} />
                                </div>
                              )}
                              <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent" />
                              <span className="absolute bottom-2 left-2 font-mono text-[9px] text-white/80 bg-black/60 px-1.5 py-0.5 rounded">
                                 EP {ep.episode_number}
                              </span>
                           </div>
                           <div className="flex flex-col justify-center min-w-0">
                              <h4 className="font-heading text-sm text-white group-hover:text-accent transition-colors truncate">{ep.name}</h4>
                              <p className="font-metadata text-[10px] text-muted/70 line-clamp-2 mt-1 leading-relaxed italic">
                                 {ep.overview || "No information available for this episode."}
                              </p>
                              <div className="flex items-center gap-2 mt-2 opacity-40">
                                 {/* <Calendar size={10} /> */}
                                 <span className="font-mono text-[9px] uppercase">{ep.air_date}</span>
                                 {ep.runtime && (
                                   <>
                                     <span className="w-0.5 h-0.5 rounded-full bg-white/40" />
                                     <span className="font-mono text-[9px] whitespace-nowrap">{ep.runtime} MIN</span>
                                   </>
                                 )}
                              </div>
                           </div>
                        </div>
                      ))}
                   </div>
                 ) : (
                   <div className="h-40 flex items-center justify-center border border-dashed border-white/10 rounded-card bg-white/2">
                      <p className="font-metadata text-xs text-muted">No episode data available.</p>
                   </div>
                 )}
                 
                 {/* Streaming Episodes (AniList Specific) */}
                 {media.source === 'anilist' && media.streamingEpisodes && media.streamingEpisodes.length > 0 && (
                   <div className="space-y-4 pt-4">
                      <span className="font-data text-[10px] uppercase tracking-widest text-accent/60 flex items-center gap-2">
                        <Play size={12} /> Where to Watch
                      </span>
                      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                         {media.streamingEpisodes.map((se, i) => (
                           <a 
                             key={i} 
                             href={se.url} 
                             target="_blank" 
                             rel="noopener noreferrer"
                             className="group relative aspect-video rounded-inner overflow-hidden border border-white/10 hover:border-accent/40 transition-all bg-white/5"
                           >
                              {se.thumbnail ? (
                                <Image src={se.thumbnail} alt={se.title} fill className="object-cover group-hover:scale-110 transition-transform duration-500" />
                              ) : (
                                <div className="w-full h-full bg-vibe-teal/10 flex items-center justify-center">
                                   <span className="font-metadata text-[8px] text-accent">{se.site}</span>
                                </div>
                              )}
                              <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/90 to-transparent p-2">
                                 <p className="font-metadata text-[9px] text-white line-clamp-1 group-hover:text-accent">{se.title}</p>
                              </div>
                           </a>
                         ))}
                      </div>
                   </div>
                 )}
              </div>
            )}

           <CastCrewSection media={media} />

           {/* Music & Scene Scoring Section */}
           <div className="pt-12 border-t border-white/5">
             <MusicSection soundtrack={media.soundtrack} composers={media.composers} />
           </div>

           <div className="space-y-6 pt-12 border-t border-white/5">
              <div className="flex items-center justify-between">
                 <h2 className="font-heading text-xl md:text-2xl tracking-tight">Your Review</h2>
                 {initialUserEntry && (
                   <button 
                    onClick={handleEditEntry}
                    className="font-data text-[9px] md:text-[10px] text-white/40 uppercase tracking-widest cursor-pointer hover:underline hover:text-accent transition-colors"
                   >
                    Edit Entry
                   </button>
                 )}
              </div>
              <div className="p-5 md:p-8 border border-dashed border-white/10 bg-white/5 rounded-card">
                 <div className="prose prose-invert max-w-none font-sans opacity-70">
                    <h4 className="font-heading text-white">Your Impression</h4>
                    {initialUserEntry?.notes ? (
                      <div className="space-y-4">
                        {initialUserEntry.rating && (
                          <div className="flex items-center gap-2 px-3 py-1 bg-accent/20 rounded-full border border-accent/40 w-fit">
                            <span className="font-display text-sm text-accent">{initialUserEntry.rating}/10</span>
                          </div>
                        )}
                        <p className="whitespace-pre-wrap">{initialUserEntry.notes}</p>
                      </div>
                    ) : (
                      <p>You haven't shared your thoughts on this yet. Add a rating and review on the right.</p>
                    )}
                 </div>
              </div>
           </div>

            <div className="pt-12 border-t border-white/5">
              <ReviewSection mediaId={media.id} mediaType={media.type} />
            </div>

            {/* Franchise / Collection Section */}
            {media.collection && (
              <div className="pt-12 border-t border-white/5 space-y-8">
                  <div className="flex flex-col gap-1">
                    <h2 className="font-heading text-2xl tracking-tighter uppercase italic text-white/50">
                      More in this Series
                    </h2>
                    <p className="font-metadata text-xs text-muted/60">{media.collection.name}</p>
                 </div>
                 
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {media.collection.parts.map((part) => (
                      <motion.div
                        key={part.id}
                        whileHover={{ y: -5 }}
                        onClick={() => router.push(`/media/movie/${part.id}`)}
                        className={cn(
                          "group cursor-pointer space-y-3 relative",
                          part.id === String(media.sourceId) && "opacity-40 grayscale pointer-events-none"
                        )}
                      >
                         <div className="aspect-3/4 rounded-card overflow-hidden relative border border-white/10 group-hover:border-accent/40 transition-all bg-surface">
                            {part.posterUrl ? (
                              <Image 
                                src={part.posterUrl}
                                alt={part.title}
                                fill
                                className="object-cover group-hover:scale-105 transition-transform"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center opacity-20">
                                <Play size={24} />
                              </div>
                            )}
                            {part.id === String(media.sourceId) && (
                               <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                                  <span className="font-metadata text-[10px] uppercase tracking-widest bg-white/10 px-2 py-1 rounded backdrop-blur-md">Currently Viewing</span>
                               </div>
                            )}
                         </div>
                         <div className="px-1">
                            <h4 className="font-heading text-sm text-white group-hover:text-accent truncate">{part.title}</h4>
                            <span className="font-metadata text-[10px] text-muted">{part.releaseDate?.split('-')[0]}</span>
                         </div>
                      </motion.div>
                    ))}
                 </div>
              </div>
            )}

           {/* Deep Dive Explorer */}
           {deepData && (
             <DeepDiveSection 
               tmdbId={media.id} 
               type={media.type}
               title={media.displayTitle} 
               posterUrl={media.posterUrl}
               data={deepData} 
             />
           )}
        </div>

        <div className="lg:col-span-4 space-y-8">
           <ReviewForm 
             ref={reviewFormRef}
             initialRating={initialUserEntry?.rating}
             initialNotes={initialUserEntry?.notes}
             initialClassification={initialUserEntry?.classification}
             mediaId={media.id}
             mediaType={media.type}
             mediaTitle={media.displayTitle}
             posterUrl={media.posterUrl}
             onSave={handleSave}
             onRemove={handleRemove}
             isSaving={isSaving}
             saveStatus={saveStatus}
             isAlreadySaved={!!initialUserEntry}
           />
        </div>
      </section>
      
      {/* Recommendations Section */}
      {media.recommendations && media.recommendations.length > 0 && (
        <section className="px-4 md:px-16 mt-24 space-y-8">
          <div className="flex items-center gap-3">
             <div className="h-px flex-1 bg-white/5" />
             <h2 className="font-heading text-2xl tracking-tighter uppercase italic text-white/50 px-4">
               Recommended {media.type === 'movie' ? 'Movies' : 'Series'}
             </h2>
             <div className="h-px flex-1 bg-white/5" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {media.recommendations.map((rec) => (
              <motion.div
                key={rec.id}
                whileHover={{ y: -5 }}
                onClick={() => router.push(`/media/${rec.type}/${rec.id}`)}
                className="group cursor-pointer space-y-2"
              >
                <div className="aspect-3/4 rounded-card overflow-hidden relative border border-white/5 group-hover:border-accent/40 transition-all bg-white/5">
                  {rec.posterUrl ? (
                    <img
                      src={rec.posterUrl}
                      alt={rec.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full bg-white/5" />
                  )}
                  <div className="absolute inset-0 bg-linear-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-3 flex flex-col justify-end">
                     <span className="font-data text-[8px] uppercase tracking-widest text-accent">{rec.type}</span>
                  </div>
                </div>
                <span className="font-heading text-[10px] block truncate text-white/60 group-hover:text-white transition-colors px-1">
                  {rec.title}
                </span>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      <SaveMediaDialog 
        isOpen={isSaveDialogOpen} 
        onClose={() => setIsSaveDialogOpen(false)} 
        media={media} 
      />

      <LogJournalDialog 
        isOpen={isJournalOpen}
        onClose={() => setIsJournalOpen(false)}
        media={{
          id: media.id,
          type: media.type,
          title: media.displayTitle,
          posterUrl: media.posterUrl
        }}
      />
    </div>
  );
}
