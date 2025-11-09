'use client';

import { useEffect, useRef } from 'react';
import styles from './CircuitTextureOverlay.module.css';

export default function CircuitTextureOverlay() {
  const ref = useRef<HTMLDivElement>(null);
  const ticking = useRef(false);
  const revealTriggered = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // 🪄 Sync with sigil reveal (CSS variable from variables.css)
    const sigilDelaySec = parseFloat(
      getComputedStyle(document.documentElement)
        .getPropertyValue('--sigil-reveal-delay')
        .replace('s', '')
        .trim()
    ) || 9.2;

    // Start a surge effect just before the reveal completes
    const revealTimer = setTimeout(() => {
      revealTriggered.current = true;
      el.classList.add(styles.surge);
      setTimeout(() => {
        el.classList.remove(styles.surge);
        revealTriggered.current = false;
      }, 2400); // duration of the surge effect
    }, (sigilDelaySec - 1.2) * 1000); // trigger ~1.2s before reveal

    // 🌫 Scroll-based parallax + luminance modulation
    const handleScroll = () => {
      if (ticking.current) return;
      ticking.current = true;

      window.requestAnimationFrame(() => {
        const scrollY = window.scrollY;
        const docHeight = document.body.scrollHeight - window.innerHeight;
        const progress = docHeight > 0 ? scrollY / docHeight : 0;

        const offset = scrollY * 0.03;
        const intensity = Math.min(1, Math.max(0, progress * 1.2));

        // 🌀 Baseline glow
        el.style.transform = `translate3d(0, ${-offset}px, 0)`;
        el.style.filter = `
          drop-shadow(-0.5px 0 rgba(255, 60, 60, ${0.35 + intensity * 0.25}))
          drop-shadow(0.5px 0 rgba(60, 180, 255, ${0.35 + intensity * 0.25}))
          blur(${0.3 + intensity * 0.2}px)
          saturate(${1.2 + intensity * 0.3})
          brightness(${0.9 + intensity * 0.4})
          contrast(${1.05 + intensity * 0.1})
        `;
        el.style.opacity = `${0.12 + intensity * 0.1}`;

        ticking.current = false;
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // initial render

    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(revealTimer);
    };
  }, []);

  return <div ref={ref} className={styles.circuitTexture} />;
}