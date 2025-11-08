'use client';

import { useLayoutEffect, useState, ComponentType } from 'react';
import { TokenGate } from '@/components/onboarding'; // via barrel
import InvestorLoading from '../loading';              // your existing loader

// Tiny inline fallback so the route never hard-crashes if imports break
function FallbackCard() {
  return (
    <div className="min-h-screen w-screen bg-black text-white flex items-center justify-center p-6">
      <div className="max-w-sm w-full rounded-xl border border-zinc-800/60 bg-zinc-900/40 p-4 text-center">
        <div className="text-lg font-semibold">Initializing Gateway</div>
        <p className="text-sm text-zinc-400 mt-1">
          If this persists, reload or check the TokenGate export.
        </p>
      </div>
    </div>
  );
}

export default function InvestorTokenPage() {
  const [hydrated, setHydrated] = useState(false);

  useLayoutEffect(() => {
    setHydrated(true);
  }, []);

  if (!hydrated) return <InvestorLoading />;

  // Type-safe guard: if TokenGate is somehow undefined or not a component
  const SafeGate: ComponentType | null =
    typeof TokenGate === 'function' ? (TokenGate as ComponentType) : null;

  return SafeGate ? <SafeGate /> : <FallbackCard />;
}