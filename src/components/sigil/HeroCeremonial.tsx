'use client';

import { useEffect, useState } from 'react';
import styles from './HeroCeremonial.module.css';
import { usePerformanceMode } from '@/hooks/usePerformanceMode';

type Props = {
  onResolve?: () => void;
};

export default function HeroCeremonial({ onResolve }: Props) {
  const [resolved, setResolved] = useState(false);
  const performanceMode = usePerformanceMode();

  useEffect(() => {
    let delay = 1800;
    if (performanceMode === 'medium') delay = 2200;
    if (performanceMode === 'low') delay = 2600;

    const t = setTimeout(() => {
      setResolved(true);
      onResolve?.();
    }, delay);

    return () => clearTimeout(t);
  }, [performanceMode, onResolve]);

  return (
    <section className={styles.container} aria-hidden={resolved}>
      <div className={`${styles.sigilStage} ${resolved ? styles.resolved : ''}`}>
        
        {/* 🌍 Globe (anchor) */}
        <img
          src="/sigil/v4/axpt_sigil_V4_globe.png"
          alt=""
          className={styles.globe}
          draggable={false}
        />

        {/* 🪽 Wings (directional expansion) */}
        <img
          src="/sigil/v4/axpt_sigil_V4_wing_show.png"
          alt=""
          className={styles.wings}
          draggable={false}
        />

        {/* 🔮 Final transparent seal */}
        <img
          src="/sigil/v4/axpt_sigil_V4_transparent.png"
          alt="AXPT Sigil"
          className={styles.seal}
          draggable={false}
        />
      </div>

      {/* ⬇ Scroll affordance */}
      <div
        className={`${styles.scrollIndicator} ${
          resolved ? styles.visible : ''
        }`}
        aria-hidden
      >
        ↓
      </div>
    </section>
  );
}