'use client';

import React, { useRef, useEffect, useState } from 'react';
import Lottie, { LottieRefCurrentProps } from 'lottie-react';

export interface OrbAnimationProps {
  size?: number;
  fadeIn?: boolean;
  className?: string;
}

const OrbAnimation: React.FC<OrbAnimationProps> = ({
  size = 200,
  fadeIn = true,
  className = '',
}) => {
  const lottieRef = useRef<LottieRefCurrentProps>(null);
  const [orbData, setOrbData] = useState<any | null>(null);

  useEffect(() => {
    // Dynamically import to ensure SSR safety
    import('@/lotties/Axis_Orb.json').then((data) => {
      setOrbData(data.default || data);
    });
  }, []);

  return (
    <div
      className={`orbAnimationWrapper ${className}`}
      style={{
        opacity: fadeIn ? 0.8 : 1,
        animation: fadeIn ? 'orbFadeIn 3s ease-in-out forwards' : undefined,
        pointerEvents: 'none',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1,
        transition: 'opacity 3s ease',
      }}
    >
      {orbData && (
        <Lottie
          lottieRef={lottieRef}
          animationData={orbData}
          loop
          autoplay
          style={{
            width: size,
            height: 'auto',
            backgroundColor: 'transparent',
            filter: 'drop-shadow(0 0 12px #0ff) blur(0.3px)',
            transition: 'transform 4s ease-in-out',
          }}
        />
      )}

      <style jsx>{`
        @keyframes orbFadeIn {
          0% {
            opacity: 0;
            transform: scale(0.92);
          }
          100% {
            opacity: 0.8;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
};

export default OrbAnimation;