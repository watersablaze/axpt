'use client';

import { useEffect, useState } from 'react';

export default function BloomControl() {
  const [bloom, setBloom] = useState(1);

  // 🧭 Load stored bloom value from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('bloom-strength');
    if (stored) {
      const parsed = parseFloat(stored);
      if (!isNaN(parsed)) {
        setBloom(parsed);
        document.documentElement.style.setProperty('--bloom-strength', parsed.toString());
      }
    } else {
      // initialize CSS variable with default
      document.documentElement.style.setProperty('--bloom-strength', '1');
    }
  }, []);

  // 💾 Whenever bloom changes, save & apply immediately
  useEffect(() => {
    document.documentElement.style.setProperty('--bloom-strength', bloom.toString());
    localStorage.setItem('bloom-strength', bloom.toString());
  }, [bloom]);

  useEffect(() => {
  console.log(`🌟 Bloom strength now: ${bloom.toFixed(2)}`);
}, [bloom]);

  // only show this overlay during development
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
        userSelect: 'none',
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
        style={{
          width: '140px',
          accentColor: '#e6c667',
          cursor: 'pointer',
        }}
      />
    </div>
  );
}