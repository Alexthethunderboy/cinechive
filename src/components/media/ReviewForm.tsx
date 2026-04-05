'use client';

import { useState, useRef, forwardRef, useImperativeHandle } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Trash2 } from 'lucide-react';
import GlassPanel from '@/components/ui/GlassPanel';
import ClassificationMeter from '@/components/ui/ClassificationMeter';
import { ClassificationName, CLASSIFICATION_COLORS } from '@/lib/design-tokens';
import { cn } from '@/lib/utils';

interface ReviewFormProps {
  initialRating?: number;
  initialNotes?: string;
  initialClassification?: ClassificationName;
  mediaId: string;
  mediaType: string;
  mediaTitle: string;
  posterUrl: string | null;
  onSave: (data: { rating: number, comment: string, classification: ClassificationName }) => Promise<void>;
  isSaving: boolean;
  saveStatus: 'idle' | 'success' | 'error';
  isAlreadySaved?: boolean;
  onRemove?: () => Promise<void>;
}

export interface ReviewFormHandle {
  focus: () => void;
}

const ReviewForm = forwardRef<ReviewFormHandle, ReviewFormProps>(({
  initialRating = 0,
  initialNotes = '',
  initialClassification,
  mediaId,
  mediaType,
  mediaTitle,
  posterUrl,
  onSave,
  isSaving,
  saveStatus,
  isAlreadySaved,
  onRemove
}, ref) => {
  const [rating, setRating] = useState<number>(initialRating);
  const [comment, setComment] = useState(initialNotes);
  const [selectedClassification, setSelectedClassification] = useState<ClassificationName | undefined>(initialClassification);
  const formRef = useRef<HTMLDivElement>(null);

  useImperativeHandle(ref, () => ({
    focus: () => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      formRef.current?.classList.add('ring-2', 'ring-accent', 'ring-offset-4', 'ring-offset-black');
      setTimeout(() => {
        formRef.current?.classList.remove('ring-2', 'ring-accent', 'ring-offset-4', 'ring-offset-black');
      }, 2000);
    }
  }));

  const currentClassification = selectedClassification || 'Essential';
  const classificationColor = CLASSIFICATION_COLORS[currentClassification];

  return (
    <GlassPanel ref={formRef} className="p-8 border-white/10 bg-black/80 backdrop-blur-3xl sticky top-24 shadow-2xl transition-all duration-500">
      <div className="mb-8">
        <h3 className="font-heading text-xl mb-1">{isAlreadySaved ? 'Edit Your Review' : 'Rate & Review'}</h3>
        <p className="font-data text-xs text-muted">Share your thoughts with the community.</p>
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
          <label className="font-data text-[10px] uppercase tracking-widest text-muted mb-4 block">Style</label>
          <ClassificationMeter 
            selected={selectedClassification}
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
            <span className="font-data text-[10px] text-muted uppercase tracking-widest">Selected</span>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSave({ rating, comment, classification: currentClassification })}
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
              "Saved!"
            ) : saveStatus === 'error' ? (
              "Sign in required"
            ) : (
              isAlreadySaved ? "Update Review" : "Save to Library"
            )}
          </motion.button>

          {isAlreadySaved && onRemove && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onRemove}
              className="w-full py-3 rounded-card font-metadata text-[10px] uppercase tracking-widest text-white/40 hover:text-rose-400 flex items-center justify-center gap-2 transition-colors"
            >
              <Trash2 size={12} /> Remove from Library
            </motion.button>
          )}
        </div>
      </div>
    </GlassPanel>
  );
});

ReviewForm.displayName = 'ReviewForm';

export default ReviewForm;
