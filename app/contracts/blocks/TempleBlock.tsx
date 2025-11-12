// app/contracts/blocks/TempleBlock.tsx
'use client';

import { motion } from 'framer-motion';
import styles from './TempleBlock.module.css';

export default function TempleBlock() {
  return (
    <section className={styles.templeSection}>
      <motion.div
        className={styles.templeContent}
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.6, ease: 'easeOut' }}
        viewport={{ once: true }}
      >
        <h1 className={styles.templeTitle}>The Temple of AXG</h1>

        <p className={styles.templeText}>
          AXG is a <span>gold-pegged stablecoin</span> — a digital representation of value that
          mirrors the stability of real gold while remaining fluid in motion across global ledgers.
          <br />
          <br />
          Each AXG token is secured by verifiable collateral, oracle-fed price data, and a
          decentralized treasury governed by both code and conscience.
          <br />
          <br />
          <span className={styles.templeGlow}>Value that moves with light.</span>
        </p>
      </motion.div>

      {/* background shimmer for subtle depth */}
      <div className={styles.templeMist} />
    </section>
  );
}