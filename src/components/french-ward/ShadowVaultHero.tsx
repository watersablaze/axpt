'use client';

import Image from 'next/image';
import styles from './ShadowVaultHero.module.css';
import ConstellationOverlay from '@/components/visual/ConstellationOverlay';

export default function ShadowVaultHero() {
  const scrollToNext = () => {
    const el = document.getElementById('after-hero');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className={styles.heroWrapper}>
      {/* Background */}
      <Image
        src="/images/vaultBG.png"
        alt="Shadow Vault Background"
        fill
        quality={90}
        priority
        className={styles.heroImage}
      />

      {/* ✨ Cosmic Layer */}
      <ConstellationOverlay />

      {/* Content */}
      <div className={styles.heroContent}>
        <span className={styles.kicker}>Black Diamond Edition</span>
        <h1 className={styles.heroTitle}>The Shadow Vault</h1>
        <p className={styles.heroSubtitle}>
          A ceremonial chamber of black light and buried brilliance.
        </p>

        {/* 🔮 Sigil Divider */}
        <div className={styles.sigilDivider} aria-hidden="true">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 100 12"
            className={styles.sigilSvg}
          >
            <line
              x1="0"
              y1="6"
              x2="32"
              y2="6"
              className={styles.sigilLine}
            />
            <circle
              cx="50"
              cy="6"
              r="2.2"
              className={styles.sigilCircle}
            />
            <line
              x1="68"
              y1="6"
              x2="100"
              y2="6"
              className={styles.sigilLine}
            />
          </svg>
        </div>

        {/* Scroll cue */}
        <button
          onClick={scrollToNext}
          className={styles.scrollCue}
          aria-label="Scroll to explore"
        >
          ↓
        </button>
      </div>
    </div>
  );
}