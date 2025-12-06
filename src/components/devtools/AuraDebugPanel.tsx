'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import styles from './AuraDebugPanel.module.css';
import { applyAuraDesync } from '@/lib/aura/desyncAura';

export default function AuraDebugPanel({ embedded = false }: { embedded?: boolean }) {
  const [duration, setDuration] = useState(5.5);
  const [color, setColor] = useState('#ffe696');
  const [blur, setBlur] = useState(12);
  const [visible, setVisible] = useState(true);
  const [syncLock, setSyncLock] = useState(true);

  // INITIAL LOAD
  useEffect(() => {
    const savedDuration = localStorage.getItem('auraPulseDuration');
    const savedColor = localStorage.getItem('auraPulseColor');
    const savedBlur = localStorage.getItem('auraPulseBlur');
    const savedSync = localStorage.getItem('auraPulseSyncLock');
    const savedDesync = localStorage.getItem('auraDesyncEnabled');

    if (savedDuration) setDuration(parseFloat(savedDuration));
    if (savedColor) setColor(savedColor);
    if (savedBlur) setBlur(parseInt(savedBlur));
    if (savedSync) setSyncLock(savedSync === 'true');
    if (savedDesync === 'true') setSyncLock(false);
  }, []);

  // APPLY GLOBAL VARIABLES
  useEffect(() => {
    const root = document.documentElement;

    if (syncLock) {
      root.style.setProperty('--aura-pulse-duration', `${duration}s`);
    } else {
      const offset = duration + (Math.random() - 0.5) * 1.2;
      root.style.setProperty('--aura-pulse-duration', `${offset}s`);
    }

    root.style.setProperty('--aura-pulse-color', color);
    root.style.setProperty('--aura-pulse-blur', `${blur}px`);

    localStorage.setItem('auraPulseDuration', duration.toString());
    localStorage.setItem('auraPulseColor', color);
    localStorage.setItem('auraPulseBlur', blur.toString());
    localStorage.setItem('auraPulseSyncLock', syncLock.toString());
    localStorage.setItem('auraDesyncEnabled', (!syncLock).toString());

    applyAuraDesync?.(!syncLock);
    window.dispatchEvent(new CustomEvent('auraUpdate'));
  }, [duration, color, blur, syncLock]);

  const reshuffleDesync = () => {
    if (!syncLock) {
      const offset = duration + (Math.random() - 0.5) * 1.2;
      document.documentElement.style.setProperty(
        '--aura-pulse-duration',
        `${offset}s`
      );
      applyAuraDesync?.(!syncLock);
    }
  };

  /* ───────────────────────────────
    EMBEDDED MODE (HUD Tab)
    ─────────────────────────────── */
  if (embedded) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
        {/* PREVIEW */}
        <motion.div
          style={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            margin: '0 auto',
          }}
          animate={{
            scale: [1, 1.15, 1],
            opacity: [0.6, 1, 0.6],
            boxShadow: [
              `0 0 ${blur}px ${color}`,
              `0 0 ${blur * 2}px ${color}`,
              `0 0 ${blur}px ${color}`,
            ],
          }}
          transition={{ duration, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* DURATION */}
        <label className={styles.label}>
          Duration: {duration.toFixed(1)}s
          <input
            type="range"
            min="2"
            max="10"
            step="0.1"
            value={duration}
            onChange={(e) => setDuration(parseFloat(e.target.value))}
            className={styles.input}
          />
        </label>

        {/* BLUR */}
        <label className={styles.label}>
          Blur: {blur}px
          <input
            type="range"
            min="4"
            max="30"
            step="1"
            value={blur}
            onChange={(e) => setBlur(parseInt(e.target.value))}
            className={styles.input}
          />
        </label>

        {/* COLOR */}
        <label className={styles.label}>
          Color:
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className={styles.input}
          />
        </label>

        {/* SYNC TOGGLE */}
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <label className={styles.toggle}>
            <input
              type="checkbox"
              checked={syncLock}
              onChange={(e) => setSyncLock(e.target.checked)}
            />
            Sync Lock
          </label>

          {!syncLock && (
            <button
              className={styles.reshuffle}
              onClick={reshuffleDesync}
              style={{ padding: '0.25rem 0.5rem' }}
            >
              ↻
            </button>
          )}
        </div>
      </div>
    );
  }

  /* ───────────────────────────────
    STANDALONE MODE (OLD FLOATING PANEL)
    ─────────────────────────────── */
  return (
    <div className={styles.panel}>
      <div className={styles.header} onClick={() => setVisible(!visible)}>
        ⚡ Aura Debug Panel {visible ? '▲' : '▼'}
      </div>

      {visible && (
        <div className={styles.controls}>
          {/* (same content as embedded, omitted for brevity) */}
          {/* You can keep or prune this based on preference */}
        </div>
      )}
    </div>
  );
}