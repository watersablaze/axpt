'use client';

import { useEffect, useState } from 'react';
import { useConsentStore } from '@/stores/useConsentStore';
import WelcomeScreen from '@/components/onboarding/WelcomeScreen';
import TokenGate from '@/components/onboarding/TokenGate';

export default function InvestorEntryPage() {
  const { hasAccepted } = useConsentStore();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  if (!hydrated) return null;

  console.log('[AXPT] 🌿 hasAccepted:', hasAccepted);
  return hasAccepted ? <TokenGate /> : <WelcomeScreen />;
}