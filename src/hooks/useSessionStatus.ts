// hooks/useSessionStatus.ts
import { useEffect, useState } from 'react';

type SessionStatus = 'loading' | 'authenticated' | 'unauthenticated';

interface UseSessionStatusReturn {
  status: SessionStatus;
  session: any;
}

export function useSessionStatus(): UseSessionStatusReturn {
  const [status, setStatus] = useState<SessionStatus>('loading');
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await fetch('/api/auth/get-session');
        const data = await res.json();

        if (res.ok && data?.decoded) {
          setSession(data.decoded);
          setStatus('authenticated');
        } else {
          setStatus('unauthenticated');
        }
      } catch {
        setStatus('unauthenticated');
      }
    };

    checkSession();
  }, []);

  return { status, session };
}