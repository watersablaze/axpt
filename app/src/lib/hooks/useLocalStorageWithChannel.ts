'use client';

import { useEffect, useState } from 'react';

type BroadcastData<T> = {
  key: string;
  value: T;
};

export function useLocalStorageWithChannel<T>(
  key: string,
  initialValue: T
): [T, (value: T) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') return initialValue;

    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (err) {
      console.error('❌ Failed to read localStorage:', err);
      return initialValue;
    }
  });

  const setValue = (value: T) => {
    try {
      setStoredValue(value);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(value));
        bc?.postMessage({ key, value }); // Broadcast to other tabs
      }
    } catch (err) {
      console.error('❌ Failed to set localStorage:', err);
    }
  };

  const bc = typeof window !== 'undefined' ? new BroadcastChannel('axpt-sync') : null;

  useEffect(() => {
    if (!bc) return;

    const handleBroadcast = (event: MessageEvent<BroadcastData<T>>) => {
      if (event.data.key === key) {
        setStoredValue(event.data.value);
      }
    };

    bc.addEventListener('message', handleBroadcast);
    return () => bc.removeEventListener('message', handleBroadcast);
  }, [key]);

  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === key && event.newValue !== null) {
        try {
          setStoredValue(JSON.parse(event.newValue));
        } catch (err) {
          console.error('❌ Failed to parse localStorage during sync:', err);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key]);

  return [storedValue, setValue];
}