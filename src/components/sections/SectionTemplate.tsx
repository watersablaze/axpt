'use client';

import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import styles from './SectionTemplate.module.css';

type SectionTemplateProps = {
  id?: string;
  title: string;
  description: string;
  visual?: ReactNode;
  children?: ReactNode;
};

export default function SectionTemplate({
  id,
  title,
  description,
  visual,
  children,
}: SectionTemplateProps) {
  return (
    <section id={id} className={styles.section}>
      {/* ✅ Visual now animates on scroll */}
      {visual && (
        <motion.div
          className={styles.visualBehind}
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.4, ease: 'easeOut' }}
          viewport={{ once: true, amount: 0.3 }}
        >
          {visual}
        </motion.div>
      )}

      {/* ✅ Animate only the inner content */}
      <motion.div
        className={styles.sectionInner}
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.2, ease: 'easeOut' }}
        viewport={{ once: true, amount: 0.3 }}
      >
        <motion.h2
          className={styles.heading}
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 1.1, ease: 'easeOut' }}
          viewport={{ once: true }}
        >
          {title}
        </motion.h2>

        <motion.p
          className={styles.text}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 0.8 }}
          transition={{ delay: 0.4, duration: 1.1, ease: 'easeOut' }}
          viewport={{ once: true }}
        >
          {description}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 1.2, ease: 'easeOut' }}
          viewport={{ once: true }}
        >
          {children}
        </motion.div>
      </motion.div>
    </section>
  );
}