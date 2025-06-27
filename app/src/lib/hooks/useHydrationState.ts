'use client';

import { useEffect, useState } from 'react';

export function useHydrationState(keysToWatch: string[]) {
  const [hydrated, setHydrated] = useState(false);
  const [values, setValues] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchValues = () => {
      const stored: Record<string, string> = {};
      for (const key of keysToWatch) {
        const val = localStorage.getItem(key);
        if (val) stored[key] = val;
      }
      setValues(stored);
      setHydrated(true);
    };

    if (typeof window !== 'undefined') {
      fetchValues();
    }
  }, [keysToWatch]);

  return { hydrated, values };
}