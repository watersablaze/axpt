'use client';

import React from 'react';
import styles from './HeroSection.module.css'; // Correct import

const HeroSection = () => {
  return (
    <section className={styles.hero}>
      <h2 className={styles.heading}>Welcome to the Axis Point</h2>
      <p className={styles.tagline}>Join PXP to explore the new age of digital platforms.</p>
    </section>
  );
};

export default HeroSection;