// src/components/nommo/ceremony/CeremonyEngine.tsx
'use client';

import { useEffect, useState } from 'react';
import { eventBus } from '@/lib/oracle/EventBus';
import { usePerformanceMode } from '@/hooks/usePerformanceMode';
import { useAudioReactiveLevel } from '@/hooks/useAudioReactiveLevel';
import styles from './CeremonyEngine.module.css';

type Phase = 'idle' | 'opening' | 'active' | 'surge' | 'warning';

export default function CeremonyEngine() {
  const [phase, setPhase] = useState<Phase>('idle');
  const performanceMode = usePerformanceMode();
  const level = useAudioReactiveLevel(); // 0 → 1

  // Map audio intensity into visual strength
  const audioIntensity = performanceMode
    ? Math.min(1, level * 1.6) // a bit more sensitive in performance mode
    : level;

  // Stream lifecycle → phases
  useEffect(() => {
    const unsubOpen = eventBus.on('nommo:ceremony:opened', () => {
      setPhase('opening');
      setTimeout(() => setPhase('active'), 5000);
    });

    const unsubSpike = eventBus.on('nommo:spike', () => {
      setPhase('surge');
      setTimeout(() => setPhase('active'), 3000);
    });

    const unsubWarn = eventBus.on('nommo:warning', () => {
      setPhase('warning');
    });

    return () => {
      unsubOpen();
      unsubSpike();
      unsubWarn();
    };
  }, []);

  return (
    <div
      className={styles.root}
      data-phase={phase}
      data-performance={performanceMode ? 'on' : 'off'}
      style={
        {
          // audio intensity passed into CSS as a variable
          '--audio-level': audioIntensity.toString(),
        } as React.CSSProperties
      }
    >
      {/* Aura is always present but modulated by audio */}
      <div className={styles.aura} />

      {/* Gate opening on ceremony start */}
      <div className={styles.gate} />

      {/* Viewer spike surge */}
      <div className={styles.surge} />

      {/* Ingest / warning state */}
      <div className={styles.warning} />
    </div>
  );
}