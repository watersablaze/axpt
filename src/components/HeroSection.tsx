import React from 'react';
import { motion } from 'framer-motion';
import MatrixEffect from './MatrixEffect';
import styles from './HeroSection.module.css';

const HeroSection = () => {
  return (
    <section className={styles.hero}>

      {/* Matrix Effect */}
      <MatrixEffect />

      {/* Hero Content */}
      <motion.div
        className={styles.content}
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.5 }}
      >
        <h1 className={styles.title}>The Planetary Exchange Platform is a Green Investor's Portal of Tomorrow</h1>
        <p className={styles.description}>
          Empowering communities worldwide through cultural and financial collaboration.
        </p>
        <motion.a
          href="/signup"
          className={styles.signupButton}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          Access
        </motion.a>
      </motion.div>
    </section>
  );
};

export default HeroSection;