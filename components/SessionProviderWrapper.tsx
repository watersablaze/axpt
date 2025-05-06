// app/components/SessionProviderWrapper.tsx
'use client';

import { ReactNode } from 'react';

// Conditionally import next-auth only if enabled
const ENABLE_NEXTAUTH = process.env.NEXT_PUBLIC_ENABLE_NEXTAUTH === 'true';

let SessionProvider: any = ({ children }: { children: ReactNode }) => <>{children}</>;

if (ENABLE_NEXTAUTH) {
  // Dynamic import to avoid SSR issues when NextAuth is enabled
  const DynamicSessionProvider = require('next-auth/react').SessionProvider;
  SessionProvider = ({ children }: { children: ReactNode }) => (
    <DynamicSessionProvider>{children}</DynamicSessionProvider>
  );
}

export default function SessionProviderWrapper({ children }: { children: ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}