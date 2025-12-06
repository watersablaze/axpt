'use client';

import { useEffect, useState } from 'react';
import { detectPerformance, PerformanceLevel } from '@/lib/performance/performanceDetector';

export function usePerformanceMode() {
  const [level, setLevel] = useState<PerformanceLevel>('high');

  useEffect(() => {
    detectPerformance().then((mode) => {
      setLevel(mode);

      window.dispatchEvent(
        new CustomEvent('performanceModeChange', { detail: { mode } })
      );
    });
  }, []);

  return level;
}