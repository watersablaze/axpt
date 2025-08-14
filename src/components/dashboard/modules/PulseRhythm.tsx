'use client';

import { useEffect, useState } from 'react';
import styles from './PulseRhythm.module.css';

type Status = 'healthy' | 'degraded' | 'offline';

interface PulseRhythmProps {
  lastPulse: string;
  status?: Status;
}

export function PulseRhythm({ lastPulse, status = 'offline' }: PulseRhythmProps) {
  const [relativeTime, setRelativeTime] = useState('');

  const safeStatus: Status = ['healthy', 'degraded', 'offline'].includes(status || '')
    ? (status as Status)
    : 'offline';

  const pulseLabel = {
    healthy: '🟢 Stable',
    degraded: '🟡 Degraded',
    offline: '🔴 Offline',
  }[safeStatus];

  useEffect(() => {
    const interval = setInterval(() => {
      const msAgo = Date.now() - new Date(lastPulse).getTime();
      const minAgo = Math.floor(msAgo / 60000);
      setRelativeTime(`${minAgo} min ago`);
    }, 60000);

    // Initial set
    const msAgo = Date.now() - new Date(lastPulse).getTime();
    setRelativeTime(`${Math.floor(msAgo / 60000)} min ago`);

    return () => clearInterval(interval);
  }, [lastPulse]);

  return (
    <div className={`${styles.pulseModule} ${styles[safeStatus]}`}>
      <h4 className={styles.title}>🫀 Pulse Rhythm</h4>

      <div className={styles.pulseIndicator}>
        <span className={`${styles.pulseDot} ${styles[`dot-${safeStatus}`]}`} />
        <span className={styles.statusText}>{pulseLabel}</span>
      </div>

      <div className={styles.timestamp}>
        <span className={styles.label}>Last Ping:</span>{' '}
        {new Date(lastPulse).toLocaleString()} ({relativeTime})
      </div>
    </div>
  );
}