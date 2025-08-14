'use client';

import styles from './AnomalyDetection.module.css';

type Status = 'healthy' | 'degraded' | 'offline';

interface DbPulseLog {
  id: string;
  createdAt: string;
  status?: Status;
  message?: string | null;
}

interface AnomalyDetectionProps {
  logs: DbPulseLog[];
}

export function AnomalyDetection({ logs }: AnomalyDetectionProps) {
  if (!logs.length) return null;

  const sorted = [...logs].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const anomalies: { type: 'gap' | 'status'; message: string }[] = [];

  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1];
    const curr = sorted[i];
    const gap = new Date(prev.createdAt).getTime() - new Date(curr.createdAt).getTime();
    const mins = Math.round(gap / 60000);

    if (mins > 45) {
      anomalies.push({
        type: 'gap',
        message: `⚠️ ${mins} min gap between logs ${i} and ${i + 1}`,
      });
    }

    if (prev.status && curr.status && prev.status !== curr.status) {
      anomalies.push({
        type: 'status',
        message: `❗ Status changed from ${prev.status.toUpperCase()} → ${curr.status.toUpperCase()} at log ${i + 1}`,
      });
    }
  }

  return (
    <div className={styles.anomalyContainer}>
      <h3 className={styles.title}>🧠 Anomaly Detection</h3>

      {anomalies.length > 0 ? (
        <>
          <div className={styles.count}>
            ⚠️ <strong>{anomalies.length}</strong> anomalies found.
          </div>
          <ul className={styles.anomalyList}>
            {anomalies.map((entry, i) => (
              <li
                key={i}
                className={
                  entry.type === 'gap' ? styles.timeGap : styles.statusShift
                }
              >
                {entry.message}
              </li>
            ))}
          </ul>
        </>
      ) : (
        <div className={styles.noIssues}>
          ✅ No anomalies detected in recent logs.
        </div>
      )}
    </div>
  );
}