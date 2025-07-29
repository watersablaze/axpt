// ✅ FILE: app/onboard/investor/token/page.tsx
'use client';

import { useLayoutEffect, useState } from 'react';
import { TokenGate } from '@/components/onboarding/TokenGate'; // ✅ Named import
import Loading from '../loading'; // Adjust path if needed

export default function InvestorTokenPage() {
  const [hydrated, setHydrated] = useState(false);

  useLayoutEffect(() => {
    setHydrated(true);
  }, []);

  if (!hydrated) return <Loading />;

  return <TokenGate />;
}