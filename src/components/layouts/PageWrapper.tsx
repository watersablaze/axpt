'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import TierBadge from '@/components/shared/TierBadge';

const LoginAnimation = dynamic(() => import('@/components/animation/LoginAnimation'), { ssr: false });

export default function PageWrapper({
  children,
  userName,
  tier,
}: {
  children: React.ReactNode;
  userName?: string | null;
  tier?: string | null;
}) {
  const [showMain, setShowMain] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowMain(true);
    }, 2200);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      {!showMain && <LoginAnimation />}
      {showMain && (
        <div className="fade-in">
          <div className="flex justify-between items-center px-4 pt-2 pb-1 text-sm text-gray-700 border-b">
            <div>
              Welcome back, <strong>{userName || 'AXPT User'}</strong>
            </div>
            <TierBadge tier={tier || 'Unknown'} />
          </div>
          <div className="p-4">{children}</div>
        </div>
      )}
    </>
  );
}