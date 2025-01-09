'use client';

import React from 'react';
import { motion } from 'framer-motion';
import styles from './Footer.module.css';

const Footer = () => {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerContainer}>
        {/* Left Column */}
        <div className={styles.column}>
          <h4>About Us</h4>
          <p>
            Axis Point connects technology, trade, and culture into a global symphony of progress.
          </p>
          <p>Email: contact@axispoint.com</p>
        </div>

        {/* Right Column */}
        <div className={styles.column}>
          <h4>Quick Links</h4>
          <ul>
            <li><a href="/register">Register</a></li>
            <li><a href="/login">Login</a></li>
            <li><a href="/wallet">Wallet</a></li>
          </ul>
        </div>
      </div>

      {/* Animated Globe in Bottom Right */}
      <motion.img
        src="/globe.png"
        alt="Globe"
        className={styles.globeBottomRight}
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.5, delay: 0.5 }}
        whileHover={{ scale: 1.1 }}
      />

      {/* Centered Copyright */}
      <p className={styles.copyright}>
        &copy; 2025 Axis Point. All rights reserved.
      </p>
    </footer>
  );
};

export default Footer;