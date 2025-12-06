'use client';

import type { ViewerAnalyticsPoint } from '@/lib/live/owncastTypes';
import styles from './PeakViewersGraph.module.css';

interface Props {
  data: ViewerAnalyticsPoint[];
  isLoading?: boolean;
  error?: string | null;
}

function groupByDay(data: ViewerAnalyticsPoint[]) {
  const map = new Map<string, number>();

  for (const point of data) {
    const day = point.timestamp.slice(0, 10); // YYYY-MM-DD
    const current = map.get(day) ?? 0;
    map.set(day, Math.max(current, point.viewers));
  }

  return Array.from(map.entries()).map(([date, viewers]) => ({
    date,
    viewers,
  }));
}

export default function PeakViewersGraph({ data, isLoading, error }: Props) {
  const grouped = groupByDay(data);

  if (isLoading) return <p className={styles.message}>Loading peaks…</p>;
  if (error) return <p className={styles.error}>Error: {error}</p>;
  if (!grouped.length)
    return <p className={styles.message}>No data for peak viewers yet.</p>;

  const max = Math.max(...grouped.map((g) => g.viewers), 1);

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>Peak Viewers by Day</h3>

      <div className={styles.barWrap}>
        {grouped.map((g) => (
          <div key={g.date} className={styles.barRow}>
            <div
              className={styles.bar}
              style={{ width: `${(g.viewers / max) * 100}%` }}
            />
            <span className={styles.label}>
              {g.date}: {g.viewers}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}