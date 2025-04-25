'use client';

import { Player } from '@lottiefiles/react-lottie-player';
import React from 'react';

interface LottieAnimationProps {
  src: string;
  loop?: boolean;
  autoplay?: boolean;
  style?: React.CSSProperties;
}

const LottieAnimation: React.FC<LottieAnimationProps> = ({
  src,
  loop = true,
  autoplay = true,
  style = { height: '300px', width: '300px' },
}) => {
  return (
    <Player
      autoplay={autoplay}
      loop={loop}
      src={src}
      style={style}
    />
  );
};

export default LottieAnimation;