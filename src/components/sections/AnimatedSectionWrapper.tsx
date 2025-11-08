// src/components/sections/AnimatedSectionWrapper.tsx
'use client';

import { motion, useAnimation } from 'framer-motion';
import { useEffect, useRef } from 'react';

type Props = {
  children: React.ReactNode;
};

export default function AnimatedSectionWrapper({ children }: Props) {
  const controls = useAnimation();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) controls.start('visible');
      },
      { threshold: 0.15 }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [controls]);

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={controls}
      transition={{ duration: 1.2, ease: 'easeOut' }}
      variants={{
        hidden: { opacity: 0, y: 40 },
        visible: { opacity: 1, y: 0 },
      }}
    >
      {children}
    </motion.div>
  );
}