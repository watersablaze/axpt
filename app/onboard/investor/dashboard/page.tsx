'use client';

import { Suspense } from 'react';
import Loading from '../loading';
import { useHydrateOnboarding } from '@/hooks/useHydrateOnboarding';
import HydrationBoundary from '@/components/wrappers/HydrationBoundary';
import VerifiedDashboardGate from '@/components/onboarding/VerifiedDashboardGate';
import StoreDebugOverlay from '@/components/debug/StoreDebugOverlay';

export default function InvestorDashboardPage() {
  const { hydrated, tokenPayload } = useHydrateOnboarding({
    requiredTier: 'Investor',
    fallbackRoute: '/onboard/investor',
  });

  if (!hydrated) return <Loading />;

  return (
    <>
      <Suspense fallback={<Loading />}>
        <HydrationBoundary>
          <VerifiedDashboardGate tokenPayload={tokenPayload} />
        </HydrationBoundary>
      </Suspense>

      {process.env.NODE_ENV === 'development' && <StoreDebugOverlay />}
    </>
  );
}