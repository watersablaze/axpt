'use client';

import { useMirrorRay } from '@/lib/context/MirrorRayContext';

export default function ModeTab() {
  const { uiMode, setUIMode, modeLabel, modeDescription, color } = useMirrorRay();

  return (
    <div>
      <h3 style={{ marginTop: 0, color }}>{modeLabel}</h3>
      <p style={{ opacity: 0.85, fontSize: '0.8rem' }}>{modeDescription}</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
        {(['oracle', 'elder', 'nommo'] as const).map((m) => (
          <button
            key={m}
            onClick={() => setUIMode(m)}
            style={{
              padding: '8px',
              borderRadius: '6px',
              border: uiMode === m ? `1px solid ${color}` : '1px solid rgba(255,255,255,0.12)',
              background: uiMode === m ? `${color}22` : 'rgba(255,255,255,0.06)',
              cursor: 'pointer',
              color: '#eee',
              textTransform: 'capitalize',
            }}
          >
            {m}
          </button>
        ))}
      </div>
    </div>
  );
}