'use client';

import { motion } from 'framer-motion';
import styles from './CodexBlock.module.css';

export default function CodexBlock() {
  return (
    <section className={styles.codexSection}>
      {/* 🫧 Background mist layer */}
      <div className={styles.codexMist} />

      <motion.div
        className={styles.codexContent}
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.6, ease: 'easeOut' }}
        viewport={{ once: true }}
      >
        <h1 className={styles.codexTitle}>The Codex of Trust</h1>

        <p className={styles.codexText}>
          Before there were blockchains, there were <span>covenants</span> —
          spoken, danced, and witnessed in spirit.
          <br />
          <br />
          Smart contracts continue that lineage: agreements written not on paper
          but in code — transparent, verifiable, and free of intermediaries.
          <br />
          <br />
          <span className={styles.codexGlow}>Ritual became protocol. Memory became chain.</span>
        </p>
      </motion.div>

      {/* Scroll indicator */}
      <div className={styles.scrollHint}>
        <motion.div
          animate={{ y: [0, 10, 0], opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        >
          ↓
        </motion.div>
      </div>
    </section>
  );
}