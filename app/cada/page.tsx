'use client';

import styles from './cada.module.css';
import CadaWaitlistForm from '@/components/cada/CadaWaitlistForm';

export default function CadaPage() {
  return (
    <main className={styles.main}>
      {/* 📜 Waitlist Card */}
      <div className={styles.card}>
        <div className={styles.logoContainer}>
          <img
            src="/images/cada/cada-logo.png"
            alt="CADA Logo"
            className={styles.logo}
          />
        </div>

        <h1 className={styles.title}>16 Years of Diasporic Artistry</h1>
        <p className={styles.subtitle}>
          Be among the first to receive your invitation for Art Basel Miami 2025
        </p>

        <CadaWaitlistForm />
      </div>

      {/* 🌴 Layered Palms */}
      <div className={styles.palmsWrapper}>
        <img
          src="/images/cada/palm-left.png"
          alt="Palm Left"
          className={`${styles.palm} ${styles.palmLeft}`}
        />
        <img
          src="/images/cada/palm-right.png"
          alt="Palm Right"
          className={`${styles.palm} ${styles.palmRight}`}
        />
      </div>
    </main>
  );
}