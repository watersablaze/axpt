'use client';

import { motion } from 'framer-motion';
import styles from './Footer.module.css';

export default function Footer() {
  return (
    <motion.footer
      className={styles.footer}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1.2, ease: 'easeOut', delay: 0.5 }}
    >
      {/* 🌗 Floating sigil emblem */}
      <div className={styles.footerSigil}>
        <img
          src="/sigil/io@2x.webp"
          alt="AXPT Sigil Fragment"
          className={styles.footerSigilImg}
        />
      </div>

      {/* 🪶 Text */}
      <p className={styles.line}>
        <span className={styles.brand}>AXPT</span> © 2025 — All Rights Reserved
      </p>
      <p className={styles.contact}>
        <a href="mailto:connect@axpt.io">connect@axpt.io</a>
      </p>
    </motion.footer>
  );
}