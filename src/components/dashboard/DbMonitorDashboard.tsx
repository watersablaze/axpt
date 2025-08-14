'use client';

import { useEffect, useState } from 'react';
import styles from './DbMonitorDashboard.module.css';

import { PulseRhythm } from './modules/PulseRhythm';
import { AlertModule } from './modules/AlertModule';
import { UptimeFeed } from './modules/UptimeFeed';
import { ChartModule } from './modules/ChartModule';
import { AnomalyDetection } from './modules/AnomalyDetection';
import { VaultEntryCard } from '@/components/dashboard/modules/VaultEntryCard';

type LogStatus = 'healthy' | 'degraded' | 'offline';

interface PulseLogEntry {
  id: string;
  createdAt: string;
  status?: string;
  message?: string;
}

interface DbPulseLog {
  id: string;
  createdAt: string;
  status: LogStatus;
  message: string;
}

function normalizeStatus(status: string | undefined): LogStatus {
  const normalized = status?.toLowerCase();
  if (normalized === 'healthy' || normalized === 'offline') return normalized;
  return 'degraded'; // fallback default
}

export default function DbMonitorDashboard() {
  const [logs, setLogs] = useState<DbPulseLog[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await fetch('/api/db-monitor-log', { method: 'GET' });
        const data = await res.json();
        console.log('[🛠️ DB Fetch]', data);

        if (data.success && Array.isArray(data.logs)) {
          const normalizedLogs = data.logs.map((log: PulseLogEntry): DbPulseLog => ({
            id: log.id,
            createdAt: log.createdAt,
            status: normalizeStatus(log.status),
            message: log.message || 'No message provided.',
          }));
          setLogs(normalizedLogs);
        } else {
          throw new Error(data.error || 'No logs returned');
        }
      } catch (err: any) {
        console.error('[❌ DB Pulse Error]', err);
        setError(err.message);
      }
    };

    fetchLogs();
  }, []);

  const latestLog = logs.length > 0 ? logs[0] : null;

  return (
    <div className={styles.dashboardContainer}>
      <h2 className={styles.dashboardTitle}>📊 DB Pulse Logs</h2>

      <div className={styles.moduleBox}>
        <h3 className={styles.cockpitTitle}>🛰️ Cockpit Module</h3>

        {error && <div className={styles.errorBox}>Error: {error}</div>}
        {!logs.length && !error && (
          <div className={styles.loading}>⏳ Waiting for pulse...</div>
        )}

        <div className={styles.modulesGrid}>
          {latestLog && (
            <>
              <VaultEntryCard title="Pulse Rhythm">
                <PulseRhythm lastPulse={latestLog.createdAt} />
              </VaultEntryCard>
              <VaultEntryCard title="Alert Module">
                <AlertModule
                  latestLog={{
                    status: latestLog.status,
                    message: latestLog.message,
                    createdAt: latestLog.createdAt,
                  }}
                />
              </VaultEntryCard>
            </>
          )}
          <VaultEntryCard title="Chart Analytics">
            <ChartModule />
          </VaultEntryCard>
          <VaultEntryCard title="Uptime Feed">
            <UptimeFeed />
          </VaultEntryCard>
          <VaultEntryCard title="Anomaly Detection">
            <AnomalyDetection logs={logs} />
          </VaultEntryCard>
        </div>
      </div>
    </div>
  );
}