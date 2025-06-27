'use client';

import { useState } from 'react';
import MirageTransition from '@/components/shared/MirageTransition';
import styles from './TokenGate.module.css';

interface TokenGateProps {
  token: string;
  onVerified: (
    partner: string,
    tier: string,
    token: string,
    docs: string[],
    displayName: string,
    greeting: string
  ) => React.ReactElement;
}

export default function TokenGate({ token, onVerified }: TokenGateProps) {
  const [isVerifying, setIsVerifying] = useState(false);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState('');
  const [partnerInfo, setPartnerInfo] = useState<{
    partner: string;
    tier: string;
    docs: string[];
    displayName: string;
    greeting: string;
  } | null>(null);

  const handleVerify = async () => {
    setIsVerifying(true);
    setError('');
    try {
      const res = await fetch('/api/partner/verify-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });

      const data = await res.json();

      if (res.ok && data?.ok) {
        setPartnerInfo({
          partner: data.partner,
          tier: data.tier,
          docs: data.docs || [],
          displayName: data.displayName,
          greeting: data.greeting,
        });
        setVerified(true);
      } else {
        setError(data.error || 'Invalid token');
      }
    } catch (err) {
      setError('Verification failed. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  if (verified && partnerInfo) {
    return (
      <MirageTransition>
        {onVerified(
          partnerInfo.partner,
          partnerInfo.tier,
          token,
          partnerInfo.docs,
          partnerInfo.displayName,
          partnerInfo.greeting
        )}
      </MirageTransition>
    );
  }

  return (
    <MirageTransition>
      <div className={styles.tokenGateContainer}>
        <div className={styles.tokenCard}>
          <h2 className={styles.tokenCardTitle}>Verifying Your Access Token</h2>
          <input
            type="text"
            value={token}
            readOnly
            className={styles.tokenInput}
          />
          <button
            onClick={handleVerify}
            className={styles.verifyButton}
            disabled={isVerifying}
          >
            {isVerifying ? 'Verifying...' : 'Enter The Portal'}
          </button>
          {error && <p className={styles.errorMessage}>{error}</p>}
        </div>
      </div>
    </MirageTransition>
  );
}