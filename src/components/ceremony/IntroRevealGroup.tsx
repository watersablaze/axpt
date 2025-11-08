'use client';
import { motion } from 'framer-motion';
import HeroIntroBlock from '../hero/HeroIntroBlock';
import SigilFormPanel from '../sigil/SigilFormPanel';
import styles from './IntroRevealGroup.module.css';

export default function IntroRevealGroup() {
  console.log('%c[IntroRevealGroup] mounted', 'color:#9cf');

  return (
    <div className={styles.groupWrapper}>
      {/* TEXT FIRST */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut', delay: 0.0 }}
      >
        <HeroIntroBlock />
      </motion.div>

      {/* FORM SECOND */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut', delay: 0.4 }}
      >
        <SigilFormPanel />
      </motion.div>
    </div>
  );
}