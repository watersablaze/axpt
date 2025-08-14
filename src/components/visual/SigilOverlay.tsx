'use client';

import { useEffect, useState } from 'react';
import styles from './SigilOverlay.module.css';

export default function SigilOverlay() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), 9000); // ⏳ duration of visual ceremony
    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  useEffect(() => {
  const shouldReduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!shouldReduceMotion) {
    const timer = setTimeout(() => setVisible(false), 9000);
    return () => clearTimeout(timer);
  }
}, []); 

  return (
    <div className={styles.sigilWrapper}>
      <img
        src="/images/axpt-sigil-main.png"
        alt="AXPT Sigil"
        className={styles.sigilImage}
      />
    </div>
  );
}