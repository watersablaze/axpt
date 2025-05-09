// lib/hooks/useHydrationState.ts
import { useEffect, useState } from "react";

export function useHydrationState(storageKeys: string[] = []) {
  const [hydrated, setHydrated] = useState(false);
  const [values, setValues] = useState<Record<string, string | null>>({});

  useEffect(() => {
    let hydrationTimeout: ReturnType<typeof setTimeout>;

    try {
      const resolved: Record<string, string | null> = {};
      for (const key of storageKeys) {
        resolved[key] = localStorage.getItem(key);
      }
      setValues(resolved);
      setHydrated(true);
    } catch (err) {
      console.error("🔴 useHydrationState localStorage error:", err);
      setValues({});
      setHydrated(true);
    }

    hydrationTimeout = setTimeout(() => {
      if (!hydrated) setHydrated(true);
    }, 3000);

    return () => clearTimeout(hydrationTimeout);
  }, []);

  return { hydrated, values };
}