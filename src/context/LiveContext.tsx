// src/context/LiveContext.tsx
'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { eventBus } from '@/lib/oracle/EventBus';
import type { LiveStatusEventPayload } from '@/lib/oracle/EventBus';

export interface LiveState extends LiveStatusEventPayload {
  lastUpdated: number | null;
  loading: boolean;
}

const defaultState: LiveState = {
  online: false,
  viewers: 0,
  peakViewers: 0,
  bitrateKbps: null,
  ingestHealthy: false,
  uptimeSeconds: null,
  error: null,
  source: 'poll',
  lastUpdated: null,
  loading: true,
};

const LiveContext = createContext<LiveState>(defaultState);

export function LiveProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<LiveState>(defaultState);

  const applyStatus = useCallback((payload: LiveStatusEventPayload) => {
    setState((prev) => {
      const next: LiveState = {
        ...prev,
        ...payload,
        lastUpdated: Date.now(),
        loading: false,
      };

      // Only emit "change" on meaningful deltas
      if (
        prev.online !== next.online ||
        prev.viewers !== next.viewers ||
        prev.peakViewers !== next.peakViewers
      ) {
        eventBus.emit('live:status:change', next);
      }

      return next;
    });
  }, []);

  const fetchStatusOnce = useCallback(async () => {
    try {
      const res = await fetch('/api/live/status', { cache: 'no-store' });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const json = await res.json();

      const payload: LiveStatusEventPayload = {
        online: json.online ?? false,
        viewers: json.viewers ?? 0,
        peakViewers: json.peakViewers ?? json.viewers ?? 0,
        bitrateKbps: json.bitrateKbps ?? null,
        ingestHealthy: json.ingestHealthy ?? true,
        uptimeSeconds: json.uptimeSeconds ?? null,
        error: json.error ?? null,
        source: 'poll',
      };

      eventBus.emit('live:status:update', payload);
      applyStatus(payload);
    } catch (err: any) {
      const message = err?.message || 'Failed to fetch live status';
      eventBus.emit('live:error', { message, at: Date.now() });
      setState((prev) => ({
        ...prev,
        loading: false,
        error: message,
        online: false,
      }));
    }
  }, [applyStatus]);

  useEffect(() => {
    let isMounted = true;
    let interval: number | undefined;

    // initial
    fetchStatusOnce();

    // poll loop (will be gradually replaced by WS, but safe as fallback)
    interval = window.setInterval(() => {
      if (isMounted) {
        fetchStatusOnce();
      }
    }, 5000);

    // also listen to external updates (e.g. WebSocket EventBridge)
    const unsubscribe = eventBus.on('live:status:update', ({ data }) => {
      applyStatus(data);
    });

    return () => {
      isMounted = false;
      if (interval) window.clearInterval(interval);
      unsubscribe();
    };
  }, [fetchStatusOnce, applyStatus]);

  const value = useMemo(() => state, [state]);

  return <LiveContext.Provider value={value}>{children}</LiveContext.Provider>;
}

export function useLive(): LiveState {
  const ctx = useContext(LiveContext);
  return ctx ?? defaultState;
}