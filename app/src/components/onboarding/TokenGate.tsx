'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import styles from './TokenGate.module.css';
import { useTokenStore } from '@/stores/useTokenStore';
import { decodeToken } from '@/utils/token';
import {
  getStoredToken,
  storeVerifiedToken,
} from '@/utils/tokenSession';

type TokenGateProps = {
  onVerifiedAction: (token: string) => void;
  token?: string;
};

export default function TokenGate({ onVerifiedAction, token = '' }: TokenGateProps) {
  const [tokenInput, setTokenInput] = useState(token);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { setToken } = useTokenStore();
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const existingToken = getStoredToken();
    if (existingToken) {
      const decoded = decodeToken(existingToken);
      if (decoded) {
        setToken(existingToken, decoded);
        onVerifiedAction(existingToken);
      }
    }
  }, [onVerifiedAction, setToken]);

  const handleVerify = async () => {
    const raw = tokenInput.trim();
    setError('');

    if (!raw || !raw.includes(':')) {
      setError('❌ Token must follow AXPT format: payload:signature');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/partner/verify-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: raw }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Invalid token');

      const decoded = decodeToken(raw);
      if (!decoded) throw new Error('Token decoding failed');

      storeVerifiedToken(raw);
      setToken(raw, decoded);
      onVerifiedAction(raw);
    } catch (err: any) {
      setError(err.message || 'Unexpected error.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;

    const handler = (e: ClipboardEvent) => {
      const pasted = e.clipboardData?.getData('text')?.trim();
      if (pasted) {
        setTokenInput(pasted);
      }
    };

    el.addEventListener('paste', handler);
    return () => el.removeEventListener('paste', handler);
  }, []);

  return (
    <div className={styles.welcomeContainer}>
      <div className={styles.portalGlowBackground} />
      <div className={styles.mirageWrapper}>
        <div className={styles.tokenCard}>
          <div className={styles.sigilWrapper}>
            <Image src="/images/axpt.io-2x.png" alt="AXPT Sigil" width={160} height={160} />
          </div>

          <h2 className={styles.tokenCardTitle}>🔑 Enter Your AXPT Token</h2>

          <input
            ref={inputRef}
            className={styles.tokenInput}
            placeholder="Paste token: eybdkaknfff..."
            value={tokenInput}
            onChange={(e) => setTokenInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleVerify();
            }}
          />

          <button
            className={styles.submitButton}
            onClick={handleVerify}
            disabled={loading}
          >
            {loading ? '⏳ Verifying...' : ' Enter Portal '}
          </button>

          {error && <p className={styles.errorMessage}>{error}</p>}

          <p className={styles.tokenReminder}>
           Granting AXPT passage...
           </p>
        </div>
      </div>
    </div>
  );
}