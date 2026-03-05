'use client';

import { useEffect, useState } from 'react';
import styles from './Header.module.css';
import DevLayerIndicator from '@/components/system/DevLayerIndicator';

export default function Header() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);

    handleScroll(); // set initial state on load/refresh
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={`${styles.header} ${scrolled ? styles.scrolled : ''}`}>
      <div className={styles.headerShell}>
        <div className={styles.inner}>
          <div className={styles.brandMark}>
            <img
              src="/sigil/v4/axpt_letters.png"
              alt="AXPT"
              className={styles.brandImage}
              draggable={false}
            />
          </div>
        </div>

        <div className={styles.layerSlot}>
          <DevLayerIndicator />
        </div>
      </div>
    </header>
  );
}