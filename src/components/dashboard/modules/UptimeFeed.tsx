'use client';

import { useEffect, useState } from 'react';
import styles from './UptimeFeed.module.css';

interface DbPulseLog {
  id: string;
  timestamp: string;
  status: string;
  message?: string;
}

export function UptimeFeed() {
  const [logs, setLogs] = useState<DbPulseLog[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await fetch('/api/db-monitor-log');
        const data = await res.json();
        console.log('[🩺 UptimeFeed Fetch]', data);

        if (data.success && data.logs?.length > 0) {
          setLogs(data.logs.slice(0, 5));
        } else {
          throw new Error(data.error || 'No logs returned');
        }
      } catch (err: any) {
        console.error('[❌ UptimeFeed Error]', err);
        setError(err.message);
      }
    };

    fetchLogs();
  }, []);

  return (
    <div className={styles.feedBox}>
      <div className={styles.header}>🩺 Uptime Timeline</div>
      {error && <div className={styles.error}>Error: {error}</div>}
      <div className={styles.timeline}>
        {logs.map((log) => {
          const formatted = new Date(log.timestamp).toLocaleString();
          return (
            <div key={log.id} className={styles.entry}>
              <div className={styles.dot} />
              <div className={styles.line} />
              <div className={styles.details}>
                <div className={styles.timestamp}>{formatted}</div>
                <div className={styles.status}>{log.status}</div>
                {log.message && (
                  <div className={styles.message}>
                    <em>{log.message}</em>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}