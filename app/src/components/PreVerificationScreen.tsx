'use client';

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import styles from '../../partner/whitepaper/WhitepaperPreVerify.module.css';
import OrbAnimation from './OrbAnimation';
import { useOrbSize } from '@/lib/hooks/useOrbSize';

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
  const orbSize = useOrbSize();

  useEffect(() => {
    if (typeof document !== 'undefined') {
      // Placeholder for any safe DOM logic if needed later
    }
  }, []);

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
      <motion.div
        className={styles.orbWrapper}
        style={{ marginTop: '2rem', maxWidth: '180px' }}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={orbBreathing}
        whileHover={{ scale: 1.07 }}
      >
        <OrbAnimation size={orbSize} fadeIn />
      </motion.div>

      <motion.h1 className={`${styles.heading} ${styles.animateFadeIn}`} variants={itemVariants}>
        Access Key Recognized
      </motion.h1>

      <motion.p className={`${styles.subheading} ${styles.animateFadeIn}`} variants={itemVariants}>
        Confirm terms to unlock your private portal.
      </motion.p>

      <motion.div className={styles.tokenBox} variants={itemVariants}>
        {token && (
          <div className={styles.detectedTokenBox}>
            <input
              type="text"
              value={token}
              readOnly
              className={styles.inputField}
            />
          </div>
        )}

        <div className={styles.termsBox}>
          <h2 className={styles.termsHeading}>Portal Terms of Access</h2>
          <p>
            By entering this portal, you acknowledge your designation as a verified partner of <strong>Axis Point Investments (AXPT.io)</strong> —
            a living node in a greater constellation of Earth-aligned stewards and strategic visionaries.
          </p>
          <p>
            The documents herein are encrypted transmissions intended solely for your private review, or that of your directly affiliated team.
            Their contents are sacred in nature — not in secrecy, but in precision. They serve the birth of generational infrastructure.
          </p>
          <p>
            Redistribution, duplication, forwarding, or extraction of any part of these materials without explicit written permission
            from AXPT is strictly prohibited. Your conscious participation confirms your agreement to honor these boundaries.
          </p>
          
    <label className={styles.checkboxRow}>
      {acceptTerms && (
        <div className={styles.guardianSigil}>
          <img src="/images/axpt.io-2x.png" alt="Guardian Sigil" />
        </div>
      )}

      <div className={styles.customCheckbox}>
        <input
          id="acceptTerms"
          type="checkbox"
          checked={acceptTerms}
          onChange={(e) => setAcceptTerms(e.target.checked)}
        />
        <span className={styles.checkmark}></span>
      </div>

      <span>I have read and honor the terms outlined above.</span>
    </label>
        </div>

        <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
          <motion.button
            onClick={handleVerify}
            disabled={status === 'verifying' || !acceptTerms}
            className={`${styles.verifyButton} ${acceptTerms ? styles.buttonActive : styles.buttonDisabled}`}
            whileTap={{ scale: 0.98 }}
            whileHover={acceptTerms ? { scale: 1.05, boxShadow: '0 0 15px #0ff' } : {}}
          >
            {status === 'verifying' ? 'Verifying...' : 'Enter the Portal'}
          </motion.button>
        </div>

        {status === 'error' && (
          <p className={styles.errorText}>Invalid token. Please try again.</p>
        )}
      </motion.div>
    </motion.div>
  );
};

export default PreVerificationScreen;
