'use client';

//import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function ProtectedArea({ children }: { children: React.ReactNode }) {
  //const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  if (status === 'loading') return <p>Checking authentication...</p>;
  if (status === 'authenticated') return <>{children}</>;

  return null;
}