'use client';

import { useState, useEffect, useRef, Fragment, Suspense } from 'react';
import dynamicImport from 'next/dynamic';
import { useHydrationState } from '@/lib/hooks/useHydrationState';
import styles from '@/partner/whitepaper/WhitepaperPreVerify.module.css';
import postStyles from './Whitepaper.module.css';

// ✅ Dynamic imports for SSR-unsafe components
const GreetingWrapper = dynamicImport(() => import('@/components/GreetingWrapper'));
const WhitepaperViewer = dynamicImport(() => import('@/components/WhitepaperViewer'), { ssr: false });
const VerificationSuccessScreen = dynamicImport(() => import('@/components/VerificationSuccessScreen'), { ssr: false });
const StorageStatus = dynamicImport(() => import('@/components/StorageStatus'), { ssr: false });
const PreVerificationScreen = dynamicImport(() => import('@/components/PreVerificationScreen'), { ssr: false });

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
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('verifiedPartner', data.partner);
          localStorage.removeItem('preVerified');
        }
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
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('verifiedPartner');
      localStorage.removeItem('preVerified');
    }
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
        <Suspense fallback={<div className={postStyles.loadingScreen}>Loading animation...</div>}>
          <VerificationSuccessScreen
            onComplete={() => {
              setStartFadeOut(true);
              setTimeout(() => {
                setTransitionComplete(true);
                if (typeof localStorage !== 'undefined') {
                  localStorage.setItem('preVerified', 'true');
                }
              }, 600);
            }}
          />
        </Suspense>
      );
    }

    return (
      <Fragment>
        <Suspense fallback={<div className={postStyles.loadingScreen}>Loading viewer...</div>}>
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
        </Suspense>

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
    <Suspense fallback={<div className={postStyles.loadingScreen}>Loading pre-verification screen...</div>}>
      <PreVerificationScreen
        token={token}
        setToken={setToken}
        acceptTerms={acceptTerms}
        setAcceptTerms={setAcceptTerms}
        handleVerify={handleVerify}
        status={status}
      />
    </Suspense>
  );
}