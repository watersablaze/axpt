'use client';

import { motion } from 'framer-motion';
import styles from './VaultBlock.module.css';

export default function VaultBlock() {
  return (
    <section className={styles.vaultSection}>
      <motion.div
        className={styles.vaultContent}
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.6, ease: 'easeOut' }}
        viewport={{ once: true }}
      >
        <h1 className={styles.vaultTitle}>The Vault of Proofs</h1>

        <p className={styles.vaultText}>
          The Vault is a <span>platinum ledger</span> — safeguarding cultural and financial truth
          with verifiable transparency. Every entry is sealed in integrity, timestamped by code,
          and guarded by community trust.
          <br />
          <br />
          <span className={styles.vaultGlow}>
            Preservation through clarity. Continuity through proof.
          </span>
        </p>
      </motion.div>

      <div className={styles.vaultMist} />
    </section>
  );
}