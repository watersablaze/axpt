'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import styles from './WelcomeScreen.module.css';
import OrbAnimation from '@/components/shared/OrbAnimation';
import { useConsentStore } from '@/stores/useConsentStore';

export default function WelcomeScreen() {
  const [accepted, setAccepted] = useState(false);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const { accept } = useConsentStore();

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 80);
    return () => clearTimeout(t);
  }, []);

  const handleProceed = useCallback(() => {
    if (!accepted) return;
    accept();
    router.push('/onboard/investor');
  }, [accepted, accept, router]);

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if ((e.key === 'Enter' || e.key === ' ') && accepted) {
        e.preventDefault();
        handleProceed();
      }
    },
    [accepted, handleProceed]
  );

  return (
    <div className={styles.welcomeContainer}>
      {/* Ambient layers */}
      <div className={styles.portalGlowBackground} aria-hidden="true" />
      <div className={styles.entryPulseGlow} aria-hidden="true" />

      {/* Center orb */}
      <div className={styles.orbLayer} aria-hidden="true">
        <OrbAnimation size={220} fadeIn />
      </div>

      {/* Content */}
      <div
        className={`${styles.termsBoxWrapper} ${mounted ? styles.fadeInUp : ''}`}
        role="region"
        aria-labelledby="onboarding-title"
      >
        <div className={styles.termsBoxNudge} tabIndex={0} onKeyDown={onKeyDown}>
          <div className={styles.sigilWrapper}>
            <Image
              src="/images/axpt-sigil-main.png"
              alt="AXPT Sigil"
              className={styles.sigilImage}
              width={120}
              height={96}
              priority
            />
          </div>

          <h1 id="onboarding-title" className={styles.title}>
            Onboarding Portal
          </h1>

          <p className={styles.description}>
            Welcome to AXPT, the House of Restorative Custodianship and planetary exchange. 
            Accessing this portal affirms you’ll honor the materials and information found inside.
          </p>

          <label className={styles.checkboxLabel} htmlFor="onboard-accept">
            <input
              id="onboard-accept"
              type="checkbox"
              checked={accepted}
              onChange={(e) => setAccepted(e.target.checked)}
              className={styles.checkboxInput}
              aria-describedby="onboard-terms"
            />
            I understand and accept the terms.
          </label>

          {/* Screen-reader-only text */}
          <p id="onboard-terms" className={styles.srOnly}>
            By proceeding you agree to handle all shared information with care and discretion.
          </p>

          <button
            type="button"
            className={`${styles.proceedButton} ${
              accepted ? styles.proceedButtonVisible : styles.proceedButtonHidden
            }`}
            disabled={!accepted}
            onClick={handleProceed}
            aria-disabled={!accepted}
          >
            PROCEED TO TOKEN GATE
          </button>
        </div>
      </div>
    </div>
  );
}