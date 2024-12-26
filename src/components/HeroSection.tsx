'use client';

import React from 'react';
import styles from './HeroSection.module.css';
import Link from 'next/link';

const HeroSection = () => {
  return (
    <section className={styles.hero}>
      <div className={styles.content}>
        {/* Left Section */}
        <div className={styles.leftSection}>
          <img
            src="/PXP.logo.png"
            alt="PXP Logo"
            className={styles.logo}
          />
          <p className={styles.description}>
            A portal designed to stimulate global melanated and indigenous communities through sustainable development.
          </p>
        </div>

        {/* Right Section */}
        <div className={styles.rightSection}>
          <Link href="/signup" className={styles.signupButton}>
            Enter Here
          </Link>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;