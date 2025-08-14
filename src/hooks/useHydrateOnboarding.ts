// 📁 src/hooks/useHydrateOnboarding.ts
'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTokenStore } from '@/stores/useTokenStore';
import { useConsentStore } from '@/stores/useConsentStore';
import { decodeToken } from '@/lib/token/decodeToken';
import type { SessionPayload } from '@/types/auth';

type Tier = SessionPayload['tier'];

interface Options {
  requiredTier?: Tier;
  fallbackRoute?: string;
  enableConsentCheck?: boolean;
}

export function useHydrateOnboarding(options: Options = {}) {
  const {
    requiredTier,
    fallbackRoute = '/onboard',
    enableConsentCheck = true,
  } = options;

  const router = useRouter();
  const searchParams = useSearchParams();
  const { hasAccepted } = useConsentStore();

  const { token, tokenPayload, setToken, autoRefreshCheck } = useTokenStore();

  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    let resolvedToken: string | null = null;

    const fromUrl = searchParams.get('token');
    const fromStorage = localStorage.getItem('axpt_token');

    if (fromUrl) {
      resolvedToken = fromUrl;
      localStorage.setItem('axpt_token', fromUrl);
    } else if (fromStorage) {
      resolvedToken = fromStorage;
    }

    if (resolvedToken) {
      const decoded = decodeToken(resolvedToken);
      const validTiers: Tier[] = ['Investor', 'Partner', 'Farmer', 'Merchant', 'Nomad', 'Board'];

      if (decoded && validTiers.includes(decoded.tier as Tier)) {
        setToken(resolvedToken, decoded);
      } else {
        console.warn('[AXPT] ⚠️ Token invalid or unrecognized tier');
      }
    }

    autoRefreshCheck();
  }, [searchParams, setToken, autoRefreshCheck]);

  useEffect(() => {
    if (hydrated && enableConsentCheck && !hasAccepted) {
      router.replace(fallbackRoute);
    }
  }, [hydrated, hasAccepted, enableConsentCheck, fallbackRoute, router]);

  useEffect(() => {
    if (!requiredTier || !hydrated || !tokenPayload?.tier) return;

    if (tokenPayload.tier !== requiredTier) {
      console.warn(`[AXPT] ❌ Tier mismatch: required ${requiredTier}, got ${tokenPayload.tier}`);
      router.replace(fallbackRoute);
    }
  }, [hydrated, tokenPayload?.tier, requiredTier, fallbackRoute, router]);

  return { hydrated, token, tokenPayload };
}