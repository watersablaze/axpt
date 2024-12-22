'use client';

import React from 'react';
import styles from './HeroSection.module.css';

const HeroSection = () => {
  return (
    <section className={styles.hero}>
      <div className={styles.content}>
        <h2 className={styles.heading}>
          PLANETARY
          <br />
          XCHANGE
          <br />
          PLATFORM
        </h2>
       
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