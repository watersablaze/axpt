'use client';

import { useEffect, useState } from 'react';
import { Loader } from '@/components/ui/loader';
import { useSession } from 'next-auth/react';

export function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();

  if (status === 'loading') return <Loader />;
  if (status === 'unauthenticated') return <div>Not authorized.</div>;

  return <>{children}</>;
}