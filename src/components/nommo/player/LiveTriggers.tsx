'use client';

import { useEffect, useRef } from 'react';
import { useLive } from '@/context/LiveContext';
import { eventBus } from '@/lib/oracle/EventBus';

export default function LiveTriggers() {
  const live = useLive();

  // Stream came online
  useEffect(() => {
    if (live.online) {
      eventBus.emit('nommo:ceremony:opened', {});
    }
  }, [live.online]);

  // Viewer spike
  const lastPeakRef = useRef<number>(live.peakViewers ?? 0);
  useEffect(() => {
    const prevPeak = lastPeakRef.current ?? 0;
    const nextPeak = live.peakViewers ?? 0;

    if (nextPeak > prevPeak) {
      eventBus.emit('nommo:spike', { peakViewers: nextPeak });
    }

    lastPeakRef.current = nextPeak;
  }, [live.peakViewers]);

  // Bitrate warning
  useEffect(() => {
    if (!live.ingestHealthy || (live.bitrateKbps ?? 0) < 1500) {
      const reason = !live.ingestHealthy ? 'ingest-unhealthy' : 'low-bitrate';
      eventBus.emit('nommo:warning', { reason });
    }
  }, [live.bitrateKbps, live.ingestHealthy]);

  return null;
}
