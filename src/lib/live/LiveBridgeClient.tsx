// src/lib/live/LiveBridgeClient.tsx
'use client';

import { useEffect } from 'react';
import { eventBus } from '@/lib/oracle/EventBus';

export default function LiveBridgeClient() {
  useEffect(() => {
    console.log('[LiveBridge] initializing...');

    const ws = new WebSocket('ws://localhost:3000/api/live/ws');

    ws.onopen = () => {
      console.log('[LiveBridge] WS OPEN');
      eventBus.emit('live:ws:open', {});
      ws.send(JSON.stringify({ command: 'subscribe-status' }));
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        console.log('[LiveBridge] MSG:', msg);

        if (msg.type === 'live:status' || msg.type === 'livestatus') {
          eventBus.emit('live:status:update', msg.payload);
        }

        if (msg.type === 'error') {
          eventBus.emit('live:error', msg.payload);
        }
      } catch (err) {
        console.warn('[LiveBridge] bad message', err);
      }
    };

    ws.onclose = () => {
      console.log('[LiveBridge] WS CLOSED');
      eventBus.emit('live:ws:closed', {});
    };

    ws.onerror = (e) => {
      console.log('[LiveBridge] WS ERROR', e);
      eventBus.emit('live:ws:closed', { error: true });
    };

  }, []);

  return null;
}