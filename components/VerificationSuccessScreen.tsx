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
    const messageTimer = setTimeout(() => {
      setShowMessage(true);
    }, 500); // Delay before starting text animation

    const fadeOutTimer = setTimeout(() => {
      setFadeOut(true);
    }, 3500); // Start fade-out before transitioning

    const transitionTimer = setTimeout(() => {
      onComplete();
    }, 4000); // Auto-transition after 4 seconds

    return () => {
      clearTimeout(messageTimer);
      clearTimeout(fadeOutTimer);
      clearTimeout(transitionTimer);
    };
  }, [onComplete]);

  return (
    <div className={`${styles.transitionContainer} ${fadeOut ? styles.fadeOut : ''}`}>
      <div className={styles.sigilAnimation}>
      <div className={styles.portalGlow}></div> {/* 🌟 Portal Radiance Layer */}
      <OrbAnimation size={220} fadeIn />
    </div>

      {showMessage && (
       <h1 className={styles.fragmentedText}>
       {"Entering The Axis".split('').map((char, index) => (
         <span
           key={index}
           style={{ '--i': index } as React.CSSProperties}
           className={char === ' ' ? styles.space : ''}
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