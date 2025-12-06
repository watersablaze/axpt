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
    const unsubscribe = eventBus.on('live:status:update', ({ data }) => {
      const viewerCount =
        typeof data.viewers === 'number'
          ? data.viewers
          : // legacy fields
            (data as any).viewerCount ?? 0;

      setStatus({
        online: !!data.online,
        viewerCount,
      });
    });

    return () => unsubscribe();
  }, []);

  return status;
}
