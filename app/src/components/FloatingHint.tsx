// File: app/src/components/FloatingHint.tsx
'use client';

import React, { useState, useEffect } from 'react';
import styles from './FloatingHint.module.css';
import { motion, AnimatePresence } from 'framer-motion';

export interface FloatingHintProps {
  message: string;
  delay?: number;      // Delay before appearing
  duration?: number;   // How long to stay visible (before fade-out)
  pulse?: boolean;
}

export const FloatingHint: React.FC<FloatingHintProps> = ({
  message,
  delay = 0,
  duration = 10,
  pulse = false,
}) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const appearTimer = setTimeout(() => setVisible(true), delay * 1000);
    const hideTimer = setTimeout(() => setVisible(false), (delay + duration) * 1000);

    return () => {
      clearTimeout(appearTimer);
      clearTimeout(hideTimer);
    };
  }, [delay, duration]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className={`${styles.hintBubble} ${pulse ? styles.pulse : ''}`}
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          {message}
        </motion.div>
      )}
    </AnimatePresence>
  );
};