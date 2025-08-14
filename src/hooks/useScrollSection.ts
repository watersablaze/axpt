// 📁 app/src/hooks/useScrollSection.ts
import { useEffect, useState } from 'react';

export function useScrollSection(sectionCount: number) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const index = Math.round(window.scrollY / window.innerHeight);
      setCurrentIndex(Math.min(index, sectionCount - 1));
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [sectionCount]);

  return currentIndex;
}