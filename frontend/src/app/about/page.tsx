'use client';

import React from 'react';
import styles from './About.module.css';

export default function AboutPage() {
  return (
    <div className={styles.container}>
      <h1 className={styles.heading}>About Us</h1>
      <p className={styles.description}>
        Welcome to the About page of Axis Point. Our mission is to connect and empower communities across the globe through innovative and sustainable solutions. Join us in shaping a brighter future.
      </p>
    </div>
  );
}