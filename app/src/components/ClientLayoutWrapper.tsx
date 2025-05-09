'use client';

import SessionProviderWrapper from '@/components/SessionProviderWrapper'; // ✅ Default import


export default function ClientLayoutWrapper({ children }: { children: React.ReactNode }) {
  return (
    <SessionProviderWrapper>
      {children}
    </SessionProviderWrapper>
  );
}