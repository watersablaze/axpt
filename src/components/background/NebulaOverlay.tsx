'use client';

import { useEffect, useState } from 'react';
import styles from './NebulaOverlay.module.css';

export default function NebulaOverlay() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className={styles.overlayWrapper}>

      {/* 🌌 Subtle Orb Glow */}
      <div className={styles.nebulaOrb} />
    </div>
  );
}