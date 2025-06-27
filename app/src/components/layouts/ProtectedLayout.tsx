// app/src/components/layouts/ProtectedLayout.tsx

'use client';

import { useEffect, useState } from 'react';
import { getSession } from '@/lib/auth/getCurrentUser';
import { Loader } from '@/components/ui/loader';

export function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    async function checkAuth() {
      const session = await getSession();
      if (session?.user) {
        setAuthorized(true);
      }
    }
    checkAuth();
  }, []);

  if (!authorized) return <Loader />;

  return <>{children}</>;
}