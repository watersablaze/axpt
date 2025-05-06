'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, useRef, Fragment } from 'react';
import GreetingWrapper from '@/components/GreetingWrapper';
import WhitepaperViewer from '@/components/WhitepaperViewer';
import VerificationSuccessScreen from '@/components/VerificationSuccessScreen';
import StorageStatus from '@/components/StorageStatus';
import PreVerificationScreen from '@/components/PreVerificationScreen';
import { useHydrationState } from '@/lib/hooks/useHydrationState';

import preStyles from './WhitepaperPreVerify.module.css';
import postStyles from './Whitepaper.module.css';

export default function WhitepaperPage() {
  const { hydrated, values } = useHydrationState(['verifiedPartner', 'preVerified']);
  const hydratedOnce = useRef(false);

  const [token, setToken] = useState('');
  const [status, setStatus] = useState<'idle' | 'verifying' | 'success' | 'error'>('idle');
  const [verifiedPartner, setVerifiedPartner] = useState<string | null>(null);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [transitionComplete, setTransitionComplete] = useState(false);
  const [startFadeOut, setStartFadeOut] = useState(false);
  const [showBadge, setShowBadge] = useState(true);

  const devBypass = false;
  const envMode = process.env.NODE_ENV || 'development';

  useEffect(() => {
    if (process.env.NODE_ENV === 'production') {
      const timer = setTimeout(() => setShowBadge(false), 4000);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    if (!hydrated || hydratedOnce.current) return;
    hydratedOnce.current = true;

    const savedPartner = values['verifiedPartner'];
    const preVerified = values['preVerified'];

    if (savedPartner) {
      setVerifiedPartner(savedPartner);
      setStatus('success');
      setTransitionComplete(preVerified === 'true');
    } else {
      resetState();
    }
  }, [hydrated]);

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
        <p>🌀 Waiting for hydration (loading access portal)...</p>
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
            }, 600);
          }}
        />
      );
    }

    return (
      <Fragment>
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

        {process.env.NODE_ENV === 'production' && showBadge && (
          <div
            style={{
              position: 'fixed',
              bottom: '1rem',
              right: '1rem',
              background: '#000',
              color: '#0ff',
              padding: '6px 12px',
              fontSize: '0.75rem',
              borderRadius: '6px',
              opacity: 0.8,
              fontFamily: 'monospace',
              zIndex: 9999,
              transition: 'opacity 0.5s ease',
            }}
          >
            AXPT ● Vercel ✅
          </div>
        )}
      </Fragment>
    );
  }

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
