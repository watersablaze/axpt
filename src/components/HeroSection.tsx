'use client';

import React from 'react';
import styles from './HeroSection.module.css';

const HeroSection = () => {
  return (
    <section className={styles.hero}>
      <div className={styles.content}>
        <h2 className={styles.heading}>PLANETARY XCHANGE PLATFORM</h2>
        <p className={styles.tagline}>
          Currency Exchange Portal Stimulating the Global Melanted and Indigenous Community through Sustainable Devleopment"
        </p>
        <form className={styles.form}>
          <input
            type="text"
            placeholder="Enter your name"
            className={styles.input}
            required
          />
          <input
            type="email"
            placeholder="Enter your email"
            className={styles.input}
            required
          />
          <button type="submit" className={styles.submitButton}>
            Get Started
          </button>
        </form>
      </div>
    </section>
  );
};

export default HeroSection;