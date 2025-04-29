'use client';

import React, { useEffect, useState } from 'react';
import styles from './VerificationSuccessScreen.module.css';
import OrbAnimation from './OrbAnimation'; // ✅ Ensure you import Orb

interface VerificationSuccessScreenProps {
  onComplete: () => void;
}

const VerificationSuccessScreen: React.FC<VerificationSuccessScreenProps> = ({ onComplete }) => {
  const [showMessage, setShowMessage] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const messageTimer = setTimeout(() => {
      setShowMessage(true);
    }, 1000); // ✨ Slightly delayed before text appears

    const fadeOutTimer = setTimeout(() => {
      setFadeOut(true);
    }, 4500); // ✨ Longer breathing space

    const transitionTimer = setTimeout(() => {
      onComplete();
    }, 5000); // ✨ Smooth timing to handoff

    return () => {
      clearTimeout(messageTimer);
      clearTimeout(fadeOutTimer);
      clearTimeout(transitionTimer);
    };
  }, [onComplete]);

  return (
    <div className={`${styles.transitionContainer} ${fadeOut ? styles.fadeOut : ''}`}>
      {/* 🟡 Orb now above text */}
      <div className={styles.sigilAnimation}>
        <OrbAnimation size={120} /> {/* Smaller, majestic */}
      </div>

      {showMessage && (
        <h1 className={styles.fragmentedText}>
          {"Entering The Axis".split('').map((char, index) => (
            <span
              key={index}
              className={char === ' ' ? styles.space : ''}
              style={{ animationDelay: `${index * 0.07}s` }} // 🛠 Slowed cascade effect
            >
              {char}
            </span>
          ))}
        </h1>
      )}
    </div>
  );
};

export default VerificationSuccessScreen;