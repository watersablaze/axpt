'use client';

import React from 'react';
import { Player } from '@lottiefiles/react-lottie-player';
import styles from './OrbAnimation.module.css';

interface OrbProps {
  size?: number;
  fadeIn?: boolean;
  className?: string;
}

const OrbAnimation: React.FC<OrbProps> = ({ size = 180, fadeIn = false, className }) => {
  const combinedClass = `${styles.orbContainer} ${fadeIn ? styles.fadeIn : ''} ${className || ''}`;

  return (
    <div
      className={combinedClass}
      style={{
        width: size,
        height: size,
      }}
    >
      <Player
        autoplay
        loop
        keepLastFrame
        renderer="svg"
        src="/lotties/Axis_orb.json"
        style={{ width: size, height: size }}
      />
    </div>
  );
};

export default OrbAnimation;