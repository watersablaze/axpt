'use client';

import React from 'react';
import styles from './Header.module.css';

const Header = () => {
  return (
    <header className={styles.header}>
      {/* Title with logo replacing "O" */}
      <h1 className={styles.title}>
        AXIS P<img src="/AXI.png" alt="Axis Point Logo" className={styles.logoO} />INT
      </h1>

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

{/* Tagline Section with Typewriter and Glitch Effect */}
<p className={`${styles.tagline} ${styles.typewriter}`}>
        Currency Exchange Portal Stimulating the Global Melanated and Indigenous Community
      </p>
    </header>
  );
};

export default Header;