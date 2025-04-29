'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import styles from '../app/partner/whitepaper/WhitepaperPreVerify.module.css'; // Adjust path if needed!
import OrbAnimation from './OrbAnimation';

interface PreVerificationScreenProps {
  token: string;
  setToken: (token: string) => void;
  acceptTerms: boolean;
  setAcceptTerms: (accept: boolean) => void;
  handleVerify: () => void;
  status: 'idle' | 'verifying' | 'success' | 'error';
}

const PreVerificationScreen: React.FC<PreVerificationScreenProps> = ({
  token,
  setToken,
  acceptTerms,
  setAcceptTerms,
  handleVerify,
  status,
}) => {
  const [videoLoaded, setVideoLoaded] = useState(false);

  // ✨ Motion Variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.5,
        delayChildren: 0.5,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { ease: 'easeOut', duration: 1 } },
  };

  // 🟢 Breathing Loop Animation (TypeScript-safe)
  const orbBreathing = {
    opacity: 1,
    scale: [1, 1.02, 1],
    transition: {
      duration: 4,
      ease: 'easeInOut',
      repeat: Infinity,
      repeatType: 'loop' as const,
    },
  };

  return (
    <motion.div
      className={styles.pageContainer}
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      {/* Orb Animation */}
      <motion.div
        className={styles.orbWrapper}
        style={{
          marginTop: '3rem', // 🌟 LOWERED the Orb Gently
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={orbBreathing}
        whileHover={{ scale: 1.07 }}
      >
        <OrbAnimation size={150} fadeIn />
      </motion.div>

      {/* Heading */}
      <motion.h1 className={styles.heading} variants={itemVariants}>
        Enter Your Access Token
      </motion.h1>

      {/* Subheading */}
      <motion.p className={styles.subheading} variants={itemVariants}>
        Confidential Access Portal.
      </motion.p>

      {/* Input Section */}
      <motion.div className={styles.tokenBox} variants={itemVariants}>
        <input
          type="text"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="Your Access Token"
          className={styles.inputField}
        />

        <div className={styles.termsBox}>
          <h2 className={styles.termsHeading}>Access Terms & Conditions</h2>
          <p>
            By entering your access token, you affirm that you are a verified partner of Axis Point Investments (AXPT.io).
            The contents of this whitepaper are confidential and intended solely for your individual review.
          </p>
          <p>
            Redistribution, duplication, or sharing of this document or its contents without explicit permission from AXPT.io is strictly prohibited.
            Your access and usage of this material confirms your agreement to these terms.
          </p>
          <label className={styles.checkboxRow}>
            <input
              id="acceptTerms"
              type="checkbox"
              checked={acceptTerms}
              onChange={(e) => setAcceptTerms(e.target.checked)}
            />
            <span>I have read and agree to the terms and conditions stated above.</span>
          </label>
        </div>

        <button
          onClick={handleVerify}
          disabled={status === 'verifying'}
          className={`${styles.verifyButton} ${
            acceptTerms ? styles.buttonActive : styles.buttonDisabled
          }`}
        >
          {status === 'verifying' ? 'Verifying...' : 'Access Whitepaper'}
        </button>

        {status === 'error' && (
          <p className={styles.errorText}>Invalid token. Please try again.</p>
        )}
      </motion.div>
    </motion.div>
  );
};

export default PreVerificationScreen;