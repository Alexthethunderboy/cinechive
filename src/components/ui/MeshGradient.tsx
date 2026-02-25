'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { ClassificationName, CLASSIFICATION_COLORS } from '@/lib/design-tokens';

interface MeshGradientProps {
  vibe?: ClassificationName;
}

export default function MeshGradient({ vibe }: MeshGradientProps) {
  const color = vibe ? CLASSIFICATION_COLORS[vibe] : '#8B5CF6';

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      <AnimatePresence mode="wait">
        <motion.div
          key={vibe || 'default'}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.4 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 2, ease: "easeInOut" }}
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(circle at 20% 30%, ${color}33 0%, transparent 50%),
              radial-gradient(circle at 80% 70%, ${color}22 0%, transparent 50%),
              radial-gradient(circle at 50% 50%, #08090A 0%, #08090A 100%)
            `
          }}
        />
      </AnimatePresence>
      
      {/* Animated noise/grain overlay for texture */}
      <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
    </div>
  );
}
