// src/components/debug/LayoutDebugger.tsx
'use client';

import { useEffect, useState } from 'react';

export default function LayoutDebugger() {
  const [scrollY, setScrollY] = useState(0);
  const [viewport, setViewport] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
      console.log(`[Scroll] Y Offset: ${window.scrollY}px`);
    };

    const handleResize = () => {
      setViewport({ width: window.innerWidth, height: window.innerHeight });
      console.log(`[Viewport] Width: ${window.innerWidth}px, Height: ${window.innerHeight}px`);
    };

    handleResize(); // initial
    window.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 10,
        left: 10,
        background: 'rgba(0, 0, 0, 0.7)',
        color: '#fff',
        padding: '6px 12px',
        borderRadius: '8px',
        fontSize: '12px',
        zIndex: 9999,
        pointerEvents: 'none',
      }}
    >
      <div>Viewport: {viewport.width} x {viewport.height}</div>
      <div>ScrollY: {scrollY}px</div>
    </div>
  );
}