'use client';

import { useRef } from 'react';
import VerifiedDashboardMobile from './VerifiedDashboardMobile';
import VerifiedDashboardDesktop from './VerifiedDashboardDesktop';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { SessionPayload } from '@/types/auth';

interface VerifiedDashboardProps {
  tokenPayload: SessionPayload;
}

export default function VerifiedDashboard({ tokenPayload }: VerifiedDashboardProps) {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const scrollRef = useRef<HTMLDivElement>(null);

  return isMobile ? (
    <VerifiedDashboardMobile scrollRef={scrollRef} tokenPayload={tokenPayload} />
  ) : (
    <VerifiedDashboardDesktop tokenPayload={tokenPayload} />
  );
}