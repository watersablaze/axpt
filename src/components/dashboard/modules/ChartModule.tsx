'use client';

import { useEffect, useState } from 'react';
import styles from './ChartModule.module.css';
import { LineChart, Line, Tooltip, ResponsiveContainer } from 'recharts';

interface DbPulseLog {
  id: string;
  createdAt: string;
}

interface ChartPoint {
  hour: string;
  count: number;
}

export function ChartModule() {
  const [data, setData] = useState<ChartPoint[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAndProcess = async () => {
      try {
        const res = await fetch('/api/db-monitor-log');
        const { success, logs, error } = await res.json();

        if (!success || !logs) throw new Error(error || 'No logs');

        const counts: Record<string, number> = {};
        for (const log of logs) {
          const date = new Date(log.createdAt);
          const hour = date.getHours().toString().padStart(2, '0') + ':00';
          counts[hour] = (counts[hour] || 0) + 1;
        }

        const result: ChartPoint[] = Object.entries(counts)
          .map(([hour, count]) => ({ hour, count }))
          .sort((a, b) => a.hour.localeCompare(b.hour));

        setData(result);
      } catch (err: any) {
        console.error('[ChartModule Error]', err);
        setError(err.message);
      }
    };

    fetchAndProcess();
  }, []);

  return (
    <div className={styles.chartBox}>
      <div className={styles.header}>📈 Pulse Chart</div>
      {error && <div className={styles.error}>Error: {error}</div>}
      <ResponsiveContainer width="100%" height={140}>
        <LineChart data={data}>
          <Line type="monotone" dataKey="count" stroke="#00f5d4" strokeWidth={2} dot={false} />
          <Tooltip />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}