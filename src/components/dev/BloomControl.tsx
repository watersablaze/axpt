'use client';

import { useEffect, useState } from 'react';

export default function BloomControl({ embedded = false }: { embedded?: boolean }) {
  const [bloom, setBloom] = useState(1);

  // Load saved value
  useEffect(() => {
    const stored = localStorage.getItem('bloom-strength');
    const parsed = stored ? parseFloat(stored) : NaN;

    const initial = !isNaN(parsed) ? parsed : 1;
    setBloom(initial);
    document.documentElement.style.setProperty('--bloom-strength', initial.toString());
  }, []);

  // Save & apply
  useEffect(() => {
    document.documentElement.style.setProperty('--bloom-strength', bloom.toString());
    localStorage.setItem('bloom-strength', bloom.toString());
  }, [bloom]);

  /* ───────── EMBEDDED MODE ───────── */
  if (embedded) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
        <div style={{ fontSize: '0.85rem', opacity: 0.8 }}>
          ✨ Bloom {bloom.toFixed(2)}
        </div>
        <input
          type="range"
          min="0.5"
          max="2.0"
          step="0.05"
          value={bloom}
          onChange={(e) => setBloom(parseFloat(e.target.value))}
          style={{ width: '100%', accentColor: '#e6c667' }}
        />
      </div>
    );
  }

  /* ───────── STANDALONE MODE (OLD FLOATING PANEL) ───────── */
  if (process.env.NODE_ENV !== 'development') return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        padding: '10px 14px',
        background: 'rgba(0, 0, 0, 0.65)',
        border: '1px solid rgba(255, 255, 255, 0.25)',
        borderRadius: '12px',
        zIndex: 9999,
        backdropFilter: 'blur(8px)',
        color: 'white',
        fontFamily: 'monospace',
        fontSize: '14px',
      }}
    >
      <label style={{ display: 'block', marginBottom: '6px' }}>
        ✨ Bloom {bloom.toFixed(2)}
      </label>
      <input
        type="range"
        min="0.5"
        max="2.0"
        step="0.05"
        value={bloom}
        onChange={(e) => setBloom(parseFloat(e.target.value))}
        style={{ width: '140px', accentColor: '#e6c667' }}
      />
    </div>
  );
}