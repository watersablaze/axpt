'use client';

import { useEffect, useState } from 'react';
import styles from './AxptAtmosphere.module.css';

export default function AxptAtmosphere() {
  const [layer, setLayer] = useState('ORIGIN');

  useEffect(() => {
    const handler = (e: any) => {
      setLayer(e.detail.layer);
    };

    window.addEventListener('axpt:surface-enter', handler);

    return () => {
      window.removeEventListener('axpt:surface-enter', handler);
    };
  }, []);

  return (
    <div
      className={styles.atmosphere}
      data-layer={layer}
      aria-hidden="true"
    >
      <div className={styles.nebula} />
      <div className={styles.depthFog} />
      <div className={styles.lightField} />
    </div>
  );
}