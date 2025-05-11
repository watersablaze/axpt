// File: app/src/components/CompassCorner.tsx
'use client';

import React, { useEffect, useState } from 'react';
import styles from './CompassCorner.module.css';
import { motion } from 'framer-motion';

interface CompassCornerProps {
  docSwitchCount?: number;
}

const CompassCorner: React.FC<CompassCornerProps> = ({ docSwitchCount }) => {
  const [twitchKey, setTwitchKey] = useState(0);

  useEffect(() => {
    if (docSwitchCount !== undefined) {
      setTwitchKey((k) => k + 1);
    }
  }, [docSwitchCount]);

  return (
    <motion.div
      className={styles.compassWrapper}
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 3.2, duration: 0.8, ease: 'easeOut' }}
    >
      <div className={styles.compass}>
        <div className={styles.pulseRing}></div>
        <div className={styles.cardinals}>
          <span className={`${styles.cardinalLabel} ${styles.north}`}>N</span>
          <span className={`${styles.cardinalLabel} ${styles.east}`}>E</span>
          <span className={`${styles.cardinalLabel} ${styles.south}`}>S</span>
          <span className={`${styles.cardinalLabel} ${styles.west}`}>W</span>
        </div>
        <div className={styles.needle} key={`needle-${twitchKey}`}></div>
        <div className={styles.needleSecondary} key={`needle2-${twitchKey}`}></div>
        <div className={styles.innerText}>AXPT</div>
      </div>
    </motion.div>
  );
};

export default CompassCorner;