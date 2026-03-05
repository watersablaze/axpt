'use client';

import { useEffect, useRef, useState } from 'react';

export function useInView<T extends HTMLElement>(
  options?: IntersectionObserverInit
) {
  const ref = useRef<T | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true); // only turn on once
          observer.unobserve(entry.target); // stop observing after activation
        }
      },
      {
        threshold: 0.3,
        rootMargin: '0px 0px -10% 0px',
        ...options,
      }
    );

    observer.observe(node);

    return () => observer.disconnect();
  }, [ref]); // <-- depend on ref

  return { ref, isVisible };
}