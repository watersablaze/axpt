'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, lazy } from 'react';
import Loading from '../loading';
import { useConsentStore } from '@/stores/useConsentStore';
import { useTokenStore } from '@/stores/useTokenStore';
import { decodeToken } from '@/lib/token/decodeToken';
import StoreDebugOverlay from '@/components/debug/StoreDebugOverlay';

const VerifiedDashboard = lazy(() => import('@/components/onboarding/VerifiedDashboard'));

export default function InvestorDashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tokenFromUrl = searchParams.get('token');

  const { hasAccepted } = useConsentStore();
  const { setToken, autoRefreshCheck } = useTokenStore();

  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (tokenFromUrl) {
      const decoded = decodeToken(tokenFromUrl);
      if (decoded) {
        setToken(tokenFromUrl, decoded);
      } else {
        console.warn('[AXPT] ⚠️ Token decoding failed');
      }
    } else {
      console.warn('[AXPT] ⚠️ No token found in URL');
    }

    autoRefreshCheck();
  }, [tokenFromUrl, setToken, autoRefreshCheck]);

  useEffect(() => {
    if (hydrated && !hasAccepted) {
      router.replace('/onboard/investor');
    }
  }, [hydrated, hasAccepted, router]);

  if (!hydrated) return <Loading />;

  return (
    <>
      <Suspense fallback={<Loading />}>
        <VerifiedDashboard />
      </Suspense>
      <StoreDebugOverlay />
    </>
  );
}