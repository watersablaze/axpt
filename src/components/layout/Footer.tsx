'use client';

import { motion } from 'framer-motion';
import styles from './Footer.module.css';

export default function Footer() {
  return (
    <motion.footer
      className={styles.footer}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1.2, ease: 'easeOut', delay: 0.4 }}
    >
      <div className={styles.inner}>
        <div className={styles.brand}>AXPT</div>

        <div className={styles.legal}>
          © 2025 — All Rights Reserved
        </div>

        <div className={styles.contact}>
          <a href="mailto:connect@axpt.io">
            connect@axpt.io
          </a>
        </div>

        <div className={styles.access}>
          private regulatory access
        </div>
      </div>
    </motion.footer>
  );
}