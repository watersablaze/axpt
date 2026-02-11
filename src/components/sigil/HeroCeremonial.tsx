'use client';

import { useEffect, useState } from 'react';
import styles from './HeroCeremonial.module.css';
import { usePerformanceMode } from '@/hooks/usePerformanceMode';

type Props = {
  onResolve?: () => void;
};

export default function HeroCeremonial({ onResolve }: Props) {
  const [resolved, setResolved] = useState(false);
  const [entered, setEntered] = useState(false);
  const [resting, setResting] = useState(false);

  const performanceMode = usePerformanceMode();

  useEffect(() => {
    let delay = 1800;
    if (performanceMode === 'medium') delay = 2200;
    if (performanceMode === 'low') delay = 2600;

    const resolveTimer = setTimeout(() => {
      setResolved(true);
      onResolve?.();

      // breath before sentence
      setTimeout(() => {
        setEntered(true);

        // settle into resting state
        setTimeout(() => {
          setResting(true);

          // unlock scroll + set global flag
          document.documentElement.classList.add('scroll-unlocked');
          document.documentElement.dataset.axptEntered = 'true';
        }, 1800);

      }, 400);

    }, delay);

    return () => clearTimeout(resolveTimer);
  }, [performanceMode, onResolve]);

  return (
    <section className={styles.container}>

      <div className={`${styles.sigilStage} ${resolved ? styles.resolved : ''}`}>
        
        <img
          src="/sigil/v4/axpt_sigil_V4_globe.png"
          alt=""
          className={styles.globe}
          draggable={false}
        />

        <img
          src="/sigil/v4/axpt_sigil_V4_wing_show.png"
          alt=""
          className={styles.wings}
          draggable={false}
        />

        <img
          src="/sigil/v4/axpt_sigil_V4_transparent.png"
          alt="AXPT Sigil"
          className={styles.seal}
          draggable={false}
        />
      </div>

      {/* Threshold Sentence */}
      {entered && (
        <div className={`${styles.threshold} ${resting ? styles.resting : ''}`}>
          You are now within AXPT
        </div>
      )}

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