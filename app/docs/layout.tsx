// ✅ app/docs/layout.tsx

'use client';

import '@/styles/globals.css';
import { useEffect, useState } from 'react';

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Prevent server/client hydration mismatch for floating UI
    setMounted(true);
  }, []);

  return (
    <div>
      {children}
      <div id="portal-root" />
    </div>
  );
}