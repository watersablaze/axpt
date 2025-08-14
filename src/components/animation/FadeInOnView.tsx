'use client';

import { useEffect, useRef, useState } from 'react';
import styles from './FadeInOnView.module.css';

interface FadeInOnViewProps {
  children: React.ReactNode;
  className?: string;
  delay?: number; // optional delay in ms
}

export default function FadeInOnView({ children, className = '', delay = 0 }: FadeInOnViewProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!ref.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => {
            setIsVisible(true);
          }, delay);
          observer.disconnect(); // trigger once
        }
      },
      { threshold: 0.2 }
    );

    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [delay]);

  return (
    <div
      ref={ref}
      className={`${styles.fadeInBase} ${isVisible ? styles.visible : ''} ${className}`}
    >
      {children}
    </div>
  );
}