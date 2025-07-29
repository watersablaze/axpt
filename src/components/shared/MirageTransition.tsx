// app/src/components/shared/MirageTransition.tsx
'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './MirageTransition.module.css';

interface MirageTransitionProps {
  children: React.ReactNode;
  keyProp?: string;
}

export default function MirageTransition({
  children,
  keyProp = 'mirage',
}: MirageTransitionProps) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={keyProp}
        initial={{
          opacity: 0,
          scale: 0.975,
          y: 30,
          filter: 'blur(24px)',
        }}
        animate={{
          opacity: 1,
          scale: 1,
          y: 0,
          filter: 'blur(0px)',
          transition: {
            duration: 1.4,
            ease: [0.4, 0, 0.2, 1],
          },
        }}
        exit={{
          opacity: 0,
          scale: 0.96,
          y: -20,
          filter: 'blur(18px)',
          transition: {
            duration: 1.1,
            ease: [0.4, 0, 0.2, 1],
          },
        }}
        className={styles.mirageWrapper}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}