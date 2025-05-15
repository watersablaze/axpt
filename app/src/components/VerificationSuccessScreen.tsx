'use client';

import React, { useEffect, useState } from 'react';
import styles from './VerificationSuccessScreen.module.css';
import OrbAnimation from './OrbAnimation';

interface VerificationSuccessScreenProps {
  onComplete: () => void;
  displayName?: string;
}

const VerificationSuccessScreen: React.FC<VerificationSuccessScreenProps> = ({
  onComplete,
  displayName,
}) => {
  const [showMessage, setShowMessage] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const messageTimer = setTimeout(() => setShowMessage(true), 1000);
    const fadeOutTimer = setTimeout(() => setFadeOut(true), 9500);
    const transitionTimer = setTimeout(() => onComplete(), 10000);

    return () => {
      clearTimeout(messageTimer);
      clearTimeout(fadeOutTimer);
      clearTimeout(transitionTimer);
    };
  }, [onComplete]);

  const baseText = 'Access granted: ';
  const fullText = baseText + (displayName ?? '');

  return (
    <div
      className={`${styles.transitionContainer} ${fadeOut ? styles.fadeOut : ''}`}
      role="alert"
      aria-live="polite"
    >
      <div className={styles.sigilAnimation}>
        <div className={styles.orbGlow} />
        <OrbAnimation size={120} />
      </div>

      {showMessage && (
        <div className={styles.messageContainer}>
          <h1 className={styles.fragmentedText}>
            {fullText.split('').map((char, index) => (
              <span
                key={`char-${index}`}
                className={char === ' ' ? styles.space : ''}
                style={{ animationDelay: `${index * 0.07}s` }}
              >
                {char}
              </span>
            ))}
          </h1>

          <p className={styles.captionWhisper} style={{ animationDelay: '2.2s' }}>Initiating…</p>
          <p className={styles.captionWhisper} style={{ animationDelay: '3.2s' }}>Exclusive access to Axis Point Documents.</p>
          <p className={`${styles.captionWhisper} ${styles.pulseFinal}`} style={{ animationDelay: '4.2s' }}>
          Enjoy your review.
        </p>
        </div>
      )}
    </div>
  );
};

export default VerificationSuccessScreen;