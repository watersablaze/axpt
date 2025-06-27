'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function MirageTransition({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={Math.random()} // avoid cyclic children serialization
        initial={{ opacity: 0, y: 20, filter: 'blur(12px)' }}
        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        exit={{ opacity: 0, y: -20, filter: 'blur(8px)' }}
        transition={{ duration: 1.2, ease: 'easeInOut' }}
        className="w-full h-full flex items-center justify-center"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}