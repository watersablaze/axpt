'use client';

import { memo } from 'react';

type Props = {
  opacity?: number;
  zIndex?: number;
};

function SigilOverlay({ opacity = 0.08, zIndex = 0 }: Props) {
  // Purely presentational: no hooks, no conditionals that change hooks count.
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        zIndex,
        pointerEvents: 'none',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'url(/images/axpt-sigil-main.png)',
          backgroundSize: 'contain',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center',
          opacity,
          transform: 'translateZ(0)',
          filter: 'contrast(105%) brightness(105%)',
        }}
      />
      {/* subtle radial mask to keep edges calm */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(60% 60% at 50% 40%, rgba(255,255,255,0.06) 0%, rgba(0,0,0,0.65) 100%)',
          mixBlendMode: 'soft-light',
        }}
      />
    </div>
  );
}

export default memo(SigilOverlay);