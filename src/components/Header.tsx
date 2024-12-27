'use client';

import React from 'react';
import Link from 'next/link';
import styles from './Header.module.css';
import CountryFlag from 'react-world-flags';

const Header = () => {
  const countryCodes = [
    'US', 'CA', 'DE', 'JP', 'KR', 'IN', 'ZA',
    'AE', 'BR', 'GB', 'FR', 'ET', 'CN', 'RU',
    'IT', 'AU', 'NZ', 'SE', 'FI', 'NO', 'SG',
    'AR', 'CL', 'KE', 'EG', 'TR', 'SA',
  ];

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
        <div className={styles.bannerText}>
          <img
            src="/PXP.logo.png"
            alt="PXP Logo"
            className={styles.pxpLogo}
            style={{
              width: '2em',
              height: '2em',
              margin: '0 10px',
              verticalAlign: 'middle',
            }}
          />
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
              {/* Insert PXP logo after every 7 flags */}
              {(index + 1) % 7 === 0 && (
                <img
                  src="/PXP.logo.png"
                  alt="PXP Logo"
                  className={styles.pxpLogo}
                  style={{
                    width: '2em',
                    height: '2em',
                    margin: '0 10px',
                    verticalAlign: 'middle',
                  }}
                />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    </header>
  );
};

export default Header;