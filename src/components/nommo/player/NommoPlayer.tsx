'use client';

import { useLive } from '@/context/LiveContext';
import VideoStream from './VideoStream';
import LiveOverlays from './LiveOverlays';
import LiveTriggers from './LiveTriggers';
import styles from './NommoPlayer.module.css';

export default function NommoPlayer() {
  const live = useLive();

  return (
    <div className={styles.playerRoot} data-nommo-player>
      {/* 🔴 Stream Offline → show portal gate */}
      {!live.online && <OfflineGate />}

      {/* 🟢 Stream Live → real video */}
      {live.online && (
        <>
          <VideoStream />
          <LiveOverlays />
          <LiveTriggers />
        </>
      )}
    </div>
  );
}

function OfflineGate() {
  return (
    <div className={styles.offlineGate}>
      <h2>Broadcast link established…</h2>
      <p>Awaiting transmission.</p>
    </div>
  );
}