'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './SigilFormPanel.module.css';
import MiniSigil from './MiniSigil';

export default function SigilFormPanel() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [loadingDots, setLoadingDots] = useState('.');

  // 🌗 Reveal form after sigil delay
  useEffect(() => {
    const fallbackDelayMs = 3600;
    const getDelay = () => {
      try {
        const str = getComputedStyle(document.documentElement)
          .getPropertyValue('--sigil-reveal-delay')
          .trim();
        const parsed = parseFloat(str);
        return isNaN(parsed) ? fallbackDelayMs : parsed * 1000;
      } catch {
        return fallbackDelayMs;
      }
    };
    const timer = setTimeout(() => setVisible(true), getDelay() - 200);
    return () => clearTimeout(timer);
  }, []);

  // ✨ Loading dots animation
  useEffect(() => {
    if (!isSending) return;
    let dots = 0;
    const interval = setInterval(() => {
      dots = (dots + 1) % 4;
      setLoadingDots('.'.repeat(dots));
    }, 400);
    return () => clearInterval(interval);
  }, [isSending]);

  // 🌊 Submission handler
  const handleSubmit = async () => {
    if (email.trim() === '') return;
    setIsSending(true);

    try {
      const res = await fetch('/api/intake/axis-journey', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (res.ok) {
        setSubmitted(true);
      } else {
        console.error('Submit failed:', await res.json());
      }
    } catch (err) {
      console.error('Submit error:', err);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className={styles.formOverlay}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
        >
          <motion.div
            className={styles.formBox}
            initial={{ opacity: 0, x: 40, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
            whileHover={{
              scale: 1.02,
              boxShadow: '0 0 40px rgba(230,198,103,0.25)',
              transition: { duration: 0.8, ease: 'easeInOut' },
            }}
          >
            <div className={styles.auroraOverlay} />

            <div className={styles.sigilWrapper}>
              <MiniSigil />
            </div>

            {!submitted ? (
              <>
                <p className={styles.description}>
                  Enter your email to receive the coordinates of our cultural portal — where sustainable
                  finance and sacred innovation converge.
                </p>

                <div className={styles.inputGroup}>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isSending}
                  />
                  <label htmlFor="email">Email address</label>
                </div>

                <button
                  className={`${styles.cta} ${isSending ? styles.loading : ''}`}
                  disabled={isSending}
                  onClick={handleSubmit}
                >
                  {isSending ? `Sending${loadingDots}` : 'Enter the Axis'}
                </button>
              </>
            ) : (
              <motion.div
                key="confirmation"
                className={styles.confirmation}
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
              >
                {/* 🌊 Ripple Ascension Animation */}
                <div className={styles.ripplePulse} />
                <div className={styles.verticalBeam} />

                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 1.2, delay: 0.3 }}
                >
                  Thank you — your signal has been received.
                </motion.p>
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}