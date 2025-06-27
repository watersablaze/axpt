'use client';

import React, { useState } from 'react';
import styles from './WelcomeScreen.module.css';
import OrbAnimation from '@/components/shared/OrbAnimation';
import TokenGate from './TokenGate';
import VerifiedDashboard from './VerifiedDashboard';
import MirageTransition from './MirageTransition';

export default function WelcomeScreen() {
  const [phase, setPhase] = useState<'welcome' | 'sigil' | 'tokenInput'>('welcome');
  const [token, setToken] = useState<string>('');

  const handleCheckbox = () => {
    setPhase('sigil');
    setTimeout(() => setPhase('tokenInput'), 1200); // delay for transition
  };

  return (
    <div className={styles.welcomeContainer}>
      <div className={styles.portalGlowBackground} />

      <MirageTransition transitionKey={phase}>
        {phase === 'welcome' && (
          <div className={styles.gateBox}>
            <div className={styles.orbWrapper}>
              <OrbAnimation size={180} fadeIn />
            </div>
            <div className={styles.messageBox}>
              <h1 className={styles.title}>ENTERING AXPT PORTAL</h1>
              <p className={styles.message}>
                This platform is a sacred technology. By entering, you affirm your role in restoring
                Earth’s wealth systems and supporting culturally awakened economies. Accessing this
                portal is an agreement to honor the spiritual, economic, and ecological purpose of AXPT.
              </p>
              <label className={styles.checkboxLabel}>
                <input type="checkbox" onChange={handleCheckbox} />
                <span>I understand and agree to the terms above</span>
              </label>
            </div>
          </div>
        )}

        {phase === 'sigil' && (
          <div className={styles.sigilWrapper}>
            <OrbAnimation size={120} fadeIn />
          </div>
        )}

        {phase === 'tokenInput' && (
          token ? (
            <TokenGate
              token={token}
              onVerified={(partner, tier, token, docs) => (
                <VerifiedDashboard
                  partner={partner}
                  tier={tier}
                  token={token}
                  docs={docs}
                />
              )}
            />
          ) : (
            <div className={styles.tokenInputWrapper}>
              <div className={styles.tokenCard}>
                <h2 className={styles.tokenCardTitle}>Enter Your Access Token</h2>
                <input
                  type="text"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  className={styles.tokenInput}
                  placeholder="Paste token here..."
                />
              </div>
            </div>
          )
        )}
      </MirageTransition>
    </div>
  );
}