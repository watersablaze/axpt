// ✅ OrbAnimation.tsx (Lottie)
'use client';

import React from 'react';
import { Player } from '@lottiefiles/react-lottie-player';

interface OrbProps {
  size?: number;
  fadeIn?: boolean;
  className?: string;
}

const OrbAnimation: React.FC<OrbProps> = ({ size = 180, fadeIn = false, className }) => {
  return (
    <div
      className={className}
      style={{
        width: size,
        height: size,
        opacity: fadeIn ? 0.9 : 1,
        margin: '0 auto',
      }}
    >
      <Player
        autoplay
        loop
        src="/lotties/Axis_Orb.json"
        style={{ height: size, width: size }}
      />
    </div>
  );
};

export default OrbAnimation;