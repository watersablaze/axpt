'use client';

import { useEffect, useMemo, useState } from 'react';

interface HydrationState {
  hydrated: boolean;
  values: Record<string, string>;
}

/**
 * useHydrationState — Prevent SSR mismatch by deferring access to localStorage.
 * Adds guardrails for stability and avoids infinite re-renders by memoizing keys.
 */
export function useHydrationState(rawKeysToWatch: string[] = []): HydrationState {
  const [hydrated, setHydrated] = useState(false);
  const [values, setValues] = useState<Record<string, string>>({});

  // ✅ Memoize keys so useEffect doesn't run every render
  const keysToWatch = useMemo(() => rawKeysToWatch, []);

  useEffect(() => {
    try {
      const localStorageValues: Record<string, string> = {};
      keysToWatch.forEach((key) => {
        const stored = localStorage.getItem(key);
        if (stored !== null) {
          localStorageValues[key] = stored;
        }
      });

      setValues(localStorageValues);
      setHydrated(true);
    } catch (err) {
      console.error('[useHydrationState] localStorage error:', err);
      setHydrated(true); // Still mark as hydrated to avoid blocking
    }
  }, [keysToWatch]);

  return { hydrated, values };
}