'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import AxptMotionBridge from '@/components/motion/AxptMotionBridge';
import styles from './NommoHero.module.css';
import { useRef } from 'react';
import { AXPT_CINEMATIC_EASE } from '@/lib/constants/motion';

export default function NommoHero() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end start'],
  });

  // Motion transforms
  const nebulaY = useTransform(scrollYProgress, [0, 1], [0, -60]);
  const textY = useTransform(scrollYProgress, [0, 1], [0, -30]);
  const textOpacity = useTransform(scrollYProgress, [0, 0.4], [1, 0.8]);
  const fadeBridgeOpacity = useTransform(scrollYProgress, [0.2, 1], [0, 1]); // dark veil increase

  return (
    <motion.section
      ref={ref}
      className={styles.container}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.5, ease: 'easeOut' }}
    >
      {/* 🌌 Nebula Background */}
      <motion.img
        src="/images/backgrounds/Nebula@2x.png"
        alt="Nommo Nebula"
        className={styles.nebula}
        style={{ y: nebulaY }}
      />

      {/* ✨ Text Block */}
      <motion.div
        className={styles.textBlock}
        style={{ y: textY, opacity: textOpacity }}
      >
        <AxptMotionBridge>
          <h1 className={`${styles.title} axpt-shimmer`}>Nommo Media</h1>
        </AxptMotionBridge>

        <AxptMotionBridge delay={0.2}>
          <p className={styles.subtitle}>
            Restorative storytelling and sacred reportage — where film, sound,
            and word remember the world.
          </p>
        </AxptMotionBridge>

        <AxptMotionBridge delay={0.4}>
          <a href="#feature" className={styles.cta}>
            Watch Trailer
          </a>
        </AxptMotionBridge>
      </motion.div>

      {/* 🌫️ Fade Bridge — connects Hero → Feature */}
      <motion.div
        className={styles.fadeBridge}
        style={{ opacity: fadeBridgeOpacity }}
      />

      {/* Scroll Indicator */}
      <div className="axpt-scroll-indicator z-10" />
    </motion.section>
  );
}