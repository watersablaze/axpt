'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import styles from './NommoUpcomingBridge.module.css';

export default function NommoUpcomingBridge() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end start'],
  });

  // ✅ Begin fade-in later so it’s visible when Manifesto finishes
  const opacity = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [0, 0.5, 1, 1]);

  return (
    <motion.div
      ref={ref}
      className={styles.bridge}
      style={{ opacity }}
      aria-hidden="true"
    />
  );
}