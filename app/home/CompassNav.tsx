'use client';
import { motion } from 'framer-motion';

export default function CompassNav() {
  return (
    <motion.div
      className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 2 }}
    >
      <div className="flex gap-4 text-white">
        <button>Wallet</button>
        <button>Projects</button>
        <button>Resources</button>
      </div>
    </motion.div>
  );
}
