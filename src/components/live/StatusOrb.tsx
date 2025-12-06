'use client';

import type { OwncastHealth } from '@/lib/live/owncastTypes';
import styles from './StatusOrb.module.css';

interface Props {
  health: OwncastHealth | null;
  className?: string;
}

export default function StatusOrb({ health, className }: Props) {
  const online = health?.online ?? false;
  const error = health?.error;

  const color = online ? '#00ffbf' : '#ff6565';
  const pulse = online ? styles.pulse : styles.still;

  return (
    <div className={`${styles.orbWrapper} ${className ?? ''}`}>
      <div
        className={`${styles.orb} ${pulse}`}
        style={{ background: color, boxShadow: `0 0 16px ${color}80` }}
      />

      <div className={styles.label}>
        {online ? 'LIVE' : error ? 'Offline (Err)' : 'Offline'}
      </div>
    </div>
  );
}