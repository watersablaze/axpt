// 📁 components/tools/DbMonitorDashboard.tsx
'use client';

import { useEffect, useState } from 'react';
import styles from './DbMonitorDashboard.module.css';

interface LogEntry {
  timestamp: string;
  status: 'active' | 'idle' | 'error';
  message: string;
}

export default function DbMonitorDashboard() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await fetch('/api/db-monitor-log');
        const data = await res.json();
        setLogs(data.logs);
        setLoading(false);
      } catch (err) {
        console.error('Failed to load DB logs:', err);
        setLoading(false);
      }
    };

    fetchLogs();
    const interval = setInterval(fetchLogs, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Database Status Monitor</h2>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <ul className={styles.logList}>
          {logs.map((log, idx) => (
            <li key={idx} className={styles[log.status]}>
              <span className={styles.timestamp}>{log.timestamp}</span>
              <span className={styles.message}>{log.message}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}