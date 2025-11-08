'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Loading from './loading';
import { useConsentStore } from '@/stores/useConsentStore';
import { WelcomeScreen } from '@/components/onboarding';

export default function InvestorEntryPage() {
  const router = useRouter();
  const { hasAccepted } = useConsentStore();
  const [hydrated, setHydrated] = useState(false);

  // Hydration guard to avoid SSR/CSR mismatch
  useEffect(() => setHydrated(true), []);

  if (!hydrated) return <Loading />;

  // If already accepted, send them straight to the token gate route
  if (hasAccepted) {
    router.replace('/onboard/investor/token');
    return <Loading />;
  }

  // Otherwise, show the welcome/terms screen
  return <WelcomeScreen />;
}