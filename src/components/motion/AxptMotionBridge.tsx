// components/motion/AxptMotionBridge.tsx
'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

type AxptMotionBridgeProps = {
  as?: keyof JSX.IntrinsicElements;
  className?: string;
  delay?: number;
  duration?: number;
  children: React.ReactNode;
};

/**
 * 🪶 AXPT Motion Bridge
 * - Uses Framer Motion if available
 * - Falls back to CSS `.axpt-fade-in` if JS or Framer fails
 * - Keeps visual rhythm consistent across hydration phases
 */
export default function AxptMotionBridge({
  as = 'div',
  className = '',
  delay = 0,
  duration = 0.8,
  children,
}: AxptMotionBridgeProps) {
  const [isClient, setIsClient] = useState(false);

  // Determine hydration success (JS environment ready)
  useEffect(() => {
    const timer = setTimeout(() => setIsClient(true), 80);
    return () => clearTimeout(timer);
  }, []);

  const Element = as;

  if (!isClient) {
    // 🧘 CSS-only fallback (hydration pending or disabled)
    return <Element className={`axpt-fade-in ${className}`}>{children}</Element>;
  }

  // 🪶 Framer Motion Path (fully active)
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration, delay, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
}