'use client';

import { useEffect, useRef } from 'react';
import { eventBus } from '@/lib/oracle/EventBus';

export function useLiveBridge() {
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    console.log('[LiveBridge] initializing...');

    const url = `ws://${window.location.host}/api/live/ws`;
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('[LiveBridge] WS OPEN');
      ws.send(JSON.stringify({ command: 'subscribe-status' }));
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        console.log('[LiveBridge] MSG:', msg);

        if (msg.type === 'live:status') {
          eventBus.emit('live:status:update', msg.payload);
        }

        if (msg.type === 'error') {
          console.warn('[LiveBridge] ERROR:', msg.payload);
          eventBus.emit('live:error', msg.payload);
        }
      } catch (err) {
        console.error('[LiveBridge] invalid JSON message', err);
      }
    };

    ws.onerror = (err) => {
      console.error('[LiveBridge] ERROR', err);
    };

    ws.onclose = () => {
      console.warn('[LiveBridge] CLOSED');
    };

    return () => ws.close();
  }, []);
}