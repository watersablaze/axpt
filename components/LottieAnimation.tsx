'use client';

import { Player } from '@lottiefiles/react-lottie-player';
import React, { useState } from 'react';

interface LottieAnimationProps {
  src: string;
  loop?: boolean;
  autoplay?: boolean;
  style?: React.CSSProperties;
  fallbackMessage?: string;  // Optional: Custom fallback message
}

const LottieAnimation: React.FC<LottieAnimationProps> = ({
  src,
  loop = true,
  autoplay = true,
  style = { height: '300px', width: '300px' },
  fallbackMessage = 'Animation failed to load.',
}) => {
  const [hasError, setHasError] = useState(false);

  return (
    <div style={{ ...style, position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      {!hasError ? (
        <Player
          autoplay={autoplay}
          loop={loop}
          src={src}
          style={style}
          onEvent={(event) => {
            if (event === 'error') {
              setHasError(true);
              console.error(`Failed to load Lottie animation from: ${src}`);
            }
          }}
        />
      ) : (
        <div style={{ textAlign: 'center', color: '#999' }}>
          {fallbackMessage}
        </div>
      )}
    </div>
  );
};

export default LottieAnimation;