// FILE: app/src/components/layouts/SessionInitializer.tsx
'use client';

import { useEffect, useState } from 'react';
import { useSessionStore } from '@/stores/useSessionStore';

export function SessionInitializer() {
  const setSession = useSessionStore((s) => s.setSession);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  useEffect(() => {
    const fetchSession = async () => {
      setStatus('loading');
      try {
        const res = await fetch('/api/refresh-token');
        if (!res.ok) throw new Error(`Status ${res.status}`);
        const data = await res.json();
        if (data.session) {
          setSession(data.session);
          setStatus('success');
          console.log('🔁 Session restored:', data.session);
        } else {
          setStatus('error');
        }
      } catch (err) {
        console.warn('🔁 Session refresh failed:', err);
        setStatus('error');
      }
    };

    fetchSession();
  }, [setSession]);

  return (
    process.env.NODE_ENV === 'development' && status !== 'idle' ? (
      <div className="fixed bottom-2 right-2 text-xs px-3 py-1 bg-black/80 text-white rounded shadow z-[9999]">
        Session: {status}
      </div>
    ) : null
  );
}