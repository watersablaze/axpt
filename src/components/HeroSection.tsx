import React from 'react';
import GlobeAnimation from './GlobeAnimation'; // Import the GlobeAnimation component
import MatrixEffect from './MatrixEffect'; // If applicable
import styles from './HeroSection.module.css';

const HeroSection = () => {
  return (
    <section className={styles.hero}>
      {/* Globe Animation */}
      <GlobeAnimation />

      {/* Matrix Effect */}
      <MatrixEffect />

      {/* Hero Content */}
      <div className={styles.content}>
        <h1 className={styles.title}>Welcome to the Future of Exchange</h1>
        <p className={styles.description}>
          Empowering communities worldwide through cultural and financial collaboration.
        </p>
        <a href="/signup" className={styles.signupButton}>
          Access
        </a>
      </div>
    </section>
  );
};

export default HeroSection;