'use client';

import styles from './FeaturedGemSection.module.css';
import Image from 'next/image';

export default function FeaturedGemSection() {
  return (
    <section className={styles.section}>
      <h2 className={styles.heading}>The Featured Gem Trinity</h2>
      <div className={styles.gemCanvas}>
        {/* Black Diamond */}
        <div className={`${styles.gemUnit} ${styles.blackDiamond}`}>
          <Image
            src="/images/gems/blackdiamond.png"
            alt="Black Diamond"
            width={560}
            height={560}
            className={styles.gemImage}
          />
          <h3 className={styles.title}>Black Diamond</h3>
          <p className={styles.caption}>
            Forged beyond light in the core of earth’s sacred dream — unspoken and sovereign.
          </p>
        </div>

        {/* Ruby Flame */}
        <div className={`${styles.gemUnit} ${styles.ruby}`}>
          <Image
            src="/images/gems/ruby.png"
            alt="Ruby Flame"
            width={200}
            height={200}
            className={styles.gemImage}
          />
          <h3 className={styles.title}>Ruby Flame</h3>
          <p className={styles.caption}>
            She burns with ancestral passion, illuminating paths with fire-born wisdom.
          </p>
        </div>

        {/* Emerald Eye */}
        <div className={`${styles.gemUnit} ${styles.emerald}`}>
          <Image
            src="/images/gems/emerald.png"
            alt="Emerald Eye"
            width={180}
            height={180}
            className={styles.gemImage}
          />
          <h3 className={styles.title}>Emerald Eye</h3>
          <p className={styles.caption}>
            She hums in chlorophyll frequencies, restoring rhythm to the realm of breath.
          </p>
        </div>
      </div>
    </section>
  );
}