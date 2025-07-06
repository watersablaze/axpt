'use client';

import React, { useEffect, useState } from 'react';
import styles from './WelcomeScreen.module.css';
import OrbAnimation from '@/components/shared/OrbAnimation';
import MirageTransition from '../shared/MirageTransition';
import TokenGate from '@/components/onboarding/TokenGate';
import VerifiedDashboard from '@/components/onboarding/VerifiedDashboard';
import { decodeToken } from '@/utils/token';
import { useTokenStore } from '@/stores/useTokenStore';

type Phase = 'welcome' | 'sigil' | 'tokenInput' | 'dashboard';

type WelcomeScreenProps = {
  onAcceptAction: () => void;
};

export default function WelcomeScreen({ onAcceptAction }: WelcomeScreenProps) {
  const [phase, setPhase] = useState<Phase>('welcome');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [expired, setExpired] = useState(false);
  const { decoded, token, setToken, clearToken } = useTokenStore();

  useEffect(() => {
    if (phase !== 'tokenInput') return;

    const lastToken = localStorage.getItem('axpt_last_token');
    if (lastToken) {
      const payload = decodeToken(lastToken);
      if (payload && payload.exp && Date.now() < payload.exp * 1000) {
        setToken(lastToken, payload);
        setPhase('dashboard');
      } else {
        setExpired(true);
        clearToken();
        localStorage.removeItem('axpt_last_token');
      }
    }
  }, [phase]);

  const handleCheckbox = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      setPhase('sigil');
      setTimeout(() => {
        setPhase('tokenInput');
        setIsTransitioning(false);
        onAcceptAction();
      }, 1600);
    }, 700);
  };

  const handleTokenVerified = () => {
    setPhase('dashboard');
  };

  return (
    <div className={styles.welcomeContainer}>
      <div className={styles.portalEthericBackground} />

      <MirageTransition keyProp={phase}>
        {phase === 'welcome' && !isTransitioning && (
          <div className={styles.gateBox}>
            <div className={styles.orbWrapper}>
              <OrbAnimation size={180} fadeIn />
            </div>
            <div className={styles.messageBox}>
              <h1 className={styles.title}>ENTERING AXPT ONBOARDING PORTAL</h1>
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
          <div className={styles.tokenInputWrapper}>
            {expired && (
              <div className={styles.sessionWarning}>
                ⚠️ Your session has expired. Please enter a new token to continue.
              </div>
            )}
            <TokenGate onVerifiedAction={handleTokenVerified} />
          </div>
        )}

        {phase === 'dashboard' && decoded && token && (
          <VerifiedDashboard />
        )}
      </MirageTransition>
    </div>
  );
}