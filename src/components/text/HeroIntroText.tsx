'use client';

import { motion } from 'framer-motion';
import styles from './HeroIntroText.module.css';

export default function HeroIntroText() {
  return (
    <motion.div
      className={styles.wrapper}
      initial={{ opacity: 0, y: 28 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1.6, ease: 'easeOut' }}
    >
      <h1 className={styles.title}>
        Explore Web3 with AXPT.
      </h1>

      <p className={styles.subtitle}>
        The House of Restorative Custodianship and Planetary Exchange.
      </p>
    </motion.div>
  );
}