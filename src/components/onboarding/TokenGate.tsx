'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { decodeToken } from '@/lib/token/decodeToken';
import { useTokenStore } from '@/stores/useTokenStore';
import { useConsentStore } from '@/stores/useConsentStore';
import type { SessionPayload } from '@/types/auth';
import styles from './TokenGate.module.css';

export default function TokenGate() {
  const [tokenInput, setTokenInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showToken, setShowToken] = useState(false); // 👁️ toggle

  const router = useRouter();
  const searchParams = useSearchParams();

  const { token, tokenPayload, hasHydrated, setToken } = useTokenStore();
  const { accept } = useConsentStore();

  // keep refs for timers to clean them up
  const redirectTimerRef = useRef<number | null>(null);
  const fadeTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (redirectTimerRef.current) window.clearTimeout(redirectTimerRef.current);
      if (fadeTimerRef.current) window.clearTimeout(fadeTimerRef.current);
    };
  }, []);

  // 🌀 Zustand hydration check logging (safe)
  useEffect(() => {
    // console.log('[AXPT] Zustand', { token, tokenPayload, hasHydrated });
  }, [token, tokenPayload, hasHydrated]);

  // ✅ Silent redirect when already authenticated (side effects in effect, not render)
  useEffect(() => {
    if (!hasHydrated) return;
    if (token && tokenPayload && !showConfirmation) {
      setFadeOut(true);
      fadeTimerRef.current = window.setTimeout(() => {
        router.push(`/onboard/investor/dashboard?token=${encodeURIComponent(token)}`);
      }, 500);
    }
  }, [hasHydrated, token, tokenPayload, showConfirmation, router]);

  const verifyToken = async (raw: string) => {
    const trimmed = raw.trim();
    if (!trimmed) {
      toast.error('Missing token.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/partner/verify-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: trimmed }),
      });
      const result = await res.json();

      if (!res.ok || !result?.success) {
        toast.error(result?.error || 'Invalid or expired token');
        return;
      }

      const decoded = decodeToken(trimmed);
      if (!decoded) {
        toast.error('Token decoding failed');
        return;
      }

      const validTiers: SessionPayload['tier'][] = [
        'Investor', 'Partner', 'Farmer', 'Merchant', 'Nomad', 'Board',
      ];
      if (!validTiers.includes(decoded.tier as SessionPayload['tier'])) {
        toast.error('Invalid tier in token');
        return;
      }

      const typedDecoded: SessionPayload = { ...decoded, tier: decoded.tier as SessionPayload['tier'] };

      setToken(trimmed, typedDecoded);
      try { localStorage.setItem('axpt_token', trimmed); } catch {}
      accept();

      setShowConfirmation(true);

      // brief confirmation, then fade + redirect
      redirectTimerRef.current = window.setTimeout(() => {
        setFadeOut(true);
        fadeTimerRef.current = window.setTimeout(() => {
          router.push(`/onboard/investor/dashboard?token=${encodeURIComponent(trimmed)}`);
        }, 500);
      }, 1500);
    } catch (err) {
      console.error('[AXPT] ❌ TokenGate Error:', err);
      toast.error('Unexpected error verifying token');
    } finally {
      setLoading(false);
    }
  };

  // 🔁 Auto-verification from URL once hydrated (no double fire)
  useEffect(() => {
    if (!hasHydrated) return;
    const urlToken = searchParams.get('token');
    if (urlToken && !token) {
      verifyToken(urlToken);
    }
  }, [hasHydrated, searchParams, token]);

  const handleVerify = () => verifyToken(tokenInput);

  if (!hasHydrated) {
    return (
      <div className="flex items-center justify-center min-h-screen text-white">
        <p className="animate-pulse">Initializing portal...</p>
      </div>
    );
  }

  // 🌟 Confirmation screen
  if (showConfirmation && tokenPayload) {
    return (
      <div className={`${styles.welcomeContainer} ${fadeOut ? styles.fadeOut : ''}`}>
        <div className={styles.portalGlowBackground} />
        <div className={styles.mirageWrapper}>
          <div className={`${styles.tokenCard} ${styles.confirmationCard}`}>
            <div className={`${styles.sigilWrapper} ${styles.sigilPulse}`}>
              <img src="/images/axpt-sigil-main.png" alt="AXPT Sigil" />
            </div>
            <h2 className="text-white text-xl mb-1">🪙 Verified as: {tokenPayload.tier}</h2>
            <p className="text-purple-300 text-sm mb-1">
              {tokenPayload.partner?.toUpperCase()}
            </p>
            <p className="text-xs text-gray-400 animate-pulse">Entering the portal...</p>
          </div>
        </div>
      </div>
    );
  }

  // 🧬 Default Token Entry Form
  return (
    <div className={styles.welcomeContainer}>
      <div className={styles.portalGlowBackground} />
      <div className={styles.orbLift} />
      <div className={styles.mirageWrapper}>
        <div className={styles.tokenCard}>
          <div className={styles.sigilWrapper}>
            <img src="/images/axpt-sigil-main.png" alt="AXPT Sigil" />
          </div>

          <h2 className={styles.tokenCardTitle}>Enter Access Token</h2>

          {/* 🔑 Token Input with reveal toggle */}
          <div className={styles.tokenInputWrap}>
            <input
              type={showToken ? 'text' : 'password'}
              placeholder="Paste your token here"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              disabled={loading}
              className={styles.tokenInput}
              autoComplete="one-time-code"
              aria-label="Access token"
            />
            <button
              type="button"
              onClick={() => setShowToken((prev) => !prev)}
              className={styles.revealBtn}
              aria-label={showToken ? 'Hide token' : 'Show token'}
            >
              {showToken ? '🙈' : '👁️'}
            </button>
          </div>

          <button onClick={handleVerify} disabled={loading} className={styles.submitButton}>
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