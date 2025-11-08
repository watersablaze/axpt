// src/components/SigilWatermark.tsx
'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import styles from './SigilWatermark.module.css';

export default function SigilWatermark() {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  if (!hydrated) return null;

  return (
    <motion.div
      className={styles.wrapper}
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 0.38, scale: 1 }}
      transition={{ duration: 2.2, ease: 'easeInOut' }}
    >
      <img
        src="/sigil/axpt_base_clean.png"
        alt="AXPT Sigil Watermark"
        className={styles.sigil}
      />
    </motion.div>
  );
}