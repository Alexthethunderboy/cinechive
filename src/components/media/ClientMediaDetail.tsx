'use client';

import { useCallback, useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { DetailedMedia } from '@/lib/api/mapping';
import { archiveMediaAction, removeMediaEntryAction } from '@/lib/media-actions';
import ReviewSection from './ReviewSection';
import MusicSection from './MusicSection';
import DeepDiveSection from './DeepDiveSection';
import { getSeasonEpisodesAction } from '@/lib/search-actions';
import { cn } from '@/lib/utils';
import { useRouter, useSearchParams } from 'next/navigation';
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
import MediaPreferenceButtons from './MediaPreferenceButtons';
import { toCanonicalMediaId } from '@/lib/media-identity';
import { emitRefreshNotifications } from '@/lib/client-events';
import { useAuth } from '@/components/providers/AuthProvider';
import { getMediaEntryForUser } from '@/lib/profile-data-actions';
import Link from 'next/link';
import { getMediaEnrichmentAction } from '@/lib/media-enrichment-actions';
import type { TriviaItem, TechnicalSpecs } from '@/lib/services/DeepDataService';
import type { ScriptInfo } from '@/lib/services/ScriptService';
import type { ClassificationName } from '@/lib/design-tokens';
import {
  archiveLocalMedia,
  getLocalMediaEntry,
  removeLocalMediaEntry,
  useLocalArchive,
} from '@/lib/local-archive';

type UserMediaEntry = Awaited<ReturnType<typeof getMediaEntryForUser>>;

interface DisplayUserEntry {
  rating?: number | null;
  notes?: string | null;
  classification?: ClassificationName;
}

interface MediaEpisode {
  id: number;
  name: string;
  overview?: string;
  still_path?: string | null;
  episode_number?: number;
  air_date?: string | null;
  runtime?: number | null;
}

interface ClientMediaDetailProps {
  media: DetailedMedia;
  initialUserEntry?: UserMediaEntry;
  deepData?: {
    trivia: TriviaItem[];
    specs: TechnicalSpecs;
    scripts: ScriptInfo[];
  };
}

export default function ClientMediaDetail({ media: initialMedia, initialUserEntry, deepData: initialDeepData }: ClientMediaDetailProps) {
  const { user, serviceStatus, isLocalMode } = useAuth();
  const localArchive = useLocalArchive();
  const router = useRouter();
  const searchParams = useSearchParams();
  const reviewFormRef = useRef<ReviewFormHandle>(null);
  
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [isJournalOpen, setIsJournalOpen] = useState(false);
  const [userEntry, setUserEntry] = useState<DisplayUserEntry | null>((initialUserEntry as DisplayUserEntry | null | undefined) ?? null);
  const [media, setMedia] = useState(initialMedia);
  const [deepData, setDeepData] = useState(initialDeepData);
  const canUseAccountFeatures = !!user && (isLocalMode || serviceStatus === 'available');
  
  // Episode Selection State
  const [selectedSeason, setSelectedSeason] = useState<number>(media.seasons?.[0]?.seasonNumber || 1);
  const [episodes, setEpisodes] = useState<MediaEpisode[]>([]);
  const [isLoadingEpisodes, setIsLoadingEpisodes] = useState(false);
  const canShowEpisodeExplorer = media.type === 'tv' || (media.source === 'anilist' && !!media.streamingEpisodes?.length);

  useEffect(() => {
    if (initialMedia.source !== 'tmdb') return;

    let cancelled = false;
    void getMediaEnrichmentAction(initialMedia).then((enrichment) => {
      if (cancelled) return;
      setMedia(enrichment.media);
      setDeepData((current) => ({
        trivia: enrichment.trivia,
        scripts: enrichment.scripts,
        specs: current?.specs || {},
      }));
    }).catch(() => {
      // Core details are already visible; enrichment is intentionally optional.
    });

    return () => {
      cancelled = true;
    };
  }, [initialMedia]);

  const refreshUserEntry = useCallback(async () => {
    if (!canUseAccountFeatures) {
      setUserEntry(null);
      return;
    }

    try {
      if (isLocalMode) {
        const entry = getLocalMediaEntry(toCanonicalMediaId(media), media.type, localArchive);
        setUserEntry(entry ? { ...entry, notes: entry.comment } : null);
        return;
      }
      const entry = await getMediaEntryForUser(toCanonicalMediaId(media), media.type);
      setUserEntry(entry as DisplayUserEntry | null);
    } catch {
      setUserEntry(null);
    }
  }, [canUseAccountFeatures, isLocalMode, localArchive, media]);

  useEffect(() => {
    void refreshUserEntry();
  }, [refreshUserEntry]);

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

  useEffect(() => {
    const action = searchParams.get('action');
    if (action === 'save') {
      setIsSaveDialogOpen(true);
    }
    if (action === 'journal') {
      setIsJournalOpen(true);
    }
  }, [searchParams]);

  async function handleSave(data: { rating: number, comment: string, classification: ClassificationName }) {
    setIsSaving(true);
    setSaveStatus('idle');
    
    try {
      if (isLocalMode) {
        const entry = archiveLocalMedia({
          mediaId: toCanonicalMediaId(media),
          mediaType: media.type,
          title: media.displayTitle,
          posterUrl: media.posterUrl,
          releaseYear: media.releaseYear,
          classification: data.classification,
          comment: data.comment || undefined,
          rating: data.rating || undefined,
          isVault: true,
        });
        setUserEntry({ ...entry, notes: entry.comment });
        setSaveStatus('success');
        toast.success('Saved privately in this browser.');
        setTimeout(() => setSaveStatus('idle'), 3000);
        return;
      }
      const result = await archiveMediaAction({
        mediaId: toCanonicalMediaId(media),
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
      emitRefreshNotifications();
      await refreshUserEntry();
      setTimeout(() => setSaveStatus('idle'), 3000);
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
      if (isLocalMode) {
        removeLocalMediaEntry(toCanonicalMediaId(media), media.type);
        toast.success('Removed from local library.');
        setUserEntry(null);
        return;
      }
      const result = await removeMediaEntryAction(toCanonicalMediaId(media), media.type);
      if (result && 'error' in result) {
        toast.error(result.error);
        return;
      }
      toast.success("Removed from library.");
      emitRefreshNotifications();
      setUserEntry(null);
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
        mediaId={toCanonicalMediaId(media)}
        isSaving={isSaving} 
        saveStatus={saveStatus} 
        isAlreadySaved={!!userEntry}
        onSave={() => reviewFormRef.current?.focus()} 
        onOpenSaveDialog={() => setIsSaveDialogOpen(true)}
        onOpenJournal={() => setIsJournalOpen(true)}
        user={user}
        accountFeaturesAvailable={canUseAccountFeatures}
      />

      {isLocalMode ? (
        <div role="status" className="mx-3 mt-4 rounded-xl border border-emerald-300/20 bg-emerald-300/8 px-4 py-3 text-xs text-emerald-100/80 sm:mx-4 md:mx-16">
          Local archive active. Saves, ratings, reviews, journal logs, likes, collections and reminders stay private in this browser. Community data and device sync are paused.
        </div>
      ) : serviceStatus === 'unavailable' && (
        <div role="status" className="mx-3 mt-4 rounded-xl border border-amber-300/20 bg-amber-300/8 px-4 py-3 text-xs text-amber-100/80 sm:mx-4 md:mx-16">
          Account and community services are unavailable. Core film details, cast, trailers and recommendations remain available.
        </div>
      )}

      {/* Details Grid */}
      <section className="px-3 sm:px-4 md:px-16 mt-8 md:mt-12 grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12">
        {/* Left Col: Info & Vibe */}
        <div className="lg:col-span-8 space-y-12">
          <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-white/5">
              {!isLocalMode && serviceStatus === 'available' && (
                <CommunityRating mediaId={toCanonicalMediaId(media)} mediaType={media.type} />
              )}
              {!isLocalMode && canUseAccountFeatures && (
                <FriendActivity mediaId={toCanonicalMediaId(media)} mediaType={media.type} />
              )}
            </div>
            <MediaInfo media={media} />
          </div>

          <CastCrewSection media={media} />

          {/* Franchise / Collection Section */}
          {media.collection && media.collection.parts.length > 0 && (
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
                      
                      <div className="absolute top-2 right-2 z-20">
                        <MediaPreferenceButtons
                          mediaId={part.id}
                          mediaType="movie"
                          title={part.title}
                          posterUrl={part.posterUrl}
                          compact
                        />
                      </div>
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

          {/* Episode Explorer for TV / Anime */}
          {canShowEpisodeExplorer && (
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
                  <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none w-full sm:max-w-[60%] md:max-w-[50%] justify-start sm:justify-end">
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
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

          {!isLocalMode && serviceStatus === 'available' && (
            <div className="pt-12 border-t border-white/5">
              <ReviewSection mediaId={toCanonicalMediaId(media)} mediaType={media.type} />
            </div>
          )}

          <div id="media-actions" className="space-y-6 pt-12 border-t border-white/5">
              <div className="flex items-center justify-between">
                 <h2 className="font-heading text-xl md:text-2xl tracking-tight">Your Review</h2>
                 {userEntry && (
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
                    {userEntry?.notes ? (
                      <div className="space-y-4">
                        {userEntry.rating && (
                          <div className="flex items-center gap-2 px-3 py-1 bg-accent/20 rounded-full border border-accent/40 w-fit">
                            <span className="font-display text-sm text-accent">{userEntry.rating}/10</span>
                          </div>
                        )}
                        <p className="whitespace-pre-wrap">{userEntry.notes}</p>
                      </div>
                    ) : (
                      <p>{canUseAccountFeatures ? "You haven't shared your thoughts on this yet. Add a rating and review on the right." : 'Sign in to save, rate and review this title.'}</p>
                    )}
                 </div>
              </div>
          </div>

          {/* Music & Scene Scoring Section */}
          <div className="pt-12 border-t border-white/5">
            <MusicSection soundtrack={media.soundtrack} composers={media.composers} />
          </div>

           {/* Deep Dive Explorer */}
           {deepData && (
             <DeepDiveSection 
               tmdbId={toCanonicalMediaId(media)} 
               type={media.type}
               title={media.displayTitle} 
               posterUrl={media.posterUrl}
               data={deepData} 
             />
           )}
        </div>

        <div className="lg:col-span-4 space-y-8">
          {canUseAccountFeatures ? (
           <ReviewForm
             ref={reviewFormRef}
             initialRating={userEntry?.rating ?? undefined}
             initialNotes={userEntry?.notes ?? undefined}
             initialClassification={userEntry?.classification}
             onSave={handleSave}
             onRemove={handleRemove}
             isSaving={isSaving}
             saveStatus={saveStatus}
             isAlreadySaved={!!userEntry}
             localMode={isLocalMode}
           />
          ) : (
            <div className="sticky top-24 rounded-2xl border border-white/10 bg-white/4 p-6 text-sm text-white/60">
              <h3 className="mb-2 font-heading text-lg text-white">Your library</h3>
              <p className="mb-4">{serviceStatus === 'unavailable' ? 'Account services are temporarily offline.' : 'Sign in to save this title and write a review.'}</p>
              {serviceStatus !== 'unavailable' && (
                <Link href="/login" className="inline-flex rounded-xl bg-white px-4 py-2 font-bold text-black">Sign in</Link>
              )}
            </div>
          )}
        </div>
      </section>
      
      {/* Recommendations Section */}
      {media.recommendations && media.recommendations.length > 0 && (
        <section className="px-3 sm:px-4 md:px-16 mt-16 sm:mt-24 space-y-8">
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
                    <Image
                      src={rec.posterUrl}
                      alt={rec.title}
                      fill
                      sizes="(max-width: 767px) 92vw, 40vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full bg-white/5" />
                  )}
                  <div className="absolute inset-0 bg-linear-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-3 flex flex-col justify-end">
                     <span className="font-data text-[8px] uppercase tracking-widest text-accent">{rec.type}</span>
                  </div>
                  
                  <div className="absolute top-2 right-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
                    <MediaPreferenceButtons
                        mediaId={rec.id}
                        mediaType={rec.type}
                        title={rec.title}
                        posterUrl={rec.posterUrl}
                        compact
                    />
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

      {canUseAccountFeatures && <SaveMediaDialog
        isOpen={isSaveDialogOpen} 
        onClose={() => setIsSaveDialogOpen(false)} 
        media={media} 
      />}

      {canUseAccountFeatures && <LogJournalDialog
        isOpen={isJournalOpen}
        onClose={() => setIsJournalOpen(false)}
        media={{
          id: toCanonicalMediaId(media),
          type: media.type,
          title: media.displayTitle,
          posterUrl: media.posterUrl
        }}
      />}
    </div>
  );
}
