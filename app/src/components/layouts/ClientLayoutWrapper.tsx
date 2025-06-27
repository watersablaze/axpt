// ✅ app/src/components/layouts/ClientLayoutWrapper.tsx
'use client';
import { SessionProvider } from 'next-auth/react';

export default function ClientLayoutWrapper({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}