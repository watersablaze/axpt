'use client';

import styles from './FeaturedGemSectionMobile.module.css';

// If your desktop component already pulls copy/assets from a data file,
// you can import and map that data here instead of hardcoding.
// import { GEMS } from './featuredGem.data';

export default function FeaturedGemSectionMobile() {
  return (
    <section className={styles.wrapper} aria-labelledby="fgm-title">
      <h2 id="fgm-title" className={styles.sectionTitle}>The Featured Gem Trinity</h2>

      {/* Black Diamond */}
      <article className={styles.gemCard}>
        <img
          className={styles.gemImage}
          src="/images/gems/blackdiamond.png"
          alt="Black Diamond"
          loading="lazy"
          decoding="async"
        />
        <h3 className={styles.gemTitle}>Black Diamond</h3>
        <p className={styles.gemSubtitle}>
          Forged by pressure with fierce wisdom—earth’s dream, unspoken and sovereign.
        </p>
      </article>

      {/* Ruby Flame */}
      <article className={styles.gemCard}>
        <img
          className={styles.gemImage}
          src="/images/gems/ruby.png"
          alt="Ruby Flame"
          loading="lazy"
          decoding="async"
        />
        <h3 className={styles.gemTitle}>Ruby Flame</h3>
        <p className={styles.gemSubtitle}>
          She burns with ancestral passion, illuminating the rite of return.
        </p>
      </article>

      {/* Emerald Eye */}
      <article className={styles.gemCard}>
        <img
          className={styles.gemImage}
          src="/images/gems/emerald.png"
          alt="Emerald Eye"
          loading="lazy"
          decoding="async"
        />
        <h3 className={styles.gemTitle}>Emerald Eye</h3>
        <p className={styles.gemSubtitle}>
          She hums in chlorophyll frequencies, restoring rhythm to the realm of breath.
        </p>
      </article>
    </section>
  );
}