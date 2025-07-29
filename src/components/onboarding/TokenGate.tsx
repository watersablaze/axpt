'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { decodeToken } from '@/lib/token/decodeToken';
import { useTokenStore } from '@/stores/useTokenStore';
import { useConsentStore } from '@/stores/useConsentStore';
import styles from './TokenGate.module.css';

export default function TokenGate() {
  const [tokenInput, setTokenInput] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { setToken } = useTokenStore();
  const { accept } = useConsentStore();

  const handleVerify = async () => {
    const token = tokenInput.trim();
    if (!token) {
      toast.error('Please enter your token');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/partner/verify-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });

      const result = await res.json();

      if (!res.ok || !result?.success) {
        toast.error(result?.error || 'Invalid or expired token');
        return;
      }

      const decoded = decodeToken(token);
      if (!decoded) {
        toast.error('Token decoding failed');
        return;
      }

      // 👇 Add token back into the decoded payload
      setToken(token, { ...decoded, token });

      accept();
      router.push(`/onboard/investor/dashboard?token=${encodeURIComponent(token)}`);
    } catch (err) {
      console.error('[AXPT] ❌ TokenGate Error:', err);
      toast.error('Unexpected error verifying token');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.welcomeContainer}>
      <div className={styles.portalGlowBackground} />

      {/* Orb */}
      <div className={styles.orbLift}></div>

      {/* Token Card */}
      <div className={styles.mirageWrapper}>
        <div className={styles.tokenCard}>
          <div className={styles.sigilWrapper}>
            <img src="/images/axpt-sigil.png" alt="AXPT Sigil" />
          </div>

          <h2 className={styles.tokenCardTitle}>Enter Access Token</h2>

          <input
            type="text"
            placeholder="Paste your token here"
            value={tokenInput}
            onChange={(e) => setTokenInput(e.target.value)}
            disabled={loading}
            className={styles.tokenInput}
          />

          <button
            onClick={handleVerify}
            disabled={loading}
            className={styles.submitButton}
          >
            {loading ? 'Verifying...' : 'Verify Token'}
          </button>

          <p className={styles.tokenReminder}>
            Ensure no extra spaces are copied when entering your token.
          </p>
        </div>
      </div>
    </div>
  );
}