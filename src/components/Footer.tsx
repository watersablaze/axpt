'use client';

import React from 'react';
import { motion } from 'framer-motion';
import styles from './Footer.module.css';

const Footer = () => {
  return (
    <footer className={styles.footer}>
      {/* Left Section - All Rights Reserved + Currency Symbols */}
      <div className={styles.leftSection}>
        <p>
          &copy; 2024 Axis Point. All rights reserved. <br />
          One Platform. Infinite Pathways.
        </p>
        <div className={styles.currencySymbols}>
          <motion.span
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              repeat: Infinity,
              repeatType: 'mirror',
              duration: 1,
              delay: 0.2,
            }}
          >
            $
          </motion.span>
          <motion.span
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              repeat: Infinity,
              repeatType: 'mirror',
              duration: 1,
              delay: 0.4,
            }}
          >
            €
          </motion.span>
          <motion.span
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              repeat: Infinity,
              repeatType: 'mirror',
              duration: 1,
              delay: 0.6,
            }}
          >
            ¥
          </motion.span>
          <motion.span
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              repeat: Infinity,
              repeatType: 'mirror',
              duration: 1,
              delay: 0.8,
            }}
          >
            £
          </motion.span>
        </div>
      </div>

      {/* Right Section - Combined Content */}
      <div className={styles.rightSection}>
        <h4></h4>
        <ul>
          <li><a href="/register">Register</a></li>
          <li><a href="/login">Login</a></li>
          <li><a href="/wallet">Wallet</a></li>
        </ul>
      </div>

      {/* Animated Globe */}
      <motion.img
        src="/globe.png"
        alt="Globe"
        className={styles.globeBottomRight}
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.5, delay: 0.5 }}
        whileHover={{ scale: 1.1 }}
      />
    </footer>
  );
};

export default Footer;