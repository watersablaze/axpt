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
      <p className={styles.tagline}>
     <strong>The Crossroads of Technology, Trade, and Cultural Exchange.</strong> 
      </p>
      <div className={styles.buttonContainer}>
        <Link href="/wallet" className={styles.walletButton}>
          Wallet
        </Link>
        <Link href="/login" className={styles.loginButton}>
          Login
        </Link>
      </div>

    </header>
  );
};

export default Header;