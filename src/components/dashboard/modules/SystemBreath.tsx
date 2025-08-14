'use client';

import styles from './SystemBreath.module.css';

interface DbPulseLog {
  id: string;
  timestamp: string;
}

interface Props {
  logs: DbPulseLog[];
}

export function SystemBreath({ logs }: Props) {
  if (logs.length < 2) return <div className={styles.breathBox}>Waiting for breath data…</div>;

  // Compute average interval in minutes
  const intervals: number[] = [];
  for (let i = 0; i < logs.length - 1; i++) {
    const current = new Date(logs[i].timestamp).getTime();
    const next = new Date(logs[i + 1].timestamp).getTime();
    const diffMin = Math.abs(current - next) / 60000;
    intervals.push(diffMin);
  }

  const avgInterval = intervals.reduce((sum, val) => sum + val, 0) / intervals.length;
  const rounded = Math.round(avgInterval * 10) / 10;

  let status = 'stable';
  if (rounded > 6) status = 'unstable';
  else if (rounded > 2.5) status = 'irregular';

  return (
    <div className={`${styles.breathBox} ${styles[status]}`}>
      <div className={styles.aura} />
      <div className={styles.stats}>
        <div className={styles.label}>System Breath</div>
        <div className={styles.interval}>{rounded} min avg</div>
        <div className={styles.quality}>
          {status === 'stable' && '💚 Consistent'}
          {status === 'irregular' && '🟡 Irregular'}
          {status === 'unstable' && '🔴 Unstable'}
        </div>
      </div>
    </div>
  );
}