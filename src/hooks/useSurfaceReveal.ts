import { useEffect, useRef, useState } from 'react';

export function useSurfaceReveal() {
  const ref = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
        }
      },
      {
        rootMargin: '0px 0px -35% 0px',
        threshold: 0,
      }
    );

    observer.observe(el);

    return () => observer.disconnect();
  }, []);

  return {
    ref,
    visible,
    className: `surface ${visible ? 'surface--active' : ''}`,
  };
}