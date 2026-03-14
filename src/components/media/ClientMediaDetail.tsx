'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ClassificationName, CLASSIFICATION_COLORS, SPRING_CONFIG } from '@/lib/design-tokens';
import { ChevronLeft, Calendar, Clock, Star, Play, Share2, Plus, Bookmark, Flame, Users, Info, Loader2, DollarSign, Check } from 'lucide-react';
import ClassificationMeter from '@/components/ui/ClassificationMeter';
import Image from 'next/image';
import GlassPanel from '@/components/ui/GlassPanel';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { DetailedMedia } from '@/lib/api/mapping';
import { archiveMediaAction } from '@/lib/actions';
import ReviewSection from './ReviewSection';
import MusicSection from './MusicSection';
import DeepDiveSection from './DeepDiveSection';
import { getSeasonEpisodesAction } from '@/lib/actions';
import { useEffect } from 'react';
import { SearchService } from '@/lib/services/SearchService';

import { toast } from 'sonner';

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
  const [selectedClassification, setSelectedClassification] = useState<ClassificationName | undefined>(initialUserEntry?.classification);
  const [comment, setComment] = useState(initialUserEntry?.notes || '');
  const [rating, setRating] = useState<number>(initialUserEntry?.rating || 0);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  
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

  const currentClassification = selectedClassification || media.classification;
  const classificationColor = CLASSIFICATION_COLORS[currentClassification];

  async function handleSave() {
    setIsSaving(true);
    setSaveStatus('idle');
    
    // Optimistic UI Update
    const previousStatus = saveStatus;
    setSaveStatus('success'); 
    
    try {
      const result = await archiveMediaAction({
        mediaId: media.id,
        mediaType: media.type,
        title: media.displayTitle,
        posterUrl: media.posterUrl,
        classification: currentClassification,
        comment: comment || undefined,
        rating: rating || undefined,
      });

      if (result && 'error' in result) {
        setSaveStatus('error');
        toast.error((result as { error: string }).error);
        return;
      }

      toast.success("Film registered in your library.");
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      console.error(error);
      setSaveStatus('error');
      toast.error("Collection failed.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="pb-20">
      {/* Hero Header with Shared Layout Transition */}
      <section className="relative h-[60vh] md:h-[70vh] w-full overflow-hidden">
        <div 
          className="absolute inset-0 z-0"
        >
          {media.backdropUrl ? (
            <Image
              src={media.backdropUrl}
              alt={media.displayTitle}
              fill
              className="object-cover"
              priority
            />
          ) : (
            <div className="w-full h-full bg-surface" />
          )}
          {/* Layered mask for depth */}
          <div className="absolute inset-0 bg-linear-to-t from-background via-background/60 to-transparent" />
          <div className="absolute inset-0 bg-linear-to-r from-background via-transparent to-transparent opacity-80" />
        </div>

        {/* Back Button */}
        <nav className="absolute top-8 left-4 md:left-8 z-20">
          <motion.button
            whileHover={{ x: -5 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.back()}
            className="glass p-2.5 rounded-full hover:border-accent/30 transition-colors text-white/40 hover:text-accent"
          >
            <ChevronLeft size={20} />
          </motion.button>
        </nav>

        {/* Hero Content */}
        <div className="absolute bottom-0 left-0 right-0 z-10 p-4 md:p-10">
           <motion.div
             initial={{ opacity: 0, y: 30 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ delay: 0.4, duration: 0.8 }}
             className="max-w-4xl"
           >
              <div className="flex items-center gap-3 mb-4">
                 <span className="font-metadata bg-white/10 text-white px-3 py-1 rounded-inner">
                    {media.type}
                 </span>
                 <div className="flex items-center gap-2 text-muted font-metadata">
                    <Calendar size={12} />
                     <span>{media.releaseYear}</span>
                    {media.duration && (
                      <>
                        <span className="mx-1">•</span>
                        <Clock size={12} />
                        <span>{media.duration}</span>
                      </>
                    )}
                    {media.episodes && (
                      <>
                        <span className="mx-1">•</span>
                        <span>{media.episodes} Episodes</span>
                      </>
                    )}
                    {media.format && (
                      <>
                        <span className="mx-1">•</span>
                        <span className="uppercase text-[10px] tracking-widest bg-white/5 px-2 py-0.5 rounded-xs">{media.format}</span>
                      </>
                    )}
                 </div>
              </div>

              <h1 className="font-heading text-5xl md:text-8xl tracking-tighter leading-[0.8] mb-4 italic">
                {media.displayTitle.toUpperCase()}
              </h1>

              <div className="flex flex-wrap gap-4 items-center">
                 {media.trailerUrl ? (
                   <a href={media.trailerUrl} target="_blank" rel="noopener noreferrer">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="px-6 py-3 rounded-card bg-white text-black font-heading text-base italic uppercase flex items-center gap-2.5 hover:bg-white/90 transition-colors shadow-2xl"
                    >
                      <Play size={18} fill="currentColor" />
                      WATCH TRAILER
                    </motion.button>
                   </a>
                 ) : (
                    <motion.button
                      disabled
                      className="px-8 py-4 rounded-card bg-white/10 text-white/50 font-heading flex items-center gap-3 cursor-not-allowed"
                    >
                      No Trailer Found
                    </motion.button>
                 )}
                  <div className="flex gap-3">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={handleSave}
                      disabled={isSaving || saveStatus === 'success'}
                      className={cn(
                        "p-3 rounded-xl backdrop-blur-md transition-all flex items-center justify-center border",
                        saveStatus === 'success' 
                          ? "bg-accent/20 border-accent/40 text-accent" 
                          : "bg-black/40 border-white/10 text-white/50 hover:text-white"
                      )}
                      title="Collect Film"
                    >
                      {isSaving ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : saveStatus === 'success' ? (
                        <Check className="w-5 h-5" />
                      ) : (
                        <Bookmark className="w-5 h-5" />
                      )}
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={async () => {
                        const url = new URL(window.location.href);
                        if (user?.profile?.username) {
                          url.searchParams.set('via', user.profile.username);
                        }
                        const shareUrl = url.toString();

                        if (navigator.share) {
                          try {
                            await navigator.share({
                              title: media.displayTitle,
                              text: `Check out ${media.displayTitle} on CineChive!`,
                              url: shareUrl,
                            });
                          } catch (err) {
                            if ((err as Error).name !== 'AbortError') console.error('Error sharing:', err);
                          }
                        } else {
                          try {
                            await navigator.clipboard.writeText(shareUrl);
                            toast.success('Link copied to clipboard.');
                          } catch (err) {
                            console.error('Failed to copy:', err);
                          }
                        }
                      }}
                      className="p-3 rounded-xl backdrop-blur-md transition-all flex items-center justify-center border bg-black/40 border-white/10 text-white/50 hover:text-white"
                      title="Transmit Frequency"
                    >
                      <Share2 className="w-5 h-5" />
                    </motion.button>
                  </div>
              </div>
           </motion.div>
        </div>
      </section>

      {/* Details Grid */}
      <section className="px-6 md:px-16 mt-12 grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Left Col: Info & Vibe */}
        <div className="lg:col-span-8 space-y-12">
           <div className="space-y-6">
              <h2 className="font-heading text-2xl tracking-tighter flex items-center gap-2 uppercase italic text-white/50">
                <Info size={18} className="text-white/30" />
                Feature Overview
              </h2>
              <p className="text-xl text-muted leading-relaxed font-heading opacity-90">
                {media.overview}
              </p>
           </div>

           {/* Pulse Stats */}
           {media.stats && (
             <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {media.stats.map(stat => (
                  <GlassPanel key={stat.label} className="p-6 border-white/5 bg-white/5">
                     <span className="font-display text-2xl block">{stat.value}</span>
                     <span className="font-data text-[10px] uppercase text-muted tracking-widest">{stat.label}</span>
                  </GlassPanel>
                ))}
             </div>
           )}
 
           {/* Financial Context */}
           {(media.business?.budget !== undefined || media.business?.revenue !== undefined) && (
             <div className="space-y-6 pt-12 border-t border-white/5">
                <h2 className="font-display text-2xl tracking-tighter flex items-center gap-2 uppercase italic text-accent/60">
                  <DollarSign size={18} className="text-accent/40" />
                  Financial Context
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <GlassPanel className="p-8 border-white/5 bg-white/5 group hover:bg-white/10 transition-all">
                      <span className="font-data text-[10px] uppercase text-muted tracking-widest block mb-1">Production Budget</span>
                       <span className="font-display text-3xl text-white">
                        {media.business?.budget && media.business.budget > 0 
                          ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(media.business.budget)
                          : 'Unknown'
                        }
                      </span>
                   </GlassPanel>
                   <GlassPanel className="p-8 border-white/5 bg-white/5 group hover:bg-white/10 transition-all">
                      <span className="font-data text-[10px] uppercase text-muted tracking-widest block mb-1">Box Office Revenue</span>
                       <span className="font-display text-3xl text-accent">
                        {media.business?.revenue && media.business.revenue > 0 
                          ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(media.business.revenue)
                          : 'Unknown'
                        }
                      </span>
                   </GlassPanel>
                </div>
             </div>
           )}
 
            {/* Cast Section */}
            {media.cast && media.cast.length > 0 && (
              <div className="space-y-8">
                <h2 className="font-display text-3xl tracking-tighter flex items-center gap-3 uppercase italic text-white">
                  <Users className="text-accent" />
                  Leading Cast
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
                  {media.cast.map((person, i) => (
                    <motion.div
                      key={i}
                      whileHover={{ y: -8 }}
                      onMouseEnter={() => SearchService.prefetchCinemaGraph(person.id, 'person')}
                      onClick={() => router.push(`/media/person/${person.id}`)}
                      className="group cursor-pointer space-y-3"
                    >
                      <div className="aspect-3/4 rounded-card overflow-hidden relative border border-white/10 group-hover:border-accent/40 transition-all shadow-xl bg-white/5">
                        {person.profileUrl ? (
                          <Image
                            src={person.profileUrl}
                            alt={person.name}
                            fill
                            className="object-cover group-hover:scale-110 transition-all duration-500"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-white/10 bg-white/5">
                            <div className="flex flex-col items-center gap-2 opacity-20">
                              <Users size={32} />
                              <span className="font-data text-[8px] uppercase tracking-widest">Still Image</span>
                            </div>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-linear-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <div className="px-1">
                        <span className="font-heading text-sm block text-white group-hover:text-accent transition-colors truncate">
                          {person.name}
                        </span>
                        <span className="font-data text-[10px] text-muted uppercase tracking-widest line-clamp-1">
                          {person.role}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Crew Section */}
            {media.crew && media.crew.length > 0 && (
              <div className="space-y-8 pt-8 border-t border-white/5">
                <h2 className="font-display text-3xl tracking-tighter flex items-center gap-3 uppercase italic text-white/60">
                  <Plus className="text-accent/40" />
                  Key Production
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
                  {media.crew.map((person, i) => (
                    <motion.div
                      key={i}
                      whileHover={{ y: -5 }}
                      onMouseEnter={() => SearchService.prefetchCinemaGraph(person.id, 'person')}
                      onClick={() => router.push(`/media/person/${person.id}`)}
                      className="group cursor-pointer space-y-3"
                    >
                      <div className="aspect-3/4 rounded-card overflow-hidden relative border border-white/5 group-hover:border-accent/20 transition-all bg-white/5 scale-95 opacity-60 group-hover:opacity-100 group-hover:scale-100">
                        {person.profileUrl ? (
                          <Image
                            src={person.profileUrl}
                            alt={person.name}
                            fill
                            className="object-cover transition-all duration-500"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-white/5 bg-white/5">
                            <span className="font-data text-[10px] uppercase opacity-10">404</span>
                          </div>
                        )}
                      </div>
                      <div className="px-1">
                        <span className="font-heading text-xs block text-white/50 group-hover:text-white transition-colors truncate">
                          {person.name}
                        </span>
                        <span className="font-data text-[9px] text-muted/40 uppercase tracking-widest line-clamp-1">
                          {person.role}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}


           {/* Music & Scene Scoring Section */}
           <div className="pt-12 border-t border-white/5">
             <MusicSection soundtrack={media.soundtrack} composers={media.composers} />
           </div>

           <div className="space-y-6 pt-12 border-t border-white/5">
              <div className="flex items-center justify-between">
                 <h2 className="font-heading text-2xl tracking-tight">Your Review</h2>
                 {initialUserEntry && (
                   <span className="font-data text-[10px] text-white/40 uppercase tracking-widest cursor-pointer hover:underline">Edit Entry</span>
                 )}
              </div>
              <GlassPanel className="p-8 border-dashed border-white/10 bg-white/5">
                 <div className="prose prose-invert max-w-none font-sans opacity-70">
                    <h4 className="font-heading text-white">Your Impression</h4>
                    {initialUserEntry?.notes ? (
                      <div className="space-y-4">
                        {initialUserEntry.rating && (
                          <div className="flex items-center gap-2 px-3 py-1 bg-accent/20 rounded-full border border-accent/40 w-fit">
                            <Star size={14} className="text-accent fill-accent" />
                            <span className="font-display text-sm text-accent">{initialUserEntry.rating}/10</span>
                          </div>
                        )}
                        <p className="whitespace-pre-wrap">{initialUserEntry.notes}</p>
                      </div>
                    ) : (
                      <p>You haven't shared your thoughts on this frequencies yet. Add a rating and review on the right to join the pulse.</p>
                    )}
                 </div>
              </GlassPanel>
           </div>

            <div className="pt-12 border-t border-white/5">
              <ReviewSection mediaId={media.id} mediaType={media.type} />
            </div>

            {/* Franchise / Collection Section */}
            {media.collection && (
              <div className="pt-12 border-t border-white/5 space-y-8">
                  <div className="flex flex-col gap-1">
                    <h2 className="font-heading text-2xl tracking-tighter uppercase italic text-white/50">
                      The Franchise Collection
                    </h2>
                    <p className="font-metadata text-xs text-muted/60">Exploring the full series of {media.collection.name}</p>
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
                                <Info size={24} />
                              </div>
                            )}
                            {part.id === String(media.sourceId) && (
                               <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                                  <span className="font-metadata text-[10px] uppercase tracking-widest bg-white/10 px-2 py-1 rounded backdrop-blur-md">Current Frequency</span>
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

            {/* Episode Explorer for TV / Anime */}
            {(media.type === 'tv' || media.type === 'anime') && (
              <div className="pt-12 border-t border-white/5 space-y-8">
                 <div className="flex items-end justify-between">
                    <div className="flex flex-col gap-1">
                        <h2 className="font-heading text-2xl tracking-tighter uppercase italic text-white/50">
                          Episode Details
                        </h2>
                        <p className="font-metadata text-xs text-muted/60">Detailed breakdown of seasonal frequencies</p>
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
                         <span className="font-data text-[10px] uppercase tracking-widest text-muted">Decoding Frequencies...</span>
                      </div>
                   </div>
                 ) : episodes.length > 0 ? (
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {episodes.map((ep) => (
                        <GlassPanel key={ep.id} className="p-4 border-white/5 bg-white/3 group hover:bg-white/5 transition-all flex gap-4 overflow-hidden">
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
                                 <Calendar size={10} />
                                 <span className="font-mono text-[9px] uppercase">{ep.air_date}</span>
                                 {ep.runtime && (
                                   <>
                                     <span className="w-0.5 h-0.5 rounded-full bg-white/40" />
                                     <span className="font-mono text-[9px] whitespace-nowrap">{ep.runtime} MIN</span>
                                   </>
                                 )}
                              </div>
                           </div>
                        </GlassPanel>
                      ))}
                   </div>
                 ) : (
                   <div className="h-40 flex items-center justify-center border border-dashed border-white/10 rounded-card bg-white/2">
                      <p className="font-metadata text-xs text-muted">No detailed episode data found in the library.</p>
                   </div>
                 )}
                 
                 {/* Streaming Episodes (AniList Specific) */}
                 {media.source === 'anilist' && media.streamingEpisodes && media.streamingEpisodes.length > 0 && (
                   <div className="space-y-4 pt-4">
                      <span className="font-data text-[10px] uppercase tracking-widest text-accent/60 flex items-center gap-2">
                        <Play size={12} /> External Broadcasts
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
           <GlassPanel className="p-8 border-white/10 bg-black/80 backdrop-blur-3xl sticky top-24 shadow-2xl">
              <div className="mb-8">
                 <h3 className="font-heading text-xl mb-1">Rate & Review</h3>
                 <p className="font-data text-xs text-muted">Share your resonance with the community.</p>
              </div>

              <div className="space-y-6">
                 <div>
                    <label className="font-data text-[10px] uppercase tracking-widest text-muted mb-3 block">Rating</label>
                    <div className="flex items-center justify-between gap-1">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                        <button
                          key={num}
                          onClick={() => setRating(num)}
                          className={cn(
                            "w-8 h-8 rounded-full border flex items-center justify-center transition-all",
                            rating >= num 
                              ? "bg-accent border-accent text-black font-bold shadow-[0_0_15px_rgba(255,255,255,0.2)]" 
                              : "border-white/10 text-white/30 hover:border-white/30"
                          )}
                        >
                          <span className="text-[10px]">{num}</span>
                        </button>
                      ))}
                    </div>
                 </div>

                 <div>
                    <label className="font-data text-[10px] uppercase tracking-widest text-muted mb-3 block">Your Review</label>
                    <textarea 
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Share your thoughts..."
                      className="w-full bg-white/5 border border-white/5 rounded-inner p-4 font-heading text-sm focus:border-accent/40 outline-none min-h-[100px] resize-none transition-all"
                    />
                 </div>

                 <div>
                    <label className="font-data text-[10px] uppercase tracking-widest text-muted mb-4 block">Cinematic Mode</label>
                    <ClassificationMeter 
                     selected={currentClassification}
                     onSelect={setSelectedClassification}
                    />
                 </div>

                 <div className="pt-2">
                    <div 
                     className="w-full aspect-video rounded-card border-2 flex flex-col items-center justify-center gap-3 transition-all duration-500"
                     style={{ 
                       borderColor: `${classificationColor}40`, 
                       background: `linear-gradient(135deg, ${classificationColor}10, transparent)`,
                       boxShadow: `0 0 30px ${classificationColor}15`
                     }}
                    >
                      <span className="text-4xl">{[currentClassification]}</span>
                      <span className="font-heading text-lg" style={{ color: classificationColor }}>{currentClassification.toUpperCase()}</span>
                      <span className="font-data text-[10px] text-muted uppercase tracking-widest">Captured</span>
                    </div>
                 </div>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleSave}
                    disabled={isSaving}
                    className={cn(
                      "w-full py-5 rounded-card font-display text-xl transition-all elevation flex items-center justify-center gap-3",
                      saveStatus === 'success' ? "bg-emerald-500 text-black" : 
                      saveStatus === 'error' ? "bg-rose-500 text-white" : ""
                    )}
                    style={saveStatus === 'idle' ? { backgroundColor: classificationColor, color: '#000' } : {}}
                  >
                   {isSaving ? (
                     <Loader2 className="animate-spin" size={24} />
                   ) : saveStatus === 'success' ? (
                     "SAVED TO COLLECTION"
                   ) : saveStatus === 'error' ? (
                     "AUTH REQUIRED"
                   ) : (
                     "SAVE TO COLLECTION"
                   )}
                  </motion.button>
              </div>
           </GlassPanel>
        </div>
      </section>
      
      {/* Recommendations Section */}
      {media.recommendations && media.recommendations.length > 0 && (
        <section className="px-6 md:px-16 mt-24 space-y-8">
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
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
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
    </div>
  );
}
