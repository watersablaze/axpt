import { useEffect, useState } from 'react';

export type StreamPhase =
  | 'DORMANT'
  | 'INITIATION'
  | 'LIVE'
  | 'AFTERGLOW'
  | 'ERROR';

export function useStreamStatus() {
  const [phase, setPhase] = useState<StreamPhase>('DORMANT');
  const [viewers, setViewers] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const fetchStatus = async () => {
      try {
        const res = await fetch('/api/nommo/status', {
          cache: 'no-store',
        });

        const data = await res.json();

        if (!mounted) return;

        setPhase(data.phase);
        setViewers(data.viewers || 0);
      } catch (err) {
        console.error('Nommo status error:', err);
        if (mounted) {
          setPhase('ERROR');
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 10_000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  return {
    phase,
    viewers,
    isLive: phase === 'LIVE',
    loading,
  };
}