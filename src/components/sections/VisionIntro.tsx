'use client';

import styles from './VisionSection.module.css';

export default function VisionIntro() {
  return (
    <div className={styles.visionIntro}>
      <h1 className={styles.title}>
        AXIS POINT
      </h1>

      <p className={styles.subtitle}>
        Infrastructure for sovereign media, value, and cultural continuity.
      </p>

      <p className={styles.body}>
        AXPT is not a platform.  
        It is a structural response to fragmentation —
        where media, money, memory, and movement
        are restored to coherent systems.
      </p>
    </div>
  );
}
