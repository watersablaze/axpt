'use client';

import React from 'react';
import styles from './Footer.module.css';

const Footer = () => {
  return (
    <footer className={styles.footer}>
      <p>&copy; 2024 PXP Platform</p>
      <a href="/privacy" className={styles.link}>Privacy Policy</a>
    </footer>
  );
};

export default Footer;