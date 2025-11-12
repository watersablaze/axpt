'use client';

import { useEffect } from 'react';
import { initAuraDesync } from '@/lib/aura/desyncAura';

export default function AuraInitializer() {
  // ✨ Pool of aura emojis — changes with each update
  const emojis = ['⚡', '🌠', '🔮', '💫', '🌀', '🌙', '🌈', '🔥'];

  // 🎛 Logs aura state with adaptive styling
  const logAuraState = () => {
    const root = getComputedStyle(document.documentElement);
    const duration = root.getPropertyValue('--aura-pulse-duration').trim();
    const color = root.getPropertyValue('--aura-pulse-color').trim();
    const blur = root.getPropertyValue('--aura-pulse-blur').trim();
    const desync = document.documentElement.dataset.auraDesync === 'true';

    // Pick a random emoji for flair
    const emoji = emojis[Math.floor(Math.random() * emojis.length)];

    // Dynamic color style for console banner
    const cssColor = color || 'rgba(255,230,150,0.5)';
    const colorStyle = `
      background: ${cssColor};
      color: #111;
      font-weight: 600;
      padding: 4px 10px;
      border-radius: 6px;
      box-shadow: 0 0 8px ${cssColor};
    `;

    // Clear previous logs for freshness
    console.clear();

    // 🎨 Header banner
    console.info(
      `%c${emoji} Aura Field Active — Current Harmonics`,
      colorStyle
    );

    // 📊 Structured data view
    console.table({
      'Pulse Duration': duration || '—',
      'Pulse Color': color || '—',
      'Blur Radius': blur || '—',
      'Desync Mode': desync ? 'Enabled' : 'Unified',
    });

    // Small tagline for ambiance
    console.log(
      `%c↳ aura variables live-tracked via localStorage + CustomEvent bridge`,
      'color: #ccc; font-style: italic; font-size: 11px; padding-left: 2px;'
    );
  };

  useEffect(() => {
    // 🪶 Initialize aura desync system
    initAuraDesync();

    if (process.env.NODE_ENV === 'development') {
      logAuraState();

      // 🔁 Listen for aura updates (from panel sliders or sync toggles)
      const handleStorageChange = (e: StorageEvent) => {
        if (
          e.key &&
          ['auraPulseDuration', 'auraPulseColor', 'auraPulseBlur', 'auraPulseSyncLock'].includes(e.key)
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
    }
  }, []);

  return null;
}