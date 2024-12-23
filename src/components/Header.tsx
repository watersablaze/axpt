'use client';

import React from 'react';
import Link from 'next/link';
import styles from './Header.module.css';

const Header = () => {
  return (
    <header className={styles.header}>
      <h1 className={styles.title}>
        AXIS P<img src="/AXI.png" alt="Axis Point Logo" className={styles.logoO} />INT
      </h1>
      <nav className={styles.nav}>
        <div className={styles.navDropdown}>
          <button className={styles.navButton}>Menu</button>
          <div className={styles.navContent}>
            <Link href="/about">About</Link>
            <Link href="/services">Services</Link>
            <Link href="/contact">Contact</Link>
          </div>
        </div>
        <Link href="/wallet" className={styles.loginButton}>
          Wallet
        </Link>
        <Link href="/login" className={styles.loginButton}>
          Login
        </Link>
      </nav>

 {/* Tagline Section */}
 <p className={styles.tagline}>
        Currency Exchange Portal Stimulating the Global Melanated and Indigenous Community
      </p>
    </header>
  );
};

export default Header;