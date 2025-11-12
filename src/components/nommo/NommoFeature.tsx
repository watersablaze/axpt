'use client';

import { motion } from 'framer-motion';
import styles from './NommoFeature.module.css';
import AxptMotionBridge from '@/components/motion/AxptMotionBridge';
import { AXPT_CINEMATIC_EASE } from '@/lib/constants/motion';

export default function NommoFeature() {
  return (
    <section id="feature" className={styles.section}>
      {/* ✨ Atmospheric continuity from Hero */}
      <div className={styles.backGlow} aria-hidden="true" />

      {/* 🎬 Unified fade-up container */}
      <motion.div
        className={styles.featureContent}
        initial={{ opacity: 0, y: 60 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{
          duration: 2.2,
          ease: [0.25, 0.1, 0.25, 1.0], // classic cinematic ease
        }}
        viewport={{ once: true }}
      >
        <AxptMotionBridge>
          <h2 className={`${styles.title} axpt-shimmer`}>
            Warriors in the Garden
          </h2>
        </AxptMotionBridge>

        <div className={`${styles.videoFrame} ${styles.placeholderFrame}`}>
          <div className={styles.placeholderInner}>
            <div className={styles.placeholderGlow} />
            <p className={styles.placeholderText}>Trailer Coming Soon</p>
          </div>
        </div>

        <AxptMotionBridge delay={0.2}>
          <p className={styles.description}>
            A story of spirit, resistance, and remembrance — filmed across the
            sacred geographies of Turtle Island and Alkebulan.
          </p>
          <p className={styles.meta}>Full Release • Art Basel 2025</p>
        </AxptMotionBridge>
      </motion.div>
    </section>
  );
}