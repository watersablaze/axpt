'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import styles from './SigilWatermark.module.css';

type Props = {
  scrolled?: boolean;
};

export default function SigilWatermark({ scrolled = false }: Props) {
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    setHasHydrated(true);
  }, []);

  if (!hasHydrated) return null;

  return (
    <motion.div
      className={styles.wrapper}
      initial={{ opacity: 0, scale: 1 }}
      animate={{
        opacity: [scrolled ? 0.18 : 0.26, scrolled ? 0.32 : 0.42, scrolled ? 0.18 : 0.26],
        scale: [scrolled ? 1.01 : 1.03, scrolled ? 1.035 : 1.05, scrolled ? 1.01 : 1.03],
      }}
      transition={{
        duration: 10,
        repeat: Infinity,
        repeatType: 'loop',
        ease: 'easeInOut',
      }}
    >
      <img
        src="/images/axpt-sigil-main.png"
        alt="AXPT Sigil Watermark"
        className={styles.sigil}
        onError={() => console.error('[AXPT] ❌ Sigil image failed to load')}
        onLoad={() => console.log('[AXPT] ✅ Sigil image loaded')}
      />
    </motion.div>
  );
}