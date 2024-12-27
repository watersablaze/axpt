'use client';

import React from 'react';
import Link from 'next/link';
import styles from './Header.module.css';
import CountryFlag from 'react-world-flags';

const Header = () => {
  const countryCodes = [
    'US', 'NG', 'IN', 'JP', 'BR', 'FR', 'ZA', 'CN', 'RU', 'CA', 
    'DE', 'KE', 'EG', 'IT',
  ]; // Added a total of 14 flags

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
          {countryCodes.map((code, index) => (
            <React.Fragment key={index}>
              <CountryFlag
                code={code}
                style={{
                  width: '1.5em',
                  height: '1.5em',
                  margin: '0 10px',
                  verticalAlign: 'middle',
                }}
              />
              {(index + 1) % 7 === 0 && (
                <img
                  src="/PXP.logo.png"
                  alt="PXP Logo"
                  className={styles.pxpLogo}
                />
              )}
            </React.Fragment>
          ))}
        </span>
      </div>
    </header>
  );
};

export default Header;