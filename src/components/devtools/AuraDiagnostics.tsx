'use client';

import { useEffect } from 'react';
import { initAuraDesync } from '@/lib/aura/desyncAura';

export default function AuraDiagnostics() {
  // ✨ Pool of aura emojis — dev-only flair
  const emojis = ['⚡', '🌠', '🔮', '💫', '🌀', '🌙', '🌈', '🔥'];

  const logAuraState = () => {
    const root = getComputedStyle(document.documentElement);
    const duration = root.getPropertyValue('--aura-pulse-duration').trim();
    const color = root.getPropertyValue('--aura-pulse-color').trim();
    const blur = root.getPropertyValue('--aura-pulse-blur').trim();
    const desync = document.documentElement.dataset.auraDesync === 'true';

    const emoji = emojis[Math.floor(Math.random() * emojis.length)];
    const cssColor = color || 'rgba(255,230,150,0.5)';

    const colorStyle = `
      background: ${cssColor};
      color: #111;
      font-weight: 600;
      padding: 4px 10px;
      border-radius: 6px;
      box-shadow: 0 0 8px ${cssColor};
    `;

    console.clear();

    console.info(
      `%c${emoji} Aura Diagnostics — Current Harmonics`,
      colorStyle
    );

    console.table({
      'Pulse Duration': duration || '—',
      'Pulse Color': color || '—',
      'Blur Radius': blur || '—',
      'Desync Mode': desync ? 'Enabled' : 'Unified',
    });

    console.log(
      `%c↳ Dev-only aura diagnostics (CSS vars + localStorage + CustomEvent bridge)`,
      'color: #ccc; font-style: italic; font-size: 11px; padding-left: 2px;'
    );
  };

  useEffect(() => {
    // ⛔ HARD STOP: never run in production
    if (process.env.NODE_ENV !== 'development') return;

    initAuraDesync();
    logAuraState();

    const handleStorageChange = (e: StorageEvent) => {
      if (
        e.key &&
        [
          'auraPulseDuration',
          'auraPulseColor',
          'auraPulseBlur',
          'auraPulseSyncLock',
        ].includes(e.key)
      ) {
        logAuraState();
      }
    };

    const handleCustomUpdate = () => logAuraState();

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('auraUpdate', handleCustomUpdate);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('auraUpdate', handleCustomUpdate);
    };
  }, []);

  return null;
}