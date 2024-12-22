'use client';

import React from 'react';
import styles from './Header.module.css';

const Header = () => {
  return (
    <header className={styles.header}>
      {/* Logo Section */}
      <div className={styles.logoContainer}>
        <a href="/">
          <img src="/AXI.png" alt="Axis Point Logo" className={styles.logo} />
        </a>
      </div>

      {/* Header Title */}
      <h1 className={styles.title}>AXIS POINT</h1>

      {/* Navigation Section */}
      <nav className={styles.nav}>
        <div className={styles.navDropdown}>
          <button className={styles.navButton}>Menu</button>
          <div className={styles.navContent}>
            <a href="/about">About</a>
            <a href="/services">Services</a>
            <a href="/contact">Contact</a>
          </div>
        </div>
        <a href="/login" className={styles.loginButton}>Login</a>
      </nav>
    </header>
  );
};

export default Header;