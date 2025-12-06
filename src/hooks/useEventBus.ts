// src/hooks/useEventBus.ts
'use client';

import { useEffect } from 'react';
import type { EventPayload } from '@/lib/oracle/EventBus';
import { eventBus } from '@/lib/oracle/EventBus';

type EventName = EventPayload['name'];

export function useEventBus<T extends EventName>(
  name: T,
  handler: (event: Extract<EventPayload, { name: T }>) => void,
) {
  useEffect(() => {
    const unsubscribe = eventBus.on(name, handler as any);
    return () => unsubscribe();
  }, [name, handler]);
}