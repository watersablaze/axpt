'use client';

import { useEffect } from 'react';
import { useLive } from '@/context/LiveContext';
import { eventBus } from '@/lib/oracle/EventBus';

export default function LiveTriggers() {
  const live = useLive();

  // Stream came online
  useEffect(() => {
    if (live.online) {
      eventBus.emit('nommo:ceremony:opened');
    }
  }, [live.online]);

  // Viewer spike
  useEffect(() => {
    if (live.peaked) {
      eventBus.emit('nommo:spike');
    }
  }, [live.peakViewers]);

  // Bitrate warning
  useEffect(() => {
    if (!live.ingestHealthy || (live.bitrateKbps ?? 0) < 1500) {
      eventBus.emit('nommo:warning');
    }
  }, [live.bitrateKbps, live.ingestHealthy]);

  return null;
}