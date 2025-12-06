// src/lib/live/LiveBridge.ts
'use client';

import { useEffect } from 'react';
import { eventBus } from '@/lib/oracle/EventBus';
import type { LiveStatusEventPayload } from '@/lib/oracle/EventBus';

let socket: WebSocket | null = null;
let reconnectTimer: number | null = null;

function buildWsUrl(): string {
  if (typeof window === 'undefined') return '';
  const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
  return `${protocol}://${window.location.host}/api/live/ws`;
}

function connect() {
  if (typeof window === 'undefined') return;
  if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
    return;
  }

  const wsUrl = buildWsUrl();
  if (!wsUrl) return;

  socket = new WebSocket(wsUrl);

  socket.addEventListener('open', () => {
    eventBus.emit('live:ws:connected', { at: Date.now() });
    socket?.send(
      JSON.stringify({ type: 'command', command: 'subscribe-status' }),
    );
  });

  socket.addEventListener('message', (event) => {
    try {
      const msg = JSON.parse(event.data as string);

      if (msg.type === 'live:status') {
        const payload = msg.payload as LiveStatusEventPayload;
        eventBus.emit('live:status:update', payload);
        return;
      }

      if (msg.type === 'error') {
        eventBus.emit('live:error', {
          message: msg.payload?.message ?? 'Live WS error',
          at: Date.now(),
        });
        return;
      }

      if (msg.type === 'info') {
        eventBus.emit('debug:log', {
          channel: 'live:ws',
          message: msg.payload?.message ?? 'Info',
          meta: msg.payload,
        });
      }
    } catch {
      // ignore malformed messages
    }
  });

  const scheduleReconnect = () => {
    if (reconnectTimer != null) return;
    reconnectTimer = window.setTimeout(() => {
      reconnectTimer = null;
      connect();
    }, 4000);
  };

  socket.addEventListener('close', () => {
    eventBus.emit('live:ws:disconnected', { at: Date.now() });
    socket = null;
    scheduleReconnect();
  });

  socket.addEventListener('error', () => {
    eventBus.emit('live:ws:disconnected', { at: Date.now() });
    socket?.close();
    socket = null;
    scheduleReconnect();
  });
}

export function useLiveBridge() {
  useEffect(() => {
    connect();

    const unsub = eventBus.on('live:command', ({ data }) => {
      if (!socket || socket.readyState !== WebSocket.OPEN) return;
      socket.send(JSON.stringify({ type: 'command', ...data }));
    });

    return () => {
      unsub();
      // we leave socket global for other components to share
    };
  }, []);
}