// components/OrbAnimation.tsx

import React from 'react';
import Lottie from 'lottie-react';

interface OrbAnimationProps {
  size?: number;
  fadeIn?: boolean;
  className?: string;
}

const OrbAnimation: React.FC<OrbAnimationProps> = ({
  size = 300,
  fadeIn = true,
  className = '',
}) => {
  return (
    <div
      className={`orbAnimationWrapper ${className}`}
      style={{
        opacity: fadeIn ? 0.85 : 1,
        animation: fadeIn ? 'orbFadeIn 3s ease-in forwards' : undefined,
        pointerEvents: 'none',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1,
        transition: 'opacity 2s ease',
      }}
    >
      <Lottie
        animationData={require('@/../public/lotties/Digital_Orb.json')}
        loop
        autoplay
        style={{
          width: `${size}px`,
          height: `${size}px`,
        }}
      />
      <style jsx>{`
        @keyframes orbFadeIn {
          0% {
            opacity: 0;
            transform: scale(0.95);
          }
          100% {
            opacity: 0.85;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
};

export default OrbAnimation;