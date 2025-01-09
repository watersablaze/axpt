'use client';

import React from 'react';
import { motion } from 'framer-motion';
import styles from './Footer.module.css';

const Footer = () => {
  return (
    <footer className={styles.footer}>
      {/* Left Section - All Rights Reserved */}
      <div className={styles.leftSection}>
        <p>&copy; 2024 Axis Point. All rights reserved. < br/> One Platform. Infinite Pathways.</p>
      </div>

      {/* Right Section - Combined Content */}
      <div className={styles.rightSection}>
        <h4>About Us</h4>
        <p></p>
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