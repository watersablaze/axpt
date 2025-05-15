'use client';

import React, { useEffect, useState } from 'react';
import styles from './MobileNotice.module.css';

const MobileNotice: React.FC = () => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (typeof navigator !== 'undefined') {
      const isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
      setShow(isMobile);
    }
  }, []);

  const handleDismiss = () => {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('verifiedPartner');
      localStorage.removeItem('verifiedTier');
      localStorage.removeItem('preVerified');
    }
    window.location.reload();
  };

  if (!show) return null;

  return (
    <div className={styles.mobileNotice}>
      <div className={styles.toast}>
        <p className={styles.message}>
          📱 Looks like you're on mobile. Respect. <br />
          This portal is best experienced on desktop. <br />
          Please access from a larger screen for best results.
        </p>
        <button className={styles.dismiss} onClick={handleDismiss}>
          Return
        </button>
      </div>
    </div>
  );
};

export default MobileNotice;