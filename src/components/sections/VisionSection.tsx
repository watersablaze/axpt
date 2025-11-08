'use client';

import AnimatedSectionWrapper from './AnimatedSectionWrapper';
import styles from './VisionSection.module.css';

export default function VisionSection() {
  return (
    <section id="vision" className={styles.section}>
      <AnimatedSectionWrapper>
        <h2 className={styles.heading}>Vision</h2>
        <p className={styles.text}>
          AXPT envisions a world where cultural technology bridges ancestral wisdom with decentralized innovation. This platform exists to empower sustainable finance, creative liberation, and community sovereignty.
        </p>
      </AnimatedSectionWrapper>
    </section>
  );
}