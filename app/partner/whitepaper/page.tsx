'use client';

import { useState, useEffect } from 'react';
import GreetingWrapper from '../../../components/GreetingWrapper';
import WhitepaperViewer from '../../../components/WhitepaperViewer';
import VerificationSuccessScreen from '../../../components/VerificationSuccessScreen';
import StorageStatus from '../../../components/StorageStatus';
import PreVerificationScreen from '../../../components/PreVerificationScreen';

import preStyles from './WhitepaperPreVerify.module.css';
import postStyles from './Whitepaper.module.css';

export default function WhitepaperPage() {
  const [token, setToken] = useState('');
  const [status, setStatus] = useState<'idle' | 'verifying' | 'success' | 'error'>('idle');
  const [verifiedPartner, setVerifiedPartner] = useState<string | null>(null);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [transitionComplete, setTransitionComplete] = useState(false);
  const [startFadeOut, setStartFadeOut] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  const devBypass = false;
  const envMode = process.env.NODE_ENV || 'development';

  useEffect(() => {
    const savedPartner = localStorage.getItem('verifiedPartner');
    const preVerified = localStorage.getItem('preVerified');

    if (savedPartner) {
      setVerifiedPartner(savedPartner);
      setStatus('success');
      setTransitionComplete(preVerified === 'true');
    } else {
      resetState();
    }
    setHydrated(true);
  }, []);

  const handleVerify = async () => {
    if (!acceptTerms) {
      alert('Please agree to the terms and conditions.');
      return;
    }

    setStatus('verifying');

    try {
      const res = await fetch('/api/partner/verify-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setStatus('success');
        setVerifiedPartner(data.partner);
        localStorage.setItem('verifiedPartner', data.partner);
        localStorage.removeItem('preVerified');
        setTransitionComplete(false);
      } else {
        setStatus('error');
      }
    } catch (error) {
      console.error('Verification failed:', error);
      setStatus('error');
    }
  };

  const resetState = () => {
    setStatus('idle');
    setVerifiedPartner(null);
    setTransitionComplete(false);
    setStartFadeOut(false);
    setToken('');
  };

  const handleSoftReset = () => {
    localStorage.removeItem('verifiedPartner');
    localStorage.removeItem('preVerified');
    resetState();
  };

  if (!hydrated) {
    return (
      <div className={postStyles.loadingScreen}>
        <p>Loading access portal...</p>
      </div>
    );
  }

  if ((status === 'success' && verifiedPartner) || devBypass) {
    if (!transitionComplete) {
      return (
        <VerificationSuccessScreen
          onComplete={() => {
            setStartFadeOut(true);
            setTimeout(() => {
              setTransitionComplete(true);
              localStorage.setItem('preVerified', 'true');
            }, 600); // ✅ We'll tune this timing together next
          }}
        />
      );
    }

    return (
      <div className={postStyles.fullScreenWrapper}>
        <GreetingWrapper partnerName={verifiedPartner || 'Developer Mode'}>
          <div className={`${postStyles.viewerSection} ${postStyles.fadeIn}`}>
            <WhitepaperViewer pdfFile="/whitepaper/AXPT-Whitepaper.pdf" />
          </div>
        </GreetingWrapper>
        {devBypass && (
          <div className={postStyles.devBadge}>
            DEV MODE ACTIVE<br />
            <span className={postStyles.envIndicator}>Environment: {envMode}</span>
          </div>
        )}
        <StorageStatus onStorageCleared={handleSoftReset} />
      </div>
    );
  }

  // 🟢 Pre-Verification Experience with Orb & Motion
  return (
    <PreVerificationScreen
      token={token}
      setToken={setToken}
      acceptTerms={acceptTerms}
      setAcceptTerms={setAcceptTerms}
      handleVerify={handleVerify}
      status={status}
    />
  );
}