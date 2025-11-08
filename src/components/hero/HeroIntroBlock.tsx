'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import HeroIntroText from '../text/HeroIntroText';
import styles from './HeroIntroBlock.module.css';

// 🌀 Glyph motion timing (starts ~3.2 s)
const glyphVariants = {
  hidden: { opacity: 0, y: 28 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: 3.2 + i * 0.15,
      duration: 1.0,
      ease: 'easeOut',
    },
  }),
};

// ✨ Label fade timing (follows glyphs)
const labelVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: 3.4 + i * 0.15,
      duration: 1.0,
      ease: 'easeOut',
    },
  }),
};

export default function HeroIntroBlock() {
  return (
    <motion.div
      className={styles.wrapper}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 3.0, duration: 1.2, ease: 'easeOut' }}
    >
      <div className={styles.introBlockWrapper}>
        {/* 🏷️ Floating tagline + ripple */}
        <div className={styles.taglineWrapper}>
          <div className={styles.tagline}>Fintech, for the Culture.</div>
          <div className={styles.taglineRipple} id="taglineRipple" />
        </div>

        {/* 🌟 Title & Subtitle */}
        <div className={styles.textWrapper}>
          <HeroIntroText />
        </div>

        {/* 🔷 Glyphs + Labels */}
        <motion.div
          className={styles.glyphGroupRow}
          initial="hidden"
          animate="visible"
          variants={glyphVariants}
        >
          {[
            { src: '/glyphs/axpt_wallet_glyph.png', alt: 'Wallet Glyph', label: 'Digital Wallet' },
            { src: '/glyphs/smart_contract_glyph.png', alt: 'Smart Contract Glyph', label: 'Smart Contracts' },
            { src: '/glyphs/diaspora_bridge_glyph.png', alt: 'Cultural Exchange Glyph', label: 'Cultural Exchange' },
          ].map((glyph, index) => (
            <motion.div key={glyph.alt} className={styles.glyphColumn}>
              <motion.img
                src={glyph.src}
                alt={glyph.alt}
                className={styles.glyphIcon}
                custom={index}
                variants={glyphVariants}
                animate={{
                  rotate: [0, 3, -3, 0],
                  y: [0, -10, 0],
                  opacity: 0.72,
                }}
                transition={{
                  duration: 6.8 + index * 0.2,
                  repeat: Infinity,
                  repeatType: 'loop',
                  ease: 'easeInOut',
                }}
                whileHover={{
                  scale: 1.08,
                  opacity: 1,
                  filter: 'drop-shadow(0 0 16px rgba(255, 255, 255, 0.2))',
                }}
              />
              <motion.span
                className={styles.glyphLabel}
                custom={index}
                variants={labelVariants}
                animate={{ opacity: 0.66 }}
                whileHover={{
                  scale: 1.05,
                  opacity: 1,
                  textShadow: '0 0 12px rgba(255, 230, 150, 0.5)',
                  color: '#fff2b3',
                }}
              >
                {glyph.label}
              </motion.span>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </motion.div>
  );
}