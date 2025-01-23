import React, { useState } from 'react';
import { motion } from 'framer-motion';
import styles from './HeroSection.module.css';

const HeroSection = () => {
  const [formMessage, setFormMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (isSubmitting) return;
    setIsSubmitting(true);
    setFormMessage(''); // Reset message

    const form = e.currentTarget;
    const formData = {
      name: (form.elements.namedItem('name') as HTMLInputElement).value,
      email: (form.elements.namedItem('email') as HTMLInputElement).value,
      password: (form.elements.namedItem('password') as HTMLInputElement).value,
      industry: (form.elements.namedItem('industry') as HTMLSelectElement).value,
      interests: (form.elements.namedItem('interests') as HTMLSelectElement).value,
    };

    console.log('Submitting form data:', formData); // Log form data

    try {
      const response = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setFormMessage('Signup successful! Redirecting...');
        form.reset(); // Clear the form
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 2000);
      } else {
        console.error('Signup Error Response:', data.message);
        setFormMessage(data.message || 'Signup failed!');
      }
    } catch (error) {
      console.error('Signup Error:', error.message || error);
      setFormMessage('An error occurred. Please try again later.');
    } finally {
      setIsSubmitting(false); // Re-enable button
    }
  };

  return (
    <section className={styles.hero}>
      <motion.img
        src="/AXI.png"
        alt="AXI Logo"
        className={styles.logoTopLeft}
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 1.5 }}
      />

      <div className={styles.content}>
        <p className={styles.tagline}>
          The currency exchange portal connecting <br />
          technology, trade, and culture into a <br />
          global symphony of progress.
        </p>
      </div>

      <div className={styles.signupForm}>
        <h2 className={styles.formTitle}>Register Here</h2>
        <form onSubmit={handleSignup}>
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
            disabled={isSubmitting}
            whileHover={{
              scale: isSubmitting ? 1 : 1.05,
              background: isSubmitting
                ? 'gray'
                : 'linear-gradient(90deg, #175a25, #9db42d)',
              boxShadow: isSubmitting ? 'none' : '0px 6px 12px rgba(0, 0, 0, 0.4)',
            }}
            whileTap={{
              scale: isSubmitting ? 1 : 0.95,
            }}
          >
            {isSubmitting ? 'Processing...' : 'Access'}
          </motion.button>
        </form>
        {formMessage && <p className={styles.formMessage}>{formMessage}</p>}
      </div>
    </section>
  );
};

export default HeroSection;