'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import styles from './AuraDebugPanel.module.css';
import { applyAuraDesync } from '@/lib/aura/desyncAura';

export default function AuraDebugPanel() {
  const [duration, setDuration] = useState(5.5);
  const [color, setColor] = useState('#ffe696');
  const [blur, setBlur] = useState(12);
  const [visible, setVisible] = useState(false);
  const [syncLock, setSyncLock] = useState(true);

  // 🗄️ Load stored preferences (including desync)
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
    if (savedDesync === 'true') setSyncLock(false); // reflect prior desync mode
  }, []);

  // 🌀 Apply global aura variables and persist settings
  useEffect(() => {
    const root = document.documentElement;

    // Update timing based on sync state
    if (syncLock) {
      root.style.setProperty('--aura-pulse-duration', `${duration}s`);
    } else {
      const offsetDur = duration + (Math.random() - 0.5) * 1.2;
      root.style.setProperty('--aura-pulse-duration', `${offsetDur}s`);
    }

    root.style.setProperty('--aura-pulse-color', color);
    root.style.setProperty('--aura-pulse-blur', `${blur}px`);

    // Persist values
    localStorage.setItem('auraPulseDuration', duration.toString());
    localStorage.setItem('auraPulseColor', color);
    localStorage.setItem('auraPulseBlur', blur.toString());
    localStorage.setItem('auraPulseSyncLock', syncLock.toString());
    localStorage.setItem('auraDesyncEnabled', (!syncLock).toString());

    // 🔊 Notify the aura logger in real-time
window.dispatchEvent(new CustomEvent('auraUpdate'));

    // Apply aura state to document
    applyAuraDesync?.(!syncLock);
  }, [duration, color, blur, syncLock]);

  // 🪶 Notify AuraInitializer (for live console updates)
window.dispatchEvent(new CustomEvent('auraUpdate'));

  // 🔁 Manual reshuffle (re-randomize desyncs)
  const reshuffleDesync = () => {
    if (!syncLock) {
      document.documentElement.style.setProperty(
        '--aura-pulse-duration',
        `${duration + (Math.random() - 0.5) * 1.2}s`
      );
      applyAuraDesync?.(!syncLock); // ✅ now type-safe and persistent
    }
  };

  return (
    <div className={`${styles.panel} ${visible ? styles.visible : ''}`}>
      <div className={styles.header} onClick={() => setVisible(!visible)}>
        ⚡ Aura Debug Panel {visible ? '▲' : '▼'}
      </div>

      {visible && (
        <div className={styles.controls}>
          {/* 🫧 Live Pulse Preview */}
          <motion.div
            className={styles.preview}
            animate={{
              scale: [1, 1.15, 1],
              opacity: [0.6, 1, 0.6],
              boxShadow: [
                `0 0 ${blur}px ${color}`,
                `0 0 ${blur * 2}px ${color}`,
                `0 0 ${blur}px ${color}`,
              ],
            }}
            transition={{
              duration,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />

          {/* Duration control */}
          <label className={styles.label}>
            Duration: <span>{duration.toFixed(1)}s</span>
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

          {/* Blur control */}
          <label className={styles.label}>
            Blur: <span>{blur}px</span>
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

          {/* Color control */}
          <label className={styles.label}>
            Color:
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className={styles.input}
            />
          </label>

          {/* 🔒 Sync Lock Toggle */}
          <div className={styles.toggleRow}>
            <label className={styles.toggle}>
              <input
                type="checkbox"
                checked={syncLock}
                onChange={(e) => setSyncLock(e.target.checked)}
              />
              Sync Lock
            </label>

            {!syncLock && (
              <button className={styles.reshuffle} onClick={reshuffleDesync}>
                ↻ Reshuffle
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}