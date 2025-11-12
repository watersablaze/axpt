'use client';
import { motion, useCycle } from 'framer-motion';
import { useEffect } from 'react';

export default function MirrorRayLayerGold() {
  const [phase, cyclePhase] = useCycle('inhale', 'exhale');

  useEffect(() => {
    const interval = setInterval(cyclePhase, 6000);
    return () => clearInterval(interval);
  }, [cyclePhase]);

  const isInhale = phase === 'inhale';

  return (
    <motion.div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      <motion.div
        className="absolute inset-0 bg-gradient-radial from-amber-300/40 via-yellow-400/25 to-transparent blur-[140px]"
        animate={{
          scale: isInhale ? 1.15 : 1,
          opacity: isInhale ? 0.95 : 0.6,
        }}
        transition={{ duration: 3, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute inset-0 bg-gradient-conic from-yellow-200/20 via-amber-400/25 to-orange-300/10 blur-[200px]"
        animate={{
          rotate: isInhale ? 360 : 0,
          opacity: isInhale ? 0.55 : 0.35,
        }}
        transition={{ duration: 6, ease: 'easeInOut' }}
      />
    </motion.div>
  );
}