'use client';

import styles from './TokenContractsSection.module.css';
import AnimatedSectionWrapper from './AnimatedSectionWrapper';

export default function TokenContractsSection() {
  return (
    <section id="contracts" className={styles.section}>
      <AnimatedSectionWrapper>
        <h2 className={styles.heading}>Tokenization & Smart Contracts</h2>
        <p className={styles.text}>
          Explore AXG, our gold-backed stablecoin, and the evolving suite of smart contracts anchoring this ecosystem. Transparency, utility, and sovereignty shape the architecture of AXPT.
        </p>
      </AnimatedSectionWrapper>
    </section>
  );
}