// FILE: app/src/hooks/useSessionTracker.ts

export const useSessionTracker = () => {
  const trackSession = async (userId: string, docViewed?: string) => {
    try {
      const res = await fetch('/api/partner/session-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, docViewed }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Unknown error');
      return data;
    } catch (err) {
      console.error('[AXPT] ❌ useSessionTracker error:', err);
      return null;
    }
  };

  return { trackSession };
};