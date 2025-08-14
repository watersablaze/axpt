'use client';

import { useEffect, useState } from 'react';
import styles from './ConstellationOverlay.module.css';

export default function ConstellationOverlay() {
  const [stars, setStars] = useState<JSX.Element[]>([]);
  const [guardians, setGuardians] = useState<JSX.Element[]>([]);

  useEffect(() => {
    const twinkleStars = Array.from({ length: 80 }).map((_, i) => {
      const size = Math.random() * 2 + 1;
      const top = Math.random() * 100;
      const left = Math.random() * 100;
      const duration = Math.random() * 2 + 1.5;
      const drift = Math.random() < 0.5 ? 'driftLeft' : 'driftRight';
      const delay = Math.random() * 5;

      return (
        <div
          key={`twinkle-${i}`}
          className={`${styles.star} ${styles[drift]}`}
          style={{
            width: `${size}px`,
            height: `${size}px`,
            top: `${top}%`,
            left: `${left}%`,
            animationDuration: `${duration}s, ${10 + Math.random() * 10}s`,
            animationDelay: `${0}s, ${delay}s`,
          }}
        />
      );
    });

    const guardianStars = Array.from({ length: 7 }).map((_, i) => {
      const size = Math.random() * 3 + 5; // larger
      const top = Math.random() * 100;
      const left = Math.random() * 100;
      const xDrift = 20 + Math.random() * 20;
      const yDrift = 20 + Math.random() * 30;
      const duration = 30 + Math.random() * 30;

      return (
        <div
          key={`guardian-${i}`}
          className={`${styles.guardian}`}
          style={{
            width: `${size}px`,
            height: `${size}px`,
            top: `${top}%`,
            left: `${left}%`,
            animationDuration: `${duration}s`,
            animationDelay: `${Math.random() * 10}s`,
            '--xDrift': `${xDrift}px`,
            '--yDrift': `${yDrift}px`,
          } as React.CSSProperties}
        />
      );
    });

    setStars(twinkleStars);
    setGuardians(guardianStars);
  }, []);

  return (
    <div className={styles.overlay}>
      {guardians}
      {stars}
    </div>
  );
}