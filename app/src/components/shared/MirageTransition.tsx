'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './MirageTransition.module.css';

interface MirageTransitionProps {
  children: React.ReactNode;
  keyProp?: string;
}

export default function MirageTransition({ children, keyProp }: MirageTransitionProps) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={Math.random()}
        initial={{ opacity: 0, scale: 0.98, y: 20, filter: 'blur(20px)' }}
        animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
        exit={{ opacity: 0, scale: 0.95, y: -20, filter: 'blur(15px)' }}
        transition={{ duration: 1.4, ease: 'easeInOut' }}
        className="w-full h-full flex items-center justify-center"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
