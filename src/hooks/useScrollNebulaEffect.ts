'use client';

import { useEffect } from 'react';

/**
 * Applies scroll-based parallax to all elements with data-nebula-scroll attribute
 */
export function useScrollNebulaEffect() {
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;

      const elements = document.querySelectorAll('[data-nebula-scroll]');
      elements.forEach((el, index) => {
        const depth = Number(el.getAttribute('data-nebula-depth')) || 0.2;
        (el as HTMLElement).style.transform = `translateY(${scrollY * depth}px)`;
      });
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
}