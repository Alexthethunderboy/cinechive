'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ClassificationName, CLASSIFICATION_COLORS, SPRING_CONFIG } from '@/lib/design-tokens';
import { ChevronLeft, Calendar, Clock, Star, Play, Share2, Plus, Bookmark, Flame, Users, Info, Loader2, DollarSign } from 'lucide-react';
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

interface ClientMediaDetailProps {
  media: DetailedMedia;
  initialUserEntry?: any;
  deepData?: {
    trivia: any[];
    specs: any;
    scripts: any[];
  };
}

export default function ClientMediaDetail({ media, initialUserEntry, deepData }: ClientMediaDetailProps) {
  const router = useRouter();
  const [selectedClassification, setSelectedClassification] = useState<ClassificationName | undefined>(initialUserEntry?.classification);
  const [comment, setComment] = useState(initialUserEntry?.notes || '');
  const [rating, setRating] = useState<number>(initialUserEntry?.rating || 0);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const currentClassification = selectedClassification || media.classification;
  const classificationColor = CLASSIFICATION_COLORS[currentClassification];

  async function handleSave() {
    setIsSaving(true);
    setSaveStatus('idle');
    try {
      await archiveMediaAction({
        mediaId: media.id,
        mediaType: media.type,
        title: media.title,
        posterUrl: media.posterUrl,
        classification: currentClassification,
        comment: comment || undefined,
        rating: rating || undefined,
      });
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      console.error(error);
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="pb-20">
      {/* Hero Header with Shared Layout Transition */}
      <section className="relative h-[60vh] md:h-[70vh] w-full overflow-hidden">
        <motion.div 
          layoutId={`media-poster-${media.id}`} 
          className="absolute inset-0 z-0"
          transition={SPRING_CONFIG.hero}
        >
          {media.backdropUrl ? (
            <Image
              src={media.backdropUrl}
              alt={media.title}
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
        </motion.div>

        {/* Back Button */}
        <nav className="absolute top-10 left-6 md:left-10 z-20">
          <motion.button
            whileHover={{ x: -5 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.back()}
            className="glass p-3 rounded-full hover:border-accent/30 transition-colors text-white/40 hover:text-accent"
          >
            <ChevronLeft size={24} />
          </motion.button>
        </nav>

        {/* Hero Content */}
        <div className="absolute bottom-0 left-0 right-0 z-10 p-6 md:p-16">
           <motion.div
             initial={{ opacity: 0, y: 30 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ delay: 0.4, duration: 0.8 }}
             className="max-w-4xl"
           >
              <div className="flex items-center gap-3 mb-4">
                 <span className="font-data text-[10px] uppercase font-bold tracking-[0.2em] bg-accent/20 text-accent px-3 py-1 rounded-inner border border-accent/30">
                    {media.type}
                 </span>
                 <div className="flex items-center gap-2 text-muted font-data text-[10px] uppercase tracking-widest">
                    <Calendar size={12} />
                    <span>{media.year}</span>
                    {media.duration && (
                      <>
                        <span className="mx-1">•</span>
                        <Clock size={12} />
                        <span>{media.duration}</span>
                      </>
                    )}
                 </div>
              </div>

              <h1 className="font-display text-5xl md:text-8xl tracking-tighter leading-[0.8] mb-6 italic">
                {media.title.toUpperCase()}
              </h1>

              <div className="flex flex-wrap gap-4 items-center">
                 {media.trailerUrl ? (
                   <a href={media.trailerUrl} target="_blank" rel="noopener noreferrer">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="px-8 py-4 rounded-card bg-accent text-black font-display text-lg italic uppercase flex items-center gap-3 hover:bg-white/10 transition-colors elevation"
                    >
                      <Play size={20} fill="currentColor" />
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
                 
                 <div className="flex gap-2">
                    {[Bookmark, Share2, Plus].map((Icon, i) => (
                      <motion.button
                        key={i}
                        whileHover={{ y: -5 }}
                        className="glass p-4 rounded-inner hover:border-accent/30 transition-colors text-white/40 hover:text-accent"
                      >
                        <Icon size={20} />
                      </motion.button>
                    ))}
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
              <h2 className="font-display text-2xl tracking-tighter flex items-center gap-2 uppercase italic text-accent">
                <Info size={18} className="text-accent/60" />
                Feature Overview
              </h2>
              <p className="text-xl text-muted leading-relaxed font-heading opacity-90">
                {media.description}
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
           {(media.budget !== undefined || media.revenue !== undefined) && (
             <div className="space-y-6 pt-12 border-t border-white/5">
                <h2 className="font-display text-2xl tracking-tighter flex items-center gap-2 uppercase italic text-accent/60">
                  <DollarSign size={18} className="text-accent/40" />
                  Financial Context
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <GlassPanel className="p-8 border-white/5 bg-white/5 group hover:bg-white/10 transition-all">
                      <span className="font-data text-[10px] uppercase text-muted tracking-widest block mb-1">Production Budget</span>
                      <span className="font-display text-3xl text-white">
                        {media.budget && media.budget > 0 
                          ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(media.budget)
                          : 'Unknown'
                        }
                      </span>
                   </GlassPanel>
                   <GlassPanel className="p-8 border-white/5 bg-white/5 group hover:bg-white/10 transition-all">
                      <span className="font-data text-[10px] uppercase text-muted tracking-widest block mb-1">Box Office Revenue</span>
                      <span className="font-display text-3xl text-accent">
                        {media.revenue && media.revenue > 0 
                          ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(media.revenue)
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
                      onClick={() => router.push(`/media/person/${person.id}`)}
                      className="group cursor-pointer space-y-3"
                    >
                      <div className="aspect-3/4 rounded-card overflow-hidden relative border border-white/10 group-hover:border-accent/40 transition-all shadow-xl bg-white/5">
                        {person.profilePath ? (
                          <Image
                            src={person.profilePath}
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
                      onClick={() => router.push(`/media/person/${person.id}`)}
                      className="group cursor-pointer space-y-3"
                    >
                      <div className="aspect-3/4 rounded-card overflow-hidden relative border border-white/5 group-hover:border-accent/20 transition-all bg-white/5 scale-95 opacity-60 group-hover:opacity-100 group-hover:scale-100">
                        {person.profilePath ? (
                          <Image
                            src={person.profilePath}
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

           {/* Pulse Reviews Section */}
           <div className="pt-12 border-t border-white/5">
             <ReviewSection mediaId={media.id} mediaType={media.type} />
           </div>

           {/* Deep Dive Explorer */}
           {deepData && (
             <DeepDiveSection 
               tmdbId={media.id} 
               title={media.title} 
               data={deepData} 
             />
           )}
        </div>

        <div className="lg:col-span-4 space-y-8">
           <GlassPanel className="p-8 border-white/10 bg-white/5 sticky top-24">
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
    </div>
  );
}
