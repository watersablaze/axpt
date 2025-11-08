// FloatingDashboardButton.tsx

'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

export default function FloatingDashboardButton() {
  const pathname = usePathname();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const isInOnboarding = pathname?.startsWith('/onboard/investor');
  const isDashboard = pathname === '/onboard/investor/dashboard';
  const isInitial = pathname === '/onboard/investor';

  const shouldShow = isInOnboarding && !isDashboard && !isInitial;

  if (!shouldShow) return null;

  const button = (
    <div className="fixed top-4 left-4 z-50 animate-slide-fade-in">
      <button
        onClick={() => router.push('/onboard/investor/dashboard?verified=1')}
        className="bg-[#1c1a35] text-[#f5f0e1] backdrop-blur-sm font-semibold px-5 py-2 rounded-full shadow-xl transition-all hover:shadow-2xl hover:brightness-110 focus:outline-none"
      >
        ⬅ Return to Dashboard
      </button>
    </div>
  );

  const portalRoot = typeof window !== 'undefined'
    ? document.getElementById('portal-root')
    : null;

  return portalRoot ? createPortal(button, portalRoot) : null;
}