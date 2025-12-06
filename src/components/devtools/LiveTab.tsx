// src/components/devtools/LiveTab.tsx
'use client';

import { ReactNode } from 'react';
import { useLive } from '@/context/LiveContext';
import { usePerformanceMode } from '@/hooks/usePerformanceMode';
import { useAudioReactiveLevel } from '@/hooks/useAudioReactiveLevel';
import styles from './LiveTab.module.css';

export default function LiveTab() {
  const live = useLive();
  const performanceMode = usePerformanceMode();
  const audioLevel = useAudioReactiveLevel();

  return (
    <div className={styles.panel}>
      <h2 className={styles.heading}>
        Live Diagnostics {live.online ? '●' : '○'}
      </h2>

      <Row label="Status" value={live.online ? 'Online' : 'Offline'} />
      <Row label="Viewers" value={live.viewers} />
      <Row label="Peak" value={live.peakViewers} />
      <Row
        label="Bitrate"
        value={live.bitrateKbps ? `${live.bitrateKbps} kbps` : '—'}
      />
      <Row
        label="Ingest"
        value={live.ingestHealthy ? 'Healthy' : 'Unstable'}
        color={live.ingestHealthy ? '#8fd' : '#f77'}
      />

      {/* New diagnostic rows */}
      <Row
        label="Performance Mode"
        value={performanceMode ? 'ON' : 'OFF'}
        color={performanceMode ? '#9f9' : undefined}
      />

      <Row
        label="Audio Level"
        value={audioLevel.toFixed(2)}
      />

      {live.error && (
        <div className={styles.errorBox}>{live.error}</div>
      )}

      <div className={styles.timestamp}>
        Updated:{' '}
        {live.lastUpdated
          ? new Date(live.lastUpdated).toLocaleTimeString()
          : '—'}
      </div>
    </div>
  );
}

type RowProps = {
  label: string;
  value: ReactNode;
  color?: string;
};

function Row({ label, value, color }: RowProps) {
  return (
    <div className={styles.row}>
      <span>{label}:</span>
      <span style={color ? { color } : undefined}>{value}</span>
    </div>
  );
}