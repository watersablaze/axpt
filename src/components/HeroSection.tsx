import React from 'react';
import { motion } from 'framer-motion';
import styles from './HeroSection.module.css';

const HeroSection = () => {
  return (
    <section className={styles.hero}>
      {/* Left Content Section */}
      <motion.div
        className={styles.content}
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.5 }}
      >
        <img src="/PXP.logo.png" alt="PXP Logo" className={styles.logo} />
        <h1 className={styles.title}>Planetary Xchange Platform</h1>
        <p className={styles.tagline}>
          At the crossroads of <strong>technology</strong>, <strong>trade</strong>, and <strong>culture</strong>, PXP redefines global exchange into a harmonious symphony of progress and innovation.
        </p>
        <motion.a
          href="/signup"
          className={styles.signupButton}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          Access Here
        </motion.a>
      </motion.div>

      {/* Right Placeholder Section */}
      <motion.div
        className={styles.emptyVisual}
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 1.5 }}
      >
        {/* Placeholder for future animation */}
        Placeholder for Animation
      </motion.div>
    </section>
  );
};

export default HeroSection;