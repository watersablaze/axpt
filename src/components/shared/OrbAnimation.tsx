'use client';

import React from 'react';
import { Player } from '@lottiefiles/react-lottie-player';
import styles from './OrbAnimation.module.css';

interface OrbProps {
  size?: number;
  fadeIn?: boolean;
  className?: string;
}

const OrbAnimation: React.FC<OrbProps> = ({ size = 180, fadeIn = false, className = '' }) => {
  return (
    <div
      className={`${styles.orbContainer} ${fadeIn ? styles.fadeIn : ''} ${className}`}
      style={{ width: size, height: size }}
    >
      {/* 💫 Subtle background mist */}
      <div className={styles.celestialMist} />

      {/* 🌈 Rotating ambient ring */}
      <div className={styles.etherealRing} />

      {/* 🧿 Orb core */}
      <div className={styles.orbInner}>
        <Player
          autoplay
          loop
          src="/lotties/Axis_orb.json"
          renderer="svg"
          style={{ width: '100%', height: '100%' }}
        />
      </div>
    </div>
  );
};

export default OrbAnimation;