'use client';
import { motion } from 'framer-motion';
import Link from 'next/link';

export default function EnterButton() {
  return (
    <motion.div
      className="z-10 relative text-center"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1.2, delay: 1.5 }}
    >
      <Link href="/portal">
        <button className="px-6 py-3 bg-white/10 border border-white rounded-full backdrop-blur-md hover:scale-105 transition">
          Enter the Axis
        </button>
      </Link>
    </motion.div>
  );
}
