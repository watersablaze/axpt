'use client';

import { motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';

type AxptScrollRevealProps = {
  className?: string;
  delay?: number;
  threshold?: number; // 0–1
  children: React.ReactNode;
};

/**
 * 🌀 AXPT Scroll Reveal
 * Fades and slides content into view once as user scrolls
 */
export default function AxptScrollReveal({
  className = '',
  delay = 0,
  threshold = 0.15,
  children,
}: AxptScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!ref.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold }
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [threshold]);

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y: 24 }}
      animate={visible ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.9, delay, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
}