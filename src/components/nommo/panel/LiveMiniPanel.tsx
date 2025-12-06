'use client';

import { useLive } from '@/context/LiveContext';
import styles from './LiveMiniPanel.module.css';
import { eventBus } from '@/lib/oracle/EventBus';

export default function LiveMiniPanel() {
  const live = useLive();

  const goToLiveTab = () => {
    eventBus.emit('nommo:switch-tab', { tab: 'live' });
  };

  const openFull = () => {
  eventBus.emit('nommo:switch-tab', { tab: 'live' });
  eventBus.emit('live:open-full', {});
};

  return (
    <div className={styles.panel}>
      <h4 className={styles.heading}>
        Live Status {live.online ? '●' : '○'}
      </h4>

      <div className={styles.row}>
        <span>Status:</span>
        <span>{live.online ? 'Online' : 'Offline'}</span>
      </div>

      <div className={styles.row}>
        <span>Viewers:</span>
        <span>{live.viewers}</span>
      </div>

      <div className={styles.row}>
        <span>Peak:</span>
        <span>{live.peakViewers}</span>
      </div>

      <div className={styles.row}>
        <span>Bitrate:</span>
        <span>{live.bitrateKbps ? `${live.bitrateKbps} kbps` : '—'}</span>
      </div>

      <div className={styles.row}>
        <span>Ingest:</span>
        <span style={{ color: live.ingestHealthy ? '#8fd' : '#f77' }}>
          {live.ingestHealthy ? 'Healthy' : 'Unstable'}
        </span>
      </div>

      {live.error && (
        <div className={styles.errorBox}>{live.error}</div>
      )}

      <div className={styles.timestamp}>
        Updated:{' '}
        {live.lastUpdated
          ? new Date(live.lastUpdated).toLocaleTimeString()
          : '—'}
      </div>

    <button className={styles.openButton} onClick={openFull}>
      Open Full Console →
    </button>
    </div>
  );
}