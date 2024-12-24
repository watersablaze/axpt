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
      <div className={styles.buttonSection}>
  <button className={`${styles.button} ${styles.walletButton}`}>Wallet</button>
  <button className={`${styles.button} ${styles.loginButton}`}>Login</button>
  <button className={`${styles.button} ${styles.pxpButton}`}>PXP</button>
</div>
 {/* Tagline Section */}
 <p className={styles.tagline}>
        Currency Exchange Portal Stimulating the Global Melanated and Indigenous Community
      </p>
    </header>
  );
};

export default Header;