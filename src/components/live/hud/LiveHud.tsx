'use client';

import { useState, useEffect } from 'react';
import { useLive } from '@/context/LiveContext';
import { eventBus } from '@/lib/oracle/EventBus';
import LiveMiniPanel from '@/components/nommo/panel/LiveMiniPanel';
import styles from './LiveHud.module.css';
import { useLiveBridge } from '@/lib/live/LiveBridge';

export default function LiveHud() {
  useLiveBridge(); // ensures WS bridge is active

  const live = useLive();
  const [open, setOpen] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  /** Offset HUD if Nommo Orb is present */
  useEffect(() => {
    const orb = document.querySelector('[data-nommo-orb]');
    if (!orb) return;

    const rect = orb.getBoundingClientRect();
    setOffset({ x: 0, y: rect.height + 20 });
  }, []);

  /** Remote open Mini HUD */
  useEffect(() => {
    const unsub = eventBus.on('live:open-mini', () => setOpen(true));
    return () => unsub();
  }, []);

  /** Orb color system */
  const color = live.loading
    ? 'var(--hud-color-wait)'
    : live.online
    ? 'var(--hud-color-live)'
    : 'var(--hud-color-offline)';

  return (
    <div
      className={styles.container}
      style={{ bottom: `${22 + offset.y}px`, right: `${22 + offset.x}px` }}
      data-live-hud
    >
      {/* ORB */}
      <button
        className={styles.orb}
        style={{ backgroundColor: color }}
        onClick={() => setOpen(o => !o)}
      >
        <span className={styles.pulse} />
      </button>

      {/* PANEL */}
      {open && (
        <div className={styles.panel}>

          <h4 className={styles.heading}>
            Live Status {live.online ? '●' : '○'}
          </h4>

          <Row label="Status" value={live.online ? 'Online' : 'Offline'} />
          <Row label="Viewers" value={live.viewers} />
          <Row label="Peak" value={live.peakViewers} />
          <Row
            label="Bitrate"
            value={live.bitrateKbps ? `${live.bitrateKbps} kbps` : '—'}
          />

          {/* 🔥 Mini Panel */}
          <div className={styles.row}>
            <LiveMiniPanel />
          </div>

          <Row
            label="Ingest"
            value={live.ingestHealthy ? 'Healthy' : 'Unstable'}
            color={live.ingestHealthy ? '#9cf' : '#f66'}
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
      )}
    </div>
  );
}

function Row({ label, value, color }: any) {
  return (
    <div className={styles.row}>
      <span>{label}:</span>
      <span style={{ color }}>{value}</span>
    </div>
  );
}