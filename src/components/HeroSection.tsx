import React from 'react';
import { motion } from 'framer-motion';
import styles from './HeroSection.module.css';

const HeroSection = () => {
  return (
    <section className={styles.hero}>
      {/* Animated AXI Logo in Top Left Corner */}
      <motion.img
        src="/AXI.png"
        alt="AXI Logo"
        className={styles.logoTopLeft}
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 1.5 }}
      />

      {/* Left Content Section */}
      <div className={styles.content}>
        <p className={styles.tagline}>
          One Platform: Infinite Pathways. 
        </p>
        <p className={styles.tagline}>
          The Crossroads of <strong>Technology</strong>, <br /> <strong>Trade</strong>, and <strong>Cultural Exchange</strong>.
        </p>
      </div>

      {/* Signup Form Section */}
      <div className={styles.signupForm}>
        <h2 className={styles.formTitle}>Register Here</h2>
        <form>
          <div className={styles.inputGroup}>
            <label htmlFor="name">Name</label>
            <input type="text" id="name" name="name" placeholder="Enter your name" required />
          </div>
          <div className={styles.inputGroup}>
            <label htmlFor="email">Email</label>
            <input type="email" id="email" name="email" placeholder="Enter your email" required />
          </div>
          <div className={styles.inputGroup}>
            <label htmlFor="password">Password</label>
            <input type="password" id="password" name="password" placeholder="Enter your password" required />
          </div>
          <motion.button
            type="submit"
            className={styles.submitButton}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Access
          </motion.button>
        </form>
      </div>

      {/* Animated Arrow Map PNG in Center */}
      <motion.img
        src="/large-map.png"
        alt="Arrow Map"
        className={styles.LargeMap}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 8, ease: 'easeOut' }}
      />

      {/* Animated Globe PNG in Bottom Right Corner */}
      <motion.img
        src="/globe.png"
        alt="Globe"
        className={styles.globeBottomRight}
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.5, delay: 0.5 }}
        whileHover={{ scale: 1.1 }}
      />
    </section>
  );
};

export default HeroSection;