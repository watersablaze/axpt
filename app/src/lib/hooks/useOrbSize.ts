// File: src/lib/hooks/useOrbSize.ts

import { useEffect, useState } from 'react';

/**
 * Dynamically adjusts OrbAnimation size based on screen width.
 * Returns a number representing the optimal orb size in pixels.
 */
export function useOrbSize(baseSize: number = 200) {
  const [size, setSize] = useState(baseSize);

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const newSize = width < 768 ? baseSize * 0.75 : baseSize;
      setSize(newSize);
    };

    handleResize(); // initial
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [baseSize]);

  return size;
}
