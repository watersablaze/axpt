'use client';

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './SigilFormPanel.module.css';
import MiniSigil from './MiniSigil';

export default function SigilFormPanel() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [loadingDots, setLoadingDots] = useState('.');
  const confettiRef = useRef<HTMLCanvasElement>(null);

  // 🌗 Reveal form after delay (smooth fade-in)
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

    const timer = setTimeout(() => {
      setVisible(true);
    }, getDelay() - 200);

    return () => clearTimeout(timer);
  }, []);

  // ✨ Loading dots
  useEffect(() => {
    if (!isSending) return;
    let dots = 0;
    const interval = setInterval(() => {
      dots = (dots + 1) % 4;
      setLoadingDots('.'.repeat(dots));
    }, 400);
    return () => clearInterval(interval);
  }, [isSending]);

  // 🎉 Confetti
  const triggerConfetti = () => {
    const canvas = confettiRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const particles = Array.from({ length: 25 }).map(() => ({
      x: canvas.width / 2,
      y: canvas.height / 2,
      vx: (Math.random() - 0.5) * 6,
      vy: (Math.random() - 1.2) * 5,
      color: `hsl(${Math.random() * 360}, 100%, 70%)`,
      life: 100,
    }));
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.12;
        p.life -= 2;
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(p.life / 100, 0);
        ctx.fillRect(p.x, p.y, 4, 4);
      });
      if (particles.some((p) => p.life > 0)) requestAnimationFrame(animate);
    };
    animate();
  };

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
        triggerConfetti();
      } else {
        const data = await res.json();
        console.error('Submit failed:', data.error);
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
          <canvas ref={confettiRef} className={styles.confettiCanvas} />

          <motion.div
            className={styles.formBox}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
          >
            <div className={styles.auroraOverlay} />
            <div className={styles.sigilWrapper}>
              <MiniSigil />
            </div>

            {!submitted ? (
              <>
                <p className={styles.description}>
                  Enter your email to unlock exclusive insights into sustainable cultural finance
                  and decentralized innovation.
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
                className={styles.confirmation}
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
              >
                <div className={styles.glowRing} />
                <p>Thank you — you're in.</p>
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}