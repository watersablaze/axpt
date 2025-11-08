'use client';

import { useEffect, useState } from 'react';
import styles from './MobileWelcomePopup.module.css';

type Props = {
  message?: string;
  duration?: number; // ms before auto-dismiss
};

export default function MobileWelcomePopup({
  message = 'Welcome to AXPT.io',
  duration = 4000,
}: Props) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), duration);
    return () => clearTimeout(timer);
  }, [duration]);

  if (!visible) return null;

  return (
    <div className={styles.popup}>
      <div className={styles.container}>
        <p className={styles.text}>{message}</p>
      </div>
    </div>
  );
}