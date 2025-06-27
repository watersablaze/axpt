// app/src/components/animations/LoginAnimation.tsx
'use client';

import { useEffect, useState } from 'react';

export default function LoginAnimation({ onFinish }: { onFinish?: () => void }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      if (onFinish) onFinish();
    }, 2500); // adjust duration if needed
    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black transition-all animate-fade">
      <img
        src="/animations/orb-reveal.gif" // replace with actual path to your animation
        alt="AXPT Sigil Animation"
        className="w-64 h-64 object-contain"
      />
    </div>
  );
}