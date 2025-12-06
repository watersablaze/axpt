// src/lib/live/useLiveStatus.ts
'use client';

import { useEffect, useState } from 'react';
import { eventBus } from '@/lib/oracle/EventBus';

export type LiveStatus = {
  online: boolean;
  viewers: number;
  peakViewers: number;
  bitrateKbps: number | null;
  ingestHealthy: boolean;
  uptimeSeconds: number | null;
  lastUpdated: number | null;
  error?: string | null;
  source?: string | null;
};

const INITIAL_STATUS: LiveStatus = {
  online: false,
  viewers: 0,
  peakViewers: 0,
  bitrateKbps: null,
  ingestHealthy: false,
  uptimeSeconds: null,
  lastUpdated: null,
  error: null,
  source: null,
};

export function useLiveStatus(): LiveStatus {
  const [status, setStatus] = useState<LiveStatus>(INITIAL_STATUS);

  useEffect(() => {
    const unsubStatus = eventBus.on('live:status:update', ({ data }) => {
      const payload: any = data ?? {};

      const viewers =
        typeof payload.viewers === 'number'
          ? payload.viewers
          : typeof payload.viewerCount === 'number'
          ? payload.viewerCount
          : 0;

      const peakViewers =
        typeof payload.peakViewers === 'number'
          ? payload.peakViewers
          : typeof payload.peakViewerCount === 'number'
          ? payload.peakViewerCount
          : typeof payload.highestViewerCount === 'number'
          ? payload.highestViewerCount
          : viewers;

      const bitrateKbps =
        typeof payload.bitrateKbps === 'number'
          ? payload.bitrateKbps
          : typeof payload.bitrate === 'number'
          ? payload.bitrate
          : null;

      const uptimeSeconds =
        typeof payload.uptimeSeconds === 'number'
          ? payload.uptimeSeconds
          : typeof payload.uptime === 'number'
          ? payload.uptime
          : null;

      setStatus((prev) => ({
        online: !!payload.online,
        viewers,
        peakViewers,
        bitrateKbps,
        ingestHealthy:
          typeof payload.ingestHealthy === 'boolean'
            ? payload.ingestHealthy
            : prev.ingestHealthy,
        uptimeSeconds,
        lastUpdated: Date.now(),
        error: null,
        source: payload.source ?? prev.source ?? 'owncast',
      }));
    });

    const unsubError = eventBus.on('live:error', ({ data }) => {
      const message =
        (data && (data.message || data.error)) || 'Unknown live error';

      setStatus((prev) => ({
        ...prev,
        online: false,
        ingestHealthy: false,
        error: message,
        lastUpdated: Date.now(),
      }));
    });

    return () => {
      unsubStatus();
      unsubError();
    };
  }, []);

  return status;
}