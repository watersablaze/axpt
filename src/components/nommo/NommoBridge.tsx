'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import styles from './NommoBridge.module.css';

export default function NommoBridge() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });

  // Smooth fade-through as you scroll past the Feature
  const opacity = useTransform(scrollYProgress, [0, 0.4, 1], [0, 1, 0]);

  return (
    <motion.div
      ref={ref}
      className={styles.bridge}
      style={{ opacity }}
      aria-hidden="true"
    />
  );
}