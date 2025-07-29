// app/src/hooks/usePartnerSession.ts
import { useEffect } from 'react';

export function usePartnerSessionSync(slug?: string, viewedDoc?: string) {
  useEffect(() => {
    if (!slug) return;

    const sync = async () => {
      try {
        const res = await fetch('/api/partner/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ slug, viewedDoc }),
        });

        const data = await res.json();
        if (!res.ok) {
          console.warn('[AXPT] Session sync failed:', data.error);
        }
      } catch (err) {
        console.error('[AXPT] Failed to sync session:', err);
      }
    };

    sync();
  }, [slug, viewedDoc]);
}