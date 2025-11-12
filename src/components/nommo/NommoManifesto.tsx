'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import styles from './NommoManifesto.module.css';
import AxptMotionBridge from '@/components/motion/AxptMotionBridge';

export default function NommoManifesto() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end start'],
  });

  // ✅ Fade stays solid until last 30% of the section
  const fadeOut = useTransform(scrollYProgress, [0, 0.7, 1], [1, 1, 0]);

  return (
    <motion.section
      ref={ref}
      id="manifesto"
      className={styles.section}
      style={{ opacity: fadeOut }}
    >
      <motion.div
        className={styles.content}
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{
          duration: 2,
          ease: [0.25, 0.1, 0.25, 1.0],
        }}
        viewport={{ once: true }}
      >
        <AxptMotionBridge>
          <h3 className={styles.title}>The Voice of Water and Fire</h3>
        </AxptMotionBridge>

        <p className={styles.text}>
          Nommo Media stands as a vessel for restorative journalism — reawakening
          truth through sacred witness. Our stories flow through resistance and
          beauty alike, illuminating the unseen and amplifying voices that bridge
          the continents of memory and becoming.
        </p>
      </motion.div>
    </motion.section>
  );
}