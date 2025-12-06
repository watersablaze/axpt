'use client';

import { useEffect, useState } from 'react';
import { eventBus } from '@/lib/oracle/EventBus';
import type { LiveStatus } from './liveTypes';

export function useLiveStatus() {
  const [status, setStatus] = useState<LiveStatus>({
    online: false,
    viewerCount: 0,
  });

  useEffect(() => {
    const handler = (data: LiveStatus) => setStatus(data);
    eventBus.on('live:status:update', handler);
    return () => eventBus.off('live:status:update', handler);
  }, []);

  return status;
}