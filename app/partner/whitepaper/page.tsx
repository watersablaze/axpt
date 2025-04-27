'use client';

import { useState, useEffect } from 'react';
import LottieAnimation from '../../../components/LottieAnimation';
import GreetingWrapper from '../../../components/GreetingWrapper';
import WhitepaperViewer from '../../../components/WhitepaperViewer';

// 🟢 Pre and Post Verification Styles
import preStyles from './WhitepaperPreVerify.module.css'; 
import postStyles from './Whitepaper.module.css'; 

export default function WhitepaperPage() {
  const [token, setToken] = useState('');
  const [status, setStatus] = useState<'idle' | 'verifying' | 'success' | 'error'>('idle');
  const [verifiedPartner, setVerifiedPartner] = useState<string | null>(null);
  const [acceptTerms, setAcceptTerms] = useState(false);

  // ✅ DEV BYPASS - Turn ON for easy testing
  const devBypass = true; // <<< Change to false before production

  const envMode = process.env.NODE_ENV || 'development';

  // ✅ Load from localStorage on page load
  useEffect(() => {
    const savedPartner = localStorage.getItem('verifiedPartner');
    if (savedPartner) {
      setStatus('success');
      setVerifiedPartner(savedPartner);
    }
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
        localStorage.setItem('verifiedPartner', data.partner); // ✅ Save verified partner
      } else {
        setStatus('error');
      }
    } catch (error) {
      console.error('Verification failed:', error);
      setStatus('error');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('verifiedPartner');
    setStatus('idle');
    setVerifiedPartner(null);
    setToken('');
  };

  // ✅ POST-VERIFICATION VIEW (with DEV BYPASS logic)
  if ((status === 'success' && verifiedPartner) || devBypass) {
    return (
      <div className={postStyles.fullScreenWrapper}>
        <GreetingWrapper partnerName={verifiedPartner || 'Developer Mode'}>
          {/* 🟢 NOW properly passed as children */}
          <div className={postStyles.viewerSection}>
            <WhitepaperViewer pdfFile="/whitepaper/AXPT-Whitepaper.pdf" />
            {!devBypass && (
              <button className={postStyles.logoutButton} onClick={handleLogout}>
                Logout / Reset Verification
              </button>
            )}
          </div>
        </GreetingWrapper>

        {/* 🟢 Dev Mode Badge (Only shows if devBypass is true) */}
        {devBypass && (
          <div className={postStyles.devBadge}>
            DEV MODE ACTIVE<br />
            <span className={postStyles.envIndicator}>Environment: {envMode}</span>
          </div>
        )}
      </div>
    );
  }

  // ✅ PRE-VERIFICATION VIEW
  return (
    <div className={preStyles.pageContainer}>
      <div className={preStyles.animationWrapper}>
        <LottieAnimation src="/lotties/placeholder.json" />
      </div>

      <h1 className={preStyles.heading}>Enter Your Access Token</h1>

      <div className={preStyles.tokenBox}>
        <input
          type="text"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="Your Access Token"
          className={preStyles.inputField}
        />

        <div className={preStyles.termsBox}>
          <h2 className={preStyles.termsHeading}>Access Terms & Conditions</h2>
          <p>
            By proceeding, you agree that the contents of this whitepaper are confidential and intended solely
            for your individual review as a verified partner of Axis Point Investments (AXPT.io).
          </p>
          <p>
            Redistribution or sharing of this document or its content without explicit permission is strictly prohibited.
          </p>
          <div className={preStyles.checkboxRow}>
            <input
              id="acceptTerms"
              type="checkbox"
              checked={acceptTerms}
              onChange={(e) => setAcceptTerms(e.target.checked)}
            />
            <label htmlFor="acceptTerms">I agree to the terms and conditions stated above.</label>
          </div>
        </div>

        <button
          onClick={handleVerify}
          disabled={status === 'verifying'}
          className={`${preStyles.verifyButton} ${acceptTerms ? preStyles.buttonActive : preStyles.buttonDisabled}`}
        >
          {status === 'verifying' ? 'Verifying...' : 'Access Whitepaper'}
        </button>

        {status === 'error' && (
          <p className={preStyles.errorText}>Invalid token. Please try again.</p>
        )}
      </div>
    </div>
  );
}