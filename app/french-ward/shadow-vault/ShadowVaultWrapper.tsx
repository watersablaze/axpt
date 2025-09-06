'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

const ShadowVaultPage = dynamic(() => import('./ShadowVaultPage'), { ssr: false });
const ShadowVaultMobile = dynamic(() => import('./ShadowVaultMobile'), { ssr: false });

export default function ShadowVaultWrapper() {
  const [isMobile, setIsMobile] = useState<boolean | null>(null);

  useEffect(() => {
    const mql = window.matchMedia('(max-width: 768px)');
    const apply = () => setIsMobile(mql.matches);

    apply();

    // Cross-browser listener
    if (typeof mql.addEventListener === 'function') {
      mql.addEventListener('change', apply);
      return () => mql.removeEventListener('change', apply);
    } else {
      // Safari < 14
      // @ts-ignore
      mql.addListener(apply);
      // @ts-ignore
      return () => mql.removeListener(apply);
    }
  }, []);

  // Tiny skeleton to prevent “nothing” while hydrating
  if (isMobile === null) {
    return (
      <div style={{ minHeight: '40vh', display: 'grid', placeItems: 'center', opacity: 0.7 }}>
        <span style={{ fontSize: 14, letterSpacing: '.06em' }}>Preparing the Vault…</span>
      </div>
    );
  }

  return isMobile ? <ShadowVaultMobile /> : <ShadowVaultPage />;
}