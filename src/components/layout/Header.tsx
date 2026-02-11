'use client';

import styles from './Header.module.css';

export default function Header() {
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <span className={styles.brand}>AXPT</span>
        <span className={styles.tagline}>
          A sovereign infrastructure for culture, capital, and continuity.
        </span>
      </div>
    </header>
  );
}