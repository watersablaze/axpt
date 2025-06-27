'use client';

import { useEffect, useState } from 'react';

export function useOrbSize(baseSize: number = 180): number {
  const [size, setSize] = useState(baseSize);

  useEffect(() => {
    function updateSize() {
      const width = window.innerWidth;
      if (width < 480) {
        setSize(baseSize * 0.6); // small screen
      } else if (width < 768) {
        setSize(baseSize * 0.8); // tablet
      } else if (width < 1024) {
        setSize(baseSize * 0.9); // small laptop
      } else {
        setSize(baseSize); // default
      }
    }

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, [baseSize]);

  return size;
}