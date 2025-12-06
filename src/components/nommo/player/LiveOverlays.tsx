'use client';

import { useLive } from '@/context/LiveContext';
import styles from './LiveOverlays.module.css';

export default function LiveOverlays() {
  const live = useLive();

  return (
    <div className={styles.overlayRoot}>
      {/* Aura border */}
      <div
        className={styles.aura}
        style={{
          opacity: live.online ? 1 : 0,
          boxShadow: live.online
            ? `0 0 40px ${live.bitrateKbps > 2000 ? '#00ffbfcc' : '#ff0066aa'}`
            : 'none'
        }}
      />

      {/* Bitrate pulse */}
      <div
        className={styles.pulse}
        data-strength={live.bitrateKbps ?? 0}
      />

      {/* Viewer count indicator */}
      <div className={styles.viewers}>
        {live.viewers} viewers connected
      </div>
    </div>
  );
}