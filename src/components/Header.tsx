'use client';

import React from 'react';
import Link from 'next/link';
import styles from './Header.module.css';
import CountryFlag from 'react-world-flags';

const Header = () => {
  const countryCodes = ['US', 'NG', 'IN', 'JP', 'BR', 'FR', 'ZA', 'CN', 'RU', 'CA'];

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
      <div className={styles.banner}>
        <span className={styles.bannerText}>
          Planetary Exchange Platform |{' '}
          {countryCodes.map((code) => (
            <CountryFlag
              key={code}
              countryCode={code}
              style={{
                width: '1.5em',
                height: '1.5em',
                margin: '0 10px', // Space between flags
              }}
            />
          ))}
          | Cultural Exchange | Community Empowerment
        </span>
      </div>
    </header>
  );
};

export default Header;