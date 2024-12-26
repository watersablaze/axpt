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
        Currency Exchange Portal Stimulating the Global Melanated and Indigenous Community
      </p>
      <div className={styles.buttonContainer}>
        <Link href="/wallet" className={styles.walletButton}>
          Wallet
        </Link>
        <Link href="/login" className={styles.loginButton}>
          Login
        </Link>
      </div>
            {/* Rolling Banner */}
            <div className={styles.banner}>
        <p className={styles.bannerText}>Planetary Exchange Platform - Cultural Exchange - Community Empowerment - Trade</p>
      </div>
    </header>
  );
};

export default Header;     