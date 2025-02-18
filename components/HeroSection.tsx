import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image'; // ✅ Import Next.js Image
import { Visibility, VisibilityOff } from '@mui/icons-material'; // Material Icons
import { signIn } from 'next-auth/react'; // For immediate login post-signup
import styles from './HeroSection.module.css';

const HeroSection = () => {
  const [formMessage, setFormMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);

  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormMessage('Processing your signup...');

    const form = e.currentTarget;
    const formData = {
      name: (form.elements.namedItem('name') as HTMLInputElement).value,
      email: (form.elements.namedItem('email') as HTMLInputElement).value,
      password: (form.elements.namedItem('password') as HTMLInputElement).value,
      industry: (form.elements.namedItem('industry') as HTMLSelectElement).value,
      interests: (form.elements.namedItem('interests') as HTMLSelectElement).value,
    };

    try {
      const response = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setFormMessage('Signup successful! Logging you in...');

        // Auto-login after successful signup
        const loginResponse = await signIn('credentials', {
          redirect: false,
          email: formData.email,
          password: formData.password,
        });

        if (loginResponse?.ok) {
          setFormMessage('Welcome! Redirecting to your dashboard...');
          setTimeout(() => {
            window.location.href = '/dashboard';
          }, 2000);
        } else {
          setFormMessage('Signup succeeded, but auto-login failed. Please login manually.');
        }

        form.reset();
      } else {
        setFormMessage(data.message || 'Signup failed. Please try again.');
      }
    } catch (err) {
      console.error('❌ Signup Error:', err);
      setFormMessage('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className={styles.hero}>
      {/* ✅ Optimized AXI Logo with Priority */}
      <motion.div
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 1.5 }}
      >
        <Image
          src="/AXI.png"
          alt="AXI Logo"
          width={100}
          height={100}
          priority // ✅ Loads faster
          className={styles.logoTopLeft}
        />
      </motion.div>

      <div className={styles.content}>
        <p className={styles.tagline}>
          The currency exchange portal connecting <br />
          technology, trade, and culture into a <br />
          global symphony of progress.
        </p>
      </div>

      {/* ✅ Background Image Optimization */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 8, ease: 'easeOut' }}
      >
        <Image
          src="/large-map.png"
          alt="Arrow Map"
          width={600}
          height={400}
          className={styles.LargeMap}
        />
      </motion.div>

      {/* Signup Form */}
      <div className={styles.signupForm}>
        <h2 className={styles.formTitle}>Register Here</h2>
        <form onSubmit={handleSignup} autoComplete="off">
          <div className={styles.inputGroup}>
            <label htmlFor="name">Name</label>
            <input type="text" id="name" name="name" placeholder="Enter your name" required />
          </div>
          <div className={styles.inputGroup}>
            <label htmlFor="email">Email</label>
            <input type="email" id="email" name="email" placeholder="Enter your email" required />
          </div>
          <motion.button
            type="submit"
            className={styles.submitButton}
            disabled={isSubmitting}
            whileHover={{
              scale: isSubmitting ? 1 : 1.05,
              background: isSubmitting ? '#ccc' : 'linear-gradient(90deg, #175a25, #9db42d)',
            }}
            whileTap={{ scale: 0.95 }}
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