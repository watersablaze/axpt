'use client';

import { useEffect, useRef, useState } from 'react';
import VerifiedDashboardMobile from './VerifiedDashboardMobile';
import VerifiedDashboardDesktop from './VerifiedDashboardDesktop';
import OrbAnimation from '@/components/shared/OrbAnimation';
import { SessionPayload } from '@/types/auth';

interface VerifiedDashboardGateProps {
  tokenPayload: SessionPayload | null;
}

export default function VerifiedDashboardGate({ tokenPayload }: VerifiedDashboardGateProps) {
  const [isMobile, setIsMobile] = useState<boolean | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkIsMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      console.log('[VerifiedDashboardGate] 📱 isMobile:', mobile);
    };

    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  useEffect(() => {
    console.log('[VerifiedDashboardGate] 🪪 Token Payload:', tokenPayload);
  }, [tokenPayload]);

  if (isMobile === null || !tokenPayload) {
    console.log('[VerifiedDashboardGate] ⏳ Awaiting conditions → isMobile:', isMobile, 'tokenPayload:', tokenPayload);
    return (
      <div className="relative flex flex-col items-center justify-center min-h-screen w-screen bg-black text-white overflow-hidden">
        {/* 🌀 AXPT Sigil Glow */}
        <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none">
          <img
            src="/images/axpt-sigil-main.png"
            alt="AXPT Sigil"
            className="axptSigil burst"
          />
        </div>

        {/* 🔮 Orb Animation */}
        <div className="z-10">
          <OrbAnimation className="w-[160px] h-[160px] opacity-90" />
          <p className="text-purple-300 text-sm mt-4 animate-pulse">Loading dashboard interface...</p>
        </div>
      </div>
    );
  }

  return isMobile ? (
    <VerifiedDashboardMobile scrollRef={scrollRef} tokenPayload={tokenPayload} />
  ) : (
    <VerifiedDashboardDesktop tokenPayload={tokenPayload} />
  );
}