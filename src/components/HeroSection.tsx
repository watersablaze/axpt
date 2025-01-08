import React from 'react';
import styles from './HeroSection.module.css';

const HeroSection = () => {
  return (
    <section className={styles.hero}>
      {/* AXI Logo in Top Left Corner */}
      <img src="/AXI.png" alt="AXI Logo" className={styles.logoTopLeft} />

      {/* Left Content Section */}
      <div className={styles.content}>
        <h1 className={styles.title}>AP</h1>
        <p className={styles.tagline}>
          One Platform: Infinite Pathways. <br /> The crossroads of <strong>technology</strong>, <strong>trade</strong>, <br /> and <strong>cultural exchange</strong>, <br /> bridging borders and timelines.
          <br />
        </p>
      </div>

      {/* Signup Form Section */}
      <div className={styles.signupForm}>
        <h2 className={styles.formTitle}>Register Here</h2>
        <form>
          <div className={styles.inputGroup}>
            <label htmlFor="name">Name</label>
            <input type="text" id="name" name="name" placeholder="Enter your name" required />
          </div>
          <div className={styles.inputGroup}>
            <label htmlFor="email">Email</label>
            <input type="email" id="email" name="email" placeholder="Enter your email" required />
          </div>
          <div className={styles.inputGroup}>
            <label htmlFor="password">Password</label>
            <input type="password" id="password" name="password" placeholder="Enter your password" required />
          </div>
          <button type="submit" className={styles.submitButton}>AcCess</button>
        </form>
      </div>

      {/* Globe PNG in Bottom Right Corner */}
      <img src="/globe.png" alt="Globe" className={styles.globeBottomRight} />
    </section>
  );
};

export default HeroSection;