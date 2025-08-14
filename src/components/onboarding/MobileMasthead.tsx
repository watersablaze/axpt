'use client';

import { motion } from 'framer-motion';
import styles from './MobileMasthead.module.css';
import MobileBlurb from './MobileBlurb';

type Props = {
  displayName?: string;
  scrollRef: React.RefObject<HTMLElement>;
};

export default function MobileMasthead({ displayName, scrollRef }: Props) {
  return (
    <div className={styles.mastheadContainer}>
      {/* Shifted downward for visual balance */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.4, duration: 1.2, ease: 'easeOut' }}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '0.4rem',
          marginTop: '6.5rem', // 🌟 Adjust this to control downward spacing
        }}
      >
        <div className={styles.accessText}>
          ACCESS <span className={styles.granted}>GRANTED</span>
        </div>

        {displayName && (
          <div className={styles.displayName}>
            Welcome, {displayName}
          </div>
        )}
      </motion.div>

      {/* 🌌 Portal Introduction */}
      <MobileBlurb scrollRef={scrollRef} />
    </div>
  );
}