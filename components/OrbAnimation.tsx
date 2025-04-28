import React, { useState } from 'react';

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
  const [videoLoaded, setVideoLoaded] = useState(false);

  return (
    <div
      className={`orbAnimationWrapper ${className}`}
      style={{
        opacity: videoLoaded ? (fadeIn ? 0.85 : 1) : 0,
        animation: videoLoaded && fadeIn ? 'orbFadeIn 3s ease-in forwards' : undefined,
        pointerEvents: 'none',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1,
        transition: 'opacity 2s ease',
      }}
    >
      <video
        src="/videos/Axis_Orb3.webm" // ✅ Updated to your new render!
        autoPlay
        loop
        muted
        playsInline
        onLoadedData={() => setVideoLoaded(true)}
        style={{
          width: `${size}px`,
          height: 'auto',
          backgroundColor: 'transparent',
          filter: 'blur(0.3px)',
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