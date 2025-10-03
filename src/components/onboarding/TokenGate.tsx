'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { decodeToken } from '@/lib/token/decodeToken';
import { useTokenStore } from '@/stores/useTokenStore';
import { useConsentStore } from '@/stores/useConsentStore';
import type { SessionPayload } from '@/types/auth';
import styles from './TokenGate.module.css';

const VALID_TIERS: SessionPayload['tier'][] = [
  'Investor', 'Partner', 'Farmer', 'Merchant', 'Nomad', 'Board',
];

// heuristic for “short code” vs JWT
function looksLikeCode(input: string) {
  const s = input.trim();
  // short, dashed, no dots – e.g. AXPT-MAYA-7Q4F-AB
  return s.length < 50 && s.includes('-') && !s.includes('.');
}

export default function TokenGate() {
  const [tokenInput, setTokenInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showToken, setShowToken] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();

  const { token, tokenPayload, hasHydrated, setToken } = useTokenStore();
  const { accept } = useConsentStore();

  useEffect(() => {
    if (hasHydrated) {
      // eslint-disable-next-line no-console
      console.log('[AXPT] Zustand hydrated:', { token, tokenPayload });
    }
  }, [hasHydrated, token, tokenPayload]);

  const shouldSilentRedirect = useMemo(
    () => hasHydrated && token && tokenPayload && !showConfirmation,
    [hasHydrated, token, tokenPayload, showConfirmation]
  );

  useEffect(() => {
    if (!shouldSilentRedirect) return;
    setFadeOut(true);
    const t = setTimeout(() => {
      router.push(`/onboard/investor/dashboard?token=${encodeURIComponent(token!)}`);
    }, 500);
    return () => clearTimeout(t);
  }, [router, shouldSilentRedirect, token]);

  async function completeLogin(jwt: string) {
    const decoded = decodeToken(jwt);
    if (!decoded) {
      toast.error('Token decoding failed');
      return;
    }
    if (!VALID_TIERS.includes(decoded.tier as SessionPayload['tier'])) {
      toast.error('Invalid tier in token');
      return;
    }
    const typedDecoded: SessionPayload = { ...decoded, tier: decoded.tier as SessionPayload['tier'] };
    setToken(jwt, typedDecoded);
    localStorage.setItem('axpt_token', jwt);
    accept();

    setShowConfirmation(true);
    const t1 = setTimeout(() => setFadeOut(true), 900);
    const t2 = setTimeout(() => {
      router.push(`/onboard/investor/dashboard?token=${encodeURIComponent(jwt)}`);
    }, 1500);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }

  async function verifyTokenOrCode(raw: string) {
    const trimmed = raw.trim();
    if (!trimmed) {
      toast.error('Missing access code or token.');
      return;
    }

    setLoading(true);
    try {
      // 1) If it looks like a short code, redeem to a JWT first
      if (looksLikeCode(trimmed)) {
        const r = await fetch('/api/partner/redeem-code', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: trimmed }),
        });
        const j = await r.json();
        if (!r.ok || !j?.success || !j.token) {
          toast.error(j?.error || 'Invalid or expired code');
          return;
        }
        // Then continue via existing verification route to keep logs/DB updates
        const v = await fetch('/api/partner/verify-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: j.token }),
        });
        const vj = await v.json();
        if (!v.ok || !vj?.success) {
          toast.error(vj?.error || 'Verification failed');
          return;
        }
        await completeLogin(j.token);
        return;
      }

      // 2) Otherwise treat it as a full JWT and verify directly
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
      await completeLogin(trimmed);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[AXPT] ❌ TokenGate Error:', err);
      toast.error('Unexpected error verifying access');
    } finally {
      setLoading(false);
    }
  }

  // auto-verify ?token=… in URL
  useEffect(() => {
    const urlToken = searchParams.get('token');
    if (hasHydrated && urlToken && !token) {
      verifyTokenOrCode(urlToken);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasHydrated, searchParams, token]);

  if (!hasHydrated) {
    return (
      <div className="flex items-center justify-center min-h-screen text-white">
        <p className="animate-pulse">Initializing portal...</p>
      </div>
    );
  }

  if (shouldSilentRedirect) {
    return (
      <div className={`${styles.welcomeContainer} ${styles.fadeOut}`}>
        <p className="text-white text-xl animate-pulse">Redirecting...</p>
      </div>
    );
  }

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
            <p className="text-purple-300 text-sm mb-1">{tokenPayload.partner?.toUpperCase()}</p>
            <p className="text-xs text-gray-400 animate-pulse">Entering the portal...</p>
          </div>
        </div>
      </div>
    );
  }

  // input UI
  return (
    <div className={styles.welcomeContainer}>
      <div className={styles.portalGlowBackground} />
      <div className={styles.orbLift} />
      <div className={styles.mirageWrapper}>
        <div className={styles.tokenCard}>
          <div className={styles.sigilWrapper}>
            <img src="/images/axpt-sigil-main.png" alt="AXPT Sigil" />
          </div>

          <h2 className={styles.tokenCardTitle}>Enter Access Code / Token</h2>

          <div className={styles.tokenInputWrap}>
            <input
              type={showToken ? 'text' : 'password'}
              placeholder="e.g. AXPT-MAYA-7Q4F-AB  • or paste a token"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              disabled={loading}
              className={styles.tokenInput}
              autoComplete="one-time-code"
            />
            <button
              type="button"
              onClick={() => setShowToken((v) => !v)}
              className={styles.revealBtn}
              aria-label={showToken ? 'Hide value' : 'Show value'}
              disabled={loading}
            >
              {showToken ? '🙈' : '👁️'}
            </button>
          </div>

          <button
            onClick={() => verifyTokenOrCode(tokenInput)}
            disabled={loading}
            className={styles.submitButton}
          >
            {loading ? 'Verifying…' : 'Verify'}
          </button>

          <p className={styles.tokenReminder}>
            Tip: codes are short and dashed; tokens are long strings.
          </p>
        </div>
      </div>
    </div>
  );
}