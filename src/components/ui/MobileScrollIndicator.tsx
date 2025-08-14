'use client';

import styles from './MobileScrollIndicator.module.css';

type Props = {
  total: number;
  current: number;
};

export default function MobileScrollIndicator({ total, current }: Props) {
  return (
    <div className={styles.indicatorWrapper}>
      {Array.from({ length: total }).map((_, index) => (
        <div
          key={index}
          className={`${styles.dot} ${index === current ? styles.active : ''}`}
        />
      ))}
    </div>
  );
}