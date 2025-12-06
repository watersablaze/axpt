// src/lib/live/eventBridgeClient.ts
'use client';

import { eventBus } from '@/lib/oracle/EventBus';

export function pushLiveStatusToEventBus(json: any) {
  eventBus.emit('live:status:update', {
    online: json.online ?? false,
    viewers: json.viewers ?? 0,
    peakViewers: json.peakViewers ?? json.viewers ?? 0,
    bitrateKbps: json.bitrateKbps ?? null,
    ingestHealthy: json.ingestHealthy ?? false,
    uptimeSeconds: json.uptimeSeconds ?? null,
    error: json.error ?? null,
    source: 'poll',
  });
}