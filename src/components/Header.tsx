'use client';

import React from 'react';
import styles from './Header.module.css';

const Header = () => {
  return (
    <header className={styles.header}>
      <a href="/" className={styles.logo}>
        AXIS POINT
      </a>
      <nav className={styles.nav}>
        <a href="/about" className={styles.navLink}>About</a>
        <a href="/services" className={styles.navLink}>Services</a>
        <a href="/contact" className={styles.navLink}>Contact</a>
        <a href="/login" className={styles.loginButton}>Login</a>
      </nav>
    </header>
  );
};

export default Header;