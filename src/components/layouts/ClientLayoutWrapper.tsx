'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import FloatingDashboardButton from '@/components/onboarding/FloatingDashboardButton';
import { SessionProvider } from 'next-auth/react';

export default function ClientLayoutWrapper({ children }: { children: React.ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setHydrated(true);
  }, []);

  const showFloatingButton =
    hydrated &&
    (
      pathname === '/onboard/investor/dashboard' ||
      pathname === '/onboard/investor/upgrade' ||
      pathname.startsWith('/vault/')
    );

  return (
    <SessionProvider>
      {children}
      {showFloatingButton && <FloatingDashboardButton />}
      <div id="portal-root" />
    </SessionProvider>
  );
}