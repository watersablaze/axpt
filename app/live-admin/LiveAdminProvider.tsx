'use client';

import { LiveProvider } from '@/context/LiveContext';

export default function LiveAdminProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return <LiveProvider>{children}</LiveProvider>;
}