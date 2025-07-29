'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './WelcomeScreen.module.css';
import Image from 'next/image';
import OrbAnimation from '@/components/shared/OrbAnimation';
import { useConsentStore } from '@/stores/useConsentStore';

export default function WelcomeScreen() {
  const [accepted, setAccepted] = useState(false);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const { accept } = useConsentStore();

  useEffect(() => {
    const timeout = setTimeout(() => setMounted(true), 100);
    return () => clearTimeout(timeout);
  }, []);

  const handleProceed = () => {
    if (accepted) {
      accept();
      router.push('/onboard/investor');
    }
  };

  return (
    <div className={styles.welcomeContainer}>
      <div className={styles.portalGlowBackground}></div>
      <div className={styles.entryPulseGlow}></div>

      <div className={styles.orbLayer}>
        <OrbAnimation size={220} fadeIn />
      </div>

      <div className={`${styles.termsBoxWrapper} ${mounted ? styles.fadeInUp : ''}`}>
        <div className={styles.termsBoxNudge}>
          <div className={styles.sigilWrapper}>
            <Image
              src="/images/axpt-sigil.png"
              alt="AXPT Sigil"
              className={styles.sigilImage}
              width={120}
              height={96}
              priority
            />
          </div>

          <h1 className={styles.title}>Onboarding Portal</h1>
          <p className={styles.description}>
            This platform grants you access to secured documents, project details, and sacred realms of action.
          </p>
          <p className={styles.description}>
            By entering, you affirm your role in restoring Earth’s wealth systems and supporting culturally awakened economies.
          </p>
          <p className={styles.description}>
            Accessing this portal is an agreement to honor the spiritual, economic, and ecological purpose of AXPT.
          </p>

          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={accepted}
              onChange={(e) => setAccepted(e.target.checked)}
              className={styles.checkboxInput}
            />
            I understand and accept the terms.
          </label>

          <button
            className={`${styles.proceedButton} ${accepted ? styles.proceedButtonVisible : styles.proceedButtonHidden}`}
            disabled={!accepted}
            onClick={handleProceed}
          >
            PROCEED TO TOKEN GATE
          </button>
        </div>
      </div>
    </div>
  );
}