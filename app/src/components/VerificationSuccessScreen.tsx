'use client';

import React, { useEffect, useState } from 'react';
import styles from './VerificationSuccessScreen.module.css';
import OrbAnimation from './OrbAnimation';

interface VerificationSuccessScreenProps {
  onComplete: () => void;
}

const VerificationSuccessScreen: React.FC<VerificationSuccessScreenProps> = ({ onComplete }) => {
  const [showMessage, setShowMessage] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const messageTimer = setTimeout(() => setShowMessage(true), 1000);
    const fadeOutTimer = setTimeout(() => setFadeOut(true), 4500);
    const transitionTimer = setTimeout(() => onComplete(), 5000);

    return () => {
      clearTimeout(messageTimer);
      clearTimeout(fadeOutTimer);
      clearTimeout(transitionTimer);
    };
  }, [onComplete]);

  return (
    <div className={`${styles.transitionContainer} ${fadeOut ? styles.fadeOut : ''}`}>
      <div className={styles.sigilAnimation}>
        <div className={styles.orbGlow} />
        <OrbAnimation size={120} />
      </div>

      {showMessage && (
        <div className={styles.messageContainer}>
          <h1 className={styles.fragmentedText}>
            {"Entering The Axis".split('').map((char, index) => (
              <span
                key={index}
                className={char === ' ' ? styles.space : ''}
                style={{ animationDelay: `${index * 0.07}s` }}
              >
                {char}
              </span>
            ))}
          </h1>
          <p className={styles.captionWhisper}>
            Stabilizing field... aligning vectors...
          </p>
        </div>
      )}
    </div>
  );
};

export default VerificationSuccessScreen;