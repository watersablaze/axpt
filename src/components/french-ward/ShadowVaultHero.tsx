'use client';

import Image from 'next/image';
import styles from './ShadowVaultHero.module.css';
import ConstellationOverlay from '@/components/visual/ConstellationOverlay';

export default function ShadowVaultHero() {
  return (
    <div className={styles.heroWrapper}>
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
      
      <div className={styles.heroContent}>
        <h1 className={styles.heroTitle}>The Shadow Vault</h1>
        <p className={styles.heroSubtitle}>
          A ceremonial chamber of black light and buried brilliance.
        </p>
      </div>
    </div>
  );
}