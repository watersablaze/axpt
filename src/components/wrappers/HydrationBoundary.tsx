'use client';

import { useState, useEffect } from 'react';

interface HydrationBoundaryProps {
  children: React.ReactNode;
  label?: string;
}

export default function HydrationBoundary({
  children,
  label = 'HydrationBoundary',
}: HydrationBoundaryProps) {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const logLabel = `[${label}]`;
    const startTime = performance.now();

    if (process.env.NODE_ENV === 'development') {
      console.log(`${logLabel} ⏳ Hydration check starting...`);
    }

    setIsHydrated(true);

    const endTime = performance.now();

    if (process.env.NODE_ENV === 'development') {
      console.log(`${logLabel} ✅ Hydration complete in ${(endTime - startTime).toFixed(2)}ms`);
    }
  }, [label]);

  return isHydrated ? <>{children}</> : null;
}