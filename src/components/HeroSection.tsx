import React, { useState } from 'react';
import { motion } from 'framer-motion';
import styles from './HeroSection.module.css';

const HeroSection = () => {
  const [formMessage, setFormMessage] = useState(''); // State to handle feedback messages

  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const form = e.currentTarget;
    const name = form.name.value;
    const email = form.email.value;
    const password = form.password.value;
    const industry = form.industry.value;
    const interests = form.interests.value;

    try {
      const response = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, industry, interests }),
      });

      const data = await response.json();

      if (response.ok) {
        setFormMessage('Signup successful! Redirecting...');
        setTimeout(() => {
          window.location.href = '/dashboard'; // Redirect to the dashboard after success
        }, 2000);
      } else {
        setFormMessage(data.message || 'Signup failed. Please try again.');
      }
    } catch (error) {
      console.error('Signup error:', error);
      setFormMessage('An error occurred. Please try again.');
    }
  };

  return (
    <section className={styles.hero}>
      {/* Animated AXI Logo in Top Left Corner */}
      <motion.img
        src="/AXI.png"
        alt="AXI Logo"
        className={styles.logoTopLeft}
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 1.5 }}
      />

      {/* Left Content Section */}
      <div className={styles.content}>
        <p className={styles.tagline}>
          The currency exchange portal connecting <br />
          technology, trade, and culture into a <br />
          global symphony of progress.
        </p>
      </div>

      {/* Signup Form Section */}
      <div className={styles.signupForm}>
        <h2 className={styles.formTitle}>Register Here</h2>
        <form onSubmit={handleSignup}>
          <div className={styles.inputGroup}>
            <label htmlFor="name">Name</label>
            <input
              type="text"
              id="name"
              name="name"
              placeholder="Enter your name"
              required
            />
          </div>
          <div className={styles.inputGroup}>
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              placeholder="Enter your email"
              required
            />
          </div>
          <div className={styles.inputGroup}>
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              placeholder="Enter your password"
              required
            />
          </div>
          <div className={styles.inputGroup}>
            <label htmlFor="industry">Industry</label>
            <select id="industry" name="industry" required>
              <option value="">Select your industry</option>
              <option value="finance">Finance</option>
              <option value="technology">Technology</option>
              <option value="education">Education</option>
              <option value="healthcare">Healthcare</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div className={styles.inputGroup}>
            <label htmlFor="interests">Core Interests</label>
            <select id="interests" name="interests" required>
              <option value="">Select your interests</option>
              <option value="sustainability">Sustainability</option>
              <option value="blockchain">Blockchain</option>
              <option value="investment">Investment</option>
              <option value="culturalExchange">Cultural Exchange</option>
            </select>
          </div>
          <motion.button
            type="submit"
            className={styles.submitButton}
            whileHover={{
              scale: 1.05,
              background: 'linear-gradient(90deg, #175a25, #9db42d)',
              boxShadow: '0px 6px 12px rgba(0, 0, 0, 0.4)',
            }}
            whileTap={{
              scale: 0.95,
            }}
          >
            Access
          </motion.button>
        </form>
        {formMessage && <p className={styles.formMessage}>{formMessage}</p>}
      </div>

      {/* Animated Arrow Map PNG in Center */}
      <motion.img
        src="/large-map.png"
        alt="Arrow Map"
        className={styles.LargeMap}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 8, ease: 'easeOut' }}
      />
    </section>
  );
};

export default HeroSection;