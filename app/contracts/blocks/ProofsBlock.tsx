'use client';

import { motion } from 'framer-motion';
import styles from './ProofsBlock.module.css';

export default function ProofsBlock() {
  return (
    <section className={styles.proofsSection}>
      <motion.div
        className={styles.proofsContent}
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.6, ease: 'easeOut' }}
        viewport={{ once: true }}
      >
        <h1 className={styles.proofsTitle}>Proofs of Light</h1>

        <p className={styles.proofsText}>
          At the final threshold, <span>light becomes record</span> — a reflection of every act of
          value, of giving, of building. Proofs are not just hashes; they are signatures of
          integrity carried through time.
          <br />
          <br />
          <span className={styles.proofsGlow}>
            Every beam remembers where it shone.
          </span>
        </p>
      </motion.div>

      <div className={styles.proofsMist} />
    </section>
  );
}